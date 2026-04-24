import { useMemo, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useSpots } from '../context/SpotsContext';
import { SearchIcon, StarIcon } from '../components/Icons';
import SpotCard from '../components/SpotCard';
import { CATEGORIES, filterSpots } from '../data/spots';

function Section({ t, title, children, subtitle }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: t.text }}>{title}</div>
        {subtitle && <div style={{ fontSize: 11, color: t.muted }}>{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}

export default function DiscoverScreen({ onSpotPress, onOpenSearch }) {
  const { t } = useTheme();
  const { spots, checkinHistory } = useSpots();
  const [category, setCategory] = useState('All');

  const categoryFiltered = useMemo(() => filterSpots(spots, category), [spots, category]);
  const visited = useMemo(() => new Set((checkinHistory || []).map((c) => c.spotId)), [checkinHistory]);
  const trending = useMemo(() => [...spots].sort((a, b) => (b.weeklyCheckins || 0) - (a.weeklyCheckins || 0)).slice(0, 8), [spots]);
  const activeToday = useMemo(() => [...spots].sort((a, b) => (b.checkinsToday || 0) - (a.checkinsToday || 0)).slice(0, 8), [spots]);
  const featured = useMemo(() => spots.filter((s) => s.isFeatured), [spots]);
  const unseen = useMemo(() => categoryFiltered.filter((s) => !visited.has(s.id)).slice(0, 10), [categoryFiltered, visited]);
  const newNearby = useMemo(() => {
    const now = Date.now();
    return spots.filter((s) => {
      const raw = s.createdAt?.toDate ? s.createdAt.toDate() : s.createdAt;
      if (!raw) return false;
      const created = new Date(raw).getTime();
      return !Number.isNaN(created) && now - created < 7 * 24 * 60 * 60 * 1000;
    }).slice(0, 6);
  }, [spots]);

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: t.bg, padding: '62px 14px 20px' }}>
      <button
        onClick={onOpenSearch}
        style={{
          width: '100%', border: `1px solid ${t.border}`, background: t.surface, color: t.muted,
          borderRadius: 14, padding: '12px 12px', fontFamily: 'Outfit, sans-serif',
          display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 14,
        }}
      >
        <SearchIcon color={t.muted} size={16} />
        Search spots, food, vibes...
      </button>

      <Section t={t} title="Trending This Week" subtitle="Most weekly check-ins">
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {trending.map((s) => (
            <div key={s.id} style={{ minWidth: 250 }}>
              <SpotCard spot={s} onPress={onSpotPress} />
            </div>
          ))}
        </div>
      </Section>

      <Section t={t} title="Most Active Today">
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {activeToday.map((s) => (
            <div key={s.id} style={{ minWidth: 250 }}>
              <SpotCard spot={s} onPress={onSpotPress} />
            </div>
          ))}
        </div>
      </Section>

      <Section t={t} title="Featured Vendors">
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {featured.map((s) => (
            <div key={s.id} style={{ minWidth: 230, border: `1px solid ${t.border}`, background: t.surface, borderRadius: 14, padding: 12 }}>
              <div style={{ fontSize: 10, color: t.warning, fontWeight: 700, marginBottom: 6 }}>Sponsored</div>
              <div style={{ fontSize: 14, color: t.text, fontWeight: 700, marginBottom: 4 }}>{s.name}</div>
              <div style={{ fontSize: 11, color: t.muted, marginBottom: 8 }}>{s.neighborhood}</div>
              <button onClick={() => onSpotPress(s)} style={{ border: 'none', background: t.accent, color: 'white', borderRadius: 10, padding: '8px 10px', cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>View Spot</button>
            </div>
          ))}
        </div>
      </Section>

      <Section t={t} title="Browse by Category">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
          {CATEGORIES.filter((c) => c !== 'All').map((c) => (
            <button key={c} onClick={() => setCategory(c)} style={{
              border: `1px solid ${category === c ? t.accent : t.border}`,
              background: category === c ? t.accentBg : t.surface,
              color: category === c ? t.accentText : t.text,
              borderRadius: 12, padding: '10px 8px', cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
              fontWeight: 600,
            }}>{c}</button>
          ))}
        </div>
      </Section>

      {newNearby.length > 0 && (
        <Section t={t} title="New Spots Nearby">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {newNearby.map((s) => (
              <button key={s.id} onClick={() => onSpotPress(s)} style={{
                border: `1px solid ${t.border}`, background: t.surface, borderRadius: 12, padding: 10, textAlign: 'left',
                cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
              }}>
                <div style={{ fontSize: 12, color: t.text, fontWeight: 700 }}>{s.name}</div>
                <div style={{ fontSize: 10, color: t.muted }}>{s.neighborhood}</div>
              </button>
            ))}
          </div>
        </Section>
      )}

      <Section t={t} title="Spots You Haven't Visited">
        {unseen.length === 0 ? (
          <div style={{ border: `1px solid ${t.border}`, background: t.surface, borderRadius: 14, padding: 14, color: t.muted, fontSize: 12 }}>
            You're all caught up. Try a new category.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {unseen.map((s) => <SpotCard key={s.id} spot={s} onPress={onSpotPress} />)}
          </div>
        )}
      </Section>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', color: t.muted, fontSize: 11, marginTop: 8 }}>
        <StarIcon color={t.gold} size={12} /> Personalized using your check-ins
      </div>
    </div>
  );
}
