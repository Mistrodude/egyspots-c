import { memo } from 'react';
import { useTheme } from '../context/ThemeContext';
import { SpotIcon } from './Icons';
import CrowdBadge from './CrowdBadge';

function SpotCard({ spot, onPress, checkedIn }) {
  const { t } = useTheme();
  return (
    <div
      onClick={() => onPress(spot)}
      style={{
        background: t.surface, borderRadius: 14, padding: '12px 14px',
        display: 'flex', gap: 12, alignItems: 'center',
        boxShadow: t.shadow, cursor: 'pointer',
        border: `1px solid ${t.border}`,
      }}
    >
      <div style={{
        width: 72, height: 56, borderRadius: 12, overflow: 'hidden',
        background: `linear-gradient(135deg, ${spot.color}33, ${spot.color}66)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        border: `1px solid ${t.border}`,
      }}>
        {spot.coverPhotoURL ? (
          <img
            src={spot.coverPhotoURL}
            alt={spot.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <SpotIcon category={spot.category} color={spot.color} size={20} />
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
          <span style={{
            fontWeight: 700, fontSize: 13, color: t.text,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {spot.name}
          </span>
          {checkedIn && (
            <span style={{
              fontSize: 9, fontWeight: 700, color: t.accent,
              background: t.accentBg, padding: '1px 6px', borderRadius: 8,
            }}>
              HERE
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 10, color: t.muted }}>
            {spot.neighborhood} · {spot.distance}
          </span>
          <CrowdBadge crowd={spot.crowd} />
        </div>
      </div>

      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: t.accent }}>{spot.rating}</div>
        <div style={{ fontSize: 9, color: '#F4C430', lineHeight: 1.2 }}>★★★★★</div>
      </div>
    </div>
  );
}

export default memo(SpotCard);
