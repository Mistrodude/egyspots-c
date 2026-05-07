import { initializeApp } from 'firebase/app';
import { initializeAuth, browserLocalPersistence, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore'; // Changed from getFirestore
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

// 1. Auth: browserLocalPersistence uses localStorage (not IndexedDB) — persists across
//    app restarts without the WKWebView hang that indexedDBLocalPersistence causes.
export const auth = initializeAuth(app, { persistence: browserLocalPersistence });

// 2. Firestore: long-polling prevents WKWebView from killing the real-time stream.
//    ignoreUndefinedProperties avoids runtime errors on partial documents.
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  ignoreUndefinedProperties: true,
});

export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();