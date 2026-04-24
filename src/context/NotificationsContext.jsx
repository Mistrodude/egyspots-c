import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  collection, query, where, orderBy, limit,
  onSnapshot, updateDoc, writeBatch, doc, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';

const NotificationsContext = createContext(null);

export function NotificationsProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount,   setUnreadCount]   = useState(0);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const q = query(
      collection(db, 'notifications'),
      where('toUserId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsub = onSnapshot(q, (snap) => {
      const notifs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setNotifications(notifs);
      setUnreadCount(notifs.filter((n) => !n.isRead).length);
    }, () => {});

    return unsub;
  }, [user]);

  const markAllRead = useCallback(async () => {
    if (!user || unreadCount === 0) return;
    const unread = notifications.filter((n) => !n.isRead);
    const batch = writeBatch(db);
    unread.forEach((n) => {
      batch.update(doc(db, 'notifications', n.id), { isRead: true });
    });
    await batch.commit();
  }, [user, notifications, unreadCount]);

  const markRead = useCallback(async (notifId) => {
    await updateDoc(doc(db, 'notifications', notifId), { isRead: true });
  }, []);

  return (
    <NotificationsContext.Provider value={{ notifications, unreadCount, markAllRead, markRead }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationsContext);
