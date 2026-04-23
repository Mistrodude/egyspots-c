import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useSpots } from '../context/SpotsContext';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import CrowdBadge from '../components/CrowdBadge';
import { SpotIcon, BackIcon, HeartIcon } from '../components/Icons';
import { MOCK_REVIEWS, STORIES } from '../data/mockData';
import ChatTab from './tabs/ChatTab';
import ReviewsTab from './tabs/ReviewsTab';

export default function SpotDetailScreen({ spot, onBack, onOpenChat, onRequireAuth }) {
  const { t }        = useTheme();
  const { checkedInId, checkIn } = useSpots();
  const { user }     = useAuth();
  const [tab, setTab] = useState('info');
  const isCheckedIn   = spot.id === checkedInId;

  const handleCheckIn = () => {
    if (!user) {
      if (onRequireAuth) {
        onRequireAuth();
      } else {
        onBack();
      }
      return;
    }
    checkIn(spot.id);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: t.bg }} className="anim-slideInRight">

      {/* Hero */}
      <div style={{
        height: 200, position: 'relative', flexShrink: 0,
        background: `linear-gradient(135deg, ${spot.color}33 0%, ${spot.color}66 100%)`,
        overflow: 'hidden',
      }}>
        <svg style={{ position: 'absolute', inset: 0, opacity: 0.12 }} width="100%" height="100%">
          <defs>
            <pattern id="stripes" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="20" stroke={spot.color} strokeWidth="8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#stripes)" />
        </svg>

        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 16 }}>
          <div style={{ marginBottom: 8, opacity: 0.8 }}>
            <SpotIcon category={spot.category} color={spot.color} size={28} />
          </div>
          <div style={{ fontSize: 10, fontWeight: 700, color: spot.color, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 4 }}>
            {spot.category}
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: t.text, marginBottom: 4 }}>{spot.name}</div>
          <div style={{ fontSize: 12, color: t.muted }}>{spot.neighborhood}, Cairo</div>
        </div>

        <button onClick={onBack} style={{
          position: 'absolute', top: 14, left: 14,
          width: 34, height: 34, borderRadius: '50%',
          background: t.surface, border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: t.shadow,
        }}>
          <BackIcon color={t.text} size={18} />
        </button>

        <button style={{
          position: 'absolute', top: 14, right: 14,
          width: 34, height: 34, borderRadius: '50%',
          background: t.surface, border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: t.shadow,
        }}>
          <HeartIcon color={t.muted} size={18} />
        </button>
      </div>

      {/* Stats row */}
      <div style={{ background: t.surface, padding: '14px 16px', display: 'flex', borderBottom: `1px solid ${t.border}`, flexShrink: 0 }}>
        {[
          { label: 'Rating',   value: spot.rating + '★' },
          { label: 'Reviews',  value: spot.reviews       },
          { label: 'Here Now', value: spot.checkins       },
          { label: 'Distance', value: spot.distance       },
        ].map((s, i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center', borderRight: i < 3 ? `1px solid ${t.border}` : 'none' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: t.accent }}>{s.value}</div>
            <div style={{ fontSize: 10, color: t.muted }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${t.border}`, background: t.surface, flexShrink: 0 }}>
        {['info', 'chat', 'reviews'].map((tb) => (
          <button key={tb} onClick={() => setTab(tb)} style={{
            flex: 1, padding: '12px 0',
            border: 'none', cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
            background: 'transparent', fontSize: 12, fontWeight: 600, textTransform: 'capitalize',
            color: tab === tb ? t.accent : t.muted,
            borderBottom: tab === tb ? `2px solid ${t.accent}` : '2px solid transparent',
            transition: 'all 0.2s',
          }}>
            {tb === 'chat' ? '💬 Chat' : tb === 'reviews' ? '⭐ Reviews' : 'ℹ Info'}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none' }}>
        {tab === 'info'    && <InfoTab spot={spot} t={t} />}
        {tab === 'chat'    && <ChatTab spot={spot} onOpenChat={onOpenChat} />}
        {tab === 'reviews' && <ReviewsTab spot={spot} />}
      </div>

      {/* Check-in button */}
      <div style={{ padding: '12px 16px', background: t.navBg, backdropFilter: 'blur(12px)', borderTop: `1px solid ${t.border}`, flexShrink: 0 }}>
        <button onClick={handleCheckIn} style={{
          width: '100%', padding: 14, borderRadius: 16,
          border: isCheckedIn ? `2px solid ${t.accent}` : 'none',
          cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
          background: isCheckedIn ? 'transparent' : t.accent,
          color: isCheckedIn ? t.accent : 'white',
          fontSize: 15, fontWeight: 700,
          boxShadow: isCheckedIn ? 'none' : `0 4px 16px ${t.accent}55`,
          transition: 'all 0.2s',
        }}>
          {isCheckedIn ? '✓ Checked In · Leave' : '📍 Check In Here'}
        </button>
      </div>
    </div>
  );
}

function InfoTab({ spot, t }) {
  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Crowd meter */}
      <div style={{ background: t.surface, borderRadius: 14, padding: 14, border: `1px solid ${t.border}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: t.text }}>Crowd Level</span>
          <CrowdBadge crowd={spot.crowd} />
        </div>
        <div style={{ height: 8, borderRadius: 8, background: t.surface2, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${spot.crowdPct}%`,
            borderRadius: 8,
            background: spot.crowdPct > 70 ? '#D06A50' : spot.crowdPct > 40 ? '#C8A96E' : '#4A9E6B',
            transition: 'width 1s ease',
          }} />
        </div>
        <div style={{ fontSize: 10, color: t.muted, marginTop: 4 }}>{spot.checkins} people checked in</div>
      </div>

      {/* Vibes */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: t.muted, marginBottom: 8, letterSpacing: '1px' }}>TONIGHT'S VIBES</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {(spot.vibe || []).map((v) => (
            <span key={v} style={{ fontSize: 12, padding: '5px 12px', borderRadius: 20, background: t.accentBg, color: t.accentText, fontWeight: 500 }}>{v}</span>
          ))}
        </div>
      </div>

      {/* Who's here */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: t.muted, marginBottom: 8, letterSpacing: '1px' }}>WHO'S HERE</div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {['OK', 'NM', 'KA', 'ST', 'AM', 'YB'].map((av, i) => (
            <div key={i} style={{ marginLeft: i > 0 ? -8 : 0, border: `2px solid ${t.bg}`, borderRadius: '50%' }}>
              <Avatar initials={av} size={34} color={t.accent} bg={t.accentBg} />
            </div>
          ))}
          <span style={{ fontSize: 11, color: t.muted, marginLeft: 8 }}>+{Math.max(0, spot.checkins - 6)} more</span>
        </div>
      </div>

      {/* Hours */}
      <div style={{ background: t.surface, borderRadius: 14, padding: 14, border: `1px solid ${t.border}` }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: t.text, marginBottom: 8 }}>Hours</div>
        {['Sun–Thu', 'Fri–Sat'].map((d, i) => (
          <div key={d} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: i === 0 ? `1px solid ${t.border}` : 'none' }}>
            <span style={{ fontSize: 12, color: t.muted }}>{d}</span>
            <span style={{ fontSize: 12, color: i === 1 ? '#4A9E6B' : t.text, fontWeight: 600 }}>
              {i === 0 ? '9AM – 2AM' : '24 hrs ✓'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
