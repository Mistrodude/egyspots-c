import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  collection, onSnapshot, doc, updateDoc,
  addDoc, getDoc, getDocs, serverTimestamp, increment, query, where, limit,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import { computeCheckinPoints } from '../utils/points';

const SpotsContext = createContext(null);

const CHECKIN_COOLDOWN_MINUTES = 5;

export function SpotsProvider({ children }) {
  const { user, userProfile } = useAuth();
  const [spots,       setSpots]       = useState([]);
  const [checkedInId, setCheckedInId] = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [checkinHistory, setCheckinHistory] = useState([]);

  // Refs so checkIn callback never goes stale without needing spots/checkinHistory in its deps
  const spotsRef          = useRef(spots);
  const checkinHistoryRef = useRef(checkinHistory);
  useEffect(() => { spotsRef.current = spots; },          [spots]);
  useEffect(() => { checkinHistoryRef.current = checkinHistory; }, [checkinHistory]);

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
          const savedId = snap.data().activeCheckin;
          // Verify the spot still exists before restoring the check-in
          const spotSnap = await getDoc(doc(db, 'spots', savedId));
          if (spotSnap.exists()) {
            setCheckedInId(savedId);
          } else {
            // Spot was deleted — clear the stale activeCheckin
            updateDoc(doc(db, 'users', user.uid), { activeCheckin: null }).catch(() => {});
          }
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
    const currentSpots   = spotsRef.current;
    const currentHistory = checkinHistoryRef.current;
    const isLeaving = checkedInId === spotId;

    // Spam guard: same-spot re-checkin within cooldown window
    if (!isLeaving && user) {
      const lastAtSpot = currentHistory.find((c) => c.spotId === spotId);
      if (lastAtSpot) {
        const ts = lastAtSpot.timestamp;
        const lastMs = ts instanceof Date ? ts.getTime() : ts?.toDate ? ts.toDate().getTime() : null;
        if (lastMs && Date.now() - lastMs < CHECKIN_COOLDOWN_MINUTES * 60 * 1000) {
          const minutesLeft = Math.ceil((CHECKIN_COOLDOWN_MINUTES * 60 * 1000 - (Date.now() - lastMs)) / 60000);
          return { success: false, error: 'cooldown', minutesLeft };
        }
      }
    }

    const newId = isLeaving ? null : spotId;
    setCheckedInId(newId);

    if (!user) return { success: true, optimistic: true };

    try {
      // Leave previous spot — silently ignore if that spot was deleted
      if (!isLeaving && checkedInId) {
        try {
          await updateDoc(doc(db, 'spots', checkedInId), {
            checkins:     increment(-1),
            totalCheckins: increment(-1),
            checkinsToday: increment(-1),
          });
        } catch (_) {}
      }

      if (!isLeaving) {
        const spot = currentSpots.find((s) => s.id === spotId);

        // Determine first-visit status (needed for explorer points)
        let isFirstVisit = true;
        try {
          const prevSnap = await getDocs(
            query(collection(db, 'checkins'),
              where('userId', '==', user.uid),
              where('spotId', '==', spotId),
              limit(1)
            )
          );
          isFirstVisit = prevSnap.empty;
        } catch (_) {}

        // Write checkin document
        const checkinData = {
          userId:      user.uid,
          username:    userProfile?.username || userProfile?.displayName || user.displayName || 'User',
          userPhotoURL: userProfile?.profilePhotoURL || user.photoURL || null,
          spotId,
          spotName:    spot?.name || '',
          founderId:   spot?.founderId || null,
          note:        options.note || '',
          photoURL:    options.photoURL || null,
          rating:      options.rating || null,
          isAnonymous: options.isAnonymous || false,
          location:    options.location || null,
          timestamp:   serverTimestamp(),
        };
        const checkinRef = await addDoc(collection(db, 'checkins'), checkinData);
        setCheckinHistory((prev) => [{ id: checkinRef.id, ...checkinData, timestamp: new Date() }, ...prev]);

        // Notify spot founder (fire-and-forget)
        if (spot?.founderId && spot.founderId !== user.uid) {
          addDoc(collection(db, 'notifications'), {
            toUserId:     spot.founderId,
            type:         'checkin_at_your_spot',
            title:        `New check-in at ${spot.name}`,
            body:         `${userProfile?.displayName || userProfile?.username || 'Someone'} just checked in`,
            data:         { spotId },
            isRead:       false,
            createdAt:    serverTimestamp(),
          }).catch(() => {});
        }

        await updateDoc(doc(db, 'spots', spotId), {
          checkins:      increment(1),
          totalCheckins: increment(1),
          checkinsToday: increment(1),
        });

        await updateDoc(doc(db, 'users', user.uid), {
          activeCheckin: newId,
          totalCheckins: increment(1),
        });

        // Award points — fire-and-forget so they never block the check-in UX
        const ptsByUid = computeCheckinPoints({
          userId:            user.uid,
          founderId:         spot?.founderId || null,
          prevTotalCheckins: spot?.totalCheckins || 0,
          isFirstVisit,
        });
        Object.entries(ptsByUid).forEach(([uid, pts]) => {
          updateDoc(doc(db, 'users', uid), { points: increment(pts) }).catch(() => {});
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
  }, [checkedInId, user, userProfile]);

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
