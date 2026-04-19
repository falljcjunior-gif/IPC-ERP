import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableMultiTabIndexedDbPersistence } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBMQwaE0JnyJ-0zHQI2Ydc2kYD5MiVzoUw",
  authDomain: "ipc-erp.firebaseapp.com",
  projectId: "ipc-erp",
  storageBucket: "ipc-erp.firebasestorage.app",
  messagingSenderId: "487186181701",
  appId: "1:487186181701:web:c309b560b3432323383d2c",
  measurementId: "G-63XSZY9ZR"
};

// Initialisation de Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Activer le mode Offline-First (Robust logistique logistique et terrain sans réseau)
enableMultiTabIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn("Multiple tabs open, persistence can only be enabled in one tab at a a time.");
  } else if (err.code === 'unimplemented') {
    console.warn("The current browser does not support all of the features required to enable persistence");
  }
});

export { firebaseConfig };
export default app;
