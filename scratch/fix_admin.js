import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB...", // I should get these from the project
  authDomain: "ipc-erp.firebaseapp.com",
  projectId: "ipc-erp",
  storageBucket: "ipc-erp.appspot.com",
  messagingSenderId: "...",
  appId: "..."
};
