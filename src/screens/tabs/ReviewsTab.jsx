import { useTheme } from '../../context/ThemeContext';
import Avatar from '../../components/Avatar';
import { MOCK_REVIEWS } from '../../data/mockData';

export default function ReviewsTab({ spot }) {
  const { t } = useTheme();
  const bars   = [5, 4, 3, 2, 1];
  const counts = [180, 90, 30, 10, 2];
  const total  = counts.reduce((a, b) => a + b, 0);

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Summary */}
      <div style={{ background: t.surface, borderRadius: 14, padding: 16, border: `1px solid ${t.border}`, display: 'flex', gap: 16, alignItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 42, fontWeight: 800, color: t.accent, lineHeight: 1 }}>{spot.rating}</div>
          <div style={{ color: '#F4C430', fontSize: 14 }}>★★★★★</div>
          <div style={{ fontSize: 10, color: t.muted, marginTop: 2 }}>{spot.reviews} reviews</div>
        </div>
        <div style={{ flex: 1 }}>
          {bars.map((b, i) => (
            <div key={b} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: 10, color: t.muted, width: 8 }}>{b}</span>
              <div style={{ flex: 1, height: 6, borderRadius: 4, background: t.surface2 }}>
                <div style={{ height: '100%', width: `${(counts[i] / total) * 100}%`, borderRadius: 4, background: t.accent }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reviews */}
      {MOCK_REVIEWS.map((r) => (
        <div key={r.id} style={{ background: t.surface, borderRadius: 14, padding: 14, border: `1px solid ${t.border}` }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'center' }}>
            <Avatar initials={r.avatar} size={36} color={t.accent} bg={t.accentBg} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: t.text }}>{r.user}</div>
              <div style={{ fontSize: 10, color: t.muted }}>{r.time}</div>
            </div>
            <div style={{ color: '#F4C430', fontSize: 12 }}>{'★'.repeat(r.rating)}</div>
          </div>
          <p style={{ fontSize: 12, color: t.text, lineHeight: 1.5, marginBottom: 8 }}>{r.text}</p>
          <div style={{ fontSize: 10, color: t.muted }}>👍 {r.helpful} found this helpful</div>
        </div>
      ))}
    </div>
  );
}
