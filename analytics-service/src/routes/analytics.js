// analytics-service/src/routes/analytics.js
import express from 'express';
import {
  trackPlay,
  getSongAnalytics,
  getUserHistory,
  getTrendingSongs,
  getRecommendations,
  getPlatformAnalytics,
  recordEngagement,
  getAnalyticsHealth
} from '../controllers/analyticsController.js';

const router = express.Router();

// ============================================================================
// PUBLIC ROUTES
// ============================================================================

/**
 * @route GET /health
 * @description Health check for analytics service
 * @access Public
 */
router.get('/health', getAnalyticsHealth);

/**
 * @route POST /plays
 * @description Track a song play
 * @access Public
 * @body {string} songId - ID of the song played
 * @body {string} [userId] - ID of the user (optional for anonymous plays)
 * @body {number} [duration] - Duration of play in seconds
 * @body {string} [timestamp] - When the play occurred
 */
router.post('/plays', trackPlay);

/**
 * @route GET /songs/:songId
 * @description Get analytics for a specific song
 * @access Public
 * @param {string} songId - ID of the song
 * @query {string} [period] - Time period (24h, 7d, 30d, all)
 */
router.get('/songs/:songId', getSongAnalytics);

/**
 * @route GET /trending
 * @description Get currently trending songs
 * @access Public
 * @query {number} [limit=20] - Number of songs to return
 * @query {string} [period=24h] - Time period (24h, 7d, 30d)
 */
router.get('/trending', getTrendingSongs);

// ============================================================================
// USER ROUTES (Require user authentication)
// ============================================================================

/**
 * @route GET /users/:userId/history
 * @description Get listening history for a user
 * @access Private (User-specific)
 * @param {string} userId - ID of the user
 * @query {number} [limit=50] - Number of history items to return
 * @query {number} [offset=0] - Pagination offset
 */
router.get('/users/:userId/history', getUserHistory);

/**
 * @route GET /users/:userId/recommendations
 * @description Get personalized song recommendations for a user
 * @access Private (User-specific)
 * @param {string} userId - ID of the user
 * @query {number} [limit=10] - Number of recommendations to return
 */
router.get('/users/:userId/recommendations', getRecommendations);

/**
 * @route POST /engagement
 * @description Record user engagement (likes, shares, etc.)
 * @access Private
 * @body {string} userId - ID of the user
 * @body {string} type - Type of engagement (like, share, download, playlist_add, search)
 * @body {string} [targetId] - ID of the target (song, playlist, etc.)
 * @body {object} [metadata] - Additional engagement data
 */
router.post('/engagement', recordEngagement);

// ============================================================================
// ADMIN ROUTES (Require admin authentication)
// ============================================================================

/**
 * @route GET /platform
 * @description Get platform-wide analytics (admin only)
 * @access Private (Admin)
 * @query {string} [period=7d] - Time period (24h, 7d, 30d)
 */
router.get('/platform', getPlatformAnalytics);

/**
 * @route GET /dashboard
 * @description Get comprehensive analytics dashboard data
 * @access Private (Admin)
 * @query {string} [period=7d] - Time period for analytics
 */
router.get('/dashboard', async (req, res) => {
  try {
    const { period = '7d' } = req.query;

    // Get multiple analytics data in parallel
    const [
      platformData,
      trendingSongs,
      recentPlays
    ] = await Promise.all([
      getPlatformAnalyticsData(period),
      getTrendingSongsData(10, period),
      getRecentPlaysData(20)
    ]);

    res.json({
      period,
      platform: platformData,
      trending: trendingSongs,
      recentActivity: recentPlays,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting dashboard data:', error);
    res.status(500).json({ error: 'Failed to get dashboard data' });
  }
});

/**
 * @route GET /users/:userId/insights
 * @description Get detailed insights for a specific user (admin only)
 * @access Private (Admin)
 * @param {string} userId - ID of the user
 * @query {string} [period=30d] - Time period for insights
 */
router.get('/users/:userId/insights', async (req, res) => {
  try {
    const { userId } = req.params;
    const { period = '30d' } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const userInsights = await getUserInsights(userId, period);
    
    res.json({
      userId,
      period,
      ...userInsights,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting user insights:', error);
    res.status(500).json({ error: 'Failed to get user insights' });
  }
});

// ============================================================================
// HELPER FUNCTIONS FOR DASHBOARD
// ============================================================================

async function getRecentPlaysData(limit = 20) {
  try {
    const playsSnapshot = await firestore
      .collection('song_plays')
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();

    const recentPlays = [];
    playsSnapshot.forEach(doc => {
      recentPlays.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return recentPlays;
  } catch (error) {
    console.error('Error getting recent plays:', error);
    return [];
  }
}

async function getUserInsights(userId, period) {
  try {
    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Get user's play history
    const playsSnapshot = await firestore
      .collection('song_plays')
      .where('userId', '==', userId)
      .where('timestamp', '>=', startDate)
      .get();

    const plays = [];
    let totalPlayTime = 0;
    const songCounts = {};
    const timeOfDayCounts = {
      morning: 0,
      afternoon: 0,
      evening: 0,
      night: 0
    };

    playsSnapshot.forEach(doc => {
      const play = doc.data();
      plays.push(play);
      
      totalPlayTime += play.duration || 0;
      
      // Count plays per song
      songCounts[play.songId] = (songCounts[play.songId] || 0) + 1;
      
      // Analyze time of day
      const hour = new Date(play.timestamp).getHours();
      if (hour >= 5 && hour < 12) timeOfDayCounts.morning++;
      else if (hour >= 12 && hour < 17) timeOfDayCounts.afternoon++;
      else if (hour >= 17 && hour < 22) timeOfDayCounts.evening++;
      else timeOfDayCounts.night++;
    });

    // Get top played songs
    const topSongs = Object.entries(songCounts)
      .map(([songId, count]) => ({ songId, plays: count }))
      .sort((a, b) => b.plays - a.plays)
      .slice(0, 10);

    // Get engagement data
    const engagementSnapshot = await firestore
      .collection('user_engagement')
      .where('userId', '==', userId)
      .where('timestamp', '>=', startDate)
      .get();

    const engagementByType = {};
    engagementSnapshot.forEach(doc => {
      const engagement = doc.data();
      engagementByType[engagement.type] = (engagementByType[engagement.type] || 0) + 1;
    });

    return {
      totalPlays: plays.length,
      totalPlayTime,
      averagePlayTime: plays.length > 0 ? Math.round(totalPlayTime / plays.length) : 0,
      topSongs,
      listeningPatterns: {
        timeOfDay: timeOfDayCounts,
        favoriteTime: Object.keys(timeOfDayCounts).reduce((a, b) => 
          timeOfDayCounts[a] > timeOfDayCounts[b] ? a : b
        )
      },
      engagement: engagementByType,
      activityLevel: getActivityLevel(plays.length)
    };

  } catch (error) {
    console.error('Error getting user insights:', error);
    throw error;
  }
}

function getActivityLevel(playCount) {
  if (playCount >= 100) return 'high';
  if (playCount >= 30) return 'medium';
  if (playCount >= 10) return 'low';
  return 'inactive';
}

// Import firestore for helper functions
import { firestore } from '../config/database.js';
import { getPlatformAnalyticsData, getTrendingSongsData } from '../controllers/analyticsController.js';

export default router;