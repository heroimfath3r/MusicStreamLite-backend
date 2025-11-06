// src/routes/albums.js
import express from 'express';
const router = express.Router();

// URL base de la API de álbumes desde variables de entorno
const ALBUMS_API_URL = process.env.ALBUMS_API_URL || 'http://localhost:3001/api/albums';

/**
 * GET /albums
 * Obtiene todos los álbumes
 */
router.get('/', async (req, res) => {
  try {
    const response = await fetch(ALBUMS_API_URL);

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const albums = await response.json();
    res.status(200).json({
      success: true,
      data: albums
    });
  } catch (error) {
    console.error('Error fetching albums:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los álbumes',
      error: error.message
    });
  }
});

/**
 * GET /albums/:id
 * Obtiene un álbum específico por ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const response = await fetch(`${ALBUMS_API_URL}/${id}`);

    if (response.status === 404) {
      return res.status(404).json({
        success: false,
        message: 'Álbum no encontrado'
      });
    }

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const album = await response.json();
    res.status(200).json({
      success: true,
      data: album
    });
  } catch (error) {
    console.error('Error fetching album:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el álbum',
      error: error.message
    });
  }
});

/**
 * POST /albums
 * Crea un nuevo álbum
 * Body esperado: { title, artist_id, release_date, cover_url, etc. }
 */
router.post('/', async (req, res) => {
  try {
    const albumData = req.body;

    const response = await fetch(ALBUMS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(albumData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        success: false,
        message: 'Error al crear el álbum',
        error: errorData.message || 'Error desconocido'
      });
    }

    const newAlbum = await response.json();
    res.status(201).json({
      success: true,
      message: 'Álbum creado exitosamente',
      data: newAlbum
    });
  } catch (error) {
    console.error('Error creating album:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error al crear el álbum',
      error: error.message
    });
  }
});

/**
 * PUT /albums/:id
 * Actualiza un álbum existente
 * Body esperado: campos a actualizar
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const albumData = req.body;

    const response = await fetch(`${ALBUMS_API_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(albumData)
    });

    if (response.status === 404) {
      return res.status(404).json({
        success: false,
        message: 'Álbum no encontrado'
      });
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        success: false,
        message: 'Error al actualizar el álbum',
        error: errorData.message || 'Error desconocido'
      });
    }

    const updatedAlbum = await response.json();
    res.status(200).json({
      success: true,
      message: 'Álbum actualizado exitosamente',
      data: updatedAlbum
    });
  } catch (error) {
    console.error('Error updating album:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el álbum',
      error: error.message
    });
  }
});

/**
 * DELETE /albums/:id
 * Elimina un álbum por ID
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const response = await fetch(`${ALBUMS_API_URL}/${id}`, {
      method: 'DELETE'
    });

    if (response.status === 404) {
      return res.status(404).json({
        success: false,
        message: 'Álbum no encontrado'
      });
    }

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    res.status(200).json({
      success: true,
      message: 'Álbum eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error deleting album:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar el álbum',
      error: error.message
    });
  }
});

export default router;
