import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { haversineMeters, CHECKIN_RADIUS_M } from './utils/geo';
import { useTheme }  from './context/ThemeContext';
import { useAuth }   from './context/AuthContext';
import { useSpots }  from './context/SpotsContext';
import BottomNav     from './components/BottomNav';
import Loading       from './components/Loading';
import ExploreScreen from './screens/ExploreScreen';

const SpotDetailScreen    = lazy(() => import('./screens/SpotDetailScreen'));
const ChatScreen          = lazy(() => import('./screens/ChatScreen'));
const SearchScreen        = lazy(() => import('./screens/SearchScreen'));
const ProfileScreen       = lazy(() => import('./screens/ProfileScreen'));
const AuthScreen          = lazy(() => import('./screens/AuthScreen'));
const OnboardingScreen    = lazy(() => import('./screens/OnboardingScreen'));
const DiscoverScreen      = lazy(() => import('./screens/DiscoverScreen'));
const StoriesTab          = lazy(() => import('./screens/StoriesTab'));
const StoryViewerScreen   = lazy(() => import('./screens/StoryViewerScreen'));
const AddStoryScreen      = lazy(() => import('./screens/AddStoryScreen'));
const NotificationsScreen = lazy(() => import('./screens/NotificationsScreen'));
const EditProfileScreen   = lazy(() => import('./screens/EditProfileScreen'));
const SettingsScreen      = lazy(() => import('./screens/SettingsScreen'));
const AddSpotScreen       = lazy(() => import('./screens/AddSpotScreen'));
const EditSpotScreen      = lazy(() => import('./screens/EditSpotScreen'));

const S = <Loading message="Loading…" />;

export default function App() {
  const { t }    = useTheme();
  const { loading: authLoading, user, userProfile, logOut } = useAuth();
  const { loading: spotsLoading, spots, checkIn, checkedInId } = useSpots();

  const [tab,            setTab]           = useState('map');
  const [selectedSpot,   setSelectedSpot]  = useState(null);
  const [chatOpen,       setChatOpen]      = useState(false);
  const [authOpen,       setAuthOpen]      = useState(false);
  const [searchOpen,     setSearchOpen]    = useState(false);
  const [notifOpen,      setNotifOpen]     = useState(false);
  const [editProfileOpen,setEditProfile]   = useState(false);
  const [settingsOpen,   setSettingsOpen]  = useState(false);
  const [addSpotOpen,    setAddSpot]       = useState(false);
  const [addStoryOpen,       setAddStory]       = useState(false);
  const [addStoryDefaultId,  setAddStoryDefaultId] = useState('');
  const [storyViewerSpotId,  setStoryViewerSpotId] = useState(null);
  const [editSpotOpen,       setEditSpotOpen]   = useState(false);
  const [editSpotTarget,     setEditSpotTarget] = useState(null);
  const [onboardingDone, setOnboardingDone] = useState(
    () => localStorage.getItem('onboardingDone') === 'true'
  );

  const [userPos,    setUserPos]    = useState(null);
  const [nearbySpot, setNearbySpot] = useState(null);

  // Keep a ref so auto-checkout effect never has stale closures
  const checkInRef    = useRef(checkIn);
  const checkedInIdRef = useRef(checkedInId);
  useEffect(() => { checkInRef.current = checkIn; });
  useEffect(() => { checkedInIdRef.current = checkedInId; });

  // Watch GPS position continuously — low accuracy to save battery
  useEffect(() => {
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Compute nearest spot within check-in radius
  useEffect(() => {
    if (!userPos || !spots?.length) { setNearbySpot(null); return; }
    let closest = null, minDist = Infinity;
    spots.forEach((s) => {
      const d = haversineMeters(userPos, s);
      if (d < minDist) { minDist = d; closest = s; }
    });
    setNearbySpot(minDist <= CHECKIN_RADIUS_M ? closest : null);
  }, [userPos, spots]);

  // Auto-checkout when the user walks away from their checked-in spot
  useEffect(() => {
    if (!nearbySpot && checkedInIdRef.current && userPos) {
      checkInRef.current(checkedInIdRef.current); // toggles off
    }
  }, [nearbySpot, userPos]);

  const [guestInteractions, setGuestInteractions] = useState(0);
  const [toast, setToast] = useState(null);

  const bumpGuest = () => {
    if (!user) {
      setGuestInteractions((n) => {
        if (n + 1 >= 2) { setAuthOpen(true); return 0; }
        return n + 1;
      });
    }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  // FAB: one-tap check-in/out when near a spot; otherwise open Add Story
  const handleFAB = async () => {
    if (!user) { setAuthOpen(true); return; }
    if (nearbySpot) {
      const alreadyCheckedIn = checkedInId === nearbySpot.id;
      const result = await checkIn(nearbySpot.id);
      if (result?.error === 'cooldown') {
        showToast(`Wait ${result.minutesLeft} min — checked in recently`);
      } else if (!alreadyCheckedIn) {
        showToast(`Checked in to ${nearbySpot.name} ✓`);
      }
    } else {
      setAddStory(true);
    }
  };

  const handleSpotPress = (spot) => {
    bumpGuest();
    setSelectedSpot(spot);
  };

  if (authLoading || spotsLoading) return <Loading message="Loading EgySpots…" />;

  if (userProfile?.isBanned && !user) {
    return (
      <div style={{ height: '100%', background: t.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🚫</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: t.text, marginBottom: 8 }}>Account Suspended</div>
        <div style={{ fontSize: 13, color: t.muted, textAlign: 'center', marginBottom: 24 }}>
          {userProfile.banReason || 'Your account has been suspended. Contact support for help.'}
        </div>
        <button
          onClick={logOut}
          style={{ border: `1px solid ${t.border}`, background: t.surface, color: t.text, borderRadius: 10, padding: '10px 24px', cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}
        >
          Continue as Guest
        </button>
      </div>
    );
  }

  if (!onboardingDone) {
    return (
      <Suspense fallback={<Loading />}>
        <OnboardingScreen onDone={() => {
          localStorage.setItem('onboardingDone', 'true');
          setOnboardingDone(true);
        }} />
      </Suspense>
    );
  }

  // Overlay priority stack
  if (authOpen) return (
    <div style={{ height: '100%', background: t.bg }}>
      <Suspense fallback={S}><AuthScreen onBack={() => setAuthOpen(false)} /></Suspense>
    </div>
  );

  if (notifOpen) return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: t.bg }}>
      <Suspense fallback={S}><NotificationsScreen onBack={() => setNotifOpen(false)} onSpotPress={(s) => { setNotifOpen(false); setSelectedSpot(s); }} /></Suspense>
    </div>
  );

  if (settingsOpen) return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: t.bg }}>
      <Suspense fallback={S}><SettingsScreen onBack={() => setSettingsOpen(false)} onRequireAuth={() => { setSettingsOpen(false); setAuthOpen(true); }} /></Suspense>
    </div>
  );

  if (editProfileOpen) return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: t.bg }}>
      <Suspense fallback={S}><EditProfileScreen onBack={() => setEditProfile(false)} /></Suspense>
    </div>
  );

  if (addSpotOpen) return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: t.bg }}>
      <Suspense fallback={S}><AddSpotScreen onBack={() => setAddSpot(false)} onRequireAuth={() => { setAddSpot(false); setAuthOpen(true); }} userPos={userPos} /></Suspense>
    </div>
  );

  if (addStoryOpen) return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: t.bg }}>
      <Suspense fallback={S}><AddStoryScreen defaultSpotId={addStoryDefaultId} onClose={() => { setAddStory(false); setAddStoryDefaultId(''); }} onRequireAuth={() => { setAddStory(false); setAddStoryDefaultId(''); setAuthOpen(true); }} userPos={userPos} /></Suspense>
    </div>
  );

  if (editSpotOpen && editSpotTarget) return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: t.bg }}>
      <Suspense fallback={S}><EditSpotScreen spot={editSpotTarget} onBack={() => { setEditSpotOpen(false); setEditSpotTarget(null); }} /></Suspense>
    </div>
  );

  if (storyViewerSpotId) return (
    <Suspense fallback={S}>
      <StoryViewerScreen
        spotId={storyViewerSpotId}
        onClose={() => setStoryViewerSpotId(null)}
        onCheckIn={() => { setStoryViewerSpotId(null); }}
      />
    </Suspense>
  );

  if (chatOpen && selectedSpot) return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: t.bg }}>
      <Suspense fallback={S}><ChatScreen spot={selectedSpot} onBack={() => setChatOpen(false)} /></Suspense>
    </div>
  );

  if (searchOpen) return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: t.bg }}>
      <Suspense fallback={S}><SearchScreen userPos={userPos} onSpotPress={(s) => { setSearchOpen(false); setSelectedSpot(s); }} onBack={() => setSearchOpen(false)} /></Suspense>
    </div>
  );

  if (selectedSpot) return (
    <div style={{ height: '100%', background: t.bg }}>
      <Suspense fallback={S}>
        <SpotDetailScreen
          spot={selectedSpot}
          userPos={userPos}
          onBack={() => setSelectedSpot(null)}
          onOpenChat={() => setChatOpen(true)}
          onStoryViewer={() => setStoryViewerSpotId(selectedSpot.id)}
          onAddStory={() => { setAddStoryDefaultId(selectedSpot.id); setAddStory(true); }}
          onEditSpot={user?.uid === selectedSpot?.founderId ? () => { setEditSpotTarget(selectedSpot); setEditSpotOpen(true); } : undefined}
          onRequireAuth={() => { setSelectedSpot(null); setAuthOpen(true); }}
        />
      </Suspense>
    </div>
  );

  const mainScreen = (() => {
    switch (tab) {
      case 'map': return (
        <ExploreScreen
          userPos={userPos}
          onSpotPress={handleSpotPress}
          onOpenSearch={() => setSearchOpen(true)}
          onOpenNotifications={() => { if (!user) { setAuthOpen(true); return; } setNotifOpen(true); }}
          onAddSpot={() => { if (!user) { setAuthOpen(true); return; } setAddSpot(true); }}
        />
      );
      case 'explore': return (
        <Suspense fallback={S}>
          <DiscoverScreen
            onSpotPress={handleSpotPress}
            onOpenSearch={() => setSearchOpen(true)}
          />
        </Suspense>
      );
      case 'stories': return (
        <Suspense fallback={S}>
          <StoriesTab
            onSpotPress={handleSpotPress}
            onAddStory={() => { if (!user) { setAuthOpen(true); return; } setAddStory(true); }}
            onRequireAuth={() => setAuthOpen(true)}
          />
        </Suspense>
      );
      case 'profile': return (
        <Suspense fallback={S}>
          <ProfileScreen
            onNavigateToAuth={() => setAuthOpen(true)}
            onEditProfile={() => setEditProfile(true)}
            onSettings={() => setSettingsOpen(true)}
            onNotifications={() => setNotifOpen(true)}
            onSpotPress={handleSpotPress}
            onAddSpot={() => setAddSpot(true)}
            onBack={() => setTab('map')}
            onStoryViewer={(spotId) => setStoryViewerSpotId(spotId)}
          />
        </Suspense>
      );
      default: return null;
    }
  })();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: t.bg, overflow: 'hidden', position: 'relative' }}>
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {mainScreen}
      </div>
      <BottomNav tab={tab} setTab={setTab} onStoryFABPress={handleFAB} nearbySpot={nearbySpot} checkedInId={checkedInId} />
      {toast && (
        <div style={{
          position: 'absolute', bottom: 90, left: 16, right: 16,
          background: t.accent, color: 'white',
          borderRadius: 12, padding: '12px 16px',
          textAlign: 'center', fontWeight: 700, fontSize: 14,
          zIndex: 2000, boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
          pointerEvents: 'none',
          animation: 'fadeUp 0.2s ease',
        }}>
          {toast}
        </div>
      )}
    </div>
  );
}
