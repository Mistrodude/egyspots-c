import { useTheme } from '../context/ThemeContext';

export default function Loading({ message = 'Loading…' }) {
  const { t } = useTheme();
  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: t.bg, gap: 14,
    }}>
      <div style={{
        width: 32, height: 32,
        border: `3px solid ${t.border}`,
        borderTopColor: t.accent,
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <span style={{ fontSize: 13, color: t.muted }}>{message}</span>
    </div>
  );
}
