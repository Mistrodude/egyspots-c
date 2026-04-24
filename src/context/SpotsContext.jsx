import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  collection, onSnapshot, doc, updateDoc, setDoc,
  addDoc, getDoc, getDocs, serverTimestamp, increment, query, where, orderBy, limit,
} from 'firebase/firestore';
import { db } from '../firebase';
import { SPOTS_SEED } from '../data/spots';
import { useAuth } from './AuthContext';

const SpotsContext = createContext(null);

const MAX_CHECKINS_PER_HOUR = 5;
const CHECKIN_COOLDOWN_MINUTES = 30;

export function SpotsProvider({ children }) {
  const { user, userProfile } = useAuth();
  const [spots,       setSpots]       = useState(SPOTS_SEED);
  const [checkedInId, setCheckedInId] = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [checkinHistory, setCheckinHistory] = useState([]);

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

  // Restore active check-in and load check-in history for signed-in user
  useEffect(() => {
    if (!user) { setCheckedInId(null); setCheckinHistory([]); return; }

    const restore = async () => {
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists() && snap.data().activeCheckin) {
          setCheckedInId(snap.data().activeCheckin);
        }
      } catch (_) {}
    };

    const loadHistory = async () => {
      try {
        const q = query(
          collection(db, 'checkins'),
          where('userId', '==', user.uid),
          orderBy('timestamp', 'desc'),
          limit(20)
        );
        const snap = await getDocs(q);
        setCheckinHistory(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (_) {}
    };

    restore();
    loadHistory();
  }, [user]);

  const checkIn = useCallback(async (spotId, options = {}) => {
    const isLeaving = checkedInId === spotId;
    const newId = isLeaving ? null : spotId;
    setCheckedInId(newId);

    if (!user) return { success: true, optimistic: true };

    try {
      // Leave previous spot
      if (!isLeaving && checkedInId) {
        await updateDoc(doc(db, 'spots', checkedInId), {
          checkins:     increment(-1),
          totalCheckins: increment(-1),
          checkinsToday: increment(-1),
        });
      }

      if (!isLeaving) {
        const spot = spots.find((s) => s.id === spotId);

        // Write checkin document
        const checkinData = {
          userId:      user.uid,
          username:    userProfile?.username || userProfile?.displayName || user.displayName || 'User',
          userPhotoURL: userProfile?.profilePhotoURL || user.photoURL || null,
          spotId,
          spotName:    spot?.name || '',
          ownerId:     spot?.ownerId || null,
          note:        options.note || '',
          photoURL:    options.photoURL || null,
          rating:      options.rating || null,
          isAnonymous: options.isAnonymous || false,
          location:    options.location || null,
          timestamp:   serverTimestamp(),
        };
        await addDoc(collection(db, 'checkins'), checkinData);

        await updateDoc(doc(db, 'spots', spotId), {
          checkins:     increment(1),
          totalCheckins: increment(1),
          checkinsToday: increment(1),
        });

        await updateDoc(doc(db, 'users', user.uid), {
          activeCheckin:  newId,
          totalCheckins:  increment(1),
        });
      } else {
        await updateDoc(doc(db, 'spots', spotId), {
          checkins:     increment(-1),
          totalCheckins: increment(-1),
          checkinsToday: increment(-1),
        });
        await updateDoc(doc(db, 'users', user.uid), { activeCheckin: null });
      }

      return { success: true };
    } catch (e) {
      console.warn('Check-in error:', e.message);
      return { success: false, error: e.message };
    }
  }, [checkedInId, user, userProfile, spots]);

  const submitReport = useCallback(async (targetType, targetId, reason, reasonNote = '') => {
    if (!user) return;
    await addDoc(collection(db, 'reports'), {
      reportedBy: user.uid,
      targetType,
      targetId,
      reason,
      reasonNote,
      status:    'open',
      createdAt: serverTimestamp(),
    });
  }, [user]);

  const value = useMemo(
    () => ({ spots, loading, checkedInId, checkIn, checkinHistory, submitReport }),
    [spots, loading, checkedInId, checkIn, checkinHistory, submitReport]
  );

  return (
    <SpotsContext.Provider value={value}>
      {children}
    </SpotsContext.Provider>
  );
}

export const useSpots = () => useContext(SpotsContext);
