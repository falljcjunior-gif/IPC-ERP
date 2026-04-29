import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore, enableMultiTabIndexedDbPersistence } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getMessaging } from "firebase/messaging";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBMQwaE0JnyJ-0zHQI2Ydc2kYD5MiVzoUw",
  authDomain: "ipc-erp.firebaseapp.com",
  projectId: "ipc-erp",
  storageBucket: "ipc-erp.firebasestorage.app",
  messagingSenderId: "487186181701",
  appId: "1:487186181701:web:c309b560b3432323383d2c",
  measurementId: "G-63XSZY9ZR",
  databaseURL: "https://ipc-erp-default-rtdb.firebaseio.com"
};

// Initialisation de Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

// [FIX REAL-TIME] Disable Fetch Streams & Force Long Polling to prevent silent onSnapshot drop
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  useFetchStreams: false
});

export const rtdb = getDatabase(app);
export const storage = getStorage(app);
export const messaging = (typeof window !== 'undefined' && typeof navigator !== 'undefined') ? getMessaging(app) : null;

// Activer le mode Offline-First
enableMultiTabIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn("Multiple tabs open, persistence can only be enabled in one tab at a time.");
  } else if (err.code === 'unimplemented') {
    console.warn("The current browser does not support all of the features required to enable persistence");
  }
});

export { firebaseConfig };
export default app;

