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
  const [imageLoaded,  setImageLoaded]  = useState(false);
  const [reportTarget, setReportTarget] = useState(null);

  const touchStartRef = useRef({ x: 0, y: 0, time: 0 });
  const holdRef       = useRef(null);
  const timerRef      = useRef(null);
  const viewedRef     = useRef(new Set());
  const current       = stories[idx];

  // Preload every story image the moment the viewer opens
  useEffect(() => {
    stories.forEach((s) => { if (s.photoURL) new Image().src = s.photoURL; });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset loaded flag when the story changes
  useEffect(() => {
    setImageLoaded(!current?.photoURL);
  }, [idx]); // eslint-disable-line react-hooks/exhaustive-deps

  // Mark viewed once per story (not on every render)
  useEffect(() => {
    if (!imageLoaded || !current || viewedRef.current.has(current.id)) return;
    viewedRef.current.add(current.id);
    markViewed(current.id);
  }, [idx, imageLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  const advance = useCallback(() => {
    setIdx((i) => {
      if (i + 1 < stories.length) return i + 1;
      onClose();
      return i;
    });
  }, [stories.length, onClose]);

  // Auto-advance via setTimeout — no setInterval, zero re-renders during playback
  useEffect(() => {
    if (!imageLoaded || paused || !current) return;
    timerRef.current = setTimeout(advance, STORY_DURATION);
    return () => clearTimeout(timerRef.current);
  }, [idx, imageLoaded, paused, advance, current]);

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
    holdRef.current = setTimeout(() => setPaused(true), 150);
  };

  const handleTouchEnd = (e) => {
    clearTimeout(holdRef.current);
    if (paused) { setPaused(false); return; } // release hold = unpause
    const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
    const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
    const dt = Date.now() - touchStartRef.current.time;
    if (dy > 80 && Math.abs(dy) > Math.abs(dx)) {
      onClose();
    } else if (dt < 200 && Math.abs(dx) < 15 && Math.abs(dy) < 15) {
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
      {/* Gradient placeholder shown while image loads */}
      {current.photoURL && !imageLoaded && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        }} />
      )}

      {/* Story photo — fades in once loaded */}
      {current.photoURL
        ? <img
            key={current.id}
            src={current.photoURL}
            alt=""
            onLoad={() => setImageLoaded(true)}
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%', objectFit: 'cover',
              opacity: imageLoaded ? 1 : 0,
              transition: 'opacity 0.2s ease',
            }}
          />
        : <div style={{ position: 'absolute', inset: 0, background: t.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>📍</div>
      }

      {/* Cinematic gradient overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 30%, transparent 55%, rgba(0,0,0,0.8) 100%)',
      }} />

      {/* Progress bars — GPU-composited CSS animation, zero JS re-renders */}
      <div style={{
        position: 'absolute',
        top: 'calc(env(safe-area-inset-top, 44px) + 8px)',
        left: 12, right: 12,
        display: 'flex', gap: 3,
        zIndex: 10, pointerEvents: 'none',
      }}>
        {stories.map((_, i) => (
          <div key={i} style={{ flex: 1, height: 2.5, background: 'rgba(255,255,255,0.28)', borderRadius: 2, overflow: 'hidden' }}>
            {i < idx && (
              <div style={{ height: '100%', width: '100%', background: 'white', borderRadius: 2 }} />
            )}
            {i === idx && (
              <div
                key={idx}
                style={{
                  height: '100%', width: '100%', background: 'white', borderRadius: 2,
                  transformOrigin: 'left center',
                  transform: 'scaleX(0)',
                  animation: `storyProgress ${STORY_DURATION}ms linear forwards`,
                  animationPlayState: (paused || !imageLoaded) ? 'paused' : 'running',
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Top bar */}
      <div style={{
        position: 'absolute',
        top: 'calc(env(safe-area-inset-top, 44px) + 22px)',
        left: 12, right: 12,
        display: 'flex', alignItems: 'center', gap: 8, zIndex: 10,
      }}>
        {current.userPhotoURL
          ? <img src={current.userPhotoURL} alt="" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid rgba(255,255,255,0.4)' }} />
          : <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'white', flexShrink: 0 }}>
              {(current.userName || '?')[0].toUpperCase()}
            </div>
        }
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'white', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{current.userName || 'Anonymous'}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{timeAgo(current.createdAt)}</div>
        </div>
        {paused && (
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.75)', fontWeight: 800, letterSpacing: 1.5, marginRight: 4 }}>HOLD</div>
        )}
        <button onClick={() => setReportTarget(current.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, flexShrink: 0 }}>
          <ReportFlagIcon color="rgba(255,255,255,0.65)" size={18} />
        </button>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, flexShrink: 0 }}>
          <XIcon color="white" size={22} />
        </button>
      </div>

      {/* Caption */}
      {current.caption && (
        <div style={{ position: 'absolute', bottom: 108, left: 16, right: 16, zIndex: 10 }}>
          <div style={{ fontSize: 15, color: 'white', fontWeight: 500, lineHeight: 1.45, textShadow: '0 1px 8px rgba(0,0,0,0.9)' }}>
            {current.caption}
          </div>
        </div>
      )}

      {/* Check-in CTA */}
      <div style={{ position: 'absolute', bottom: 40, left: 16, right: 16, zIndex: 10 }}>
        <button
          onClick={() => { clearTimeout(timerRef.current); setPaused(true); onCheckIn(); }}
          style={{
            width: '100%', padding: '14px 0', borderRadius: 14,
            background: t.accent, color: 'white', border: 'none',
            fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 15, cursor: 'pointer',
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
