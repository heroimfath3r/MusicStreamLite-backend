// backend/user-service/src/controllers/userController.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production';
const JWT_EXPIRES_IN = '24h';
const SALT_ROUNDS = 12;

// ============================================
// 🔧 UTILIDADES
// ============================================
const generateToken = (user) =>
  jwt.sign({ userId: user.user_id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

const sanitizeUser = (user) => {
  if (!user) return null;
  const { password_hash, ...safe } = user;
  return safe;
};

const sendError = (res, code, message) =>
  res.status(code).json({ success: false, error: message });

// ============================================
// 🧱 HU1: REGISTRO DE USUARIO
// ============================================
export const register = async (req, res) => {
  try {
    const { email, password, name, date_of_birth, country } = req.body;

    // Validaciones básicas
    if (!email || !password || !name)
      return sendError(res, 400, 'Email, password and name are required');

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return sendError(res, 400, 'Invalid email format');

    if (password.length < 6)
      return sendError(res, 400, 'Password must be at least 6 characters long');

    // Verificar usuario existente
    const existing = await pool.query('SELECT user_id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0)
      return sendError(res, 400, 'Email already registered');

    // Crear usuario
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, name, date_of_birth, country, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) 
       RETURNING user_id, email, name, date_of_birth, country, created_at`,
      [email.toLowerCase(), hashedPassword, name, date_of_birth || null, country || null]
    );

    const user = result.rows[0];

    // Crear preferencias por defecto
    await pool.query(`INSERT INTO user_preferences (user_id) VALUES ($1)`, [user.user_id]);

    // Generar token
    const token = generateToken(user);

    console.log(`✅ User registered: ${user.email}`);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: sanitizeUser(user),
      token
    });
  } catch (error) {
    console.error('❌ Registration error:', error);
    sendError(res, 500, 'Internal server error during registration');
  }
};

// ============================================
// 🔐 HU2: LOGIN DE USUARIO
// ============================================
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return sendError(res, 400, 'Email and password are required');

    const result = await pool.query(
      `SELECT user_id, email, password_hash, name, profile_image_url, country 
       FROM users WHERE email = $1`,
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) return sendError(res, 401, 'Invalid email or password');

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) return sendError(res, 401, 'Invalid email or password');

    await pool.query('UPDATE users SET last_login = NOW() WHERE user_id = $1', [user.user_id]);

    const token = generateToken(user);
    console.log(`✅ Login successful: ${user.email}`);

    res.json({
      success: true,
      message: 'Login successful',
      user: sanitizeUser(user),
      token
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    sendError(res, 500, 'Internal server error during login');
  }
};

// ============================================
// 👤 HU10: OBTENER PERFIL DE USUARIO
// ============================================
export const getProfile = async (req, res) => {
  try {
    const { userId } = req.user;
    const result = await pool.query(
      `SELECT u.user_id, u.email, u.name, u.profile_image_url, u.date_of_birth,
              u.country, u.created_at, u.last_login,
              p.theme, p.language, p.auto_play, p.quality_preference
       FROM users u
       LEFT JOIN user_preferences p ON u.user_id = p.user_id
       WHERE u.user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) return sendError(res, 404, 'User not found');

    const user = result.rows[0];
    res.json({
      success: true,
      user: {
        id: user.user_id,
        email: user.email,
        name: user.name,
        profileImage: user.profile_image_url,
        dateOfBirth: user.date_of_birth,
        country: user.country,
        createdAt: user.created_at,
        lastLogin: user.last_login,
        preferences: {
          theme: user.theme,
          language: user.language,
          autoPlay: user.auto_play,
          quality: user.quality_preference
        }
      }
    });
  } catch (error) {
    console.error('❌ Get profile error:', error);
    sendError(res, 500, 'Internal server error');
  }
};

// ============================================
// ✏️ HU10: ACTUALIZAR PERFIL DE USUARIO
// ============================================
export const updateProfile = async (req, res) => {
  try {
    const { name, profile_image_url, date_of_birth, country } = req.body;
    const { userId } = req.user;

    const updates = [];
    const values = [];
    let index = 1;

    const fields = { name, profile_image_url, date_of_birth, country };
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) {
        updates.push(`${key} = $${index++}`);
        values.push(value);
      }
    }

    if (updates.length === 0) return sendError(res, 400, 'No fields to update');

    updates.push(`updated_at = NOW()`);
    values.push(userId);

    const query = `
      UPDATE users 
      SET ${updates.join(', ')} 
      WHERE user_id = $${index}
      RETURNING user_id, email, name, profile_image_url, date_of_birth, country, updated_at
    `;

    const result = await pool.query(query, values);
    if (result.rows.length === 0) return sendError(res, 404, 'User not found');

    const user = result.rows[0];
    console.log(`✅ Profile updated: ${user.email}`);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: sanitizeUser(user)
    });
  } catch (error) {
    console.error('❌ Update profile error:', error);
    sendError(res, 500, 'Internal server error');
  }
};

// ============================================
// 🎵 HU6: CREAR PLAYLIST
// ============================================
export const createPlaylist = async (req, res) => {
  try {
    const { name, description, is_public } = req.body;
    const { userId } = req.user;

    if (!name) return sendError(res, 400, 'Playlist name is required');

    const result = await pool.query(
      `INSERT INTO playlists (user_id, name, description, is_public, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING *`,
      [userId, name, description || null, is_public || false]
    );

    const playlist = result.rows[0];
    console.log(`✅ Playlist created: ${playlist.name}`);

    res.status(201).json({
      success: true,
      message: 'Playlist created successfully',
      playlist: {
        id: playlist.playlist_id,
        name: playlist.name,
        description: playlist.description,
        isPublic: playlist.is_public,
        coverImage: playlist.cover_image_url,
        createdAt: playlist.created_at
      }
    });
  } catch (error) {
    console.error('❌ Create playlist error:', error);
    sendError(res, 500, 'Internal server error');
  }
};

// ============================================
// 🎧 HU6: OBTENER PLAYLISTS DEL USUARIO
// ============================================
export const getPlaylists = async (req, res) => {
  try {
    const { userId } = req.user;
    const result = await pool.query(
      `SELECT p.playlist_id, p.name, p.description, p.is_public, p.cover_image_url,
              p.created_at, p.updated_at, COUNT(ps.song_id) AS song_count
       FROM playlists p
       LEFT JOIN playlist_songs ps ON p.playlist_id = ps.playlist_id
       WHERE p.user_id = $1
       GROUP BY p.playlist_id
       ORDER BY p.created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      count: result.rows.length,
      playlists: result.rows.map((p) => ({
        id: p.playlist_id,
        name: p.name,
        description: p.description,
        isPublic: p.is_public,
        coverImage: p.cover_image_url,
        songCount: parseInt(p.song_count),
        createdAt: p.created_at,
        updatedAt: p.updated_at
      }))
    });
  } catch (error) {
    console.error('❌ Get playlists error:', error);
    sendError(res, 500, 'Internal server error');
  }
};
// ============================================
// ⭐ HU5: AGREGAR CANCIÓN A FAVORITOS
// ============================================
export const addFavorite = async (req, res) => {
  try {
    const { song_id } = req.body;
    const { userId } = req.user;

    if (!song_id) return sendError(res, 400, 'Song ID is required');

    // Verificar si ya existe en favoritos
    const existing = await pool.query(
      'SELECT favorite_id FROM favorites WHERE user_id = $1 AND song_id = $2',
      [userId, song_id]
    );

    if (existing.rows.length > 0) {
      return sendError(res, 400, 'Song already in favorites');
    }

    // Agregar a favoritos
    const result = await pool.query(
      `INSERT INTO favorites (user_id, song_id, added_at)
       VALUES ($1, $2, NOW())
       RETURNING *`,
      [userId, song_id]
    );

    console.log(`✅ Song ${song_id} added to favorites for user ${userId}`);

    res.status(201).json({
      success: true,
      message: 'Song added to favorites',
      favorite: {
        id: result.rows[0].favorite_id,
        songId: result.rows[0].song_id,
        addedAt: result.rows[0].added_at
      }
    });
  } catch (error) {
    console.error('❌ Add favorite error:', error);
    console.error('❌ Error details:', error.message);
    console.error('❌ Error stack:', error.stack);
    sendError(res, 500, 'Internal server error');
  }
};

// ============================================
// ❌ HU5: ELIMINAR CANCIÓN DE FAVORITOS
// ============================================
export const removeFavorite = async (req, res) => {
  try {
    const { song_id } = req.params;
    const { userId } = req.user;

    const result = await pool.query(
      'DELETE FROM favorites WHERE user_id = $1 AND song_id = $2 RETURNING *',
      [userId, song_id]
    );

    if (result.rows.length === 0) {
      return sendError(res, 404, 'Favorite not found');
    }

    console.log(`✅ Song ${song_id} removed from favorites for user ${userId}`);

    res.json({
      success: true,
      message: 'Song removed from favorites'
    });
  } catch (error) {
    console.error('❌ Remove favorite error:', error);
    sendError(res, 500, 'Internal server error');
  }
};

// ============================================
// 📋 HU5: OBTENER FAVORITOS DEL USUARIO
// ============================================
export const getFavorites = async (req, res) => {
  try {
    const { userId } = req.user;

    const result = await pool.query(
      `SELECT f.favorite_id, f.song_id, f.added_at
       FROM favorites f
       WHERE f.user_id = $1
       ORDER BY f.added_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      count: result.rows.length,
      favorites: result.rows.map(f => ({
        id: f.favorite_id,
        songId: f.song_id,
        addedAt: f.added_at
      }))
    });
  } catch (error) {
    console.error('❌ Get favorites error:', error);
    sendError(res, 500, 'Internal server error');
  }
};

// ============================================
// ➕ HU6: AGREGAR CANCIÓN A PLAYLIST
// ============================================
export const addSongToPlaylist = async (req, res) => {
  try {
    const { playlist_id } = req.params;
    const { song_id } = req.body;
    const { userId } = req.user;

    if (!song_id) return sendError(res, 400, 'Song ID is required');

    // Verificar que la playlist pertenezca al usuario
    const playlistCheck = await pool.query(
      'SELECT playlist_id FROM playlists WHERE playlist_id = $1 AND user_id = $2',
      [playlist_id, userId]
    );

    if (playlistCheck.rows.length === 0) {
      return sendError(res, 404, 'Playlist not found or not owned by user');
    }

    // Verificar si la canción ya está en la playlist
    const existing = await pool.query(
      'SELECT playlist_song_id FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2',
      [playlist_id, song_id]
    );

    if (existing.rows.length > 0) {
      return sendError(res, 400, 'Song already in playlist');
    }

    // Obtener la siguiente posición
    const positionQuery = await pool.query(
      'SELECT COALESCE(MAX(position), 0) + 1 as next_position FROM playlist_songs WHERE playlist_id = $1',
      [playlist_id]
    );
    const position = positionQuery.rows[0].next_position;

    // Agregar canción a la playlist
    const result = await pool.query(
      `INSERT INTO playlist_songs (playlist_id, song_id, position, added_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING *`,
      [playlist_id, song_id, position]
    );

    // Actualizar updated_at de la playlist
    await pool.query(
      'UPDATE playlists SET updated_at = NOW() WHERE playlist_id = $1',
      [playlist_id]
    );

    console.log(`✅ Song ${song_id} added to playlist ${playlist_id}`);

    res.status(201).json({
      success: true,
      message: 'Song added to playlist',
      playlistSong: {
        id: result.rows[0].playlist_song_id,
        playlistId: result.rows[0].playlist_id,
        songId: result.rows[0].song_id,
        position: result.rows[0].position,
        addedAt: result.rows[0].added_at
      }
    });
  } catch (error) {
    console.error('❌ Add song to playlist error:', error);
    sendError(res, 500, 'Internal server error');
  }
};

// ============================================
// ➖ HU6: ELIMINAR CANCIÓN DE PLAYLIST
// ============================================
export const removeSongFromPlaylist = async (req, res) => {
  try {
    const { playlist_id, song_id } = req.params;
    const { userId } = req.user;

    // Verificar que la playlist pertenezca al usuario
    const playlistCheck = await pool.query(
      'SELECT playlist_id FROM playlists WHERE playlist_id = $1 AND user_id = $2',
      [playlist_id, userId]
    );

    if (playlistCheck.rows.length === 0) {
      return sendError(res, 404, 'Playlist not found or not owned by user');
    }

    // Eliminar canción
    const result = await pool.query(
      'DELETE FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2 RETURNING *',
      [playlist_id, song_id]
    );

    if (result.rows.length === 0) {
      return sendError(res, 404, 'Song not found in playlist');
    }

    // Actualizar updated_at de la playlist
    await pool.query(
      'UPDATE playlists SET updated_at = NOW() WHERE playlist_id = $1',
      [playlist_id]
    );

    console.log(`✅ Song ${song_id} removed from playlist ${playlist_id}`);

    res.json({
      success: true,
      message: 'Song removed from playlist'
    });
  } catch (error) {
    console.error('❌ Remove song from playlist error:', error);
    sendError(res, 500, 'Internal server error');
  }
};

// ============================================
// 🎵 HU6: OBTENER CANCIONES DE UNA PLAYLIST
// ============================================
export const getPlaylistSongs = async (req, res) => {
  try {
    const { playlist_id } = req.params;
    const { userId } = req.user;

    // Verificar que la playlist pertenezca al usuario o sea pública
    const playlistCheck = await pool.query(
      'SELECT * FROM playlists WHERE playlist_id = $1 AND (user_id = $2 OR is_public = true)',
      [playlist_id, userId]
    );

    if (playlistCheck.rows.length === 0) {
      return sendError(res, 404, 'Playlist not found or access denied');
    }

    const result = await pool.query(
      `SELECT ps.playlist_song_id, ps.song_id, ps.position, ps.added_at
       FROM playlist_songs ps
       WHERE ps.playlist_id = $1
       ORDER BY ps.position ASC`,
      [playlist_id]
    );

    res.json({
      success: true,
      playlist: {
        id: playlistCheck.rows[0].playlist_id,
        name: playlistCheck.rows[0].name,
        description: playlistCheck.rows[0].description
      },
      count: result.rows.length,
      songs: result.rows.map(s => ({
        id: s.playlist_song_id,
        songId: s.song_id,
        position: s.position,
        addedAt: s.added_at
      }))
    });
  } catch (error) {
    console.error('❌ Get playlist songs error:', error);
    sendError(res, 500, 'Internal server error');
  }
};

// ============================================
// 🗑️ HU6: ELIMINAR PLAYLIST
// ============================================
export const deletePlaylist = async (req, res) => {
  try {
    const { playlist_id } = req.params;
    const { userId } = req.user;

    const result = await pool.query(
      'DELETE FROM playlists WHERE playlist_id = $1 AND user_id = $2 RETURNING *',
      [playlist_id, userId]
    );

    if (result.rows.length === 0) {
      return sendError(res, 404, 'Playlist not found or not owned by user');
    }

    console.log(`✅ Playlist ${playlist_id} deleted`);

    res.json({
      success: true,
      message: 'Playlist deleted successfully',
      playlist: {
        id: result.rows[0].playlist_id,
        name: result.rows[0].name
      }
    });
  } catch (error) {
    console.error('❌ Delete playlist error:', error);
    sendError(res, 500, 'Internal server error');
  }
};

// ============================================
// 📊 HU8: REGISTRAR REPRODUCCIÓN
// ============================================
export const recordPlay = async (req, res) => {
  try {
    const { song_id, duration_played, completed } = req.body;
    const { userId } = req.user;

    if (!song_id) return sendError(res, 400, 'Song ID is required');

    // Registrar en historial
    const result = await pool.query(
      `INSERT INTO play_history (user_id, song_id, played_at, duration_played, completed)
       VALUES ($1, $2, NOW(), $3, $4)
       RETURNING *`,
      [userId, song_id, duration_played || 0, completed || false]
    );

    // Actualizar o crear estadísticas de usuario-canción
    const statsCheck = await pool.query(
      'SELECT stat_id, play_count, total_time_played FROM user_song_stats WHERE user_id = $1 AND song_id = $2',
      [userId, song_id]
    );

    if (statsCheck.rows.length > 0) {
      // Actualizar estadísticas existentes
      await pool.query(
        `UPDATE user_song_stats 
         SET play_count = play_count + 1,
             total_time_played = total_time_played + $1,
             last_played = NOW(),
             updated_at = NOW()
         WHERE user_id = $2 AND song_id = $3`,
        [duration_played || 0, userId, song_id]
      );
    } else {
      // Crear nuevas estadísticas
      await pool.query(
        `INSERT INTO user_song_stats (user_id, song_id, play_count, total_time_played, last_played)
         VALUES ($1, $2, 1, $3, NOW())`,
        [userId, song_id, duration_played || 0]
      );
    }

    console.log(`✅ Play recorded: user ${userId}, song ${song_id}`);

    res.status(201).json({
      success: true,
      message: 'Play recorded successfully',
      play: {
        id: result.rows[0].play_id,
        songId: result.rows[0].song_id,
        playedAt: result.rows[0].played_at,
        durationPlayed: result.rows[0].duration_played,
        completed: result.rows[0].completed
      }
    });
  } catch (error) {
    console.error('❌ Record play error:', error);
    sendError(res, 500, 'Internal server error');
  }
};

// ============================================
// 🕐 HU8: VER HISTORIAL DE REPRODUCCIÓN
// ============================================
export const getPlayHistory = async (req, res) => {
  try {
    const { userId } = req.user;
    const { limit = 50, offset = 0 } = req.query;

    const result = await pool.query(
      `SELECT ph.play_id, ph.song_id, ph.played_at, ph.duration_played, ph.completed, ph.device_type
       FROM play_history ph
       WHERE ph.user_id = $1
       ORDER BY ph.played_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const countResult = await pool.query(
      'SELECT COUNT(*) as total FROM play_history WHERE user_id = $1',
      [userId]
    );

    res.json({
      success: true,
      total: parseInt(countResult.rows[0].total),
      count: result.rows.length,
      limit: parseInt(limit),
      offset: parseInt(offset),
      history: result.rows.map(h => ({
        id: h.play_id,
        songId: h.song_id,
        playedAt: h.played_at,
        durationPlayed: h.duration_played,
        completed: h.completed,
        deviceType: h.device_type
      }))
    });
  } catch (error) {
    console.error('❌ Get play history error:', error);
    sendError(res, 500, 'Internal server error');
  }
};

// ============================================
// 📈 HU8: VER ESTADÍSTICAS DE USUARIO
// ============================================
export const getUserStats = async (req, res) => {
  try {
    const { userId } = req.user;

    // Canciones más escuchadas
    const topSongs = await pool.query(
      `SELECT song_id, play_count, total_time_played, last_played
       FROM user_song_stats
       WHERE user_id = $1
       ORDER BY play_count DESC
       LIMIT 10`,
      [userId]
    );

    // Total de reproducciones
    const totalPlays = await pool.query(
      'SELECT COUNT(*) as total FROM play_history WHERE user_id = $1',
      [userId]
    );

    // Tiempo total de escucha
    const totalTime = await pool.query(
      'SELECT SUM(duration_played) as total_seconds FROM play_history WHERE user_id = $1',
      [userId]
    );

    res.json({
      success: true,
      stats: {
        totalPlays: parseInt(totalPlays.rows[0].total),
        totalListeningTime: parseInt(totalTime.rows[0].total_seconds || 0),
        topSongs: topSongs.rows.map(s => ({
          songId: s.song_id,
          playCount: s.play_count,
          totalTimePlayed: s.total_time_played,
          lastPlayed: s.last_played
        }))
      }
    });
  } catch (error) {
    console.error('❌ Get user stats error:', error);
    sendError(res, 500, 'Internal server error');
  }
};