// analytics-service/src/config/healthCheck.js
import { getFirestore, COLLECTIONS } from './database.js';

export async function runHealthCheck() {
  try {
    console.log('🔥 Ejecutando health check de Firestore...');
    console.log('   Environment:', process.env.NODE_ENV || 'unknown');
    console.log('   Project ID:', process.env.FIRESTORE_PROJECT_ID || 'musicstreamlite');

    const db = getFirestore();
    console.log('   Firestore instance obtenida correctamente');

    // Usar la colección 'analytics' en lugar de '_health_check'
    const healthCheckId = `health_check_${Date.now()}`;
    const testDoc = db.collection('analytics').doc(healthCheckId);

    console.log('   Intentando escribir documento de prueba en colección "analytics"...');
    await testDoc.set({
      type: 'health_check',
      timestamp: new Date().toISOString(),
      status: 'ok',
      environment: process.env.NODE_ENV || 'unknown',
      projectId: process.env.FIRESTORE_PROJECT_ID || 'musicstreamlite',
      checkId: healthCheckId
    });

    console.log('   Verificando lectura del documento...');
    const readDoc = await testDoc.get();

    if (!readDoc.exists) {
      throw new Error('No se pudo leer el documento de prueba después de escribirlo');
    }

    const data = readDoc.data();
    console.log('   Documento leído exitosamente:', data.checkId);

    // Limpiar documento de prueba
    console.log('   Eliminando documento de prueba...');
    await testDoc.delete();

    console.log('✅ Firestore health check exitoso 🚀');
    console.log('   - Escritura: OK');
    console.log('   - Lectura: OK');
    console.log('   - Eliminación: OK');

    return {
      ok: true,
      message: 'Firestore write/read/delete OK',
      collection: 'analytics',
      projectId: process.env.FIRESTORE_PROJECT_ID || 'musicstreamlite'
    };
  } catch (error) {
    console.error('❌ Error en health check de Firestore:');
    console.error('   Mensaje:', error.message);
    console.error('   Stack:', error.stack);
    console.error('   Code:', error.code);

    return {
      ok: false,
      message: error.message,
      code: error.code,
      details: error.stack
    };
  }
}