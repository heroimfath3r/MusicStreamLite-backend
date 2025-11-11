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
    console.log('♻️  Reutilizando instancia existente de Firestore');
    return firestoreInstance;
  }

  try {
    console.log('🔧 Configurando Firestore...');

    const config = {
      projectId: process.env.FIRESTORE_PROJECT_ID || process.env.PROJECT_ID || 'musicstreamlite',
    };

    console.log(`   Project ID: ${config.projectId}`);
    console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   GOOGLE_APPLICATION_CREDENTIALS: ${process.env.GOOGLE_APPLICATION_CREDENTIALS ? 'configurado' : 'no configurado'}`);

    // 🔑 Configuración de credenciales
    // Estrategia:
    // 1. Si existe GOOGLE_APPLICATION_CREDENTIALS y NO estamos en producción → usar keyFilename
    // 2. Si estamos en producción O no hay GOOGLE_APPLICATION_CREDENTIALS → usar ADC (Application Default Credentials)
    // 3. El emulador siempre tiene prioridad

    // 🧪 Verificar si estamos usando el emulador
    if (process.env.FIRESTORE_EMULATOR_HOST) {
      console.log(`🧪 Modo EMULADOR detectado: ${process.env.FIRESTORE_EMULATOR_HOST}`);
      console.log('   No se usarán credenciales (emulador no las requiere)');
      process.env.FIRESTORE_PROJECT_ID = config.projectId;
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS && process.env.NODE_ENV !== 'production') {
      // Desarrollo local con service account key
      config.keyFilename = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      console.log(`🔑 Usando archivo de credenciales: ${config.keyFilename}`);
    } else {
      // Producción o entorno sin credenciales explícitas
      console.log('🔐 Usando Application Default Credentials (ADC)');
      console.log('   En Cloud Run, esto usa la identidad del servicio automáticamente');
      console.log('   Asegúrate de que la cuenta de servicio tenga los permisos necesarios:');
      console.log('   - roles/datastore.user (para Firestore)');
    }

    console.log(`📊 Inicializando Firestore para proyecto: ${config.projectId}`);
    firestoreInstance = new Firestore(config);

    console.log('✅ Firestore inicializado correctamente');
    console.log('   Settings:', {
      projectId: config.projectId,
      emulator: !!process.env.FIRESTORE_EMULATOR_HOST,
      usingKeyFile: !!config.keyFilename
    });

    return firestoreInstance;
  } catch (error) {
    console.error('❌ Error al inicializar Firestore:');
    console.error('   Mensaje:', error.message);
    console.error('   Code:', error.code);
    console.error('   Stack:', error.stack);
    console.error('');
    console.error('💡 Troubleshooting:');
    console.error('   1. Verifica que FIRESTORE_PROJECT_ID esté configurado correctamente');
    console.error('   2. En local: verifica que GOOGLE_APPLICATION_CREDENTIALS apunte a un archivo válido');
    console.error('   3. En Cloud Run: verifica que la cuenta de servicio tenga permisos de Firestore');
    console.error('   4. Verifica que el proyecto de Firebase/GCP esté activo');
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
