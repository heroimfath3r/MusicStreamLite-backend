//C:\Proyectos\MusicStreamLite\MusicStreamLite-backend\catalog-service\src\app.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import morgan from 'morgan';

// ✅ Importa el router unificado (index.js)
import routes from './routes/index.js'; 

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// ============================================================
// CORS Configuration
// ============================================================
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://musicstream-frontend-586011919703.us-central1.run.app'
];

// Middleware
app.use(helmet());
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(morgan('dev'));

// ============================================================
// Routes
// ============================================================
// ✅ Monta TODAS las rutas del catalog-service bajo el prefijo /api
app.use('/api', routes);

// ============================================================
// Health check
// ============================================================
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'catalog-service',
    timestamp: new Date().toISOString()
  });
});

// ============================================================
// 404 handler
// ============================================================
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ============================================================
// Error handler
// ============================================================
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// ============================================================
// Graceful shutdown
// ============================================================
process.on('SIGINT', () => {
  console.log('🛑 Cerrando Catalog Service...');
  process.exit(0);
});

// ============================================================
// Start server
// ============================================================
app.listen(PORT, '0.0.0.0', () => {
  console.log('='.repeat(60));
  console.log(`🎵 Catalog Service running on port ${PORT}`);
  console.log(`🔗 Health check: http://0.0.0.0:${PORT}/health`);
  console.log(`📚 API: http://0.0.0.0:${PORT}/api`);
  console.log('='.repeat(60));
});

export default app;