import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationsContext';
import { useSpots } from '../context/SpotsContext';
import { BackIcon, BellIcon, CheckIcon, FlagIcon, ShieldCheckIcon, StoreIcon } from '../components/Icons';

const ICONS = {
  vendor_location_update: StoreIcon,
  spot_approved: CheckIcon,
  spot_rejected: FlagIcon,
  account_verified: ShieldCheckIcon,
  account_rejected: FlagIcon,
  checkin_at_your_spot: BellIcon,
};

export default function NotificationsScreen({ onBack, onSpotPress }) {
  const { t } = useTheme();
  const { notifications, markAllRead, markRead } = useNotifications();
  const { spots } = useSpots();

  const onNotifPress = async (n) => {
    await markRead(n.id);
    const spotId = n?.data?.spotId;
    if (!spotId) return;
    const spot = spots.find((s) => s.id === spotId);
    if (spot) onSpotPress(spot);
  };

  return (
    <div style={{ height: '100%', background: t.bg, display: 'flex', flexDirection: 'column' }}>
      <div style={{ borderBottom: `1px solid ${t.border}` }}>
        <div style={{ height: 'env(safe-area-inset-top, 0px)' }} />
        <div style={{ padding: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={onBack} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}><BackIcon color={t.text} size={18} /></button>
            <div style={{ fontWeight: 700, color: t.text }}>Notifications</div>
          </div>
          <button onClick={markAllRead} style={{ border: 'none', background: 'transparent', color: t.accent, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>Mark all read</button>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {notifications.length === 0 ? (
          <div style={{ border: `1px solid ${t.border}`, background: t.surface, borderRadius: 10, padding: 16, color: t.muted, textAlign: 'center' }}>No notifications yet</div>
        ) : (
          notifications.map((n) => {
            const Icon = ICONS[n.type] || BellIcon;
            return (
              <button key={n.id} onClick={() => onNotifPress(n)} style={{ border: `1px solid ${t.border}`, background: t.surface, borderRadius: 10, padding: 10, cursor: 'pointer', textAlign: 'left', fontFamily: 'Outfit, sans-serif', color: t.text, display: 'flex', alignItems: 'center', gap: 10 }}>
                <Icon color={t.accent} size={16} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{n.title || n.type?.replaceAll('_', ' ')}</div>
                  <div style={{ fontSize: 11, color: t.muted }}>{n.body || 'New update'}</div>
                </div>
                {!n.isRead && <div style={{ width: 8, height: 8, borderRadius: '50%', background: t.accent }} />}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
