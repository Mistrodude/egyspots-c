import { memo } from 'react';
import { useTheme } from '../context/ThemeContext';
import CrowdBadge from './CrowdBadge';
import { getOpenStatus } from '../utils/openStatus';

const CATEGORY_COLORS = {
  hangout:     '#A78BFA',
  car_meet:    '#F59E0B',
  street_cart: '#10B981',
  pop_up:      '#EC4899',
  open_air:    '#3B82F6',
};

const CATEGORY_EMOJI = {
  hangout:     '☕',
  car_meet:    '🚗',
  street_cart: '🍔',
  pop_up:      '🎪',
  open_air:    '🌿',
};

function SpotCard({ spot, onPress, checkedIn }) {
  const { t } = useTheme();
  const color    = spot.color || CATEGORY_COLORS[spot.category] || '#A78BFA';
  const openStatus = getOpenStatus(spot.operatingHours);

  return (
    <div
      onClick={() => onPress(spot)}
      style={{
        background: t.surface, borderRadius: 14, padding: '10px 12px',
        display: 'flex', gap: 12, alignItems: 'center',
        boxShadow: t.shadow, cursor: 'pointer',
        border: checkedIn ? `1.5px solid ${color}` : `1px solid ${t.border}`,
      }}
    >
      {/* Cover photo / color placeholder */}
      <div style={{
        width: 72, height: 56, borderRadius: 10, overflow: 'hidden',
        flexShrink: 0, background: `linear-gradient(135deg, ${color}55, ${color}22)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {spot.coverPhotoURL
          ? <img src={spot.coverPhotoURL} alt={spot.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          : <span style={{ fontSize: 22 }}>{CATEGORY_EMOJI[spot.category] || '📍'}</span>
        }
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
              fontSize: 9, fontWeight: 700, color: color,
              background: `${color}22`, padding: '1px 6px', borderRadius: 8, flexShrink: 0,
            }}>
              HERE
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 10, color: t.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {spot.neighborhood || spot.address?.split(',')[0]}{spot.distance ? ` · ${spot.distance}` : ''}
          </span>
          <CrowdBadge crowd={spot.crowd} />
        </div>
        {openStatus && (
          <span style={{ fontSize: 9, fontWeight: 700, color: openStatus.isOpen ? '#22c55e' : '#ef4444', marginTop: 2 }}>
            {openStatus.label}
          </span>
        )}
      </div>

      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color }}>
          {spot.rating ? spot.rating.toFixed(1) : '—'}
        </div>
        <div style={{ fontSize: 9, color: '#F4C430' }}>★★★★★</div>
      </div>
    </div>
  );
}

export default memo(SpotCard);
