import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

const firebaseConfig = {
  // We'll use empty config for emulator
  apiKey: "fake-api-key",
  authDomain: "localhost",
  projectId: "demo-kmen-fondrozvoje",
  storageBucket: "demo-kmen-fondrozvoje.appspot.com",
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:0000000000000000000000"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Connect to emulator if in development
if (process.env.NODE_ENV === 'development') {
  connectFirestoreEmulator(db, 'localhost', 8080);
}
