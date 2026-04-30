import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTheme } from '../context/ThemeContext';
import { useStories } from '../context/StoriesContext';

const CAIRO_CENTER = [30.0444, 31.2357]; // [lat, lng]

function getTouchAngle(t1, t2) {
  return Math.atan2(t2.clientY - t1.clientY, t2.clientX - t1.clientX) * 180 / Math.PI;
}

export default function MapView({ spots, selectedId, onSpotPress, checkedInId, flyToTarget }) {
  const { isDark, t } = useTheme();
  const { storiesBySpot } = useStories();
  const containerRef = useRef(null);
  const wrapperRef   = useRef(null);
  const mapRef       = useRef(null);
  const markerLayerRef   = useRef(null);
  const userMarkerRef    = useRef(null);
  const userPulseRef     = useRef(null);
  const hasSetInitialRef = useRef(false);
  const gestureRef       = useRef(null);
  const bearingRef       = useRef(0);
  const [bearing, setBearing] = useState(0);
  const [mapReady, setMapReady] = useState(false);

  // ─── Map init ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: CAIRO_CENTER,
      zoom: 12,
      zoomControl: false,
      preferCanvas: true,
    });

    L.tileLayer(
      isDark
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      { maxZoom: 19, attribution: '&copy; OpenStreetMap &copy; CARTO' }
    ).addTo(map);

    markerLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    setMapReady(true);

    return () => {
      map.remove();
      mapRef.current = null;
      markerLayerRef.current = null;
      userMarkerRef.current = null;
      userPulseRef.current = null;
      hasSetInitialRef.current = false;
      setMapReady(false);
    };
  }, [isDark]);

  // ─── Markers ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapReady) return;
    const map = mapRef.current;
    const layer = markerLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    spots.forEach((spot) => {
      const isSelected  = spot.id === selectedId;
      const isCheckedIn = spot.id === checkedInId;
      const hasStories  = (storiesBySpot[spot.id]?.length || 0) > 0;
      const radius = isSelected ? 11 : 8;
      const fill   = isCheckedIn ? '#A78BFA' : (isDark ? '#A78BFA' : spot.color);

      L.circle([spot.lat, spot.lng], {
        radius: Math.max(40, (spot.crowdPct || 30) * 7),
        stroke: false, fillColor: fill, fillOpacity: 0.09, interactive: false,
      }).addTo(layer);

      if (hasStories) {
        L.circleMarker([spot.lat, spot.lng], {
          radius: radius + 5, color: '#C8A96E', weight: 2,
          fillColor: 'transparent', fillOpacity: 0, interactive: false,
        }).addTo(layer);
      }

      L.circleMarker([spot.lat, spot.lng], {
        radius, color: '#ffffff', weight: isSelected ? 3 : 2,
        fillColor: fill, fillOpacity: 1,
      }).on('click', () => onSpotPress(spot)).addTo(layer);
    });
  }, [mapReady, spots, selectedId, checkedInId, onSpotPress, isDark, storiesBySpot]);

  // ─── Fly to selected spot ─────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedId) return;
    const spot = spots.find((s) => s.id === selectedId);
    if (spot) map.flyTo([spot.lat, spot.lng], 14, { duration: 0.8 });
  }, [selectedId, spots]);

  // ─── Fly to user location ─────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !flyToTarget) return;

    if (userMarkerRef.current) map.removeLayer(userMarkerRef.current);
    if (userPulseRef.current)  map.removeLayer(userPulseRef.current);

    userMarkerRef.current = L.circleMarker([flyToTarget.lat, flyToTarget.lng], {
      radius: 7, color: '#ffffff', weight: 2, fillColor: '#3B82F6', fillOpacity: 1,
    }).addTo(map);

    userPulseRef.current = L.circle([flyToTarget.lat, flyToTarget.lng], {
      radius: 120, stroke: false, fillColor: '#3B82F6', fillOpacity: 0.12, interactive: false,
    }).addTo(map);

    if (!hasSetInitialRef.current) {
      map.setView([flyToTarget.lat, flyToTarget.lng], 15); // instant — no animation
      hasSetInitialRef.current = true;
    } else {
      map.flyTo([flyToTarget.lat, flyToTarget.lng], 15, { duration: 1.2 });
    }
  }, [flyToTarget]);

  // ─── Two-finger rotation gesture ─────────────────────────────────────────
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const onStart = (e) => {
      if (e.touches.length === 2) {
        gestureRef.current = {
          startAngle:   getTouchAngle(e.touches[0], e.touches[1]),
          startBearing: bearingRef.current,
        };
      }
    };

    const onMove = (e) => {
      if (e.touches.length !== 2 || !gestureRef.current) return;
      const angle  = getTouchAngle(e.touches[0], e.touches[1]);
      const newBearing = gestureRef.current.startBearing + (angle - gestureRef.current.startAngle);
      bearingRef.current = newBearing;
      setBearing(newBearing);
      if (containerRef.current) {
        containerRef.current.style.transition = 'none';
        containerRef.current.style.transform  = `rotate(${newBearing}deg)`;
      }
    };

    const onEnd = (e) => {
      if (e.touches.length < 2) {
        gestureRef.current = null;
        // Rotation stays — user taps compass button to snap back north
      }
    };

    wrapper.addEventListener('touchstart', onStart, { passive: true });
    wrapper.addEventListener('touchmove',  onMove,  { passive: true });
    wrapper.addEventListener('touchend',   onEnd,   { passive: true });
    return () => {
      wrapper.removeEventListener('touchstart', onStart);
      wrapper.removeEventListener('touchmove',  onMove);
      wrapper.removeEventListener('touchend',   onEnd);
    };
  }, []);

  const resetNorth = () => {
    bearingRef.current = 0;
    setBearing(0);
    if (containerRef.current) {
      containerRef.current.style.transition = 'transform 0.4s cubic-bezier(.32,1,.36,1)';
      containerRef.current.style.transform  = 'rotate(0deg)';
    }
  };

  const isRotated = Math.abs(bearing) > 3;

  return (
    <div ref={wrapperRef} style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      {/*
        Oversized container (150% × 150%, centered at -25% offset) so that
        when rotated at any angle the corners always fill the viewport —
        no background bleed-through. transformOrigin stays at center.
      */}
      <div
        ref={containerRef}
        style={{
          position: 'absolute',
          width: '150%', height: '150%',
          top: '-25%', left: '-25%',
          backgroundColor: t.bg,
          transformOrigin: 'center center',
        }}
      />

      {/*
        Controls overlay — pointer-events:none so all map taps/pans pass
        through to Leaflet. Each control re-enables pointer-events itself.
      */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1000 }}>
        {isRotated && (
          <button
            onClick={resetNorth}
            style={{
              position: 'absolute', top: 14, right: 14,
              pointerEvents: 'auto',
              width: 36, height: 36, borderRadius: '50%',
              background: 'rgba(21,18,30,0.9)', backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
            }}
            aria-label="Reset to north"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" style={{ transform: `rotate(${-bearing}deg)` }}>
              <polygon points="12,3 14.5,12 12,10.5 9.5,12" fill="#ef4444" />
              <polygon points="12,21 9.5,12 12,13.5 14.5,12" fill="rgba(255,255,255,0.5)" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
