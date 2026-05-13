export default function Loading() {
  return (
    <div style={{
      height: '100%', background: '#0D0B14',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 0, fontFamily: 'Outfit, sans-serif',
    }}>
      <div style={{ fontSize: 30, fontWeight: 800, color: '#EDE9F8', letterSpacing: '-0.03em' }}>
        EgySpots
      </div>
      <div style={{ fontSize: 14, color: '#A78BFA', fontWeight: 500, marginTop: 6 }}>
        Cairo's live map
      </div>
      <div style={{
        marginTop: 48,
        width: 22, height: 22,
        border: '3px solid rgba(167,139,250,0.2)',
        borderTopColor: '#A78BFA',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
    </div>
  );
}
