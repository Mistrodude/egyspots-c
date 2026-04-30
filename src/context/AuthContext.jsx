import { createContext, useContext, useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  sendEmailVerification,
} from 'firebase/auth';
import {
  doc, setDoc, getDoc, updateDoc, serverTimestamp, query,
  collection, where, getDocs, limit,
} from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,        setUser]        = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading,     setLoading]     = useState(true);

  const loadProfile = async (uid) => {
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      return snap.exists() ? snap.data() : null;
    } catch (_) { return null; }
  };

  useEffect(() => {
    // Safety net: if onAuthStateChanged never fires (e.g. Firebase hangs on
    // WKWebView), unblock the loading screen after 6 seconds.
    const fallback = setTimeout(() => setLoading(false), 3000);

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      clearTimeout(fallback);
      if (firebaseUser) {
        const profile = await loadProfile(firebaseUser.uid);

        // Hard block banned users
        if (profile?.isBanned) {
          await signOut(auth);
          setUser(null);
          setUserProfile({ isBanned: true, banReason: profile.banReason });
          setLoading(false);
          return;
        }

        // Auto-create profile if Google sign-in and no Firestore doc yet
        if (!profile) {
          const newProfile = {
            uid:              firebaseUser.uid,
            email:            firebaseUser.email,
            displayName:      firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
            username:         null,
            phoneNumber:      null,
            role:             'user',
            gender:           null,
            birthDate:        null,
            age:              null,
            profilePhotoURL:  firebaseUser.photoURL || null,
            bio:              '',
            city:             'Cairo',
            language:         'ar',
            isVerified:       firebaseUser.emailVerified,
            isBanned:         false,
            banReason:        null,
            totalCheckins:    0,
            notifSettings: {
              checkinLikes:  true,
              newSpotNearby: true,
            },
            createdAt:  serverTimestamp(),
            lastLoginAt: serverTimestamp(),
          };
          setDoc(doc(db, 'users', firebaseUser.uid), newProfile).catch(() => {});
          setUserProfile(newProfile);
        } else {
          // Update lastLoginAt
          updateDoc(doc(db, 'users', firebaseUser.uid), {
            lastLoginAt:  serverTimestamp(),
            isVerified:   firebaseUser.emailVerified,
          }).catch(() => {});
          setUserProfile(profile);
        }
        setUser(firebaseUser);
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });
    return () => { unsub(); clearTimeout(fallback); };
  }, []);

  const signIn = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);

  const signUp = async (email, password, userData) => {
    const {
      displayName, username, phoneNumber, birthDate, gender,
      city = 'Cairo', language = 'ar',
    } = userData;

    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName });

    const age = birthDate
      ? Math.floor((Date.now() - new Date(birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : null;

    const profile = {
      uid:              cred.user.uid,
      email,
      displayName,
      username:         username?.toLowerCase() || null,
      phoneNumber:      phoneNumber || null,
      role:             'user',
      gender:           gender || null,
      birthDate:        birthDate ? new Date(birthDate) : null,
      age,
      profilePhotoURL:  null,
      bio:              '',
      city,
      language,
      isVerified:       false,
      isBanned:         false,
      banReason:        null,
      totalCheckins:    0,
      notifSettings: {
        checkinLikes:  true,
        newSpotNearby: true,
      },
      createdAt:   serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    };

    // Fire-and-forget: don't await Firestore — if it hangs (offline/slow),
    // Auth already succeeded and the user can use the app. Profile syncs when online.
    setDoc(doc(db, 'users', cred.user.uid), profile).catch(() => {});

    try { await sendEmailVerification(cred.user); } catch (_) {}

    return cred;
  };

  const signInGoogle = () => {
    if (Capacitor.isNativePlatform()) {
      return Promise.reject(Object.assign(new Error('Google sign-in is not supported in the mobile app yet — please use email and password.'), { code: 'auth/operation-not-supported-in-this-environment' }));
    }
    return signInWithPopup(auth, googleProvider);
  };

  const logOut = () => signOut(auth);

  const checkUsernameAvailable = async (username) => {
    if (!username || username.length < 3) return false;
    try {
      const q = query(
        collection(db, 'users'),
        where('username', '==', username.toLowerCase()),
        limit(1)
      );
      const snap = await getDocs(q);
      return snap.empty;
    } catch (_) { return true; }
  };

  const updateUserProfile = async (data) => {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.uid), {
      ...data,
      updatedAt: serverTimestamp(),
    });
    const fresh = await loadProfile(user.uid);
    setUserProfile(fresh);
  };

  const refreshProfile = async () => {
    if (!user) return;
    const fresh = await loadProfile(user.uid);
    setUserProfile(fresh);
  };

  const toggleSaveSpot = async (spotId) => {
    if (!user) return;
    const saved = userProfile?.savedSpots || [];
    const next = saved.includes(spotId) ? saved.filter((id) => id !== spotId) : [...saved, spotId];
    setUserProfile((p) => ({ ...p, savedSpots: next }));
    updateDoc(doc(db, 'users', user.uid), { savedSpots: next }).catch(() => {});
  };

  const signInApple = async () => {
    if (Capacitor.isNativePlatform()) {
      throw Object.assign(new Error('Apple sign-in is not supported in the mobile app yet — please use email and password.'), { code: 'auth/operation-not-supported-in-this-environment' });
    }
    const { OAuthProvider, signInWithPopup: signinPopup } = await import('firebase/auth');
    const provider = new OAuthProvider('apple.com');
    provider.addScope('email');
    provider.addScope('name');
    const result = await signinPopup(auth, provider);
    return result;
  };

  return (
    <AuthContext.Provider value={{
      user, userProfile, loading,
      signIn, signUp, signInGoogle, signInApple, logOut,
      checkUsernameAvailable, updateUserProfile, refreshProfile, toggleSaveSpot,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
