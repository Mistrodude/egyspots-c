import { useState, lazy, Suspense } from 'react';
import { useTheme }  from './context/ThemeContext';
import { useAuth }   from './context/AuthContext';
import { useSpots }  from './context/SpotsContext';
import { SPOTS_SEED } from './data/spots';
import BottomNav       from './components/BottomNav';
import Loading         from './components/Loading';
import ExploreScreen   from './screens/ExploreScreen';

// Lazy-load non-critical screens to reduce initial bundle parse time
const SpotDetailScreen = lazy(() => import('./screens/SpotDetailScreen'));
const ChatScreen       = lazy(() => import('./screens/ChatScreen'));
const SearchScreen     = lazy(() => import('./screens/SearchScreen'));
const ProfileScreen    = lazy(() => import('./screens/ProfileScreen'));
const AuthScreen       = lazy(() => import('./screens/AuthScreen'));

export default function App() {
  const { t }    = useTheme();
  const { loading: authLoading } = useAuth();
  const { loading: spotsLoading, spots, checkedInId } = useSpots();

  const checkedInSpot = spots.find((s) => s.id === checkedInId) || null;

  const [tab,          setTab]          = useState('explore');
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [chatOpen,     setChatOpen]     = useState(false);
  const [authOpen,     setAuthOpen]     = useState(false);

  if (authLoading || spotsLoading) {
    return <Loading message="Loading EgySpots…" />;
  }

  // Auth overlay
  if (authOpen) {
    return (
      <div style={{ height: '100%', background: t.bg }}>
        <Suspense fallback={<Loading message="Loading…" />}>
          <AuthScreen onBack={() => setAuthOpen(false)} />
        </Suspense>
      </div>
    );
  }

  // Chat screen
  if (chatOpen && selectedSpot) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: t.bg }}>
        <Suspense fallback={<Loading message="Loading chat…" />}>
          <ChatScreen spot={selectedSpot} onBack={() => setChatOpen(false)} />
        </Suspense>
      </div>
    );
  }

  // Spot detail screen
  if (selectedSpot) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: t.bg }}>
        <Suspense fallback={<Loading message="Loading spot…" />}>
          <SpotDetailScreen
            spot={selectedSpot}
            onBack={() => setSelectedSpot(null)}
            onOpenChat={() => setChatOpen(true)}
            onRequireAuth={() => {
              setSelectedSpot(null);
              setAuthOpen(true);
            }}
          />
        </Suspense>
        <BottomNav tab="explore" setTab={(id) => { setSelectedSpot(null); setTab(id); }} />
      </div>
    );
  }

  // Main tab screen
  const screen =
    tab === 'explore' ? (
      <ExploreScreen
        onSpotPress={(s) => setSelectedSpot(s)}
        onOpenSearch={() => setTab('search')}
      />
    ) : tab === 'search' ? (
      <Suspense fallback={<Loading message="Loading search…" />}>
        <SearchScreen onSpotPress={(s) => { setSelectedSpot(s); setTab('explore'); }} />
      </Suspense>
    ) : tab === 'chat' ? (
      <Suspense fallback={<Loading message="Loading chat…" />}>
        <ChatScreen spot={checkedInSpot || SPOTS_SEED[0]} onBack={() => setTab('explore')} />
      </Suspense>
    ) : tab === 'profile' ? (
      <Suspense fallback={<Loading message="Loading profile…" />}>
        <ProfileScreen onNavigateToAuth={() => setAuthOpen(true)} />
      </Suspense>
    ) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: t.bg, overflow: 'hidden' }}>
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {screen}
      </div>
      <BottomNav tab={tab} setTab={setTab} />
    </div>
  );
}
