import { initializeApp } from 'firebase/app';
import { initializeAuth, inMemoryPersistence, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

// initializeAuth (not getAuth) sets persistence BEFORE Firebase starts its
// internal queue. getAuth() immediately begins IndexedDB/localStorage init and
// queues every subsequent operation (including sign-in) behind it — that's what
// causes the infinite hang in WKWebView on iOS.
export const auth    = initializeAuth(app, { persistence: inMemoryPersistence });
export const db      = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
