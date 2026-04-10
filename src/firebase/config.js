import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

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
export { firebaseConfig };
export default app;
