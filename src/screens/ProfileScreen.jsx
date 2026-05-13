import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useTheme } from '../context/ThemeContext';
import { useSpots } from '../context/SpotsContext';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationsContext';
import { useStories } from '../context/StoriesContext';
import SpotCard from '../components/SpotCard';
import { BellIcon, EditIcon, SettingsIcon, PlusIcon, BackIcon } from '../components/Icons';

export default function ProfileScreen({ onNavigateToAuth, onEditProfile, onSettings, onNotifications, onSpotPress, onAddSpot, onBack, onStoryViewer }) {
  const { t, isDark, toggleTheme } = useTheme();
  const { user, userProfile, logOut } = useAuth();
  const { checkinHistory } = useSpots();
  const { unreadCount } = useNotifications();
  const { stories } = useStories();
  const [tab, setTab] = useState('history');
  const [founded, setFounded] = useState([]);

  const now = new Date();
  const myStories = stories.filter((s) => s.userId === user?.uid && new Date(s.expiresAt?.toDate ? s.expiresAt.toDate() : s.expiresAt) > now);

  useEffect(() => {
    const loadFounded = async () => {
      if (!user) return setFounded([]);
      const snap = await getDocs(query(collection(db, 'spots'), where('founderId', '==', user.uid)));
      setFounded(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    };
    loadFounded().catch(() => {});
  }, [user]);

  if (!user) {
    return (
      <div style={{ height: '100%', background: t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div style={{ background: t.surface, borderRadius: 14, padding: 16, border: `1px solid ${t.border}`, textAlign: 'center', width: '100%', maxWidth: 360 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: t.text, marginBottom: 6 }}>Sign in to EgySpots</div>
          <div style={{ fontSize: 11, color: t.muted, marginBottom: 12 }}>Check in, chat & discover Cairo spots</div>
          <button onClick={onNavigateToAuth} style={{ padding: '10px 24px', borderRadius: 12, background: t.accent, color: 'white', border: 'none', cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 13 }}>Sign In / Sign Up</button>
        </div>
      </div>
    );
  }

  const initials = (userProfile?.displayName || user.displayName || 'U').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  const stats = [
    { label: 'Check-ins', value: userProfile?.totalCheckins || 0 },
    { label: 'Founded', value: founded.length },
    { label: 'Stories', value: myStories.length },
    { label: 'Points', value: userProfile?.points || 0 },
  ];

  return (
    <div style={{ height: '100%', background: t.bg, display: 'flex', flexDirection: 'column' }}>
      <div style={{ borderBottom: `1px solid ${t.border}`, background: t.surface }}>
        <div style={{ height: 'env(safe-area-inset-top, 44px)' }} />
        {onBack && (
          <div style={{ padding: '8px 14px 0' }}>
            <button onClick={onBack} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 4, display: 'flex' }}>
              <BackIcon color={t.text} size={20} />
            </button>
          </div>
        )}
        <div style={{ padding: onBack ? '8px 14px 12px' : '16px 14px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {userProfile?.profilePhotoURL ? <img src={userProfile.profilePhotoURL} alt="profile" style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover' }} /> : <div style={{ width: 60, height: 60, borderRadius: '50%', background: t.accentBg, color: t.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 20 }}>{initials}</div>}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: t.text }}>{userProfile?.displayName || user.displayName || 'You'}</div>
            <div style={{ fontSize: 11, color: t.muted }}>@{userProfile?.username || user.email?.split('@')[0] || 'you'} · {userProfile?.city || 'Cairo'}</div>
            {userProfile?.bio && <div style={{ fontSize: 11, color: t.text, marginTop: 4 }}>{userProfile.bio}</div>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button onClick={onEditProfile} style={pillBtn(t)}><EditIcon color={t.text} size={14} /> Edit</button>
          <button onClick={onSettings} style={pillBtn(t)}><SettingsIcon color={t.text} size={14} /> Settings</button>
          <button onClick={onNotifications} style={pillBtn(t)}><BellIcon color={t.text} size={14} /> {unreadCount > 0 ? `(${unreadCount})` : ''}</button>
          <button onClick={toggleTheme} style={pillBtn(t)}>{isDark ? 'Dark' : 'Light'}</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', marginTop: 10 }}>
          {stats.map((s) => <div key={s.label} style={{ textAlign: 'center' }}><div style={{ color: t.accent, fontSize: 16, fontWeight: 800 }}>{s.value}</div><div style={{ color: t.muted, fontSize: 10 }}>{s.label}</div></div>)}
        </div>
        </div>
      </div>

      <div style={{ padding: 12, display: 'flex', gap: 8, borderBottom: `1px solid ${t.border}`, overflowX: 'auto' }}>
        {[['history', 'Check-ins'], ['founded', 'Founded'], ['stories', 'Stories']].map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} style={{ border: 'none', background: tab === k ? t.accentBg : 'transparent', color: tab === k ? t.accent : t.muted, borderRadius: 8, padding: '8px 12px', cursor: 'pointer', fontFamily: 'Outfit, sans-serif', flexShrink: 0 }}>
            {label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
        {tab === 'history' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {checkinHistory.length === 0 && <div style={{ color: t.muted, fontSize: 12 }}>No check-ins yet.</div>}
            {checkinHistory.map((c) => {
              const raw = c.timestamp?.toDate ? c.timestamp.toDate() : (c.timestamp instanceof Date ? c.timestamp : null);
              const timeStr = raw ? raw.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + ' · ' + raw.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
              return (
                <div key={c.id} style={{ border: `1px solid ${t.border}`, background: t.surface, borderRadius: 10, padding: 10 }}>
                  <div style={{ fontSize: 13, color: t.text, fontWeight: 700 }}>{c.spotName || c.spotId}</div>
                  {timeStr && <div style={{ fontSize: 10, color: t.accent, marginBottom: 2 }}>{timeStr}</div>}
                  <div style={{ fontSize: 11, color: t.muted }}>{c.note || ''} {c.rating ? `· ★${c.rating}` : ''}</div>
                </div>
              );
            })}
          </div>
        )}
        {tab === 'founded' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {founded.length === 0 && <div style={{ color: t.muted, fontSize: 12 }}>No founded spots yet.</div>}
            {founded.map((s) => <SpotCard key={s.id} spot={s} onPress={onSpotPress} />)}
          </div>
        )}
        {tab === 'stories' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {myStories.length === 0 && <div style={{ color: t.muted, fontSize: 12 }}>No active stories. Post a story at a spot!</div>}
            {myStories.map((s) => (
              <div key={s.id} onClick={() => onStoryViewer && onStoryViewer(s.spotId)} style={{ border: `1px solid ${t.border}`, background: t.surface, borderRadius: 10, padding: 10, cursor: 'pointer' }}>
                {s.photoURL && <img src={s.photoURL} alt="" style={{ width: '100%', borderRadius: 8, maxHeight: 160, objectFit: 'cover', marginBottom: 6 }} />}
                <div style={{ fontSize: 12, color: t.text }}>{s.caption || 'No caption'}</div>
                <div style={{ fontSize: 10, color: t.muted, marginTop: 4 }}>
                  Expires in {Math.max(0, Math.floor(((s.expiresAt?.toDate ? s.expiresAt.toDate() : new Date(s.expiresAt)) - now) / 60000))}m · {s.viewCount || 0} views
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: 12, borderTop: `1px solid ${t.border}`, display: 'flex', gap: 8 }}>
        <button onClick={onAddSpot} style={{ ...pillBtn(t), flex: 1 }}><PlusIcon color={t.text} size={14} /> Add Spot</button>
        <button onClick={logOut} style={{ ...pillBtn(t), color: t.error }}>Sign Out</button>
      </div>
    </div>
  );
}

function pillBtn(t) {
  return {
    border: `1px solid ${t.border}`,
    background: t.surface,
    color: t.text,
    borderRadius: 10,
    padding: '8px 10px',
    cursor: 'pointer',
    fontFamily: 'Outfit, sans-serif',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
  };
}
