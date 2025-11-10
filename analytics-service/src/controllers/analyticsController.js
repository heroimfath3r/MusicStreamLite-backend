// analytics-service/src/controllers/analyticsController.js
import { analyticsDB, firestore } from '../config/database.js';

// Track song play
export const trackPlay = async (req, res) => {
  try {
    const { songId, userId, duration = 0, timestamp = new Date() } = req.body;

    // Validate required fields
    if (!songId) {
      return res.status(400).json({ error: 'songId is required' });
    }

    const durationPlayed = parseInt(duration) || 0;
    const playTimestamp = timestamp instanceof Date ? timestamp : new Date(timestamp);

    // Prepare event data for song_plays collection
    const playEventData = {
      userId: userId || null,
      songId,
      duration_played: durationPlayed,
      timestamp: playTimestamp
    };

    // Use batch write for atomicity (alternative to transaction for independent writes)
    const batch = firestore.batch();

    // 1. Add event to song_plays collection
    const playRef = firestore.collection('song_plays').doc();
    batch.set(playRef, playEventData);

    // 2. Update user_song_stats if userId is present (not anonymous)
    if (userId && userId !== 'anonymous' && userId !== null) {
      const statDocId = `${userId}_${songId}`;
      const statRef = firestore.collection('user_song_stats').doc(statDocId);

      // Get the document to check if it exists
      const statDoc = await statRef.get();

      if (statDoc.exists) {
        // Update existing stats using FieldValue.increment()
        batch.update(statRef, {
          play_count: firestore.FieldValue.increment(1),
          total_time_played: firestore.FieldValue.increment(durationPlayed),
          last_played: playTimestamp
        });
      } else {
        // Create new stats document
        batch.set(statRef, {
          userId,
          songId,
          play_count: 1,
          total_time_played: durationPlayed,
          last_played: playTimestamp
        });
      }
    }

    // Commit the batch
    await batch.commit();

    // Update real-time analytics (async, not critical for response)
    updateSongAnalytics(songId).catch(err =>
      console.error('Error updating song analytics:', err)
    );
    if (userId && userId !== 'anonymous') {
      updateUserAnalytics(userId, songId).catch(err =>
        console.error('Error updating user analytics:', err)
      );
    }

    res.status(201).json({
      success: true,
      playId: playRef.id,
      message: 'Play tracked successfully'
    });

  } catch (error) {
    console.error('Error tracking play:', error);
    res.status(500).json({ error: 'Failed to track play' });
  }
};

// Get song analytics
export const getSongAnalytics = async (req, res) => {
  try {
    const { songId } = req.params;
    const { period = '7d' } = req.query; // 24h, 7d, 30d, all

    if (!songId) {
      return res.status(400).json({ error: 'songId is required' });
    }

    const analytics = await getSongAnalyticsData(songId, period);
    
    res.json({
      songId,
      period,
      ...analytics
    });

  } catch (error) {
    console.error('Error getting song analytics:', error);
    res.status(500).json({ error: 'Failed to get song analytics' });
  }
};

// Get user listening history
export const getUserHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const historySnapshot = await firestore
      .collection('song_plays')
      .where('userId', '==', userId)
      .orderBy('timestamp', 'desc')
      .limit(parseInt(limit))
      .offset(parseInt(offset))
      .get();

    const history = [];
    historySnapshot.forEach(doc => {
      history.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Get total count for pagination
    const countSnapshot = await firestore
      .collection('song_plays')
      .where('userId', '==', userId)
      .get();

    res.json({
      userId,
      history,
      pagination: {
        total: countSnapshot.size,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });

  } catch (error) {
    console.error('Error getting user history:', error);
    res.status(500).json({ error: 'Failed to get user history' });
  }
};

// Get trending songs
export const getTrendingSongs = async (req, res) => {
  try {
    const { limit = 20, period = '24h' } = req.query;

    const trending = await getTrendingSongsData(limit, period);
    
    res.json({
      period,
      trending,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting trending songs:', error);
    res.status(500).json({ error: 'Failed to get trending songs' });
  }
};

// Get user recommendations
export const getRecommendations = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10 } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const recommendations = await generateRecommendations(userId, limit);
    
    res.json({
      userId,
      recommendations,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
};

// Get platform analytics (admin)
export const getPlatformAnalytics = async (req, res) => {
  try {
    const { period = '7d' } = req.query;

    const platformData = await getPlatformAnalyticsData(period);
    
    res.json({
      period,
      ...platformData,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting platform analytics:', error);
    res.status(500).json({ error: 'Failed to get platform analytics' });
  }
};

// Record user engagement
export const recordEngagement = async (req, res) => {
  try {
    const { userId, type, targetId, metadata = {} } = req.body;

    if (!userId || !type) {
      return res.status(400).json({ error: 'userId and type are required' });
    }

    const engagementData = {
      userId,
      type, // 'like', 'share', 'download', 'playlist_add', 'search'
      targetId,
      metadata,
      timestamp: new Date()
    };

    await firestore.collection('user_engagement').add(engagementData);

    // Update engagement analytics
    await updateEngagementAnalytics(type, targetId, userId);

    res.status(201).json({
      success: true,
      message: 'Engagement recorded successfully'
    });

  } catch (error) {
    console.error('Error recording engagement:', error);
    res.status(500).json({ error: 'Failed to record engagement' });
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Update song analytics in real-time
async function updateSongAnalytics(songId) {
  try {
    const songAnalyticsRef = firestore.collection('song_analytics').doc(songId);
    
    await firestore.runTransaction(async (transaction) => {
      const doc = await transaction.get(songAnalyticsRef);
      
      if (!doc.exists) {
        // Create new analytics document
        transaction.set(songAnalyticsRef, {
          songId,
          totalPlays: 1,
          uniqueListeners: 1,
          averageDuration: 0,
          lastPlayed: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        });
      } else {
        // Update existing analytics
        const data = doc.data();
        transaction.update(songAnalyticsRef, {
          totalPlays: (data.totalPlays || 0) + 1,
          uniqueListeners: data.uniqueListeners || 1, // This would need more complex logic for unique counting
          lastPlayed: new Date(),
          updatedAt: new Date()
        });
      }
    });

  } catch (error) {
    console.error('Error updating song analytics:', error);
  }
}

// Update user analytics
export async function updateUserAnalytics(userId, songId) {
  try {
    const userAnalyticsRef = firestore.collection('user_analytics').doc(userId);
    
    await userAnalyticsRef.set({
      userId,
      lastActive: new Date(),
      totalSongsPlayed: firestore.FieldValue.increment(1),
      updatedAt: new Date()
    }, { merge: true });

  } catch (error) {
    console.error('Error updating user analytics:', error);
  }
}

// Get detailed song analytics
export async function getSongAnalyticsData(songId, period) {
  const now = new Date();
  let startDate = new Date();

  // Calculate start date based on period
  switch (period) {
    case '24h':
      startDate.setHours(now.getHours() - 24);
      break;
    case '7d':
      startDate.setDate(now.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(now.getDate() - 30);
      break;
    case 'all':
    default:
      startDate = new Date(0); // Beginning of time
  }

  try {
    // Get play counts for the period
    const playsSnapshot = await firestore
      .collection('song_plays')
      .where('songId', '==', songId)
      .where('timestamp', '>=', startDate)
      .get();

    const plays = [];
    let totalDuration = 0;
    let uniqueUsers = new Set();

    playsSnapshot.forEach(doc => {
      const play = doc.data();
      plays.push(play);
      totalDuration += play.duration || 0;
      if (play.userId && play.userId !== 'anonymous') {
        uniqueUsers.add(play.userId);
      }
    });

    // Get song analytics document
    const analyticsDoc = await firestore
      .collection('song_analytics')
      .doc(songId)
      .get();

    const analyticsData = analyticsDoc.exists ? analyticsDoc.data() : {};

    return {
      playCount: plays.length,
      uniqueListeners: uniqueUsers.size,
      averageDuration: plays.length > 0 ? Math.round(totalDuration / plays.length) : 0,
      totalDuration,
      periodPlays: plays.length,
      ...analyticsData
    };

  } catch (error) {
    console.error('Error getting song analytics data:', error);
    throw error;
  }
}

// Get trending songs
export async function getTrendingSongsData(limit, period) {
  const now = new Date();
  let startDate = new Date();

  switch (period) {
    case '24h':
      startDate.setHours(now.getHours() - 24);
      break;
    case '7d':
      startDate.setDate(now.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(now.getDate() - 30);
      break;
    default:
      startDate.setHours(now.getHours() - 24);
  }

  try {
    // Aggregate play counts by song
    const playsSnapshot = await firestore
      .collection('song_plays')
      .where('timestamp', '>=', startDate)
      .get();


    const songPlays = {};

    playsSnapshot.forEach(doc => {
      const play = doc.data();
      const songId = play.songId;
      
      if (!songPlays[songId]) {
        songPlays[songId] = {
          playCount: 0,
          totalDuration: 0,
          lastPlayed: play.timestamp
        };
      } 
      
      songPlays[songId].playCount++;
      songPlays[songId].totalDuration += play.duration || 0;
      
      if (play.timestamp > songPlays[songId].lastPlayed) {
        songPlays[songId].lastPlayed = play.timestamp;
      }
    });

    // Convert to array and sort by play count
    const trending = Object.entries(songPlays)
      .map(([songId, data]) => ({
        songId,
        playCount: data.playCount,
        averageDuration: Math.round(data.totalDuration / data.playCount),
        lastPlayed: data.lastPlayed
      }))
      .sort((a, b) => b.playCount - a.playCount)
      .slice(0, parseInt(limit));

    return trending;

  } catch (error) {
    console.error('Error getting trending songs data:', error);
    throw error;
  }
}

// Generate user recommendations
async function generateRecommendations(userId, limit) {
  try {
    // Query user_song_stats collection to get user's most played songs
    const userStatsSnapshot = await firestore
      .collection('user_song_stats')
      .where('userId', '==', userId)
      .orderBy('play_count', 'desc')
      .limit(parseInt(limit))
      .get();

    if (userStatsSnapshot.empty) {
      // Return trending songs if no stats found
      return await getTrendingSongsData(limit, '7d');
    }

    // Map stats documents to recommendation format
    const recommendations = [];
    userStatsSnapshot.forEach(doc => {
      const data = doc.data();
      recommendations.push({
        songId: data.songId,
        play_count: data.play_count,
        total_time_played: data.total_time_played,
        last_played: data.last_played,
        averageDuration: data.play_count > 0
          ? Math.round(data.total_time_played / data.play_count)
          : 0
      });
    });

    return recommendations;

  } catch (error) {
    console.error('Error generating recommendations:', error);
    // Fallback to trending songs
    return await getTrendingSongsData(limit, '7d');
  }
}

// Get platform-wide analytics
 export async function getPlatformAnalyticsData(period) {
  const now = new Date();
  let startDate = new Date();

  switch (period) {
    case '24h':
      startDate.setHours(now.getHours() - 24);
      break;
    case '7d':
      startDate.setDate(now.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(now.getDate() - 30);
      break;
    default:
      startDate.setDate(now.getDate() - 7);
  }

  try {
    // Total plays
    const playsSnapshot = await firestore
      .collection('song_plays')
      .where('timestamp', '>=', startDate)
      .get();

    // Unique users
    const usersSnapshot = await firestore
      .collection('song_plays')
      .where('timestamp', '>=', startDate)
      .get();

    const uniqueUsers = new Set();
    let totalDuration = 0;

    playsSnapshot.forEach(doc => {
      const play = doc.data();
      if (play.userId && play.userId !== 'anonymous') {
        uniqueUsers.add(play.userId);
      }
      totalDuration += play.duration || 0;
    });

    // Popular songs (top 5)
    const trending = await getTrendingSongsData(5, period);

    return {
      totalPlays: playsSnapshot.size,
      uniqueUsers: uniqueUsers.size,
      totalDuration,
      averageSessionDuration: playsSnapshot.size > 0 ? Math.round(totalDuration / playsSnapshot.size) : 0,
      popularSongs: trending
    };

  } catch (error) {
    console.error('Error getting platform analytics data:', error);
    throw error;
  }
}

// Update engagement analytics
async function updateEngagementAnalytics(type, targetId, userId) {
  try {
    const engagementRef = firestore.collection('engagement_analytics').doc(`${type}_${targetId}`);
    
    await engagementRef.set({
      type,
      targetId,
      count: firestore.FieldValue.increment(1),
      lastEngaged: new Date(),
      updatedAt: new Date()
    }, { merge: true });

    // Update user engagement profile
    if (userId) {
      const userEngagementRef = firestore.collection('user_engagement_profiles').doc(userId);
      await userEngagementRef.set({
        userId,
        [type]: firestore.FieldValue.increment(1),
        lastEngagement: new Date(),
        updatedAt: new Date()
      }, { merge: true });
    }

  } catch (error) {
    console.error('Error updating engagement analytics:', error);
  }
}

// Health check for analytics service
export const getAnalyticsHealth = async (req, res) => {
  const result = await runHealthCheck();

  if (result.ok) {
    res.status(200).json({
      status: 'ok',
      service: 'analytics-service',
      firestore: 'connected',
      timestamp: new Date().toISOString(),
    });
  } else {
    res.status(500).json({
      status: 'error',
      service: 'analytics-service',
      firestore: 'unreachable',
      message: result.message,
    });
  }
};
