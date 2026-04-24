import { useEffect, useState } from 'react';
import { collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useTheme } from '../context/ThemeContext';
import { useSpots } from '../context/SpotsContext';
import { useAuth } from '../context/AuthContext';
import { useStories } from '../context/StoriesContext';
import { BackIcon, HeartIcon, ShareIcon, MapPinIcon, PlusIcon } from '../components/Icons';
import { SPOT_TAG_LABELS } from '../data/spots';
import StoryRing from '../components/StoryRing';
import ReportModal from '../components/ReportModal';

export default function SpotDetailScreen({ spot, onBack, onOpenChat, onCheckIn, onStoryViewer, onRequireAuth }) {
  const { t } = useTheme();
  const { checkedInId, checkIn } = useSpots();
  const { user, userProfile } = useAuth();
  const { storiesBySpot, hasUnviewed, markViewed } = useStories();
  const [checkins, setCheckins] = useState([]);
  const [feedLimit, setFeedLimit] = useState(10);
  const [showHours, setShowHours] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const isCheckedIn = checkedInId === spot.id;
  const textDescription = userProfile?.language === 'ar' && spot.descriptionAr ? spot.descriptionAr : spot.description;
  const spotStories = storiesBySpot[spot.id] || [];
  const stats = [
    { label: 'Today', value: spot.checkinsToday || 0 },
    { label: 'Week', value: spot.weeklyCheckins || 0 },
    { label: 'Rating', value: spot.rating || 0 },
    { label: 'Distance', value: spot.distance || '--' },
  ];

  useEffect(() => {
    const load = async () => {
      try {
        const q = query(
          collection(db, 'checkins'),
          where('spotId', '==', spot.id),
          orderBy('timestamp', 'desc'),
          limit(feedLimit)
        );
        const snap = await getDocs(q);
        setCheckins(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (_) {
        setCheckins([]);
      }
    };
    load();
  }, [spot.id, feedLimit]);

  const handlePrimaryCheckIn = async () => {
    if (isCheckedIn) {
      await checkIn(spot.id);
      return;
    }
    if (!user) {
      onRequireAuth();
      return;
    }
    onCheckIn();
  };

  const shareSpot = async () => {
    const url = `${window.location.origin}/spot/${spot.id}`;
    if (navigator.share) await navigator.share({ title: spot.name, url });
    else await navigator.clipboard.writeText(url);
  };

  const openMaps = () => window.open(`https://maps.google.com/?q=${spot.lat},${spot.lng}`, '_blank', 'noopener,noreferrer');

  const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const today = dayKeys[new Date().getDay()];
  const hoursRows = Object.entries(spot.operatingHours || {});

  return (
    <div style={{ height: '100%', background: t.bg, display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'relative', height: 210, background: `linear-gradient(135deg, ${spot.color || t.accent}33, ${spot.color || t.accent}77)` }}>
        <button onClick={onBack} style={iconBtn(t, 12, 12)}><BackIcon color={t.text} size={18} /></button>
        <button style={iconBtn(t, 12, null, 12)}><HeartIcon color={t.text} size={18} /></button>
        <div style={{ position: 'absolute', left: 16, right: 16, bottom: 14 }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: t.text }}>{spot.name}</div>
          {spot.nameAr && <div style={{ fontSize: 13, color: t.muted }}>{spot.nameAr}</div>}
        </div>
      </div>

      {/* Stories ring bar */}
      <div style={{ padding: '10px 12px 6px', borderBottom: `1px solid ${t.border}`, background: t.surface }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto', scrollbarWidth: 'none' }}>
          <button
            onClick={() => { if (!user) { onRequireAuth(); return; } onStoryViewer && onStoryViewer(); }}
            style={{ width: 48, height: 48, borderRadius: '50%', background: t.accentBg, border: `2px dashed ${t.accent}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          >
            <PlusIcon color={t.accent} size={16} />
          </button>
          {spotStories.length === 0 && <span style={{ fontSize: 11, color: t.muted, fontFamily: 'Outfit, sans-serif' }}>Be the first to post a story here</span>}
          {spotStories.map((s) => (
            <StoryRing
              key={s.id}
              name={s.userName}
              photoURL={s.userPhotoURL}
              hasUnviewed={!(s.viewedBy || []).includes(user?.uid)}
              size={40}
              onPress={() => { markViewed(s.id); onStoryViewer && onStoryViewer(); }}
            />
          ))}
        </div>
      </div>

      {/* Founder badge */}
      {spot.founderName && spot.founderName !== 'Egyspots Team' && (
        <div style={{ padding: '8px 14px', background: t.surface, borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 22, height: 22, borderRadius: '50%', background: t.accentBg, color: t.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800 }}>
            {(spot.founderName || 'E')[0].toUpperCase()}
          </div>
          <span style={{ fontSize: 11, color: t.muted, fontFamily: 'Outfit, sans-serif' }}>Founded by <span style={{ color: t.text, fontWeight: 700 }}>{spot.founderName}</span></span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', borderBottom: `1px solid ${t.border}`, background: t.surface }}>
        {stats.map((s) => (
          <div key={s.label} style={{ textAlign: 'center', padding: '10px 4px' }}>
            <div style={{ fontSize: 14, color: t.accent, fontWeight: 800 }}>{s.value}</div>
            <div style={{ fontSize: 10, color: t.muted }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, padding: 10, borderBottom: `1px solid ${t.border}`, overflowX: 'auto', background: t.surface }}>
        <button onClick={onCheckIn} style={actionBtn(t, true)}>Check In Here</button>
        <button onClick={shareSpot} style={actionBtn(t, false)}><ShareIcon color={t.text} size={14} /> Share</button>
        <button onClick={() => setReportOpen(true)} style={actionBtn(t, false)}>Report</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          <Badge t={t} color={t.accent} label={(spot.category || '').replace('_', ' ').toUpperCase()} />
          {spot.isMobile && <Badge t={t} color={t.warning || '#f59e0b'} label="Mobile" />}
        </div>
        {textDescription && <div style={{ fontSize: 13, color: t.text, marginBottom: 10 }}>{textDescription}</div>}
        {(spot.tags || []).length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
            {(spot.tags || []).map((tag) => (
              <span key={tag} style={{ fontSize: 11, color: t.accentText, background: t.accentBg, borderRadius: 999, padding: '4px 10px', fontWeight: 600 }}>
                {SPOT_TAG_LABELS[tag] || tag}
              </span>
            ))}
          </div>
        )}
        <div style={{ border: `1px solid ${t.border}`, background: t.surface, borderRadius: 12, padding: 10, marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: t.text }}><MapPinIcon color={t.text} size={14} /> {spot.address || spot.neighborhood}</div>
          <button onClick={openMaps} style={{ marginTop: 8, border: `1px solid ${t.border}`, background: t.surface2, color: t.text, borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>Open in Maps</button>
        </div>
        <div style={{ border: `1px solid ${t.border}`, background: t.surface, borderRadius: 12, padding: 10, marginBottom: 10 }}>
          <button onClick={() => setShowHours((v) => !v)} style={{ border: 'none', background: 'transparent', color: t.text, fontWeight: 700, cursor: 'pointer', padding: 0, fontFamily: 'Outfit, sans-serif' }}>
            Operating Hours {showHours ? '▲' : '▼'}
          </button>
          {showHours && (
            <div style={{ marginTop: 8, fontSize: 12 }}>
              {hoursRows.map(([day, h]) => (
                <div key={day} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', color: day === today ? t.accent : t.text }}>
                  <span>{day}</span>
                  <span>{h.closed ? 'Closed' : `${h.open} - ${h.close}`}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ fontSize: 13, fontWeight: 700, color: t.text, marginBottom: 8 }}>Recent Check-ins</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {checkins.map((c) => (
            <div key={c.id} style={{ border: `1px solid ${t.border}`, background: t.surface, borderRadius: 10, padding: 10 }}>
              <div style={{ fontSize: 12, color: t.text, fontWeight: 700 }}>{c.isAnonymous ? 'Anonymous' : c.username || 'User'}</div>
              {c.note && <div style={{ fontSize: 12, color: t.text, marginTop: 3 }}>{c.note}</div>}
              <div style={{ fontSize: 10, color: t.muted, marginTop: 4 }}>{c.rating ? `★ ${c.rating}` : ''}</div>
            </div>
          ))}
          {checkins.length === 0 && <div style={{ color: t.muted, fontSize: 12 }}>No check-ins yet.</div>}
        </div>
        <button onClick={() => setFeedLimit((n) => n + 10)} style={{ marginTop: 10, border: `1px solid ${t.border}`, background: t.surface, color: t.text, borderRadius: 9, padding: '8px 10px', cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>Show All</button>
      </div>

      <div style={{ padding: 12, borderTop: `1px solid ${t.border}`, background: t.navBg }}>
        <button onClick={handlePrimaryCheckIn} style={{ width: '100%', border: 'none', background: isCheckedIn ? t.surface2 : t.accent, color: isCheckedIn ? t.accent : 'white', borderRadius: 12, padding: 12, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontWeight: 700 }}>
          {isCheckedIn ? '✓ Checked In · Leave' : 'Check In Here'}
        </button>
        <button onClick={onOpenChat} style={{ marginTop: 8, width: '100%', border: `1px solid ${t.border}`, background: t.surface, color: t.text, borderRadius: 10, padding: 10, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>Open Chat</button>
      </div>

      {reportOpen && <ReportModal targetType="spot" targetId={spot.id} onClose={() => setReportOpen(false)} />}
    </div>
  );
}

function iconBtn(t, top, left, right) {
  return {
    position: 'absolute',
    top,
    left,
    right,
    border: 'none',
    width: 34,
    height: 34,
    borderRadius: '50%',
    background: t.surface,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  };
}
function Badge({ t, color, label }) {
  return <span style={{ fontSize: 10, fontWeight: 700, color, border: `1px solid ${color}44`, background: `${color}22`, borderRadius: 999, padding: '3px 8px' }}>{label}</span>;
}
function actionBtn(t, primary) {
  return {
    border: 'none',
    background: primary ? t.gold : t.surface2,
    color: primary ? '#1a1714' : t.text,
    borderRadius: 9,
    padding: '8px 10px',
    cursor: 'pointer',
    fontFamily: 'Outfit, sans-serif',
    fontWeight: 600,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
  };
}
