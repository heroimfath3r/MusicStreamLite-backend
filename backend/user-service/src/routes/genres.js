// backend/user-service/src/routes/genres.js
import express from 'express';
const router = express.Router();

// URL base de la API de géneros desde variables de entorno
const GENRES_API_URL = process.env.GENRES_API_URL || 'http://localhost:3001/api/genres';

/**
 * GET /genres
 * Obtiene todos los géneros musicales
 */
router.get('/', async (req, res) => {
  try {
    const response = await fetch(GENRES_API_URL);

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const genres = await response.json();
    res.status(200).json({
      success: true,
      data: genres
    });
  } catch (error) {
    console.error('Error fetching genres:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los géneros',
      error: error.message
    });
  }
});

/**
 * GET /genres/:id
 * Obtiene un género específico por ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const response = await fetch(`${GENRES_API_URL}/${id}`);

    if (response.status === 404) {
      return res.status(404).json({
        success: false,
        message: 'Género no encontrado'
      });
    }

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const genre = await response.json();
    res.status(200).json({
      success: true,
      data: genre
    });
  } catch (error) {
    console.error('Error fetching genre:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el género',
      error: error.message
    });
  }
});

/**
 * POST /genres
 * Crea un nuevo género musical
 * Body esperado: { name, description, etc. }
 */
router.post('/', async (req, res) => {
  try {
    const genreData = req.body;

    // Validación básica
    if (!genreData.name) {
      return res.status(400).json({
        success: false,
        message: 'El campo "name" es requerido'
      });
    }

    const response = await fetch(GENRES_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(genreData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        success: false,
        message: 'Error al crear el género',
        error: errorData.message || 'Error desconocido'
      });
    }

    const newGenre = await response.json();
    res.status(201).json({
      success: true,
      message: 'Género creado exitosamente',
      data: newGenre
    });
  } catch (error) {
    console.error('Error creating genre:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error al crear el género',
      error: error.message
    });
  }
});

/**
 * PUT /genres/:id
 * Actualiza un género existente
 * Body esperado: campos a actualizar
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const genreData = req.body;

    const response = await fetch(`${GENRES_API_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(genreData)
    });

    if (response.status === 404) {
      return res.status(404).json({
        success: false,
        message: 'Género no encontrado'
      });
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        success: false,
        message: 'Error al actualizar el género',
        error: errorData.message || 'Error desconocido'
      });
    }

    const updatedGenre = await response.json();
    res.status(200).json({
      success: true,
      message: 'Género actualizado exitosamente',
      data: updatedGenre
    });
  } catch (error) {
    console.error('Error updating genre:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el género',
      error: error.message
    });
  }
});

/**
 * DELETE /genres/:id
 * Elimina un género por ID
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const response = await fetch(`${GENRES_API_URL}/${id}`, {
      method: 'DELETE'
    });

    if (response.status === 404) {
      return res.status(404).json({
        success: false,
        message: 'Género no encontrado'
      });
    }

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    res.status(200).json({
      success: true,
      message: 'Género eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error deleting genre:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar el género',
      error: error.message
    });
  }
});

export default router;
