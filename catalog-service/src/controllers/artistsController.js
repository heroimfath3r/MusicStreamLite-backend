// catalog-service/src/controllers/artistsController.js
// ✅ CONTROLADOR PARA ARTISTAS
// Usa query() de database.js para todas las operaciones

import { query } from "../config/database.js";

// ============================================================
// GET /artists  → Obtener todos los artistas
// ============================================================
export const getArtists = async (req, res, next) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const sql = `
      SELECT 
        ar.*,
        COUNT(DISTINCT s.song_id) AS song_count,
        COUNT(DISTINCT al.album_id) AS album_count
      FROM artists ar
      LEFT JOIN songs s ON ar.artist_id = s.artist_id
      LEFT JOIN albums al ON ar.artist_id = al.artist_id
      GROUP BY ar.artist_id
      ORDER BY ar.name ASC
      LIMIT $1 OFFSET $2
    `;

    const rows = await query(sql, [limit, offset]);

    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('❌ Error fetching artists:', error);
    next(error);
  }
};

// ============================================================
// GET /artists/:id  → Obtener un artista por ID
// ============================================================
export const getArtistById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const artistSql = `
      SELECT 
        ar.*,
        COUNT(DISTINCT s.song_id) AS song_count,
        COUNT(DISTINCT al.album_id) AS album_count
      FROM artists ar
      LEFT JOIN songs s ON ar.artist_id = s.artist_id
      LEFT JOIN albums al ON ar.artist_id = al.artist_id
      WHERE ar.artist_id = $1
      GROUP BY ar.artist_id
    `;

    const artistRows = await query(artistSql, [id]);

    if (artistRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Artist not found'
      });
    }

    // Obtener sus canciones
    const songsSql = `
      SELECT s.*, al.title AS album_name
      FROM songs s
      LEFT JOIN albums al ON s.album_id = al.album_id
      WHERE s.artist_id = $1
      ORDER BY s.created_at DESC
      LIMIT 20
    `;
    const songs = await query(songsSql, [id]);

    // Obtener sus álbumes
    const albumsSql = `
      SELECT * FROM albums
      WHERE artist_id = $1
      ORDER BY release_date DESC
    `;
    const albums = await query(albumsSql, [id]);

    res.json({
      success: true,
      data: {
        ...artistRows[0],
        songs,
        albums
      }
    });
  } catch (error) {
    console.error('❌ Error fetching artist:', error);
    next(error);
  }
};

// ============================================================
// POST /artists  → Crear un nuevo artista
// ============================================================
export const createArtist = async (req, res, next) => {
  try {
    const { name, bio, image_url } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'El nombre del artista es requerido'
      });
    }

    const sql = `
      INSERT INTO artists (name, bio, image_url, created_at, updated_at)
      VALUES ($1, $2, $3, NOW(), NOW())
      RETURNING *
    `;

    const rows = await query(sql, [name.trim(), bio || null, image_url || null]);

    res.status(201).json({
      success: true,
      message: 'Artist created successfully',
      data: rows[0]
    });
  } catch (error) {
    console.error('❌ Error creating artist:', error);
    next(error);
  }
};

// ============================================================
// PUT /artists/:id  → Actualizar un artista existente
// ============================================================
export const updateArtist = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, bio, image_url } = req.body;

    // Construcción dinámica de updates
    const updates = [];
    const values = [];
    let index = 1;

    if (name !== undefined) {
      updates.push(`name = $${index++}`);
      values.push(name);
    }
    if (bio !== undefined) {
      updates.push(`bio = $${index++}`);
      values.push(bio);
    }
    if (image_url !== undefined) {
      updates.push(`image_url = $${index++}`);
      values.push(image_url);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const sql = `
      UPDATE artists
      SET ${updates.join(', ')}
      WHERE artist_id = $${index + 1}
      RETURNING *
    `;

    const rows = await query(sql, values);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Artist not found'
      });
    }

    res.json({
      success: true,
      message: 'Artist updated successfully',
      data: rows[0]
    });
  } catch (error) {
    console.error('❌ Error updating artist:', error);
    next(error);
  }
};

// ============================================================
// DELETE /artists/:id  → Eliminar artista
// ============================================================
export const deleteArtist = async (req, res, next) => {
  try {
    const { id } = req.params;

    const sql = 'DELETE FROM artists WHERE artist_id = $1 RETURNING artist_id';
    const rows = await query(sql, [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Artist not found'
      });
    }

    res.json({
      success: true,
      message: 'Artist deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting artist:', error);
    next(error);
  }
};
// ============================================================