// catalog-service/src/controllers/streamController.js
// ✅ CONTROLADOR PARA STREAMING
// Genera URLs firmadas de Google Cloud Storage para reproducir canciones

import dotenv from 'dotenv';
import { query, musicBucket } from '../config/database.js';

dotenv.config();

// ============================================================
// GET /stream/songs/:songId/stream-url
// ============================================================
/**
 * Genera una URL firmada de Google Cloud Storage válida por 24 horas
 * 
 * Parámetros:
 *   - songId: ID de la canción (serial o UUID)
 * 
 * Respuesta:
 *   {
 *     "success": true,
 *     "url": "https://storage.googleapis.com/...",
 *     "expiresIn": 86400,
 *     "songId": "123"
 *   }
 */
export const getStreamUrl = async (req, res, next) => {
  try {
    const { songId } = req.params;

    // 1. 🔍 Consultar la base de datos para obtener la ruta del archivo en GCS
    const songResult = await query(
      `SELECT audio_file_url FROM songs WHERE song_id = $1`,
      [songId]
    );

    if (songResult.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Song not found in catalog',
        songId
      });
    }

    // Obtener la ruta real del archivo desde la BD
    const audioFileUrl = songResult[0].audio_file_url;

    if (!audioFileUrl) {
      return res.status(404).json({
        success: false,
        error: 'Song does not have an associated file',
        songId
      });
    }

    // 2. 📁 EXTRAER EL PATH COMPLETO INCLUYENDO CARPETA
    // Si la URL es: https://storage.googleapis.com/music-stream-lite-bucket/Lil%20Uzi%20Vert/Lil%20Uzi%20Vert%20-%20Aye.mp3
    // Extraer: Lil%20Uzi%20Vert/Lil%20Uzi%20Vert%20-%20Aye.mp3
    // ✅ NUEVO:
    const bucketName = 'music-stream-lite-bucket';
    const bucketIndex = audioFileUrl.indexOf(bucketName);
    
    if (bucketIndex === -1) {
      return res.status(400).json({
        success: false,
        error: 'Invalid audio file URL format',
        songId
      });
    }

    // Obtener el path relativo (después de "bucket-name/")
    const pathStartIndex = bucketIndex + bucketName.length + 1;
    let fileName = audioFileUrl.substring(pathStartIndex);

    // ✅ DECODIFICAR URLs encoded (%20 → espacio, etc)
    fileName = decodeURIComponent(fileName);

    console.log(`🎵 [streamController] Obteniendo archivo: ${fileName}`);

    const file = musicBucket.file(fileName);

    // Verificar que el archivo existe en GCS
    const [exists] = await file.exists();
    if (!exists) {
      return res.status(404).json({
        success: false,
        error: `Audio file not found in bucket for: ${fileName}`,
        songId
      });
    }

    console.log(`✅ [streamController] Archivo encontrado: ${fileName}`);

    // 3. 🔑 Generar URL firmada con 24 horas de expiración
    const oneDay = 24 * 60 * 60 * 1000; // 24 horas en milisegundos
    const [signedUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + oneDay,
    });

    console.log(`🔗 [streamController] URL firmada generada para: ${fileName}`);

    // Responder con la URL
    res.status(200).json({
      success: true,
      url: signedUrl,
      expiresIn: Math.floor(oneDay / 1000), // Segundos
      songId,
      message: 'URL ready to play for 24 hours'
    });

  } catch (error) {
    console.error('❌ Error generating signed URL:', error);
    next(error);
  }
};