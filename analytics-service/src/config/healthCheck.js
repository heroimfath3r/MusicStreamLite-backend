// healthCheck.js
import { firestore } from './database.js';

async function runHealthCheck() {
  try {
    console.log('🔥 Intentando escribir en Firestore...');
    const docRef = firestore.collection('_health_check').doc('test');
    await docRef.set({
      timestamp: new Date(),
      status: 'ok'
    });
    console.log('✅ Documento de health check creado 🚀');
  } catch (error) {
    console.error('❌ Error al crear health check:', error.code, error.message);
  } finally {
    process.exit();
  }
}

runHealthCheck();
