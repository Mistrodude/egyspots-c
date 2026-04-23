import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useSpots } from '../context/SpotsContext';
import SpotCard from '../components/SpotCard';

const FILTERS = ['All', 'Open', 'Nearby', 'Popular'];

export default function SearchScreen({ onSpotPress }) {
  const { t }  = useTheme();
  const { spots, checkedInId } = useSpots();
  const [query,  setQuery]  = useState('');
  const [filter, setFilter] = useState('All');

  const results = spots.filter((s) => {
    const matchQuery = query === '' ||
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.neighborhood.toLowerCase().includes(query.toLowerCase()) ||
      s.category.toLowerCase().includes(query.toLowerCase());

    const matchFilter =
      filter === 'All'     ? true :
      filter === 'Open'    ? s.open :
      filter === 'Nearby'  ? parseFloat(s.distance) < 5 :
      filter === 'Popular' ? s.checkins > 30 : true;

    return matchQuery && matchFilter;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: t.bg }}>
      <div style={{ padding: '66px 16px 8px', flexShrink: 0 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: t.text, marginBottom: 12 }}>Discover Spots</div>

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

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px 16px', display: 'flex', flexDirection: 'column', gap: 10, scrollbarWidth: 'none' }}>
        {results.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: t.muted }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🗺</div>
            <div style={{ fontSize: 14 }}>No spots found</div>
            <div style={{ fontSize: 11, marginTop: 4 }}>Try a different search</div>
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
