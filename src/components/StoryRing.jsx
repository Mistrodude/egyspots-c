import { useTheme } from '../context/ThemeContext';

export default function StoryRing({ name, photoURL, hasUnviewed, size = 56, onPress }) {
  const { t } = useTheme();
  const initials = (name || '?').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  const ring = hasUnviewed ? t.accent : t.border;

  return (
    <button
      onClick={onPress}
      style={{
        background: 'none', border: 'none', cursor: 'pointer',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
        padding: 4, flexShrink: 0,
      }}
    >
      <div style={{
        width: size + 6, height: size + 6, borderRadius: '50%',
        border: `2.5px solid ${ring}`,
        boxShadow: hasUnviewed ? `0 0 10px ${t.accent}66` : 'none',
        padding: 2, display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'border-color 0.2s',
      }}>
        {photoURL
          ? <img src={photoURL} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }} />
          : <div style={{ width: size, height: size, borderRadius: '50%', background: t.accentBg, color: t.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: size * 0.3, fontFamily: 'Outfit, sans-serif' }}>{initials}</div>
        }
      </div>
      {name && (
        <span style={{ fontSize: 9, color: t.muted, fontFamily: 'Outfit, sans-serif', maxWidth: size + 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {name.split(' ')[0]}
        </span>
      )}
    </button>
  );
}
