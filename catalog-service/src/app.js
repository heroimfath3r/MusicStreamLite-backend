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

const PORT = process.env.PORT || 5234; 

// ============================================================
// CORS Configuration
// ============================================================
// Es crucial que esta lista contenga la URL exacta del frontend que hace la solicitud.
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  // Asegúrate de que esta URL sea la correcta y NO la que dio 500
  'https://musicstream-frontend-586011919703.us-central1.run.app' 
];

// Middleware
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    // Permite solicitudes sin origen (como Postman o peticiones del mismo servidor)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
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
    timestamp: new Date().toISOString(),
    port_used: PORT // Añadido para debugging
  });
});

// ============================================================
// 404 handler
// ============================================================
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ============================================================
// Error handler (Middleware de 4 argumentos)
// ============================================================
app.use((err, req, res, next) => {
  console.error('🔴 General Error Handler:', err.stack);
  res.status(err.status || 500).json({
    error: 'Internal server error',
    message: err.message || 'Unknown server error'
  });
});

// ============================================================
// Graceful shutdown
// ============================================================
process.on('SIGINT', () => {
  console.log('🛑 Cerrando Catalog Service (SIGINT)...');
  process.exit(0);
});
process.on('SIGTERM', () => {
  console.log('🛑 Cerrando Catalog Service (SIGTERM)...');
  process.exit(0);
});


// ============================================================
// Start server (Aseguramos que el servidor inicie correctamente)
// ============================================================
try {
  app.listen(PORT, '0.0.0.0', () => {
    console.log('='.repeat(60));
    console.log(`🎵 Catalog Service running on port ${PORT}`);
    console.log(`🔗 Health check: http://0.0.0.0:${PORT}/health`);
    console.log(`📚 API: http://0.0.0.0:${PORT}/api`);
    console.log('='.repeat(60));
  });
} catch (error) {
  console.error('❌ FATAL: Failed to start server:', error);
  process.exit(1);
}


export default app;