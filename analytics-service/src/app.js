// analytics-service/src/app.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import analyticsRoutes from './routes/analytics.js';
import { initFirestore, getFirestore } from './config/database.js';
import { runHealthCheck } from './config/healthCheck.js';

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Agregar logging de requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/analytics', analyticsRoutes);

// Health check mejorado con validación de Firestore
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

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Función para inicializar la aplicación
async function startServer() {
  try {
    console.log('🚀 Iniciando Analytics Service...');
    console.log('📝 Environment:', process.env.NODE_ENV || 'development');
    console.log('📦 Project ID:', process.env.FIRESTORE_PROJECT_ID || 'musicstreamlite');

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
    app.listen(PORT, () => {
      console.log('='.repeat(60));
      console.log(`📊 Analytics Service corriendo en puerto ${PORT}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`📈 Analytics API: http://localhost:${PORT}/api/analytics`);
      console.log('='.repeat(60));
    });

  } catch (error) {
    console.error('❌ Error fatal al iniciar el servicio:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Iniciar el servidor
startServer();

export default app;