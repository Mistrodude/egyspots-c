import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  collection, onSnapshot, query, where, Timestamp,
  doc, updateDoc, arrayUnion, increment, getDocs, writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import { SPOTS_SEED } from '../data/spots';

const StoriesContext = createContext(null);

async function seedDemoStories(uid) {
  try {
    const now = Timestamp.now();
    const expiresAt = new Timestamp(now.seconds + 6 * 3600, 0);
    const batch = writeBatch(db);
    SPOTS_SEED.slice(0, 3).forEach((spot, i) => {
      const ref = doc(collection(db, 'stories'));
      batch.set(ref, {
        spotId:       spot.id,
        userId:       uid,
        userName:     'EgySpots Demo',
        userPhotoURL: null,
        photoURL:     `https://picsum.photos/seed/${spot.id}/400/700`,
        caption:      `Live at ${spot.name}! 🔥`,
        createdAt:    now,
        expiresAt,
        viewCount:    i * 4,
        viewedBy:     [],
      });
    });
    await batch.commit();
  } catch (_) {}
}

export function StoriesProvider({ children }) {
  const { user } = useAuth();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const seededRef = useRef(false);

  // Seed demo stories once if collection is empty and user is signed in
  useEffect(() => {
    if (!user || seededRef.current) return;
    const check = async () => {
      try {
        const snap = await getDocs(
          query(collection(db, 'stories'), where('expiresAt', '>', Timestamp.now()))
        );
        if (snap.empty) {
          seededRef.current = true;
          await seedDemoStories(user.uid);
        }
      } catch (_) {}
    };
    check();
  }, [user]);

  useEffect(() => {
    const now = Timestamp.now();
    const q = query(
      collection(db, 'stories'),
      where('expiresAt', '>', now)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const now2 = new Date();
        const docs = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((s) => {
            const exp = s.expiresAt?.toDate ? s.expiresAt.toDate() : new Date(s.expiresAt);
            return exp > now2;
          });
        setStories(docs);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return unsub;
  }, []);

  const storiesBySpot = useMemo(() => {
    const map = {};
    stories.forEach((s) => {
      if (!map[s.spotId]) map[s.spotId] = [];
      map[s.spotId].push(s);
    });
    return map;
  }, [stories]);

  const hasUnviewed = useCallback((spotId) => {
    if (!user) return storiesBySpot[spotId]?.length > 0;
    return (storiesBySpot[spotId] || []).some(
      (s) => !(s.viewedBy || []).includes(user.uid)
    );
  }, [storiesBySpot, user]);

  const unviewedCount = useMemo(() => {
    if (!user) return Object.keys(storiesBySpot).length;
    return Object.keys(storiesBySpot).filter((spotId) => hasUnviewed(spotId)).length;
  }, [storiesBySpot, hasUnviewed, user]);

  const markViewed = useCallback(async (storyId) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'stories', storyId), {
        viewedBy:  arrayUnion(user.uid),
        viewCount: increment(1),
      });
    } catch (_) {}
  }, [user]);

  const value = useMemo(
    () => ({ stories, loading, storiesBySpot, hasUnviewed, unviewedCount, markViewed }),
    [stories, loading, storiesBySpot, hasUnviewed, unviewedCount, markViewed]
  );

  return <StoriesContext.Provider value={value}>{children}</StoriesContext.Provider>;
}

export const useStories = () => useContext(StoriesContext);
