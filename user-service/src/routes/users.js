// backend/user-service/src/routes/users.js
import express from 'express';
import {
  register,
  login,
  getProfile,
  updateProfile,
  getAllUsers, // 🆕 nuevo endpoint
  addFavorite,
  removeFavorite,
  getFavorites,
  recordPlay,
  getPlayHistory,
  getUserStats,
  changePassword
} from '../controllers/userController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// ====================================================
// USERS (registro, login, perfil, administración)
// ====================================================

// 👉 Registrar nuevo usuario
router.post('/register', register);

// RUTA: cambiar contraseña (protegida)
router.post('/change-password', authenticateToken, changePassword);

// 👉 Login de usuario
router.post('/login', login);

// 👉 Obtener todos los usuarios (solo para pruebas/admin)
router.get('/', getAllUsers);

// 👉 Perfil del usuario autenticado
router.get('/profile', authenticateToken, getProfile);

// 👉 Actualizar perfil del usuario autenticado
router.put('/profile', authenticateToken, updateProfile);

// ====================================================
// FAVORITES (manejo de canciones favoritas)
// ====================================================

// 👉 Agregar canción a favoritos
router.post('/favorites', authenticateToken, addFavorite);

// 👉 Obtener canciones favoritas del usuario
router.get('/favorites', authenticateToken, getFavorites);

// 👉 Eliminar canción de favoritos
router.delete('/favorites/:song_id', authenticateToken, removeFavorite);

// ====================================================
// HISTORIAL / ESTADÍSTICAS
// ====================================================

// 👉 Registrar reproducción
router.post('/play', authenticateToken, recordPlay);

// 👉 Obtener historial de reproducciones
router.get('/history', authenticateToken, getPlayHistory);

// 👉 Obtener estadísticas del usuario
router.get('/stats', authenticateToken, getUserStats);

export default router;
