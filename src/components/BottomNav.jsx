import { useTheme } from '../context/ThemeContext';
import { ExploreIcon, SearchIcon, ChatIcon, ProfileIcon } from './Icons';
import { useSpots } from '../context/SpotsContext';

const TABS = [
  { id: 'explore', Icon: ExploreIcon, label: 'Explore' },
  { id: 'search',  Icon: SearchIcon,  label: 'Search'  },
  { id: 'chat',    Icon: ChatIcon,    label: 'Chat'    },
  { id: 'profile', Icon: ProfileIcon, label: 'Profile' },
];

export default function BottomNav({ tab, setTab }) {
  const { t } = useTheme();
  const { checkedInId } = useSpots();

  return (
    <div style={{
      display: 'flex',
      background: t.navBg,
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderTop: `1px solid ${t.border}`,
      paddingBottom: 2,
      flexShrink: 0,
    }}>
      {TABS.map(({ id, Icon, label }) => {
        const active = tab === id;
        return (
          <button
            key={id}
            onClick={() => setTab(id)}
            style={{
              flex: 1, padding: '10px 0 7px',
              border: 'none', cursor: 'pointer',
              background: 'none', fontFamily: 'Outfit, sans-serif',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 4, position: 'relative',
            }}
          >
            <div style={{ transition: 'transform 0.2s', transform: active ? 'translateY(-1px)' : 'none' }}>
              <Icon color={active ? t.accent : t.muted} size={22} />
            </div>
            <span style={{
              fontSize: 9, fontWeight: active ? 700 : 500,
              color: active ? t.accent : t.muted,
              letterSpacing: '0.3px',
            }}>
              {label}
            </span>
            {id === 'chat' && checkedInId && (
              <div style={{
                width: 5, height: 5, borderRadius: '50%',
                background: t.accent,
                position: 'absolute', top: 8, right: '28%',
              }} />
            )}
          </button>
        );
      })}
    </div>
  );
}
