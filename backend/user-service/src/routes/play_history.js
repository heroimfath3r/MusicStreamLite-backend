// backend/user-service/src/routes/play_history.js
import express from 'express';
const router = express.Router();

// URL base de la API de historial de reproducción desde variables de entorno
const PLAY_HISTORY_API_URL = process.env.PLAY_HISTORY_API_URL || 'http://localhost:3001/api/play-history';

/**
 * GET /play-history
 * Obtiene el historial de reproducción
 * Query params opcionales:
 *   - ?user_id=123 para filtrar por usuario
 *   - ?limit=10 para limitar resultados
 *   - ?offset=0 para paginación
 */
router.get('/', async (req, res) => {
  try {
    // Construir URL con query params si existen
    const url = new URL(PLAY_HISTORY_API_URL);

    if (req.query.user_id) {
      url.searchParams.append('user_id', req.query.user_id);
    }
    if (req.query.limit) {
      url.searchParams.append('limit', req.query.limit);
    }
    if (req.query.offset) {
      url.searchParams.append('offset', req.query.offset);
    }

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const playHistory = await response.json();
    res.status(200).json({
      success: true,
      data: playHistory
    });
  } catch (error) {
    console.error('Error fetching play history:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el historial de reproducción',
      error: error.message
    });
  }
});

/**
 * GET /play-history/:id
 * Obtiene un registro específico del historial por ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const response = await fetch(`${PLAY_HISTORY_API_URL}/${id}`);

    if (response.status === 404) {
      return res.status(404).json({
        success: false,
        message: 'Registro de historial no encontrado'
      });
    }

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const playHistoryRecord = await response.json();
    res.status(200).json({
      success: true,
      data: playHistoryRecord
    });
  } catch (error) {
    console.error('Error fetching play history record:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el registro de historial',
      error: error.message
    });
  }
});

/**
 * POST /play-history
 * Registra una nueva reproducción
 * Body esperado: { user_id, song_id, played_at, duration, etc. }
 */
router.post('/', async (req, res) => {
  try {
    const playHistoryData = req.body;

    // Validación básica
    if (!playHistoryData.user_id || !playHistoryData.song_id) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos: user_id, song_id'
      });
    }

    const response = await fetch(PLAY_HISTORY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(playHistoryData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        success: false,
        message: 'Error al registrar la reproducción',
        error: errorData.message || 'Error desconocido'
      });
    }

    const newPlayHistoryRecord = await response.json();
    res.status(201).json({
      success: true,
      message: 'Reproducción registrada exitosamente',
      data: newPlayHistoryRecord
    });
  } catch (error) {
    console.error('Error creating play history record:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error al registrar la reproducción',
      error: error.message
    });
  }
});

/**
 * PUT /play-history/:id
 * Actualiza un registro del historial
 * Body esperado: campos a actualizar
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const playHistoryData = req.body;

    const response = await fetch(`${PLAY_HISTORY_API_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(playHistoryData)
    });

    if (response.status === 404) {
      return res.status(404).json({
        success: false,
        message: 'Registro de historial no encontrado'
      });
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        success: false,
        message: 'Error al actualizar el registro',
        error: errorData.message || 'Error desconocido'
      });
    }

    const updatedPlayHistoryRecord = await response.json();
    res.status(200).json({
      success: true,
      message: 'Registro actualizado exitosamente',
      data: updatedPlayHistoryRecord
    });
  } catch (error) {
    console.error('Error updating play history record:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el registro',
      error: error.message
    });
  }
});

/**
 * DELETE /play-history/:id
 * Elimina un registro del historial por ID
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const response = await fetch(`${PLAY_HISTORY_API_URL}/${id}`, {
      method: 'DELETE'
    });

    if (response.status === 404) {
      return res.status(404).json({
        success: false,
        message: 'Registro de historial no encontrado'
      });
    }

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    res.status(200).json({
      success: true,
      message: 'Registro eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error deleting play history record:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar el registro',
      error: error.message
    });
  }
});

export default router;
