import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  collection, onSnapshot, query, where, Timestamp,
  doc, updateDoc, arrayUnion, increment,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';

const StoriesContext = createContext(null);

export function StoriesProvider({ children }) {
  const { user } = useAuth();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);

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
