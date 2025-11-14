// backend/catalog-service/src/routes/albums.js
// src/routes/albums.js
import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

/**
 * Helper: valida si un ID es numérico
 */
const validateId = (id) => !isNaN(Number(id));

/**
 * GET /albums
 * Obtiene todos los álbumes
 */
router.get('/', async (req, res, next) => {
  try {
    const query = 'SELECT * FROM albums ORDER BY release_date DESC';
    const result = await pool.query(query);

    res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error fetching albums:', error.message);
    next(error);
  }
});

/**
 * GET /albums/artist/:artistId
 * Obtiene todos los álbumes de un artista específico
 */
router.get('/artist/:artistId', async (req, res, next) => {
  try {
    const { artistId } = req.params;

    if (!validateId(artistId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de artista inválido',
      });
    }

    const query = `
      SELECT * FROM albums 
      WHERE artist_id = $1 
      ORDER BY release_date DESC
    `;

    const result = await pool.query(query, [artistId]);

    res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error fetching albums by artist:', error.message);
    next(error);
  }
});

/**
 * GET /albums/:id
 * Obtiene un álbum específico por ID
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!validateId(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID inválido',
      });
    }

    const query = 'SELECT * FROM albums WHERE album_id = $1';
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Álbum no encontrado',
      });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error fetching album:', error.message);
    next(error);
  }
});

/**
 * POST /albums
 * Crea un nuevo álbum
 */
router.post('/', async (req, res, next) => {
  try {
    const { title, artist_id, release_date, cover_image_url } = req.body;

    if (!title || !artist_id) {
      return res.status(400).json({
        success: false,
        message: 'El título y el artist_id son requeridos',
      });
    }

    if (!validateId(artist_id)) {
      return res.status(400).json({
        success: false,
        message: 'artist_id inválido',
      });
    }

    const query = `
      INSERT INTO albums (title, artist_id, release_date, cover_image_url) 
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const values = [
      title.trim(),
      Number(artist_id),
      release_date || null,
      cover_image_url || null,
    ];

    const result = await pool.query(query, values);

    res.status(201).json({
      success: true,
      message: 'Álbum creado exitosamente',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error creating album:', error.message);

    if (error.code === '23503') {
      return res.status(400).json({
        success: false,
        message: 'El artista especificado no existe',
      });
    }

    next(error);
  }
});

/**
 * PUT /albums/:id
 * Actualiza un álbum existente
 */
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!validateId(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID inválido',
      });
    }

    const updates = req.body;
    const validFields = ['title', 'artist_id', 'release_date', 'cover_image_url'];

    const fieldsToUpdate = Object.keys(updates).filter(
      (field) => validFields.includes(field) && updates[field] !== undefined
    );

    if (fieldsToUpdate.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No hay campos válidos para actualizar',
      });
    }

    const setClause = fieldsToUpdate
      .map((field, index) => `${field} = $${index + 2}`)
      .join(', ');

    const values = [id, ...fieldsToUpdate.map((f) => updates[f])];

    const query = `
      UPDATE albums
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE album_id = $1
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Álbum no encontrado',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Álbum actualizado exitosamente',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error updating album:', error.message);

    if (error.code === '23503') {
      return res.status(400).json({
        success: false,
        message: 'El artista especificado no existe',
      });
    }

    next(error);
  }
});

/**
 * DELETE /albums/:id
 * Elimina un álbum por ID
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!validateId(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID inválido',
      });
    }

    const query = 'DELETE FROM albums WHERE album_id = $1 RETURNING album_id';
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Álbum no encontrado',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Álbum eliminado exitosamente',
    });
  } catch (error) {
    console.error('Error deleting album:', error.message);

    if (error.code === '23503') {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar el álbum porque tiene canciones asociadas',
      });
    }

    next(error);
  }
});

export default router;
