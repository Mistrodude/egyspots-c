import { useState, lazy, Suspense } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useStories } from '../context/StoriesContext';
import { useSpots } from '../context/SpotsContext';
import StoryRing from '../components/StoryRing';

const StoryViewerScreen = lazy(() => import('./StoryViewerScreen'));

export default function StoriesTab({ onSpotPress, onAddStory, onRequireAuth }) {
  const { t } = useTheme();
  const { storiesBySpot, hasUnviewed, loading } = useStories();
  const { spots } = useSpots();
  const [viewerSpot, setViewerSpot] = useState(null);

  const spotsWithStories = spots.filter((s) => storiesBySpot[s.id]?.length > 0);

  if (viewerSpot) {
    return (
      <Suspense fallback={null}>
        <StoryViewerScreen
          spotId={viewerSpot.id}
          onClose={() => setViewerSpot(null)}
          onCheckIn={() => { setViewerSpot(null); onSpotPress(viewerSpot); }}
        />
      </Suspense>
    );
  }

  return (
    <div style={{ height: '100%', background: t.bg, display: 'flex', flexDirection: 'column', fontFamily: 'Outfit, sans-serif' }}>
      {/* Header */}
      <div style={{ padding: 'calc(env(safe-area-inset-top, 44px) + 16px) 16px 12px', borderBottom: `1px solid ${t.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: t.text }}>Stories</div>
          <button
            onClick={onAddStory}
            style={{ padding: '8px 14px', borderRadius: 10, background: t.accent, color: 'white', border: 'none', cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 12 }}
          >
            + Post Story
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.muted, fontSize: 13 }}>Loading…</div>
      ) : spotsWithStories.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <div style={{ fontSize: 36 }}>📍</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: t.text }}>No stories right now</div>
          <div style={{ fontSize: 12, color: t.muted }}>Be the first to post a story at a spot</div>
          <button
            onClick={onAddStory}
            style={{ marginTop: 8, padding: '11px 24px', borderRadius: 12, background: t.accent, color: 'white', border: 'none', cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontWeight: 700 }}
          >
            Post Story
          </button>
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {/* Horizontal rings row */}
          <div style={{ padding: '14px 12px 8px', borderBottom: `1px solid ${t.border}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: t.muted, marginBottom: 10, letterSpacing: '0.5px' }}>ACTIVE SPOTS</div>
            <div style={{ display: 'flex', gap: 4, overflowX: 'auto', scrollbarWidth: 'none' }}>
              {spotsWithStories.map((spot) => (
                <StoryRing
                  key={spot.id}
                  name={spot.name}
                  photoURL={spot.coverPhotoURL}
                  hasUnviewed={hasUnviewed(spot.id)}
                  onPress={() => setViewerSpot(spot)}
                />
              ))}
            </div>
          </div>

          {/* Grid of spot cards with stories */}
          <div style={{ padding: '14px 12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {spotsWithStories.map((spot) => {
              const count = storiesBySpot[spot.id]?.length || 0;
              const unviewed = hasUnviewed(spot.id);
              return (
                <button
                  key={spot.id}
                  onClick={() => setViewerSpot(spot)}
                  style={{
                    background: t.surface, border: `1.5px solid ${unviewed ? t.accent : t.border}`,
                    borderRadius: 14, padding: 0, overflow: 'hidden', cursor: 'pointer',
                    textAlign: 'left', position: 'relative',
                    boxShadow: unviewed ? `0 2px 12px ${t.accent}33` : 'none',
                  }}
                >
                  {spot.coverPhotoURL
                    ? <img src={spot.coverPhotoURL} alt={spot.name} style={{ width: '100%', height: 90, objectFit: 'cover' }} />
                    : <div style={{ width: '100%', height: 90, background: t.accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>📍</div>
                  }
                  <div style={{ padding: '8px 10px' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: t.text, marginBottom: 2 }}>{spot.name}</div>
                    <div style={{ fontSize: 10, color: unviewed ? t.accent : t.muted, fontWeight: 600 }}>
                      {count} {count === 1 ? 'story' : 'stories'}
                    </div>
                  </div>
                  {unviewed && (
                    <div style={{ position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: '50%', background: t.accent }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
