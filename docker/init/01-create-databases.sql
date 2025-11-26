-- ============================================
-- MUSICSTREAMLITE - DATABASE INITIALIZATION
-- ============================================
-- La base de datos ya existe (creada por POSTGRES_DB)
-- Solo configuramos extensiones

-- Conectar a la base de datos
\c musicstream_db;

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";    -- Para UUIDs
CREATE EXTENSION IF NOT EXISTS "pg_trgm";      -- Para búsqueda de texto

-- Verificar que todo esté correcto
SELECT 'Database musicstream_db configured successfully!' AS status;