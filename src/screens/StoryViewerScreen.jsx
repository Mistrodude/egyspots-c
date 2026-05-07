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
  const [idx,          setIdx]          = useState(initialIndex);
  const [paused,       setPaused]       = useState(false);
  const [progress,     setProgress]     = useState(0);
  const [imageLoaded,  setImageLoaded]  = useState(false);
  const [reportTarget, setReportTarget] = useState(null);
  const intervalRef   = useRef(null);
  const touchStartRef = useRef({ x: 0, y: 0, time: 0 });
  const current = stories[idx];

  const advance = useCallback(() => {
    setIdx((i) => {
      if (i + 1 < stories.length) return i + 1;
      onClose();
      return i;
    });
    setProgress(0);
  }, [stories.length, onClose]);

  // Reset loaded state and preload next image whenever story changes
  useEffect(() => {
    setImageLoaded(!current?.photoURL); // no URL = instantly "loaded"
    setProgress(0);
    const next = stories[idx + 1];
    if (next?.photoURL) {
      const img = new Image();
      img.src = next.photoURL;
    }
  }, [idx]);

  // Progress timer — only runs once image is ready
  useEffect(() => {
    if (!current || paused || !imageLoaded) return;
    markViewed(current.id);
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
  }, [idx, paused, imageLoaded, current, advance, markViewed]);

  if (!current) { onClose(); return null; }

  const timeAgo = (ts) => {
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    const diff = Math.floor((Date.now() - d) / 60000);
    if (diff < 1)  return 'just now';
    if (diff < 60) return `${diff}m ago`;
    return `${Math.floor(diff / 60)}h ago`;
  };

  const handleTouchStart = (e) => {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, time: Date.now() };
  };

  const handleTouchEnd = (e) => {
    const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
    const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
    const dt = Date.now() - touchStartRef.current.time;
    if (dy > 80 && Math.abs(dy) > Math.abs(dx)) {
      onClose();
    } else if (dt < 300 && Math.abs(dx) < 20 && Math.abs(dy) < 20) {
      if (touchStartRef.current.x < window.innerWidth / 2) setIdx((i) => Math.max(0, i - 1));
      else advance();
    }
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9000, background: '#000', fontFamily: 'Outfit, sans-serif' }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Photo */}
      {current.photoURL
        ? <img
            key={current.id}
            src={current.photoURL}
            alt=""
            onLoad={() => setImageLoaded(true)}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: imageLoaded ? 1 : 0, transition: 'opacity 0.2s' }}
          />
        : <div style={{ position: 'absolute', inset: 0, background: t.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>📍</div>
      }

      {/* Loading spinner — shown until image is ready */}
      {current.photoURL && !imageLoaded && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111' }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            border: '3px solid rgba(255,255,255,0.15)',
            borderTopColor: 'white',
            animation: 'spin 0.7s linear infinite',
          }} />
        </div>
      )}

      {/* Dark overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 40%, transparent 60%, rgba(0,0,0,0.7) 100%)' }} />

      {/* Progress bars */}
      <div style={{ position: 'absolute', top: 'calc(env(safe-area-inset-top, 44px) + 8px)', left: 12, right: 12, display: 'flex', gap: 3, zIndex: 10 }}>
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
      <div style={{ position: 'absolute', top: 'calc(env(safe-area-inset-top, 44px) + 22px)', left: 12, right: 12, display: 'flex', alignItems: 'center', gap: 8, zIndex: 10 }}>
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
