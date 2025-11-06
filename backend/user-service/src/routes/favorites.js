// backend/user-service/src/routes/favorites.js
import express from 'express';
const router = express.Router();

// URL base de la API de favoritos desde variables de entorno
const FAVORITES_API_URL = process.env.FAVORITES_API_URL || 'http://localhost:3001/api/favorites';

/**
 * GET /favorites
 * Obtiene todos los favoritos
 * Query params opcionales: ?user_id=123 para filtrar por usuario
 */
router.get('/', async (req, res) => {
  try {
    // Construir URL con query params si existen
    const url = new URL(FAVORITES_API_URL);
    if (req.query.user_id) {
      url.searchParams.append('user_id', req.query.user_id);
    }

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const favorites = await response.json();
    res.status(200).json({
      success: true,
      data: favorites
    });
  } catch (error) {
    console.error('Error fetching favorites:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los favoritos',
      error: error.message
    });
  }
});

/**
 * GET /favorites/:id
 * Obtiene un favorito específico por ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const response = await fetch(`${FAVORITES_API_URL}/${id}`);

    if (response.status === 404) {
      return res.status(404).json({
        success: false,
        message: 'Favorito no encontrado'
      });
    }

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const favorite = await response.json();
    res.status(200).json({
      success: true,
      data: favorite
    });
  } catch (error) {
    console.error('Error fetching favorite:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el favorito',
      error: error.message
    });
  }
});

/**
 * POST /favorites
 * Añade un nuevo favorito
 * Body esperado: { user_id, item_type, item_id }
 * donde item_type puede ser 'song', 'album', 'artist', etc.
 */
router.post('/', async (req, res) => {
  try {
    const favoriteData = req.body;

    // Validación básica
    if (!favoriteData.user_id || !favoriteData.item_type || !favoriteData.item_id) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos: user_id, item_type, item_id'
      });
    }

    const response = await fetch(FAVORITES_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(favoriteData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        success: false,
        message: 'Error al añadir el favorito',
        error: errorData.message || 'Error desconocido'
      });
    }

    const newFavorite = await response.json();
    res.status(201).json({
      success: true,
      message: 'Favorito añadido exitosamente',
      data: newFavorite
    });
  } catch (error) {
    console.error('Error creating favorite:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error al añadir el favorito',
      error: error.message
    });
  }
});

/**
 * PUT /favorites/:id
 * Actualiza un favorito existente
 * Body esperado: campos a actualizar
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const favoriteData = req.body;

    const response = await fetch(`${FAVORITES_API_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(favoriteData)
    });

    if (response.status === 404) {
      return res.status(404).json({
        success: false,
        message: 'Favorito no encontrado'
      });
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        success: false,
        message: 'Error al actualizar el favorito',
        error: errorData.message || 'Error desconocido'
      });
    }

    const updatedFavorite = await response.json();
    res.status(200).json({
      success: true,
      message: 'Favorito actualizado exitosamente',
      data: updatedFavorite
    });
  } catch (error) {
    console.error('Error updating favorite:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el favorito',
      error: error.message
    });
  }
});

/**
 * DELETE /favorites/:id
 * Elimina un favorito por ID
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const response = await fetch(`${FAVORITES_API_URL}/${id}`, {
      method: 'DELETE'
    });

    if (response.status === 404) {
      return res.status(404).json({
        success: false,
        message: 'Favorito no encontrado'
      });
    }

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    res.status(200).json({
      success: true,
      message: 'Favorito eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error deleting favorite:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar el favorito',
      error: error.message
    });
  }
});

export default router;
