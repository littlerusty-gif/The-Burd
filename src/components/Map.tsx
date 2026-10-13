import React, { useEffect, useRef } from 'react';
import * as LModule from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Safe namespace resolver to handle ESM/Vite bundling variance
const L: any = (LModule as any).default?.map ? (LModule as any).default : LModule;

const DEFAULT_CENTER: [number, number] = [39.8283, -98.5795];
const DEFAULT_ZOOM = 4;

export interface MapProps {
  center?: [number, number];
  zoom?: number;
  observations?: any[];
  hotspots?: any[];
  selectedItem?: any;
  onSelectItem?: (item: any) => void;
  corridors?: any[];
  onSelectCorridor?: (corridor: any) => void;
  showFlightPaths?: boolean;
  showDopplerRadar?: boolean;
  userLocation?: [number, number] | null;
  region?: any;
}

export function Map(props: MapProps) {
  // Safe destructuring of props with strict default fallbacks
  const {
    center = DEFAULT_CENTER,
    zoom = DEFAULT_ZOOM,
    observations = [],
    hotspots = [],
    selectedItem = null,
    onSelectItem,
    corridors = [],
    onSelectCorridor,
    showFlightPaths = true,
    showDopplerRadar = false,
    userLocation = null,
    region = null,
  } = props || {};

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const corridorsLayerRef = useRef<any>(null);
  const radarLayerRef = useRef<any>(null);
  const markerLookupRef = useRef<Map<string, any>>(new Map());

  // Safe coordinate checks
  const safeCenter: [number, number] = 
    region?.center && Array.isArray(region.center) && region.center.length === 2 && typeof region.center[0] === 'number'
      ? region.center
      : Array.isArray(center) && center.length === 2 && typeof center[0] === 'number'
      ? center
      : DEFAULT_CENTER;

  const safeZoom: number = 
    typeof zoom === 'number' && !isNaN(zoom) && zoom > 0
      ? zoom
      : region?.zoom && typeof region.zoom === 'number'
      ? region.zoom
      : DEFAULT_ZOOM;

  // 1. Strict Map Initialization with DOM ID cleanup & error handling
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Clear stale leaflet ID to prevent container reuse crashes
    try {
      (mapContainerRef.current as any)._leaflet_id = null;
    } catch (e) {}

    let map: any = null;
    try {
      map = L.map(mapContainerRef.current, {
        center: safeCenter,
        zoom: safeZoom,
        zoomControl: false,
      });

      const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
        crossOrigin: true,
      });

      tileLayer.on('tileerror', () => {});
      tileLayer.addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      corridorsLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;

      // Force layout invalidation after mount
      setTimeout(() => {
        try {
          map.invalidateSize();
        } catch (e) {}
      }, 150);
    } catch (err) {
      console.warn('Map initialization caught safely:', err);
    }

    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (e) {}
        mapInstanceRef.current = null;
      }
      if (mapContainerRef.current) {
        try {
          (mapContainerRef.current as any)._leaflet_id = null;
        } catch (e) {}
      }
    };
  }, []);

  // 2. ResizeObserver: Guard against zero-size dimensions or layout shifts
  useEffect(() => {
    if (!mapContainerRef.current || typeof ResizeObserver === 'undefined') return;

    let rafId: number | null = null;
    const observer = new ResizeObserver(() => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        if (mapInstanceRef.current) {
          try {
            mapInstanceRef.current.invalidateSize();
          } catch (e) {}
        }
      });
    });

    observer.observe(mapContainerRef.current);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, []);

  // Update center/zoom safely
  useEffect(() => {
    if (mapInstanceRef.current && safeCenter && Array.isArray(safeCenter) && safeCenter.length === 2) {
      try {
        mapInstanceRef.current.setView(safeCenter, safeZoom);
      } catch (e) {}
    }
  }, [safeCenter, safeZoom]);

  // Doppler Radar Overlay
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (radarLayerRef.current) {
      try {
        map.removeLayer(radarLayerRef.current);
      } catch (e) {}
      radarLayerRef.current = null;
    }

    if (showDopplerRadar) {
      try {
        const radarLayer = L.tileLayer(
          'https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913/{z}/{x}/{y}.png',
          {
            opacity: 0.65,
            maxZoom: 19,
            attribution: 'Doppler Radar &copy; IEM / NOAA',
            zIndex: 5,
          }
        );
        radarLayer.addTo(map);
        radarLayerRef.current = radarLayer;
      } catch (e) {}
    }
  }, [showDopplerRadar]);

  // Render Flight Corridors safely
  useEffect(() => {
    const layer = corridorsLayerRef.current;
    if (!layer || !mapInstanceRef.current) return;
    layer.clearLayers();

    if (!showFlightPaths || !Array.isArray(corridors) || corridors.length === 0) return;

    corridors.forEach((c) => {
      if (!c || !Array.isArray(c.coordinates) || c.coordinates.length < 2) return;
      try {
        const polyline = L.polyline(c.coordinates, {
          color: c.color || '#38bdf8',
          weight: 4,
          opacity: 0.85,
        });

        if (onSelectCorridor) {
          polyline.on('click', () => onSelectCorridor(c));
        }
        polyline.bindTooltip(`<b>${c.name || 'Flight Vector'}</b><br/>${c.corridorName || ''}`);
        layer.addLayer(polyline);

        const endPoint = c.coordinates[c.coordinates.length - 1];
        if (Array.isArray(endPoint) && typeof endPoint[0] === 'number') {
          const birdIcon = L.divIcon({
            className: 'bird-end-icon',
            html: `<div style="background: rgba(15,23,42,0.9); border: 2px solid ${c.color || '#38bdf8'}; border-radius: 9999px; padding: 2px 6px; font-size: 11px; color: ${c.color || '#38bdf8'}; font-weight: bold;">➢ 🪶</div>`,
            iconSize: [36, 24],
            iconAnchor: [18, 12],
          });
          const marker = L.marker(endPoint, { icon: birdIcon });
          marker.bindPopup(`<b>${c.name || 'Flight Vector'}</b><br/>👥 ~${c.estFlockSize?.toLocaleString() || '10,000'} birds`);
          if (onSelectCorridor) {
            marker.on('click', () => onSelectCorridor(c));
          }
          layer.addLayer(marker);
        }
      } catch (e) {}
    });
  }, [showFlightPaths, corridors, onSelectCorridor]);

  // Render Markers (Observations & Hotspots) using Factory Functions
  useEffect(() => {
    const layer = markersLayerRef.current;
    if (!layer || !mapInstanceRef.current) return;

    layer.clearLayers();
    markerLookupRef.current.clear();

    const safeObsList = Array.isArray(observations) ? observations : [];
    const safeHotspotList = Array.isArray(hotspots) ? hotspots : [];

    // Hotspots
    safeHotspotList.slice(0, 80).forEach((spot) => {
      if (!spot || typeof spot.lat !== 'number' || typeof spot.lng !== 'number') return;
      try {
        const icon = L.divIcon({
          className: 'hotspot-pin',
          html: `<div style="width: 24px; height: 24px; border-radius: 50%; background: #059669; border: 2px solid white; display: flex; align-items: center; justify-content: center; font-size: 11px; box-shadow: 0 2px 6px rgba(0,0,0,0.5);">📍</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });
        const marker = L.marker([spot.lat, spot.lng], { icon });
        marker.bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; color: #1e293b;">
            <strong style="font-size: 13px;">${spot.locName || 'Hotspot'}</strong><br/>
            <span style="color: #059669; font-weight: bold;">📊 ${spot.numSpeciesAllTime || 0} species recorded</span>
          </div>
        `);
        if (onSelectItem) {
          marker.on('click', () => onSelectItem(spot));
        }
        layer.addLayer(marker);
        if (spot.locId) {
          markerLookupRef.current.set(spot.locId, marker);
        }
      } catch (e) {}
    });

    // Observations
    safeObsList.slice(0, 100).forEach((obs) => {
      if (!obs || typeof obs.lat !== 'number' || typeof obs.lng !== 'number') return;
      try {
        const count = obs.howMany || 1;
        const isRoost = obs.isCrowRoost || count >= 250;
        const bgColor = isRoost ? '#ef4444' : count > 50 ? '#f97316' : '#0d9488';
        const size = isRoost ? 30 : 26;

        const icon = L.divIcon({
          className: 'obs-pin',
          html: `
            <div style="width: ${size}px; height: ${size}px; border-radius: 50%; background: ${bgColor}; border: 2px solid white; display: flex; align-items: center; justify-content: center; font-family: monospace; font-size: 10px; font-weight: bold; color: white; box-shadow: 0 3px 8px rgba(0,0,0,0.5);">
              ${count > 999 ? (count / 1000).toFixed(1) + 'k' : count}
            </div>
          `,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });

        const marker = L.marker([obs.lat, obs.lng], { icon });
        marker.bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; color: #0f172a; min-width: 200px;">
            <strong style="font-size: 13px;">${obs.comName || 'Bird'}</strong><br/>
            <span style="font-size: 10px; color: #64748b; font-style: italic;">${obs.sciName || ''}</span>
            <div style="margin: 4px 0; color: ${bgColor}; font-weight: bold;">
              ${count > 1 ? count.toLocaleString() + ' birds' : '1 bird observed'}
            </div>
            <div style="color: #475569; font-size: 11px;">📍 ${obs.locName || 'Field Location'}</div>
            <div style="color: #94a3b8; font-size: 10px; margin-top: 2px;">🕒 ${obs.obsDt || 'Recent'}</div>
          </div>
        `);

        if (onSelectItem) {
          marker.on('click', () => onSelectItem(obs));
        }

        layer.addLayer(marker);
        if (obs.id) {
          markerLookupRef.current.set(obs.id, marker);
        }
      } catch (e) {}
    });
  }, [observations, hotspots, onSelectItem]);

  // Smooth Fly to selected item
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedItem) return;

    if (typeof selectedItem.lat === 'number' && typeof selectedItem.lng === 'number') {
      try {
        map.flyTo([selectedItem.lat, selectedItem.lng], Math.max(map.getZoom(), 14), {
          duration: 1.0,
        });

        const id = selectedItem.id || selectedItem.locId;
        if (id) {
          setTimeout(() => {
            try {
              const marker = markerLookupRef.current.get(id);
              marker?.openPopup();
            } catch (e) {}
          }, 400);
        }
      } catch (e) {}
    }
  }, [selectedItem]);

  return (
    <div 
      style={{ position: 'relative', width: '100%', height: '100%', flex: 1, overflow: 'hidden' }}
      className="w-full h-full min-h-0 relative flex-1"
    >
      <div 
        ref={mapContainerRef} 
        style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, zIndex: 0 }} 
      />
    </div>
  );
}

export default Map;
