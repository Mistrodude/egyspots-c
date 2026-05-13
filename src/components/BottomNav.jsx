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

export default function BottomNav({ tab, setTab, onStoryFABPress, nearbySpot, checkedInId }) {
  const { t } = useTheme();
  const { unreadCount } = useNotifications();
  const { unviewedCount } = useStories();
  const isNearSpot = !!nearbySpot;
  const isCheckedInHere = isNearSpot && checkedInId === nearbySpot?.id;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-end',
      background: t.navBg,
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderTop: `1px solid ${t.border}`,
      paddingBottom: 'max(6px, env(safe-area-inset-bottom, 6px))',
      paddingTop: 6,
      flexShrink: 0,
      position: 'relative',
      zIndex: 100,
    }}>
      {/* Map + Explore tabs */}
      {TABS.slice(0, 2).map(({ id, Icon, label }) => (
        <TabButton key={id} id={id} Icon={Icon} label={label} active={tab === id} setTab={setTab} t={t}
          tourId={id === 'explore' ? 'tour-explore' : undefined}
        />
      ))}

      {/* Center FAB — Here (purple) when checked in, Check In (green) when near, Story (purple) otherwise */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', paddingBottom: 2 }}>
        <button
          id="tour-fab"
          onClick={onStoryFABPress}
          aria-label={isCheckedInHere ? `Leave ${nearbySpot.name}` : isNearSpot ? `Check in to ${nearbySpot.name}` : 'Post a story'}
          style={{
            width: 44, height: 44, borderRadius: '50%',
            background: isNearSpot && !isCheckedInHere
              ? 'linear-gradient(135deg, #22c55e, #16a34a)'
              : `linear-gradient(135deg, ${t.accent}, ${t.accent}cc)`,
            border: isCheckedInHere ? `2px solid ${t.accent}` : 'none',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: isNearSpot && !isCheckedInHere
              ? '0 4px 20px rgba(34,197,94,0.5)'
              : `0 4px 20px ${t.accent}66`,
            marginTop: -10,
            transition: 'transform 0.15s, box-shadow 0.15s, background 0.3s',
          }}
          onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.93)'; }}
          onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          onTouchStart={(e) => { e.currentTarget.style.transform = 'scale(0.93)'; }}
          onTouchEnd={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          {isCheckedInHere ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : isNearSpot ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <PlusIcon color="white" size={18} />
          )}
        </button>
        <span style={{
          fontSize: 9, fontWeight: 600, letterSpacing: '0.3px', marginTop: 2,
          color: isCheckedInHere ? t.accent : isNearSpot ? '#22c55e' : t.muted,
        }}>
          {isCheckedInHere ? 'Here ✓' : isNearSpot ? 'Check In' : 'Story'}
        </span>
      </div>

      {/* Stories + Profile tabs */}
      {TABS.slice(2).map(({ id, Icon, label }) => (
        <TabButton
          key={id} id={id} Icon={Icon} label={label}
          active={tab === id} setTab={setTab} t={t}
          tourId={id === 'stories' ? 'tour-stories' : undefined}
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

function TabButton({ id, Icon, label, active, setTab, t, badge = 0, tourId }) {
  return (
    <button
      id={tourId}
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
