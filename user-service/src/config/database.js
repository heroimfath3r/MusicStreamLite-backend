// user-service/src/config/database.js
import dotenv from 'dotenv';
dotenv.config();

import pkg from 'pg';
const { Pool } = pkg;

const INSTANCE_CONNECTION_NAME = process.env.INSTANCE_CONNECTION_NAME; // project:region:instance

// Base config (común a ambos entornos)
const baseConfig = {
  user: process.env.DB_USER || 'musicstreamdb',
  database: process.env.DB_NAME || 'musicstream_db',
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 20000
};

// Si está en Cloud Run con instancia de Cloud SQL (socket)
let poolConfig;

if (INSTANCE_CONNECTION_NAME) {
  console.log('☁️ Using Cloud SQL socket connection...');
  poolConfig = {
    ...baseConfig,
    host: `/cloudsql/${INSTANCE_CONNECTION_NAME}`,
    ssl: false // Cloud SQL socket no necesita SSL
  };
} else {
  console.log('💻 Using direct IP connection (local)');
  poolConfig = {
    ...baseConfig,
    host: process.env.DB_HOST || '34.44.172.72',
    port: process.env.DB_PORT || 5432,
    ssl: { rejectUnauthorized: false } // útil si tu instancia requiere SSL
  };
}

export const pool = new Pool(poolConfig);

// Event listeners
pool.on('connect', () => {
  console.log('🟢 Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('🔴 Database pool error:', err);
});

pool.on('remove', () => {
  console.log('🔵 Client removed from pool');
});

// ===============================
// Initialize database connection
// ===============================
export const initDB = async () => {
  const client = await pool.connect();
  try {
    console.log('🔄 Verifying database connection...');
    const result = await client.query('SELECT NOW() as current_time');
    console.log('✅ Database connected at:', result.rows[0].current_time);

    // Verify essential tables exist
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'playlists', 'playlist_songs', 'favorites', 'user_preferences')
      ORDER BY table_name
    `);

    console.log('📋 Tables found:', tables.rows.map(r => r.table_name).join(', ') || 'No tables found');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw error;
  } finally {
    client.release();
  }
};

// ===============================
// Health check
// ===============================
export const checkDatabaseHealth = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as version');
    client.release();
    return {
      status: 'healthy',
      timestamp: result.rows[0].current_time,
      version: result.rows[0].version
    };
  } catch (error) {
    console.error('🔴 Database health check failed:', error);
    return { status: 'unhealthy', error: error.message };
  }
};

// ===============================
// Graceful shutdown
// ===============================
export const closeDatabase = async () => {
  try {
    await pool.end();
    console.log('🔵 Database pool closed');
  } catch (error) {
    console.error('Error closing database pool:', error);
  }
};

// ===============================
// Utility helpers
// ===============================
export const databaseUtils = {
  async executeTransaction(callback) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  paginate(query, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    return {
      query: `${query} LIMIT $1 OFFSET $2`,
      params: [limit, offset]
    };
  },

  buildWhereClause(filters) {
    const conditions = [];
    const values = [];
    let paramCount = 0;

    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null && value !== '') {
        paramCount++;
        conditions.push(`${key} = $${paramCount}`);
        values.push(value);
      }
    }

    return {
      where: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '',
      values
    };
  }
};
export default pool;