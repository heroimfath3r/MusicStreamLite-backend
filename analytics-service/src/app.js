
// analytics-service/src/app.js
import express from 'express'
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import morgan from 'morgan';
import analyticsRoutes from './routes/analytics.js';
import { initFirestore, getFirestore } from './config/database.js';

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
  origin: (origin, callback) => {
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
app.use('/api/analytics', analyticsRoutes);

// ============================================================
// Health check mejorado
// ============================================================
app.get('/health', async (req, res) => {
  try {
    // Simple health check - sin intentar conectar a Firestore
    res.json({
      status: 'OK',
      service: 'analytics-service',
      timestamp: new Date().toISOString(),
      port_used: PORT,
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(503).json({
      status: 'UNHEALTHY',
      service: 'analytics-service',
      error: error.message
    });
  }
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
  res.status(err.status || 500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// ============================================================
// Graceful shutdown
// ============================================================
process.on('SIGINT', async () => {
  console.log('🛑 Cerrando Analytics Service...');
  process.exit(0);
});

// ============================================================
// Start server
// ============================================================
async function startServer() {
  try {
    console.log('🚀 Iniciando Analytics Service...');
    console.log('📝 Environment:', process.env.NODE_ENV || 'development');
    console.log('📦 Project ID:', process.env.GOOGLE_CLOUD_PROJECT || 'musicstreamlite');

    // Inicializar Firestore
    console.log('🔥 Inicializando Firestore...');
    initFirestore();
    const db = getFirestore();
    console.log('✅ Firestore inicializado');

    // Iniciar servidor
    app.listen(PORT, '0.0.0.0', () => {
      console.log('='.repeat(60));
      console.log(`📊 Analytics Service corriendo en puerto ${PORT}`);
      console.log(`🔗 Health check: http://0.0.0.0:${PORT}/health`);
      console.log(`📈 Analytics API: http://0.0.0.0:${PORT}/api/analytics`);
      console.log('='.repeat(60));
    });

  } catch (error) {
    console.error('❌ Error fatal al iniciar:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

startServer();

export default app;