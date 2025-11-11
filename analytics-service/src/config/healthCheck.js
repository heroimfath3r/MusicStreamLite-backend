// analytics-service/src/config/healthCheck.js
import { getFirestore } from './database.js';

export async function runHealthCheck() {
  try {
    console.log('🔥 Ejecutando health check de Firestore...');
    const db = getFirestore();

    const testDoc = db.collection('_health_check').doc('test');
    await testDoc.set({
      timestamp: new Date().toISOString(),
      status: 'ok',
      environment: process.env.NODE_ENV || 'unknown',
    });

    console.log('✅ Firestore health check exitoso 🚀');
    return { ok: true, message: 'Firestore write/read OK' };
  } catch (error) {
    console.error('❌ Error en health check de Firestore:', error.message);
    return { ok: false, message: error.message };
  }
}