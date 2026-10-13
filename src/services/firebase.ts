import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCwC8nEOb2bUOxTc-0c3sukwbb-Ho7hrdo",
  authDomain: "thebirdbook-web.firebaseapp.com",
  projectId: "thebirdbook-web",
  storageBucket: "thebirdbook-web.firebasestorage.app",
  messagingSenderId: "760859267465",
  appId: "1:760859267465:web:448b72b5b6da8645f69158",
  measurementId: "G-Q2QV3P0PKY"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
