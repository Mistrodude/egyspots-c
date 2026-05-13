import { useState, useMemo, useRef, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useSpots } from '../context/SpotsContext';
import MapView from '../components/MapView';
import SpotCard from '../components/SpotCard';
import { CATEGORIES, filterSpots } from '../data/spots';
import { CATEGORY_ICONS, LocateIcon, SearchIcon, ExploreIcon } from '../components/Icons';
import { haversineMeters } from '../utils/geo';

const PEEK_H = 210;

export default function ExploreScreen({ onSpotPress, onOpenSearch, onAddSpot, userPos }) {
  const { t, isDark }  = useTheme();
  const { spots, checkedInId } = useSpots();
  const [category,     setCategory]     = useState('All');
  const [selectedId,   setSelectedId]   = useState(null);
  const [sheetOpen,    setSheetOpen]    = useState(false);
  const [locPing,      setLocPing]      = useState(false);
  const [userLocation, setUserLocation] = useState(null);

  const handleRef     = useRef(null);
  const dragRef       = useRef(null);
  const resetNorthRef = useRef(null);

  const filtered = useMemo(() => filterSpots(spots, category), [spots, category]);

  const spotsWithDist = useMemo(() => {
    if (!userPos) return filtered;
    return filtered.map((s) => {
      const dm = haversineMeters(userPos, s);
      return {
        ...s,
        distanceM: dm,
        distance: dm < 1000 ? `${Math.round(dm)}m` : `${(dm / 1000).toFixed(1)} km`,
      };
    }).sort((a, b) => a.distanceM - b.distanceM);
  }, [filtered, userPos]);

  // Fly to user location on first mount; also sync from App's GPS watch
  useEffect(() => {
    if (userPos && !userLocation) setUserLocation(userPos);
  }, [userPos]);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: false, timeout: 6000, maximumAge: 30000 }
    );
  }, []);

  // Non-passive touchmove on the handle only — prevents page scroll while dragging
  useEffect(() => {
    const el = handleRef.current;
    if (!el) return;
    const onMove = (e) => { if (dragRef.current) e.preventDefault(); };
    el.addEventListener('touchmove', onMove, { passive: false });
    return () => el.removeEventListener('touchmove', onMove);
  }, []);

  const handleSpotPress = (spot) => {
    setSelectedId(spot.id);
    onSpotPress(spot);
  };

  const handleLocate = () => {
    setLocPing(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lng: pos.coords.longitude, lat: pos.coords.latitude });
          setLocPing(false);
        },
        () => setLocPing(false),
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
      );
    } else {
      setTimeout(() => setLocPing(false), 800);
    }
  };

  const onTouchStart = (e) => {
    dragRef.current = { startY: e.touches[0].clientY, t: Date.now() };
  };

  const onTouchEnd = (e) => {
    if (!dragRef.current) return;
    const dy  = dragRef.current.startY - e.changedTouches[0].clientY;
    const vel = dy / Math.max(Date.now() - dragRef.current.t, 1);
    dragRef.current = null;
    if (Math.abs(dy) < 8) { setSheetOpen((o) => !o); return; }
    setSheetOpen(Math.abs(vel) > 0.3 ? vel > 0 : dy > 0);
  };

  const mapCtrlBottom = sheetOpen ? 'calc(88% + 14px)' : PEEK_H + 14;

  return (
    <div style={{ position: 'relative', height: '100%', overflow: 'hidden', background: t.bg }}>

      {/* Full-screen map */}
      <div style={{ position: 'absolute', inset: 0 }}>
        <MapView
          spots={filtered}
          selectedId={selectedId}
          onSpotPress={handleSpotPress}
          checkedInId={checkedInId}
          flyToTarget={userLocation}
          resetNorthRef={resetNorthRef}
        />
      </div>

      {/* Search bar */}
      <div style={{ position: 'absolute', top: 'calc(env(safe-area-inset-top, 44px) + 18px)', left: 14, right: 14, zIndex: 1200 }}>
        <button
          type="button"
          onClick={onOpenSearch}
          style={{ width: '100%', border: 'none', textAlign: 'left', cursor: 'pointer', background: 'transparent', padding: 0 }}
          aria-label="Open spot search"
        >
          <div style={{
            background: isDark ? 'rgba(21,18,30,0.88)' : 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
            borderRadius: 16, padding: '10px 14px',
            display: 'flex', alignItems: 'center', gap: 10,
            boxShadow: t.shadow2, border: `1px solid ${t.border}`,
          }}>
            <SearchIcon color={t.muted} size={16} />
            <span style={{ fontSize: 13, color: t.muted, flex: 1 }}>Search Cairo spots...</span>
            <div style={{ width: 26, height: 26, borderRadius: 8, background: t.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ExploreIcon color="white" size={13} />
            </div>
          </div>
        </button>
      </div>

      {/* Map controls */}
      <div style={{
        position: 'absolute', right: 14, bottom: mapCtrlBottom,
        zIndex: 1200, display: 'flex', flexDirection: 'column', gap: 8,
        transition: 'bottom 0.4s cubic-bezier(.32,1,.36,1)',
      }}>
        <button onClick={handleLocate} style={{
          width: 40, height: 40, borderRadius: '50%',
          border: `1px solid ${t.border}`, cursor: 'pointer',
          background: 'rgba(21,18,30,0.9)', backdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: t.shadow2,
        }}>
          <LocateIcon color={locPing ? t.accent : t.muted} size={18} />
        </button>

        <button onClick={() => resetNorthRef.current?.()} style={{
          width: 40, height: 40, borderRadius: '50%',
          border: `1px solid ${t.border}`, cursor: 'pointer',
          background: 'rgba(21,18,30,0.9)', backdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: t.shadow2,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke={t.muted} strokeWidth="1.6" />
            <polygon points="12,4 14.5,12 12,10.5 9.5,12" fill={t.accent} />
            <polygon points="12,20 9.5,12 12,13.5 14.5,12" fill={t.muted} />
          </svg>
        </button>

        <button id="tour-add-spot" onClick={onAddSpot} title="Create a new spot" style={{
          width: 40, height: 40, borderRadius: '50%',
          border: `1px solid ${t.border}`, cursor: 'pointer',
          background: 'rgba(21,18,30,0.9)', backdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: t.shadow2,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke={t.accent} strokeWidth="1.6" />
            <path d="M12 8v8M8 12h8" stroke={t.accent} strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Live badge — spot count */}
      <div style={{
        position: 'absolute', left: 14, bottom: mapCtrlBottom,
        zIndex: 1200, transition: 'bottom 0.4s cubic-bezier(.32,1,.36,1)',
        background: 'rgba(208,106,80,0.9)', backdropFilter: 'blur(8px)',
        borderRadius: 20, padding: '5px 11px',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'white', animation: 'pulse 1.5s infinite' }} />
        <span style={{ fontSize: 10, fontWeight: 700, color: 'white' }}>{spotsWithDist.length} spots live</span>
      </div>

      {/* Bottom sheet */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 1300,
        height: sheetOpen ? '88%' : PEEK_H,
        transition: 'height 0.4s cubic-bezier(.32,1,.36,1)',
        display: 'flex', flexDirection: 'column',
        background: isDark ? 'rgba(13,11,20,0.97)' : 'rgba(250,247,242,0.97)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '24px 24px 0 0',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.3)',
        borderTop: `1px solid ${t.border}`,
      }}>
        {/* Drag handle — tap or swipe to open/close */}
        <div
          ref={handleRef}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          onClick={() => setSheetOpen((o) => !o)}
          style={{
            padding: '12px 0 4px',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            cursor: 'pointer', flexShrink: 0, userSelect: 'none',
            touchAction: 'none',
          }}
        >
          <div style={{ width: 36, height: 4, borderRadius: 4, background: t.border, marginBottom: 8 }} />
          <div style={{ fontSize: 11, fontWeight: 700, color: t.muted, letterSpacing: '0.8px' }}>
            {sheetOpen ? '▾ COLLAPSE' : `▴ ${spotsWithDist.length} SPOTS NEAR YOU`}
          </div>
        </div>

        {/* Category pills */}
        <div style={{ display: 'flex', gap: 7, padding: '6px 14px 8px', overflowX: 'auto', scrollbarWidth: 'none', flexShrink: 0 }}>
          {CATEGORIES.map((c) => {
            const CatIcon = CATEGORY_ICONS[c];
            const active  = category === c;
            return (
              <button key={c} onClick={() => setCategory(c)} style={{
                flexShrink: 0, padding: '6px 13px', borderRadius: 20,
                border: 'none', cursor: 'pointer',
                background: active ? t.accent : t.pill,
                color:      active ? 'white'  : t.pillText,
                fontSize: 11, fontWeight: 600, fontFamily: 'Outfit, sans-serif',
                display: 'flex', alignItems: 'center', gap: 5,
                transition: 'all 0.2s',
              }}>
                {CatIcon && <CatIcon color={active ? 'white' : t.pillText} size={12} />}
                {c}
              </button>
            );
          })}
          <div style={{ width: 8, flexShrink: 0 }} />
        </div>

        {/* Spot list — always scrollable; sheet height clips the overflow */}
        <div style={{
          flex: 1, overflowY: 'auto',
          padding: '0 14px 16px',
          display: 'flex', flexDirection: 'column', gap: 8,
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
        }}>
          {spotsWithDist.map((s, i) => (
            <div key={s.id} style={{ animation: `fadeUp 0.25s ease ${i * 0.035}s both`, flexShrink: 0 }}>
              <SpotCard spot={s} onPress={handleSpotPress} checkedIn={s.id === checkedInId} />
            </div>
          ))}
          <div style={{ height: 8 }} />
        </div>
      </div>
    </div>
  );
}
