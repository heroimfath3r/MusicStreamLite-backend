// backend/user-service/src/routes/artists.js
import express from 'express';
const router = express.Router();

// URL base de la API de artistas desde variables de entorno
const ARTISTS_API_URL = process.env.ARTISTS_API_URL || 'http://localhost:3001/api/artists';

/**
 * GET /artists
 * Obtiene todos los artistas
 */
router.get('/', async (req, res) => {
  try {
    const response = await fetch(ARTISTS_API_URL);

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const artists = await response.json();
    res.status(200).json({
      success: true,
      data: artists
    });
  } catch (error) {
    console.error('Error fetching artists:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los artistas',
      error: error.message
    });
  }
});

/**
 * GET /artists/:id
 * Obtiene un artista específico por ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const response = await fetch(`${ARTISTS_API_URL}/${id}`);

    if (response.status === 404) {
      return res.status(404).json({
        success: false,
        message: 'Artista no encontrado'
      });
    }

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const artist = await response.json();
    res.status(200).json({
      success: true,
      data: artist
    });
  } catch (error) {
    console.error('Error fetching artist:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el artista',
      error: error.message
    });
  }
});

/**
 * POST /artists
 * Crea un nuevo artista
 * Body esperado: { name, bio, image_url, etc. }
 */
router.post('/', async (req, res) => {
  try {
    const artistData = req.body;

    const response = await fetch(ARTISTS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(artistData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        success: false,
        message: 'Error al crear el artista',
        error: errorData.message || 'Error desconocido'
      });
    }

    const newArtist = await response.json();
    res.status(201).json({
      success: true,
      message: 'Artista creado exitosamente',
      data: newArtist
    });
  } catch (error) {
    console.error('Error creating artist:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error al crear el artista',
      error: error.message
    });
  }
});

/**
 * PUT /artists/:id
 * Actualiza un artista existente
 * Body esperado: campos a actualizar
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const artistData = req.body;

    const response = await fetch(`${ARTISTS_API_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(artistData)
    });

    if (response.status === 404) {
      return res.status(404).json({
        success: false,
        message: 'Artista no encontrado'
      });
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        success: false,
        message: 'Error al actualizar el artista',
        error: errorData.message || 'Error desconocido'
      });
    }

    const updatedArtist = await response.json();
    res.status(200).json({
      success: true,
      message: 'Artista actualizado exitosamente',
      data: updatedArtist
    });
  } catch (error) {
    console.error('Error updating artist:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el artista',
      error: error.message
    });
  }
});

/**
 * DELETE /artists/:id
 * Elimina un artista por ID
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const response = await fetch(`${ARTISTS_API_URL}/${id}`, {
      method: 'DELETE'
    });

    if (response.status === 404) {
      return res.status(404).json({
        success: false,
        message: 'Artista no encontrado'
      });
    }

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    res.status(200).json({
      success: true,
      message: 'Artista eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error deleting artist:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar el artista',
      error: error.message
    });
  }
});

export default router;
