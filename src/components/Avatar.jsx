export default function Avatar({ initials, size = 32, color, bg }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: bg || 'rgba(167,139,250,0.15)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.34, fontWeight: 700,
      color: color || '#A78BFA',
      flexShrink: 0, letterSpacing: '-0.5px',
      userSelect: 'none',
    }}>
      {initials}
    </div>
  );
}
