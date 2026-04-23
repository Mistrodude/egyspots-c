import { useTheme } from '../context/ThemeContext';
import { useSpots } from '../context/SpotsContext';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import { SpotIcon } from '../components/Icons';

const STATS_LABELS = ['Check-ins', 'Reviews', 'Following', 'Spots'];
const STATS_VALUES = [47, 12, 89, 3];

const SETTINGS_ITEMS = ['Notifications', 'Privacy', 'Appearance', 'About EgySpots'];

export default function ProfileScreen({ onNavigateToAuth }) {
  const { t, isDark, toggleTheme } = useTheme();
  const { spots, checkedInId } = useSpots();
  const { user, logOut } = useAuth();

  const checkedSpot = spots.find((s) => s.id === checkedInId);
  const displayName = user?.displayName || 'You';
  const initials    = displayName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  const recentSpots = spots.slice(0, 4);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: t.bg }}>

      {/* Header */}
      <div style={{ background: t.surface, padding: '62px 16px 16px', borderBottom: `1px solid ${t.border}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{
              width: 60, height: 60, borderRadius: 20,
              background: `linear-gradient(135deg, ${t.accent}44, ${t.accent}22)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 800, color: t.accent,
              border: `2px solid ${t.accent}44`,
            }}>
              {initials}
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: t.text }}>{displayName}</div>
              <div style={{ fontSize: 11, color: t.muted }}>
                {user?.email ? `@${user.email.split('@')[0]}` : '@youhandle'} · Cairo
              </div>
              {checkedSpot && (
                <div style={{ fontSize: 10, color: '#4A9E6B', fontWeight: 600, marginTop: 2 }}>
                  📍 At {checkedSpot.name}
                </div>
              )}
            </div>
          </div>

          {/* Dark mode toggle */}
          <button onClick={toggleTheme} style={{
            width: 38, height: 22, borderRadius: 11,
            border: 'none', cursor: 'pointer',
            background: isDark ? t.accent : t.border,
            position: 'relative', transition: 'background 0.3s',
          }}>
            <div style={{
              width: 18, height: 18, borderRadius: '50%',
              background: 'white', position: 'absolute', top: 2,
              transition: 'left 0.3s',
              left: isDark ? 18 : 2,
            }} />
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex' }}>
          {STATS_LABELS.map((label, i) => (
            <div key={label} style={{ flex: 1, textAlign: 'center', borderRight: i < 3 ? `1px solid ${t.border}` : 'none' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: t.accent }}>{STATS_VALUES[i]}</div>
              <div style={{ fontSize: 10, color: t.muted }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12, scrollbarWidth: 'none' }}>

        {/* Auth state */}
        {!user ? (
          <div style={{ background: t.surface, borderRadius: 14, padding: 16, border: `1px solid ${t.border}`, textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: t.text, marginBottom: 6 }}>Sign in to EgySpots</div>
            <div style={{ fontSize: 11, color: t.muted, marginBottom: 12 }}>Check in, chat & discover Cairo spots</div>
            <button onClick={onNavigateToAuth} style={{
              padding: '10px 24px', borderRadius: 12,
              background: t.accent, color: 'white',
              border: 'none', cursor: 'pointer',
              fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 13,
            }}>
              Sign In / Sign Up
            </button>
          </div>
        ) : (
          <button onClick={logOut} style={{
            padding: '10px', borderRadius: 12,
            background: t.surface2, color: '#D06A50',
            border: `1px solid ${t.border}`, cursor: 'pointer',
            fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: 13,
          }}>
            Sign Out
          </button>
        )}

        {/* Recent check-ins */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: t.muted, marginBottom: 10, letterSpacing: '1px' }}>RECENT CHECK-INS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recentSpots.map((s, i) => (
              <div key={s.id} style={{ background: t.surface, borderRadius: 12, padding: '12px 14px', display: 'flex', gap: 12, alignItems: 'center', border: `1px solid ${t.border}` }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: s.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <SpotIcon category={s.category} color={s.color} size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: t.text }}>{s.name}</div>
                  <div style={{ fontSize: 10, color: t.muted }}>{['Tonight', 'Yesterday', '2 days ago', 'Last week'][i]}</div>
                </div>
                <div style={{ color: '#F4C430', fontSize: 11 }}>★ {s.rating}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Settings */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: t.muted, marginBottom: 10, letterSpacing: '1px' }}>SETTINGS</div>
          {SETTINGS_ITEMS.map((item) => (
            <div key={item} style={{ background: t.surface, borderRadius: 12, padding: '13px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, border: `1px solid ${t.border}`, cursor: 'pointer' }}>
              <span style={{ fontSize: 13, color: t.text }}>{item}</span>
              <span style={{ fontSize: 12, color: t.muted }}>›</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
