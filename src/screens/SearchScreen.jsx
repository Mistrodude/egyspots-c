import { useState, useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useSpots } from '../context/SpotsContext';
import SpotCard from '../components/SpotCard';
import { BackIcon } from '../components/Icons';
import { haversineMeters } from '../utils/geo';

const FILTERS = ['All', 'Nearby', 'Popular'];

export default function SearchScreen({ onSpotPress, onBack, userPos }) {
  const { t }  = useTheme();
  const { spots, checkedInId } = useSpots();
  const [query,  setQuery]  = useState('');
  const [filter, setFilter] = useState('All');

  const spotsWithDist = useMemo(() => {
    if (!userPos) return spots;
    return spots.map((s) => {
      const dm = haversineMeters(userPos, s);
      return {
        ...s,
        distanceM: dm,
        distance: dm < 1000 ? `${Math.round(dm)}m` : `${(dm / 1000).toFixed(1)} km`,
      };
    });
  }, [spots, userPos]);

  const results = spotsWithDist.filter((s) => {
    const matchQuery = query === '' ||
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      (s.neighborhood || '').toLowerCase().includes(query.toLowerCase()) ||
      (s.category || '').toLowerCase().includes(query.toLowerCase());

    const matchFilter =
      filter === 'All'     ? true :
      filter === 'Nearby'  ? (s.distanceM !== undefined ? s.distanceM < 1000 : false) :
      filter === 'Popular' ? (s.checkins || s.totalCheckins || 0) > 0 : true;

    return matchQuery && matchFilter;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: t.bg }}>
      {/* Header with safe-area spacer */}
      <div style={{ background: t.bg, flexShrink: 0 }}>
        <div style={{ height: 'env(safe-area-inset-top, 44px)' }} />
        <div style={{ padding: '10px 16px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
          {onBack && (
            <button onClick={onBack} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}>
              <BackIcon color={t.text} size={20} />
            </button>
          )}
          <div style={{ fontSize: 20, fontWeight: 800, color: t.text }}>Discover Spots</div>
        </div>

        <div style={{ padding: '10px 16px 8px' }}>
          {/* Search input */}
          <div style={{ background: t.surface, borderRadius: 16, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, border: `1px solid ${t.border}`, marginBottom: 10 }}>
            <span style={{ fontSize: 14, opacity: 0.5 }}>🔍</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cafes, car meets, shisha…"
              style={{ flex: 1, border: 'none', background: 'none', outline: 'none', fontSize: 13, color: t.text, fontFamily: 'Outfit, sans-serif' }}
            />
            {query && (
              <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: t.muted }}>✕</button>
            )}
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none' }}>
            {FILTERS.map((f) => (
              <button key={f} onClick={() => setFilter(f)} style={{
                flexShrink: 0, padding: '6px 14px', borderRadius: 20,
                border: 'none', cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
                background: filter === f ? t.accent : t.pill,
                color:      filter === f ? 'white'  : t.pillText,
                fontSize: 12, fontWeight: 600, transition: 'all 0.2s',
              }}>{f}</button>
            ))}
          </div>
        </div>
      </div>

      {filter === 'Nearby' && !userPos && (
        <div style={{ margin: '0 16px 8px', padding: '8px 12px', background: 'rgba(234,179,8,0.12)', border: '1px solid rgba(234,179,8,0.3)', borderRadius: 10, fontSize: 12, color: '#eab308' }}>
          Enable location to see nearby spots
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px 16px', display: 'flex', flexDirection: 'column', gap: 10, scrollbarWidth: 'none' }}>
        {results.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: t.muted }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🗺</div>
            <div style={{ fontSize: 14 }}>No spots found</div>
            <div style={{ fontSize: 11, marginTop: 4 }}>Try a different search or filter</div>
          </div>
        ) : (
          results.map((s, i) => (
            <div key={s.id} style={{ animation: `fadeUp 0.3s ease ${i * 0.04}s both` }}>
              <SpotCard spot={s} onPress={onSpotPress} checkedIn={s.id === checkedInId} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
