import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Configuración para desarrollo
const devConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Configuración para producción
const prodConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY_PROD,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN_PROD,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID_PROD,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET_PROD,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID_PROD,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID_PROD,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID_PROD,
};

// Selección según entorno
const ENV = process.env.EXPO_PUBLIC_ENV;
const firebaseConfig = ENV === 'prod' ? prodConfig : devConfig;

if (Object.values(firebaseConfig).some(v => !v)) {
  throw new Error('Faltan variables de entorno de Firebase. Revisa tu archivo .env y la configuración.');
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, db, storage, googleProvider }; 