import { useEffect, useRef, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import { useTheme } from '../context/ThemeContext';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const CAIRO_CENTER = [31.2357, 30.0444];

export default function MapView({ spots, selectedId, onSpotPress, checkedInId, flyToTarget }) {
  const { isDark } = useTheme();
  const containerRef  = useRef(null);
  const mapRef        = useRef(null);
  const markersRef    = useRef({});
  const mapLoadedRef  = useRef(false);

  const removeAllMarkers = useCallback(() => {
    Object.values(markersRef.current).forEach((m) => m.remove());
    markersRef.current = {};
  }, []);

  const addMarkers = useCallback((map, spotsArr, selId, checkinId) => {
    removeAllMarkers();
    spotsArr.forEach((spot) => {
      const isSelected  = spot.id === selId;
      const isCheckedIn = spot.id === checkinId;

      const el = document.createElement('div');
      el.style.cssText = `
        width:${isSelected ? 18 : 12}px;
        height:${isSelected ? 18 : 12}px;
        border-radius:50%;
        background:${isDark ? '#A78BFA' : spot.color};
        border:2px solid ${isDark ? '#0D0B14' : '#fff'};
        box-shadow:0 0 ${isSelected ? '12px 4px' : '6px 0px'} ${isDark ? '#A78BFA' : spot.color}66;
        cursor:pointer;
        transition:all 0.2s;
      `;

      if (isCheckedIn) {
        el.style.animation = 'pulse 1.8s infinite';
        el.style.background = '#A78BFA';
      }

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        onSpotPress(spot);
      });

      const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
        .setLngLat([spot.lng, spot.lat])
        .addTo(map);

      markersRef.current[spot.id] = marker;
    });
  }, [isDark, onSpotPress, removeAllMarkers]);

  const buildHeatFeatures = (spotsArr) => ({
    type: 'FeatureCollection',
    features: spotsArr.map((s) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [s.lng, s.lat] },
      properties: { crowdPct: s.crowdPct },
    })),
  });

  // Initialise map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: isDark
        ? 'mapbox://styles/mapbox/dark-v11'
        : 'mapbox://styles/mapbox/light-v11',
      center: CAIRO_CENTER,
      zoom: 11.5,
      pitch: 20,
    });

    map.on('load', () => {
      mapLoadedRef.current = true;

      map.addSource('spots-heat', {
        type: 'geojson',
        data: buildHeatFeatures(spots),
      });

      map.addLayer({
        id: 'spots-heatmap',
        type: 'heatmap',
        source: 'spots-heat',
        paint: {
          'heatmap-weight':    ['interpolate', ['linear'], ['get', 'crowdPct'], 0, 0, 100, 1],
          'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 10, 0.6, 15, 1.5],
          'heatmap-color': [
            'interpolate', ['linear'], ['heatmap-density'],
            0,   'rgba(0,0,0,0)',
            0.2, isDark ? 'rgba(74,158,107,0.5)'  : 'rgba(74,158,107,0.4)',
            0.5, isDark ? 'rgba(200,169,110,0.7)'  : 'rgba(200,169,110,0.6)',
            0.8, isDark ? 'rgba(208,106,80,0.85)'  : 'rgba(208,106,80,0.75)',
            1,   isDark ? 'rgba(255,69,0,0.9)'     : 'rgba(255,69,0,0.8)',
          ],
          'heatmap-radius':  ['interpolate', ['linear'], ['zoom'], 10, 20, 14, 50],
          'heatmap-opacity': 0.8,
        },
      });

      addMarkers(map, spots, selectedId, checkedInId);
    });

    mapRef.current = map;
    return () => {
      mapLoadedRef.current = false;
      map.remove();
      mapRef.current = null;
      removeAllMarkers();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // only once

  // Update heatmap source data reactively when spots change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoadedRef.current) return;
    const source = map.getSource('spots-heat');
    if (source) source.setData(buildHeatFeatures(spots));
  }, [spots]);

  // Update markers when spots/selection/checkin change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    addMarkers(map, spots, selectedId, checkedInId);
  }, [spots, selectedId, checkedInId, addMarkers]);

  // Fly to selected spot
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedId) return;
    const spot = spots.find((s) => s.id === selectedId);
    if (spot) map.flyTo({ center: [spot.lng, spot.lat], zoom: 14, duration: 800 });
  }, [selectedId, spots]);

  // Fly to user's location when Find Me is triggered
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !flyToTarget) return;
    map.flyTo({ center: [flyToTarget.lng, flyToTarget.lat], zoom: 15, duration: 1200 });
  }, [flyToTarget]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
  );
}
