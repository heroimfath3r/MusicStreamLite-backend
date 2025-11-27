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
  host: `/cloudsql/${process.env.INSTANCE_CONNECTION_NAME}`,
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 20000
};

// Si está en Cloud Run con instancia de Cloud SQL (socket)
let poolConfig;

if (INSTANCE_CONNECTION_NAME) {
  console.log('☁️ Using Cloud SQL socket connection...');
  console.log(`🔗 Instance: ${INSTANCE_CONNECTION_NAME}`);
  console.log(`🔗 Socket path: /cloudsql/${INSTANCE_CONNECTION_NAME}`);
  
  poolConfig = {
    ...baseConfig,
    host: `/cloudsql/${INSTANCE_CONNECTION_NAME}`,
    port: undefined, // ⭐ CRÍTICO: No usar puerto con socket Unix
    ssl: false // Cloud SQL socket no necesita SSL
  };
} else {
  console.log('💻 Using direct IP connection (local)');
  console.log(`🔗 Host: ${process.env.DB_HOST || '34.44.172.72'}`);
  console.log(`🔗 Port: ${process.env.DB_PORT || 5432}`);
  
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
  console.error('Error details:', err.message);
  console.error('Error code:', err.code);
});

pool.on('remove', () => {
  console.log('🔵 Client removed from pool');
});

// ===============================
// Initialize database connection
// ===============================
export const initDB = async () => {
  let client;
  try {
    console.log('🔄 Attempting to connect to database...');
    console.log(`   Database: ${baseConfig.database}`);
    console.log(`   User: ${baseConfig.user}`);
    
    client = await pool.connect();
    console.log('✅ Database client acquired from pool');
    
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
    console.error('❌ Database initialization error:', error.message);
    console.error('Error code:', error.code);
    console.error('Error stack:', error.stack);
    
    // Logging adicional para debugging
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 Hint: Connection refused. Check if the database is running and accessible.');
    } else if (error.code === 'ENOTFOUND') {
      console.error('💡 Hint: Host not found. Check INSTANCE_CONNECTION_NAME or DB_HOST.');
    } else if (error.code === '28P01') {
      console.error('💡 Hint: Authentication failed. Check DB_USER and DB_PASSWORD.');
    } else if (error.code === '3D000') {
      console.error('💡 Hint: Database does not exist. Check DB_NAME.');
    }
    
    throw error;
  } finally {
    if (client) {
      client.release();
      console.log('🔵 Database client released back to pool');
    }
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
    console.error('🔴 Database health check failed:', error.message);
    return { 
      status: 'unhealthy', 
      error: error.message,
      code: error.code 
    };
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