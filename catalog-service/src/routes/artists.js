// backend/catalog-service/src/routes/artists.js
import express from 'express';
import db from '../db.js'; // Conexión a PostgreSQL

const router = express.Router();

/* ============================================================
   GET /artists  → Obtener todos los artistas
   ============================================================ */
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM artists ORDER BY id ASC');

    res.json({
      success: true,
      count: result.rowCount,
      data: result.rows
    });
  } catch (error) {
    console.error('Error getting artists:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener artistas'
    });
  }
});

/* ============================================================
   GET /artists/:id  → Obtener un artista por ID
   ============================================================ */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'SELECT * FROM artists WHERE id = $1',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Artista no encontrado'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error getting artist:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener artista'
    });
  }
});

/* ============================================================
   POST /artists  → Crear un nuevo artista
   ============================================================ */
router.post('/', async (req, res) => {
  try {
    const { name, bio, image_url } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'El nombre del artista es requerido'
      });
    }

    const result = await db.query(
      `INSERT INTO artists (name, bio, image_url)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name, bio || null, image_url || null]
    );

    res.status(201).json({
      success: true,
      message: 'Artista creado exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating artist:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear artista'
    });
  }
});

/* ============================================================
   PUT /artists/:id  → Actualizar un artista existente
   ============================================================ */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, bio, image_url } = req.body;

    const result = await db.query(
      `UPDATE artists 
       SET name = COALESCE($1, name),
           bio = COALESCE($2, bio),
           image_url = COALESCE($3, image_url)
       WHERE id = $4
       RETURNING *`,
      [name, bio, image_url, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Artista no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Artista actualizado exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating artist:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar artista'
    });
  }
});

/* ============================================================
   DELETE /artists/:id  → Eliminar artista
   ============================================================ */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'DELETE FROM artists WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Artista no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Artista eliminado correctamente'
    });
  } catch (error) {
    console.error('Error deleting artist:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar artista'
    });
  }
});

export default router;
