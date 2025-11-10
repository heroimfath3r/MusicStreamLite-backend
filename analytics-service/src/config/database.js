// analytics-service/src/config/database.js
import { Firestore } from '@google-cloud/firestore';
import dotenv from 'dotenv';

dotenv.config();

let firestoreInstance = null;

/**
 * Inicializa la conexión a Firestore
 */
export const initFirestore = () => {
  if (firestoreInstance) return firestoreInstance;

  try {
    const config = {
      projectId: process.env.FIRESTORE_PROJECT_ID || process.env.PROJECT_ID || 'musicstreamlite',
    };

    // 🔑 Local o Service Account
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      config.keyFilename = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    }

    // 🧪 Emulador
    if (process.env.FIRESTORE_EMULATOR_HOST) {
      console.log(`🧪 Usando Firestore Emulator en ${process.env.FIRESTORE_EMULATOR_HOST}`);
      process.env.FIRESTORE_PROJECT_ID = config.projectId;
    }

    console.log(`📊 Inicializando Firestore para ${config.projectId} (${process.env.NODE_ENV})`);
    firestoreInstance = new Firestore(config);

    console.log('✅ Firestore inicializado correctamente');
    return firestoreInstance;
  } catch (error) {
    console.error('❌ Error al inicializar Firestore:', error);
    throw error;
  }
};

export const getFirestore = () => {
  if (!firestoreInstance) return initFirestore();
  return firestoreInstance;
};

export const closeFirestore = async () => {
  if (firestoreInstance) {
    await firestoreInstance.terminate();
    firestoreInstance = null;
    console.log('🔌 Firestore desconectado');
  }
};

export const COLLECTIONS = {
  PLAYS: 'song_plays',
  USER_SONG_STATS: 'user_song_stats',
  SONG_ANALYTICS: 'song_analytics',
  USER_ANALYTICS: 'user_analytics',
  ENGAGEMENTS: 'user_engagement',
  ENGAGEMENT_ANALYTICS: 'engagement_analytics',
  USER_ENGAGEMENT_PROFILES: 'user_engagement_profiles',
  PLATFORM_ANALYTICS: 'platform_analytics',
  HEALTH_CHECKS: 'health_checks',
};

export const firestore = getFirestore();
export const analyticsDB = firestore.collection('analytics');

export default {
  initFirestore,
  getFirestore,
  closeFirestore,
  firestore,
  analyticsDB,
  COLLECTIONS,
};
