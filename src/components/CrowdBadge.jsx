export default function CrowdBadge({ crowd }) {
  const map = {
    Chill:  { color: '#4A9E6B', label: '● Chill' },
    Lively: { color: '#C8A96E', label: '●● Lively' },
    Packed: { color: '#D06A50', label: '●●● Packed' },
  };
  const { color, label } = map[crowd] || map.Chill;
  return (
    <span style={{
      fontSize: 10, fontWeight: 600,
      color,
      background: color + '22',
      padding: '2px 7px', borderRadius: 20,
    }}>
      {label}
    </span>
  );
}
