import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTheme } from '../context/ThemeContext';
import { useStories } from '../context/StoriesContext';

const CAIRO_CENTER = [31.2357, 30.0444];

export default function MapView({ spots, selectedId, onSpotPress, checkedInId, flyToTarget }) {
  const { isDark } = useTheme();
  const { storiesBySpot } = useStories();
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerLayerRef = useRef(null);
  const userMarkerRef = useRef(null);
  const userPulseRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: [CAIRO_CENTER[1], CAIRO_CENTER[0]],
      zoom: 11.5,
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
    return () => {
      map.remove();
      mapRef.current = null;
      markerLayerRef.current = null;
      userMarkerRef.current = null;
      userPulseRef.current = null;
    };
  }, [isDark]);

  useEffect(() => {
    const map = mapRef.current;
    const layer = markerLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    spots.forEach((spot) => {
      const isSelected = spot.id === selectedId;
      const isCheckedIn = spot.id === checkedInId;
      const hasStories = (storiesBySpot[spot.id]?.length || 0) > 0;
      const radius = isSelected ? 11 : 8;
      const fill = isCheckedIn ? '#A78BFA' : (isDark ? '#A78BFA' : spot.color);

      // Heat-like halo
      L.circle([spot.lat, spot.lng], {
        radius: Math.max(40, (spot.crowdPct || 30) * 7),
        stroke: false,
        fillColor: fill,
        fillOpacity: 0.09,
        interactive: false,
      }).addTo(layer);

      // Gold story ring if spot has active stories
      if (hasStories) {
        L.circleMarker([spot.lat, spot.lng], {
          radius: radius + 5,
          color: '#C8A96E',
          weight: 2,
          fillColor: 'transparent',
          fillOpacity: 0,
          interactive: false,
        }).addTo(layer);
      }

      L.circleMarker([spot.lat, spot.lng], {
        radius,
        color: '#ffffff',
        weight: isSelected ? 3 : 2,
        fillColor: fill,
        fillOpacity: 1,
      }).on('click', () => onSpotPress(spot)).addTo(layer);
    });
  }, [spots, selectedId, checkedInId, onSpotPress, isDark, storiesBySpot]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedId) return;
    const spot = spots.find((s) => s.id === selectedId);
    if (spot) map.flyTo([spot.lat, spot.lng], 14, { duration: 0.8 });
  }, [selectedId, spots]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !flyToTarget) return;
    if (userMarkerRef.current) map.removeLayer(userMarkerRef.current);
    if (userPulseRef.current) map.removeLayer(userPulseRef.current);
    userMarkerRef.current = L.circleMarker([flyToTarget.lat, flyToTarget.lng], {
      radius: 7,
      color: '#ffffff',
      weight: 2,
      fillColor: '#3B82F6',
      fillOpacity: 1,
    }).addTo(map);
    userPulseRef.current = L.circle([flyToTarget.lat, flyToTarget.lng], {
      radius: 120,
      stroke: false,
      fillColor: '#3B82F6',
      fillOpacity: 0.12,
      interactive: false,
    }).addTo(map);
    map.flyTo([flyToTarget.lat, flyToTarget.lng], 15, { duration: 1.2 });
  }, [flyToTarget]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
  );
}
