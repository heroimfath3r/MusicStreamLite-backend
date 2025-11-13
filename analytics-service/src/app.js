import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import morgan from 'morgan';
import analyticsRoutes from './routes/analytics.js';
import { initFirestore, getFirestore } from './config/database.js';
import { runHealthCheck } from './config/healthCheck.js';

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
// Logging middleware
// ============================================================
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ============================================================
// Routes
// ============================================================
app.use('/api/analytics', analyticsRoutes);

// ============================================================
// Health check mejorado con validación de Firestore
// ============================================================
app.get('/health', async (req, res) => {
  try {
    const firestoreHealth = await runHealthCheck();

    if (!firestoreHealth.ok) {
      return res.status(503).json({
        status: 'UNHEALTHY',
        service: 'analytics-service',
        timestamp: new Date().toISOString(),
        firestore: firestoreHealth
      });
    }

    res.json({
      status: 'OK',
      service: 'analytics-service',
      timestamp: new Date().toISOString(),
      firestore: firestoreHealth
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(503).json({
      status: 'UNHEALTHY',
      service: 'analytics-service',
      timestamp: new Date().toISOString(),
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
  res.status(500).json({
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
// Función para inicializar la aplicación
// ============================================================
async function startServer() {
  try {
    console.log('🚀 Iniciando Analytics Service...');
    console.log('📝 Environment:', process.env.NODE_ENV || 'development');
    console.log('📦 Project ID:', process.env.GOOGLE_CLOUD_PROJECT || 'musicstreamlite');

    // Inicializar Firestore antes de iniciar el servidor
    console.log('🔥 Inicializando conexión a Firestore...');
    initFirestore();
    const db = getFirestore();
    console.log('✅ Conexión a Firestore establecida');

    // Ejecutar health check inicial
    console.log('🏥 Ejecutando health check inicial...');
    const healthResult = await runHealthCheck();

    if (!healthResult.ok) {
      console.error('❌ Health check inicial falló:', healthResult.message);
      console.error('⚠️  El servicio continuará iniciando, pero puede haber problemas de conexión');
    } else {
      console.log('✅ Health check inicial exitoso');
    }

    // Iniciar servidor
    app.listen(PORT, '0.0.0.0', () => {
      console.log('='.repeat(60));
      console.log(`📊 Analytics Service corriendo en puerto ${PORT}`);
      console.log(`🔗 Health check: http://0.0.0.0:${PORT}/health`);
      console.log(`📈 Analytics API: http://0.0.0.0:${PORT}/api/analytics`);
      console.log('='.repeat(60));
    });

  } catch (error) {
    console.error('❌ Error fatal al iniciar el servicio:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// ============================================================
// Iniciar el servidor
// ============================================================
startServer();

export default app;