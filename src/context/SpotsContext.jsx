import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  collection, onSnapshot, doc, updateDoc, setDoc,
  getDoc, getDocs, serverTimestamp, increment,
} from 'firebase/firestore';
import { db } from '../firebase';
import { SPOTS_SEED } from '../data/spots';
import { useAuth } from './AuthContext';

const SpotsContext = createContext(null);

export function SpotsProvider({ children }) {
  const { user } = useAuth();
  const [spots,       setSpots]       = useState(SPOTS_SEED);
  const [checkedInId, setCheckedInId] = useState(null);
  const [loading,     setLoading]     = useState(true);

  // Seed spots if Firestore collection is empty
  useEffect(() => {
    const seedIfEmpty = async () => {
      try {
        const snap = await getDocs(collection(db, 'spots'));
        if (snap.empty) {
          await Promise.all(
            SPOTS_SEED.map((s) => setDoc(doc(db, 'spots', s.id), { ...s, createdAt: serverTimestamp() }))
          );
        }
      } catch (e) {
        // Offline or permission issue — use seed data
        console.warn('Firestore seed skipped:', e.message);
      }
    };
    seedIfEmpty();
  }, []);

  // Real-time spots listener
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'spots'),
      (snap) => {
        if (!snap.empty) {
          setSpots(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        }
        setLoading(false);
      },
      (err) => {
        console.warn('Spots listener error:', err.message);
        setLoading(false);
      }
    );
    return unsub;
  }, []);

  // Restore active check-in for signed-in user
  useEffect(() => {
    if (!user) { setCheckedInId(null); return; }
    const restore = async () => {
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists() && snap.data().activeCheckin) {
          setCheckedInId(snap.data().activeCheckin);
        }
      } catch (_) {}
    };
    restore();
  }, [user]);

  const checkIn = useCallback(async (spotId) => {
    const isLeaving = checkedInId === spotId;
    const newId = isLeaving ? null : spotId;
    setCheckedInId(newId);

    if (!user) return; // optimistic UI only for guests

    try {
      if (!isLeaving && checkedInId) {
        // Leave previous spot
        await updateDoc(doc(db, 'spots', checkedInId), { checkins: increment(-1) });
      }
      if (!isLeaving) {
        await updateDoc(doc(db, 'spots', spotId), { checkins: increment(1) });
      } else {
        await updateDoc(doc(db, 'spots', spotId), { checkins: increment(-1) });
      }
      await updateDoc(doc(db, 'users', user.uid), { activeCheckin: newId });
    } catch (e) {
      console.warn('Check-in error:', e.message);
    }
  }, [checkedInId, user]);

  const value = useMemo(
    () => ({ spots, loading, checkedInId, checkIn }),
    [spots, loading, checkedInId, checkIn]
  );

  return (
    <SpotsContext.Provider value={value}>
      {children}
    </SpotsContext.Provider>
  );
}

export const useSpots = () => useContext(SpotsContext);
