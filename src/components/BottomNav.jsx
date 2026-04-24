import { useTheme } from '../context/ThemeContext';
import { MapIcon, ExploreIcon, StoryIcon, ProfileIcon, PlusIcon } from './Icons';
import { useNotifications } from '../context/NotificationsContext';
import { useStories } from '../context/StoriesContext';

const TABS = [
  { id: 'map',     Icon: MapIcon,     label: 'Map'     },
  { id: 'explore', Icon: ExploreIcon, label: 'Explore' },
  { id: 'stories', Icon: StoryIcon,   label: 'Stories' },
  { id: 'profile', Icon: ProfileIcon, label: 'Profile' },
];

export default function BottomNav({ tab, setTab, onStoryFABPress }) {
  const { t } = useTheme();
  const { unreadCount } = useNotifications();
  const { unviewedCount } = useStories();

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-end',
      background: t.navBg,
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderTop: `1px solid ${t.border}`,
      paddingBottom: 6,
      paddingTop: 6,
      flexShrink: 0,
      position: 'relative',
    }}>
      {/* Map + Explore tabs */}
      {TABS.slice(0, 2).map(({ id, Icon, label }) => (
        <TabButton key={id} id={id} Icon={Icon} label={label} active={tab === id} setTab={setTab} t={t} />
      ))}

      {/* Center Story FAB */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', paddingBottom: 2 }}>
        <button
          onClick={onStoryFABPress}
          aria-label="Post a story"
          style={{
            width: 44, height: 44, borderRadius: '50%',
            background: `linear-gradient(135deg, ${t.accent}, ${t.accent}cc)`,
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 4px 20px ${t.accent}66`,
            marginTop: -10,
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
          onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.93)'; }}
          onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          onTouchStart={(e) => { e.currentTarget.style.transform = 'scale(0.93)'; }}
          onTouchEnd={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          <PlusIcon color="white" size={18} />
        </button>
        <span style={{ fontSize: 9, fontWeight: 600, color: t.muted, letterSpacing: '0.3px', marginTop: 2 }}>Story</span>
      </div>

      {/* Stories + Profile tabs */}
      {TABS.slice(2).map(({ id, Icon, label }) => (
        <TabButton
          key={id} id={id} Icon={Icon} label={label}
          active={tab === id} setTab={setTab} t={t}
          badge={
            id === 'stories' && unviewedCount > 0 ? unviewedCount
            : id === 'profile' && unreadCount > 0 ? unreadCount
            : 0
          }
        />
      ))}
    </div>
  );
}

function TabButton({ id, Icon, label, active, setTab, t, badge = 0 }) {
  return (
    <button
      onClick={() => setTab(id)}
      style={{
        flex: 1, padding: '10px 0 7px',
        border: 'none', cursor: 'pointer',
        background: 'none', fontFamily: 'Outfit, sans-serif',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 4, position: 'relative',
      }}
    >
      <div style={{ transition: 'transform 0.2s', transform: active ? 'translateY(-1px)' : 'none', position: 'relative' }}>
        <Icon color={active ? t.accent : t.muted} size={22} />
        {badge > 0 && (
          <div style={{
            position: 'absolute', top: -4, right: -6,
            minWidth: 14, height: 14, borderRadius: 7,
            background: t.error, color: 'white',
            fontSize: 8, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 3px',
          }}>
            {badge > 9 ? '9+' : badge}
          </div>
        )}
      </div>
      <span style={{
        fontSize: 9, fontWeight: active ? 700 : 500,
        color: active ? t.accent : t.muted,
        letterSpacing: '0.3px',
      }}>
        {label}
      </span>
    </button>
  );
}
