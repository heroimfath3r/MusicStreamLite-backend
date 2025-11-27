// catalog-service/src/config/database.js
//  ARCHIVO PRINCIPAL DE CONFIGURACIÓN DE BASE DE DATOS

import { Storage } from '@google-cloud/storage';
import pkg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

// ============================================================
// 📁 CONFIGURACIÓN DE GOOGLE CLOUD STORAGE
// ============================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = new Storage({
  projectId: 'musicstreamlite',
});

const musicBucket = storage.bucket('music-stream-lite-bucket');

export const uploadSong = async (fileBuffer, fileName, mimetype) => {
  try {
    const file = musicBucket.file(fileName);
    await file.save(fileBuffer, {
      metadata: { contentType: mimetype },
    });
    await file.makePublic();
    const publicUrl = `https://storage.googleapis.com/music-stream-lite-bucket/${fileName}`;
    console.log(` Canción subida: ${fileName}`);
    return publicUrl;
  } catch (error) {
    console.error(' Error subiendo archivo:', error);
    throw new Error(`Error uploading file: ${error.message}`);
  }
};

export const getSongUrl = (fileName) => {
  return `https://storage.googleapis.com/music-stream-lite-bucket/${fileName}`;
};

export const listSongs = async () => {
  try {
    const [files] = await musicBucket.getFiles();
    const songs = files.map(file => ({
      name: file.name,
      url: `https://storage.googleapis.com/music-stream-lite-bucket/${file.name}`,
      size: file.metadata.size,
      contentType: file.metadata.contentType,
      createdAt: file.metadata.timeCreated
    }));
    console.log(`📁 Encontradas ${songs.length} canciones en el bucket`);
    return songs;
  } catch (error) {
    console.error(' Error listando archivos:', error);
    throw new Error(`Error listing files: ${error.message}`);
  }
};

export const deleteSong = async (fileName) => {
  try {
    await musicBucket.file(fileName).delete();
    console.log(` Canción eliminada: ${fileName}`);
    return true;
  } catch (error) {
    console.error(' Error eliminando archivo:', error);
    throw new Error(`Error deleting file: ${error.message}`);
  }
};

// ============================================================
//  CONFIGURACIÓN DE POSTGRESQL
// ============================================================

const INSTANCE_CONNECTION_NAME = process.env.INSTANCE_CONNECTION_NAME;
const NODE_ENV = process.env.NODE_ENV || 'development';

console.log(' [Catalog Service] Configuración de PostgreSQL:');
console.log(`   NODE_ENV: ${NODE_ENV}`);
console.log(`   DB_HOST: ${process.env.DB_HOST}`);
console.log(`   DB_PORT: ${process.env.DB_PORT}`);
console.log(`   DB_NAME: ${process.env.DB_NAME}`);
console.log(`   DB_USER: ${process.env.DB_USER}`);

let poolConfig;

//  SOLUCIÓN: Solo usar Cloud SQL si está en producción Y definido
if (INSTANCE_CONNECTION_NAME && NODE_ENV === 'production') {
  console.log('  Usando Cloud SQL socket connection');
  poolConfig = {
    user: process.env.DB_USER,
    host: `/cloudsql/${INSTANCE_CONNECTION_NAME}`,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 20000,
    ssl: false
  };
} else {
  //  Desarrollo local o producción sin Cloud SQL
  console.log(' Usando PostgreSQL local/directo');
  console.log(`   Conectando a: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
  poolConfig = {
    user: process.env.DB_USER,
    host: process.env.DB_HOST || 'postgres',
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT) || 5432,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 20000,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
  };
}

const pool = new Pool(poolConfig);

// Event listeners
pool.on('connect', () => {
  console.log(' [Catalog Service] Conectado a PostgreSQL');
});

pool.on('error', (err) => {
  console.error(' [Catalog Service] Error en pool de PostgreSQL:', err.message);
});

//  FUNCIÓN CENTRALIZADA PARA QUERIES
export const query = async (text, params = []) => {
  try {
    const result = await pool.query(text, params);
    return result.rows;
  } catch (error) {
    console.error(' Error ejecutando query:', error.message);
    throw error;
  }
};

export { pool, storage, musicBucket };
export default {};
