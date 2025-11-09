// backend/user-service/src/routes/favorites.js
import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  addFavorite,
  getFavorites,
  removeFavorite
} from '../controllers/userController.js';

const router = express.Router();

// ====================================================
// FAVORITES — manejar canciones favoritas del usuario
// ====================================================

// 👉 Obtener canciones favoritas del usuario autenticado
router.get('/', authenticateToken, getFavorites);

// 👉 Agregar canción a favoritos
router.post('/', authenticateToken, addFavorite);

// 👉 Eliminar canción de favoritos
router.delete('/:song_id', authenticateToken, removeFavorite);

export default router;
