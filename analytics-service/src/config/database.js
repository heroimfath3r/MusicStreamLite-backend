// analytics-service/src/config/database.js
import { Firestore } from '@google-cloud/firestore';
import dotenv from 'dotenv';

dotenv.config();

let firestoreInstance = null;

/**
 * Inicializa la conexión a Firestore
 */
export const initFirestore = () => {
  if (firestoreInstance) {
    return firestoreInstance;
  }

  try {
    const config = {
      projectId: process.env.FIRESTORE_PROJECT_ID || process.env.PROJECT_ID || 'musicstreamlite',
    };

    if (process.env.NODE_ENV === 'development' && process.env.FIRESTORE_EMULATOR_HOST) {
      console.log(`📊 Conectando a Firestore Emulator: ${process.env.FIRESTORE_EMULATOR_HOST}`);
    } else if (process.env.NODE_ENV === 'production') {
      console.log(`📊 Conectando a Firestore Production: ${config.projectId}`);
    } else {
      console.log(`📊 Conectando a Firestore: ${config.projectId}`);
      console.log(`💡 Asegúrate de haber ejecutado: gcloud auth application-default login`);
    }

    firestoreInstance = new Firestore(config);
    console.log('✅ Firestore inicializado correctamente');
    return firestoreInstance;
  } catch (error) {
    console.error('❌ Error al inicializar Firestore:', error);
    throw error;
  }
};

/**
 * Obtiene la instancia de Firestore
 */
export const getFirestore = () => {
  if (!firestoreInstance) {
    return initFirestore();
  }
  return firestoreInstance;
};

// ⭐ NUEVOS EXPORTS QUE FALTABAN ⭐
export const firestore = getFirestore();
export const analyticsDB = firestore.collection('analytics');

/**
 * Cierra la conexión a Firestore
 */
export const closeFirestore = async () => {
  if (firestoreInstance) {
    await firestoreInstance.terminate();
    firestoreInstance = null;
    console.log('🔌 Firestore desconectado');
  }
};

/**
 * Health check
 */
export const checkFirestoreConnection = async () => {
  try {
    const db = getFirestore();
    await db.collection('_health_check').limit(1).get();
    console.log('✅ Health check de Firestore exitoso');
    return true;
  } catch (error) {
    console.error('❌ Error en health check de Firestore:', error.message);
    return false;
  }
};

/**
 * Nombres de colecciones
 */
export const COLLECTIONS = {
  PLAYS: 'plays',
  USER_STATS: 'user_stats',
  SONG_STATS: 'song_stats',
  DAILY_METRICS: 'daily_metrics',
  RECOMMENDATIONS: 'recommendations',
  TRENDING: 'trending',
};

export default {
  initFirestore,
  getFirestore,
  closeFirestore,
  checkFirestoreConnection,
  COLLECTIONS,
  firestore,        // ⭐ Agregado
  analyticsDB,      // ⭐ Agregado
};