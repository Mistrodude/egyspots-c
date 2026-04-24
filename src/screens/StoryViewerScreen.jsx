import { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useStories } from '../context/StoriesContext';
import { useAuth } from '../context/AuthContext';
import { XIcon, ReportFlagIcon } from '../components/Icons';
import ReportModal from '../components/ReportModal';

const STORY_DURATION = 5000;

export default function StoryViewerScreen({ spotId, initialIndex = 0, onClose, onCheckIn }) {
  const { t } = useTheme();
  const { storiesBySpot, markViewed } = useStories();
  const { user } = useAuth();
  const stories = storiesBySpot[spotId] || [];
  const [idx, setIdx] = useState(initialIndex);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [reportTarget, setReportTarget] = useState(null);
  const intervalRef = useRef(null);
  const current = stories[idx];

  const advance = useCallback(() => {
    setIdx((i) => {
      if (i + 1 < stories.length) return i + 1;
      onClose();
      return i;
    });
    setProgress(0);
  }, [stories.length, onClose]);

  useEffect(() => {
    if (!current || paused) return;
    markViewed(current.id);
    setProgress(0);
    const start = Date.now();
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min((elapsed / STORY_DURATION) * 100, 100);
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(intervalRef.current);
        advance();
      }
    }, 50);
    return () => clearInterval(intervalRef.current);
  }, [idx, paused, current, advance, markViewed]);

  if (!current) { onClose(); return null; }

  const timeAgo = (ts) => {
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    const diff = Math.floor((Date.now() - d) / 60000);
    if (diff < 1)  return 'just now';
    if (diff < 60) return `${diff}m ago`;
    return `${Math.floor(diff / 60)}h ago`;
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9000, background: '#000', fontFamily: 'Outfit, sans-serif' }}
      onTouchStart={(e) => { e.touches[0].clientX < window.innerWidth / 2 ? setIdx((i) => Math.max(0, i - 1)) : advance(); }}
    >
      {/* Photo */}
      {current.photoURL
        ? <img src={current.photoURL} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        : <div style={{ position: 'absolute', inset: 0, background: t.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>📍</div>
      }

      {/* Dark overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 40%, transparent 60%, rgba(0,0,0,0.7) 100%)' }} />

      {/* Progress bars */}
      <div style={{ position: 'absolute', top: 50, left: 12, right: 12, display: 'flex', gap: 3, zIndex: 10 }}>
        {stories.map((_, i) => (
          <div key={i} style={{ flex: 1, height: 2.5, background: 'rgba(255,255,255,0.3)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{
              height: '100%', background: 'white', borderRadius: 2,
              width: i < idx ? '100%' : i === idx ? `${progress}%` : '0%',
              transition: i === idx ? 'none' : 'none',
            }} />
          </div>
        ))}
      </div>

      {/* Top bar */}
      <div style={{ position: 'absolute', top: 64, left: 12, right: 12, display: 'flex', alignItems: 'center', gap: 8, zIndex: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'white' }}>
          {(current.userName || '?')[0].toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'white' }}>{current.userName || 'Anonymous'}</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)' }}>{timeAgo(current.createdAt)}</div>
        </div>
        <button onClick={() => setReportTarget(current.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          <ReportFlagIcon color="rgba(255,255,255,0.7)" size={18} />
        </button>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          <XIcon color="white" size={22} />
        </button>
      </div>

      {/* Caption */}
      {current.caption && (
        <div style={{ position: 'absolute', bottom: 90, left: 16, right: 16, zIndex: 10 }}>
          <div style={{ fontSize: 14, color: 'white', fontWeight: 500, textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>{current.caption}</div>
        </div>
      )}

      {/* Check-in CTA */}
      <div style={{ position: 'absolute', bottom: 32, left: 16, right: 16, zIndex: 10 }}>
        <button
          onClick={() => { setPaused(true); onCheckIn(); }}
          style={{
            width: '100%', padding: '13px 0', borderRadius: 14,
            background: t.accent, color: 'white', border: 'none',
            fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 14, cursor: 'pointer',
          }}
        >
          Check In Here
        </button>
      </div>

      {reportTarget && (
        <ReportModal targetType="story" targetId={reportTarget} onClose={() => setReportTarget(null)} />
      )}
    </div>
  );
}
