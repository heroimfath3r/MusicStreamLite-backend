import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import analyticsRoutes from './routes/analytics.js';

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/analytics', analyticsRoutes);

// Health check básico
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'analytics-service',
    timestamp: new Date().toISOString()
  });
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

// Start server
app.listen(PORT, () => {
  console.log(`📊 Analytics Service running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📈 Analytics API: http://localhost:${PORT}/api/analytics`);
});

export default app;