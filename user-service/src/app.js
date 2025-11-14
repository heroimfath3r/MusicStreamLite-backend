// C:\Proyectos\MusicStreamLite\MusicStreamLite-backend\user-service\src\app.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import morgan from 'morgan';
import routes from './routes/index.js';
import { initDB, checkDatabaseHealth, closeDatabase } from './config/database.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080

// Middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3000', 
  'https://musicstream-frontend-586011919703.us-central1.run.app'], // Puertos donde corre tu React
  credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));

// ✅ Prefijo general de rutas del servicio
app.use('/api', routes);

// ✅ Health check
app.get('/health', async (req, res) => {
  try {
    const dbHealth = await checkDatabaseHealth();
    res.json({
      status: 'OK',
      service: 'user-service',
      database: dbHealth.status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ status: 'ERROR', error: error.message });
  }
});

// ✅ Ruta por defecto (404)
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ✅ Cierre controlado
process.on('SIGINT', async () => {
  console.log('🛑 Cerrando servidor...');
  await closeDatabase();
  process.exit(0);
});

// ✅ Iniciar servidor
const startServer = async () => {
  try {
    await initDB();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 User Service corriendo en http://0.0.0.0:${PORT}`);
      console.log(`🔗 Health check: http://0.0.0.0:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servicio:', error);
    process.exit(1);
  }
};

startServer();
