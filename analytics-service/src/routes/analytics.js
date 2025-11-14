// analytics-service/src/routes/analytics.js
import express from 'express';
import {
  trackPlay,
  getSongAnalytics,
  getUserHistory,
  getTrendingSongs,
  getAnalyticsHealth
} from '../controllers/analyticsController.js';

const router = express.Router();

// Health check
router.get('/health', getAnalyticsHealth);

// Tracking plays
router.post('/plays', trackPlay);

// Get analytics
router.get('/songs/:songId', getSongAnalytics);
router.get('/trending', getTrendingSongs);
router.get('/users/:userId/history', getUserHistory);

export default router;