// analytics-service/src/routes/analytics.js
import express from 'express';
import {
  trackPlay,
  getSongAnalytics,
  getUserHistory,
  getTrendingSongs,
  getAnalyticsHealth
} from '../controllers/analyticsController.js';

// Importar middlewares de autenticación
import { authenticateToken, validateUserParam } from '../middleware/auth.js';

const router = express.Router();

// ============================================================
// RUTAS PÚBLICAS (sin autenticación)
// ============================================================

// Health check - público
router.get('/health', getAnalyticsHealth);

// Analytics de canciones - público
router.get('/songs/:songId', getSongAnalytics);

// Trending songs - público
router.get('/trending', getTrendingSongs);

// ============================================================
// RUTAS PROTEGIDAS (requieren autenticación JWT)
// ============================================================

// Tracking plays - PROTEGIDO
// Solo usuarios autenticados pueden registrar reproducciones
router.post('/plays', authenticateToken, trackPlay);

// User history - PROTEGIDO
// Los usuarios solo pueden ver su propio historial
router.get('/users/:userId/history', authenticateToken, validateUserParam, getUserHistory);

export default router;