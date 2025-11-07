// src/routes/albums.js
import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

/**
 * GET /albums
 * Obtiene todos los álbumes
 */
router.get('/', async (req, res) => {
  try {
    const query = 'SELECT * FROM albums ORDER BY release_date DESC';
    const result = await pool.query(query);
    
    res.status(200).json({
      success: true,
      data: result.rows
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
 * GET /albums/artist/:artistId
 * Obtiene todos los álbumes de un artista específico
 * IMPORTANTE: Esta ruta debe ir ANTES de /:id para evitar conflictos
 */
router.get('/artist/:artistId', async (req, res) => {
  try {
    const { artistId } = req.params;
    const query = 'SELECT * FROM albums WHERE artist_id = $1 ORDER BY release_date DESC';
    const result = await pool.query(query, [artistId]);
    
    res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching albums by artist:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los álbumes del artista',
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
    const query = 'SELECT * FROM albums WHERE album_id = $1';
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Álbum no encontrado'
      });
    }
    
    res.status(200).json({
      success: true,
      data: result.rows[0]
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
 * Body esperado: { title, artist_id, release_date, cover_image_url }
 */
router.post('/', async (req, res) => {
  try {
    const { title, artist_id, release_date, cover_image_url } = req.body;
    
    // Validación básica
    if (!title || !artist_id) {
      return res.status(400).json({
        success: false,
        message: 'El título y artist_id son requeridos'
      });
    }
    
    const query = `
      INSERT INTO albums (title, artist_id, release_date, cover_image_url) 
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    
    const values = [title, artist_id, release_date || null, cover_image_url || null];
    const result = await pool.query(query, values);
    
    res.status(201).json({
      success: true,
      message: 'Álbum creado exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating album:', error.message);
    
    // Manejo específico para errores de FK (artista no existe)
    if (error.code === '23503') {
      return res.status(400).json({
        success: false,
        message: 'El artista especificado no existe',
        error: error.message
      });
    }
    
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
 * Body esperado: campos a actualizar (title, artist_id, release_date, cover_image_url)
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Verificar que haya campos para actualizar
    const validFields = ['title', 'artist_id', 'release_date', 'cover_image_url'];
    const fieldsToUpdate = Object.keys(updates).filter(key => validFields.includes(key));
    
    if (fieldsToUpdate.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No hay campos válidos para actualizar'
      });
    }
    
    // Construir query dinámicamente
    const setClause = fieldsToUpdate.map((field, index) => `${field} = $${index + 2}`).join(', ');
    const values = [id, ...fieldsToUpdate.map(field => updates[field])];
    
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
        message: 'Álbum no encontrado'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Álbum actualizado exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating album:', error.message);
    
    if (error.code === '23503') {
      return res.status(400).json({
        success: false,
        message: 'El artista especificado no existe',
        error: error.message
      });
    }
    
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
    
    const query = 'DELETE FROM albums WHERE album_id = $1 RETURNING album_id';
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Álbum no encontrado'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Álbum eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error deleting album:', error.message);
    
    // Manejo específico para errores de integridad referencial
    if (error.code === '23503') {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar el álbum porque tiene canciones asociadas',
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error al eliminar el álbum',
      error: error.message
    });
  }
});

export default router;