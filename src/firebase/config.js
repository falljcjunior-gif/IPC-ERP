import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore, enableMultiTabIndexedDbPersistence } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getMessaging } from "firebase/messaging";
import { getDatabase } from "firebase/database";
import { getFunctions } from "firebase/functions";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  databaseURL: `https://${import.meta.env.VITE_FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com`
};

// Initialisation de Firebase
export const app = initializeApp(firebaseConfig);

// ── [SECURITY] Firebase App Check (reCAPTCHA v3) ─────────────────────
// Bloque tous les appels non-autorisés même si les clés publiques sont connues.
if (typeof window !== 'undefined' && import.meta.env.VITE_RECAPTCHA_SITE_KEY) {
  // Activation du mode Debug pour localhost (affiche le token dans la console)
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }
  
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(import.meta.env.VITE_RECAPTCHA_SITE_KEY),
    isTokenAutoRefreshEnabled: true,
  });
}

export const auth = getAuth(app);

// [FIX REAL-TIME] Disable Fetch Streams & Force Long Polling to prevent silent onSnapshot drop
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  useFetchStreams: false
});

export const rtdb = getDatabase(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, 'europe-west1'); // Region standard pour l'ERP
export const messaging = (typeof window !== 'undefined' && typeof navigator !== 'undefined') ? getMessaging(app) : null;

// Activer le mode Offline-First (Uniquement hors mode TEST)
if (typeof window !== 'undefined' && !import.meta.env?.VITEST) {
  enableMultiTabIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn("Multiple tabs open, persistence can only be enabled in one tab at a time.");
    } else if (err.code === 'unimplemented') {
      console.warn("The current browser does not support all of the features required to enable persistence");
    }
  });
}

export { firebaseConfig };
export default app;

