import { useState, lazy, Suspense } from 'react';
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
const CheckInModal        = lazy(() => import('./screens/CheckInModal'));
const NotificationsScreen = lazy(() => import('./screens/NotificationsScreen'));
const EditProfileScreen   = lazy(() => import('./screens/EditProfileScreen'));
const SettingsScreen      = lazy(() => import('./screens/SettingsScreen'));
const AddSpotScreen       = lazy(() => import('./screens/AddSpotScreen'));

const S = <Loading message="Loading…" />;

export default function App() {
  const { t }    = useTheme();
  const { loading: authLoading, user, userProfile } = useAuth();
  const { loading: spotsLoading } = useSpots();

  const [tab,            setTab]           = useState('map');
  const [selectedSpot,   setSelectedSpot]  = useState(null);
  const [chatOpen,       setChatOpen]      = useState(false);
  const [authOpen,       setAuthOpen]      = useState(false);
  const [searchOpen,     setSearchOpen]    = useState(false);
  const [checkInSpot,    setCheckInSpot]   = useState(null);
  const [notifOpen,      setNotifOpen]     = useState(false);
  const [editProfileOpen,setEditProfile]   = useState(false);
  const [settingsOpen,   setSettingsOpen]  = useState(false);
  const [addSpotOpen,    setAddSpot]       = useState(false);
  const [addStoryOpen,   setAddStory]      = useState(false);
  const [storyViewerSpotId, setStoryViewerSpotId] = useState(null);
  const [onboardingDone, setOnboardingDone] = useState(
    () => localStorage.getItem('onboardingDone') === 'true'
  );

  const [guestInteractions, setGuestInteractions] = useState(0);
  const bumpGuest = () => {
    if (!user) {
      setGuestInteractions((n) => {
        if (n + 1 >= 2) { setAuthOpen(true); return 0; }
        return n + 1;
      });
    }
  };

  const handleStoryFAB = () => {
    if (!user) { setAuthOpen(true); return; }
    setAddStory(true);
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
        <div style={{ fontSize: 13, color: t.muted, textAlign: 'center' }}>
          {userProfile.banReason || 'Your account has been suspended. Contact support for help.'}
        </div>
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
      <Suspense fallback={S}><AddSpotScreen onBack={() => setAddSpot(false)} onRequireAuth={() => { setAddSpot(false); setAuthOpen(true); }} /></Suspense>
    </div>
  );

  if (addStoryOpen) return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: t.bg }}>
      <Suspense fallback={S}><AddStoryScreen onClose={() => setAddStory(false)} onRequireAuth={() => { setAddStory(false); setAuthOpen(true); }} /></Suspense>
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

  if (checkInSpot) return (
    <div style={{ height: '100%', background: t.bg }}>
      <Suspense fallback={S}>
        <CheckInModal
          spot={checkInSpot}
          onClose={() => setCheckInSpot(null)}
          onSuccess={() => setCheckInSpot(null)}
        />
      </Suspense>
    </div>
  );

  if (chatOpen && selectedSpot) return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: t.bg }}>
      <Suspense fallback={S}><ChatScreen spot={selectedSpot} onBack={() => setChatOpen(false)} /></Suspense>
    </div>
  );

  if (searchOpen) return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: t.bg }}>
      <Suspense fallback={S}><SearchScreen onSpotPress={(s) => { setSearchOpen(false); setSelectedSpot(s); }} onBack={() => setSearchOpen(false)} /></Suspense>
    </div>
  );

  if (selectedSpot) return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: t.bg }}>
      <Suspense fallback={S}>
        <SpotDetailScreen
          spot={selectedSpot}
          onBack={() => setSelectedSpot(null)}
          onOpenChat={() => setChatOpen(true)}
          onCheckIn={() => setCheckInSpot(selectedSpot)}
          onStoryViewer={() => setStoryViewerSpotId(selectedSpot.id)}
          onRequireAuth={() => { setSelectedSpot(null); setAuthOpen(true); }}
        />
      </Suspense>
      <BottomNav tab={tab} setTab={(id) => { setSelectedSpot(null); setTab(id); }} onStoryFABPress={handleStoryFAB} />
    </div>
  );

  const mainScreen = (() => {
    switch (tab) {
      case 'map': return (
        <ExploreScreen
          onSpotPress={handleSpotPress}
          onOpenSearch={() => setSearchOpen(true)}
          onOpenNotifications={() => { if (!user) { setAuthOpen(true); return; } setNotifOpen(true); }}
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
            onAddStory={handleStoryFAB}
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
          />
        </Suspense>
      );
      default: return null;
    }
  })();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: t.bg, overflow: 'hidden' }}>
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {mainScreen}
      </div>
      <BottomNav tab={tab} setTab={setTab} onStoryFABPress={handleStoryFAB} />
    </div>
  );
}
