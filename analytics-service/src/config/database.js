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

    // 🔑 Si estás ejecutando en local, usa la cuenta de servicio
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      config.keyFilename = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    }

    // 🧪 Si estás usando el emulador local de Firestore
    if (process.env.FIRESTORE_EMULATOR_HOST) {
      console.log(`🧪 Conectando al Firestore Emulator en ${process.env.FIRESTORE_EMULATOR_HOST}`);
      process.env.FIRESTORE_PROJECT_ID = config.projectId;
    }

    // 🌐 Log de entorno
    if (process.env.NODE_ENV === 'production') {
      console.log(`📊 Conectando a Firestore (Producción): ${config.projectId}`);
    } else if (process.env.NODE_ENV === 'development') {
      console.log(`📊 Conectando a Firestore (Desarrollo): ${config.projectId}`);
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
 * Verifica conexión (health check)
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
 * Colecciones utilizadas en el microservicio
 */
export const COLLECTIONS = {
  PLAYS: 'song_plays',
  SONG_ANALYTICS: 'song_analytics',
  USER_ANALYTICS: 'user_analytics',
  ENGAGEMENTS: 'user_engagement',
  ENGAGEMENT_ANALYTICS: 'engagement_analytics',
  USER_ENGAGEMENT_PROFILES: 'user_engagement_profiles',
  PLATFORM_ANALYTICS: 'platform_analytics',
  HEALTH_CHECKS: 'health_checks',
};

/**
 * Export principal (por compatibilidad con el resto del microservicio)
 */
export const firestore = getFirestore();
export const analyticsDB = firestore.collection('analytics');

export default {
  initFirestore,
  getFirestore,
  closeFirestore,
  checkFirestoreConnection,
  COLLECTIONS,
  firestore,
  analyticsDB,
};
// user-service/src/config/database.js