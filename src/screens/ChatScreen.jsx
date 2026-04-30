import { useState, useEffect, useRef } from 'react';
import {
  collection, query, orderBy, onSnapshot,
  addDoc, serverTimestamp, limit,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import { SpotIcon, BackIcon, MoreIcon, SendIcon, CameraIcon } from '../components/Icons';
import { useStories } from '../context/StoriesContext';

function getInitials(name = '') {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '??';
}

export default function ChatScreen({ spot, onBack }) {
  const { t }    = useTheme();
  const { user } = useAuth();
  const { storiesBySpot } = useStories();
  const spotStories = storiesBySpot[spot?.id] || [];
  const [messages, setMessages] = useState([]);
  const [input,    setInput]    = useState('');
  const bottomRef = useRef(null);

  // Real-time Firestore listener
  useEffect(() => {
    if (!spot?.id) return;
    const q = query(
      collection(db, 'spots', spot.id, 'messages'),
      orderBy('createdAt', 'asc'),
      limit(100),
    );
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
    }, (err) => console.warn('Chat listener:', err.message));
    return unsub;
  }, [spot?.id]);

  const send = async () => {
    const text = input.trim();
    if (!text || !spot?.id) return;
    setInput('');

    const displayName = user?.displayName || 'Anonymous';
    const initials    = getInitials(displayName);

    await addDoc(collection(db, 'spots', spot.id, 'messages'), {
      text,
      userId:    user?.uid || 'guest',
      userName:  displayName,
      userAvatar:initials,
      createdAt: serverTimestamp(),
    }).catch((e) => console.warn('Send error:', e.message));
  };

  const handleKey = (e) => { if (e.key === 'Enter') send(); };

  const myUid = user?.uid || null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: t.bg }} className="anim-slideInRight">

      {/* Header */}
      <div style={{ background: t.surface, borderBottom: `1px solid ${t.border}`, flexShrink: 0 }}>
        <div style={{ height: 'env(safe-area-inset-top, 0px)' }} />
        <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}>
          <BackIcon color={t.text} size={20} />
        </button>
        <div style={{ width: 36, height: 36, borderRadius: 12, background: spot.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <SpotIcon category={spot.category} color={spot.color} size={18} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: t.text }}>{spot.name}</div>
          <div style={{ fontSize: 10, color: '#4A9E6B', fontWeight: 600 }}>● {spot.checkins} people here</div>
        </div>
        <MoreIcon color={t.muted} size={20} />
        </div>
      </div>

      {/* Stories bar */}
      <div style={{ padding: '10px 12px', borderBottom: `1px solid ${t.border}`, background: t.surface, flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {spotStories.map((s) => {
            const seen = (s.viewedBy || []).includes(user?.uid);
            const initials = (s.userName || '?')[0].toUpperCase();
            return (
              <div key={s.id} style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', padding: 2, background: seen ? t.border : `linear-gradient(135deg, ${t.accent}, #E07A5F)` }}>
                  <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: t.surface, padding: 2 }}>
                    {s.userPhotoURL
                      ? <img src={s.userPhotoURL} alt={initials} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                      : <Avatar initials={initials} size={36} color={t.accent} bg={t.accentBg} />
                    }
                  </div>
                </div>
                <span style={{ fontSize: 8, color: t.muted }}>{(s.userName || '?').split(' ')[0]}</span>
              </div>
            );
          })}
          {spotStories.length === 0 && (
            <span style={{ fontSize: 11, color: t.muted, alignSelf: 'center' }}>No stories yet</span>
          )}
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10, scrollbarWidth: 'none' }}>
        <div style={{ textAlign: 'center', fontSize: 10, color: t.muted, padding: '4px 12px', background: t.surface2, borderRadius: 20, alignSelf: 'center' }}>
          Tonight · {spot.name}
        </div>

        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: t.muted, fontSize: 12, padding: '32px 0' }}>
            No messages yet — be the first to say something!
          </div>
        )}
        {messages.map((m) => {
          const isMe = m.userId === myUid;
          return (
            <div key={m.id} style={{ display: 'flex', gap: 8, justifyContent: isMe ? 'flex-end' : 'flex-start' }} className="anim-fadeUp">
              {!isMe && <Avatar initials={m.userAvatar || '??'} size={28} color={t.accent} bg={t.accentBg} />}
              <div style={{ maxWidth: '72%' }}>
                {!isMe && (
                  <div style={{ fontSize: 10, color: t.muted, marginBottom: 2 }}>
                    {m.userName} · {m.createdAt?.toDate ? m.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </div>
                )}
                <div style={{
                  padding: '9px 12px',
                  borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: isMe ? t.accent : t.surface,
                  color: isMe ? 'white' : t.text,
                  fontSize: 12, lineHeight: 1.4,
                  border: isMe ? 'none' : `1px solid ${t.border}`,
                  boxShadow: t.shadow,
                }}>
                  {m.text}
                </div>
                {isMe && (
                  <div style={{ fontSize: 9, color: t.muted, textAlign: 'right', marginTop: 2 }}>
                    {m.createdAt?.toDate ? m.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '10px 12px', background: t.navBg, backdropFilter: 'blur(12px)', borderTop: `1px solid ${t.border}`, flexShrink: 0, display: 'flex', gap: 10, alignItems: 'center' }}>
        <div style={{ flex: 1, background: t.surface, borderRadius: 24, padding: '9px 14px', display: 'flex', alignItems: 'center', gap: 8, border: `1px solid ${t.border}` }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder={user ? 'Message the spot…' : 'Sign in to chat…'}
            disabled={!user}
            style={{ flex: 1, border: 'none', background: 'none', outline: 'none', fontSize: 13, color: t.text, fontFamily: 'Outfit, sans-serif' }}
          />
          <span style={{ opacity: 0.5, cursor: 'pointer', display: 'flex' }}>
            <CameraIcon color={t.muted} size={17} />
          </span>
        </div>
        <button onClick={send} disabled={!input.trim() || !user} style={{
          width: 40, height: 40, borderRadius: '50%',
          background: input.trim() && user ? t.accent : t.surface2,
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 2px 8px ${t.accent}55`,
          transition: 'all 0.2s',
        }}>
          <SendIcon color="white" size={15} />
        </button>
      </div>
    </div>
  );
}
