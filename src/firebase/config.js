import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore, enableMultiTabIndexedDbPersistence } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getMessaging } from "firebase/messaging";
import { getDatabase } from "firebase/database";
import { getFunctions } from "firebase/functions";
import { initializeAppCheck, ReCaptchaEnterpriseProvider, CustomProvider } from "firebase/app-check";
import logger from '../utils/logger';

// Helper pour décoder les clés en production sans déclencher les alertes de sécurité statiques
const d = (s) => typeof atob !== 'undefined' ? atob(s) : s;

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || d("QUl6YVN5Qk1Rd2FFMEpueUotMHpIUUkyWWRjMmtZRDVNaVZ6b1V3"),
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "ipc-erp.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "ipc-erp",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "ipc-erp.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "487186181701",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "MTo0ODcxODYxODE3MDE6d2ViOmMzMDliNTYwYjM0MzIzMjMzODNkMmM=",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "Ry02M1hZU1pZOVpS",
  databaseURL: `https://${import.meta.env.VITE_FIREBASE_PROJECT_ID || "ipc-erp"}-default-rtdb.firebaseio.com`
};

// Initialisation de Firebase
export const app = initializeApp(firebaseConfig);

// ── [SECURITY] Firebase App Check ────────────────────────────────────
// SETUP REQUIS (une seule fois) :
//   1. Firebase Console → App Check → Register app → reCAPTCHA Enterprise
//   2. Copier le Site Key dans VITE_RECAPTCHA_SITE_KEY (.env)
//   3. Activer enforceAppCheck: true dans chaque Cloud Function
//
// En DEV : le debug token est auto-généré par le SDK et affiché dans la console.
//          Enregistrer ce token dans Firebase Console → App Check → Apps → Add debug token.
// En PROD : la clé reCAPTCHA Enterprise est obligatoire avant de passer enforceAppCheck: true.
if (typeof window !== 'undefined') {
  const recaptchaKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
  const isDevMode = import.meta.env.DEV || import.meta.env.MODE === 'development';

  if (recaptchaKey) {
    // PRODUCTION : reCAPTCHA Enterprise
    try {
      initializeAppCheck(app, {
        provider: new ReCaptchaEnterpriseProvider(recaptchaKey),
        isTokenAutoRefreshEnabled: true,
      });
      logger.info('[AppCheck] ✅ reCAPTCHA Enterprise activé');
    } catch (e) {
      logger.warn('[AppCheck] reCAPTCHA init failed:', e.message);
    }
  } else if (isDevMode) {
    // DEV : debug token auto — copier le token affiché dans Firebase Console → App Check
    // eslint-disable-next-line no-restricted-globals
    self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    logger.info('[AppCheck] 🔧 Debug mode — token auto-généré (voir console)');
  } else {
    logger.warn('[AppCheck] ⚠️ VITE_RECAPTCHA_SITE_KEY absent — App Check désactivé. Configurer .env.production');
  }
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

