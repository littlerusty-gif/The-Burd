import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Observation, Hotspot, FlightCorridor, RegionConfig } from '../types/bird';
import { getFlightPathForRoost, generateProceduralFlightPath } from '../data/roosts';
import {
  Layers,
  Compass,
  Sun,
  Moon,
  Info,
  ZoomIn,
  ZoomOut,
  Navigation,
  Crosshair,
  X,
  Flame,
  Wind,
  MapPin,
  Clock,
  ChevronDown,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';

export interface MapProps {
  observations?: Observation[];
  hotspots?: Hotspot[];
  selectedItem?: Observation | Hotspot | null;
  onSelectItem?: (item: Observation | Hotspot) => void;
  corridors?: FlightCorridor[];
  selectedCorridor?: FlightCorridor | null;
  onSelectCorridor?: (corridor: FlightCorridor | null) => void;
  region?: RegionConfig | null;
  activeRegion?: string;
  center?: [number, number];
  zoom?: number;
  userLocation?: [number, number] | null;
  onLocateMe?: () => void;
  isLocating?: boolean;
  showFlightPaths?: boolean;
  showDopplerRadar?: boolean;
  pinnedMeetup?: any;
}

const DEFAULT_CENTER: [number, number] = [39.8283, -98.5795]; // Geographic US Center
const DEFAULT_ZOOM = 4;

export type BasemapType = 'terrain' | 'satellite' | 'streets' | 'dark';

export interface BasemapOption {
  id: BasemapType;
  name: string;
  icon: string;
  url: string;
  subdomains: string[];
  maxZoom: number;
  attribution: string;
}

const BASEMAP_CONFIGS: Record<BasemapType, BasemapOption> = {
  terrain: {
    id: 'terrain',
    name: 'Google Terrain',
    icon: '🏔️',
    url: 'https://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    maxZoom: 20,
    attribution: 'Map data &copy; <a href="https://maps.google.com" target="_blank" rel="noreferrer">Google</a>',
  },
  satellite: {
    id: 'satellite',
    name: 'Google Satellite',
    icon: '🛰️',
    url: 'https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    maxZoom: 20,
    attribution: 'Imagery &copy; <a href="https://maps.google.com" target="_blank" rel="noreferrer">Google</a>',
  },
  streets: {
    id: 'streets',
    name: 'Google Streets',
    icon: '🗺️',
    url: 'https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    maxZoom: 20,
    attribution: 'Map data &copy; <a href="https://maps.google.com" target="_blank" rel="noreferrer">Google</a>',
  },
  dark: {
    id: 'dark',
    name: 'Dark Explorer',
    icon: '🌙',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    subdomains: ['a', 'b', 'c', 'd'],
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
  },
};

function escapeHtml(str: string = ''): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Calculates initial bearing in degrees from point 1 to point 2
 */
function getBearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(dLng);
  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

function getCompassDirection(deg: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(deg / 22.5) % 16;
  return directions[index];
}

/**
 * Calculates solar sunset time & current roost activity window for given coordinates
 */
function getSunAndRoostStatus(lat: number = 45.52, lng: number = -122.68) {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - startOfYear.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

  // Solar declination estimate
  const declination = 23.45 * Math.sin(((284 + dayOfYear) * 2 * Math.PI) / 365);
  const latRad = (lat * Math.PI) / 180;
  const decRad = (declination * Math.PI) / 180;

  let cosHourAngle = -Math.tan(latRad) * Math.tan(decRad);
  cosHourAngle = Math.max(-1, Math.min(1, cosHourAngle));
  const hourAngle = (Math.acos(cosHourAngle) * 180) / Math.PI;

  const sunsetHourSolar = 12 + hourAngle / 15;
  const tzOffsetHours = -now.getTimezoneOffset() / 60;
  const lngHours = lng / 15;
  const localSunsetDecimal = sunsetHourSolar - lngHours + tzOffsetHours;

  const sunsetHours = Math.floor(localSunsetDecimal);
  const sunsetMinutes = Math.floor((localSunsetDecimal - sunsetHours) * 60);

  const sunsetTime = new Date();
  sunsetTime.setHours(sunsetHours, sunsetMinutes, 0, 0);

  const diffMinutes = Math.round((sunsetTime.getTime() - now.getTime()) / 60000);

  const formatTime = (h: number, m: number) => {
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 || 12;
    const displayM = m < 10 ? `0${m}` : m;
    return `${displayH}:${displayM} ${period}`;
  };

  const sunsetStr = formatTime(sunsetHours, sunsetMinutes);

  let phase = 'Daytime Foraging';
  let phaseColor = '#38bdf8';
  let badgeText = 'DAYTIME FORAGING';
  let description = 'Birds are dispersed feeding throughout regional foraging grounds.';

  if (diffMinutes > 45 && diffMinutes <= 90) {
    phase = 'Early Pre-Roost Gathering';
    phaseColor = '#f59e0b';
    badgeText = 'PRE-ROOST STAGING';
    description = 'Flocks beginning staging in local trees and greenbelts.';
  } else if (diffMinutes > 15 && diffMinutes <= 45) {
    phase = 'Active Pre-Roost Staging';
    phaseColor = '#fb923c';
    badgeText = 'ROOFTOP STAGING ACTIVE';
    description = 'High bird density gathering on rooftops, bridges & powerlines before departure.';
  } else if (diffMinutes >= -25 && diffMinutes <= 15) {
    phase = 'Peak Flyway Transit';
    phaseColor = '#ef4444';
    badgeText = '🔥 PEAK ROOST TRANSIT';
    description = 'Intense directional streams flying along corridors directly into night roosts!';
  } else if (diffMinutes >= -65 && diffMinutes < -25) {
    phase = 'Roost Canopy Settling';
    phaseColor = '#a855f7';
    badgeText = 'CANOPY SETTLING';
    description = 'Massive swirling vortex settling into roost tree canopy for the night.';
  } else if (diffMinutes < -65 || diffMinutes > 720) {
    phase = 'Night Roost Dormancy';
    phaseColor = '#94a3b8';
    badgeText = 'ROOST ASLEEP';
    description = 'Flocks quietly roosting in canopy until dawn dispersal.';
  }

  return {
    sunsetStr,
    phase,
    phaseColor,
    badgeText,
    description,
    minutesToSunset: diffMinutes,
  };
}

export const Map: React.FC<MapProps> = ({
  observations = [],
  hotspots = [],
  selectedItem = null,
  onSelectItem,
  corridors = [],
  selectedCorridor = null,
  onSelectCorridor,
  region = null,
  center,
  zoom,
  userLocation = null,
  onLocateMe,
  isLocating = false,
  showFlightPaths = true,
  showDopplerRadar = false,
  pinnedMeetup = null,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const baseTileLayerRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const corridorsLayerRef = useRef<any>(null);
  const userGpsLayerRef = useRef<any>(null);
  const meetupLayerRef = useRef<any>(null);
  const radarLayerRef = useRef<any>(null);

  // Basemap & Interactive Map Controls State
  const [selectedBasemap, setSelectedBasemap] = useState<BasemapType>('terrain');
  const [isBasemapMenuOpen, setIsBasemapMenuOpen] = useState(false);
  const [quickFilter, setQuickFilter] = useState<'all' | 'flocks' | 'megaroosts' | 'corridors' | 'hotspots'>('all');
  const [showLegend, setShowLegend] = useState(true);
  const [showSunClockModal, setShowSunClockModal] = useState(false);

  // Interaction & recursion guards
  const isProgrammaticMoveRef = useRef<boolean>(false);
  const isUserInteractingRef = useRef<boolean>(false);
  const prevCenterRef = useRef<{ lat: number; lng: number } | null>(null);
  const prevZoomRef = useRef<number | null>(null);
  const markerLookupRef = useRef<globalThis.Map<string, any>>(new globalThis.Map());

  // Derive primitive scalar coordinate values for region
  const targetLat = typeof region?.center?.[0] === 'number' ? region.center[0] : (center?.[0] ?? DEFAULT_CENTER[0]);
  const targetLng = typeof region?.center?.[1] === 'number' ? region.center[1] : (center?.[1] ?? DEFAULT_CENTER[1]);
  const targetZoom = typeof region?.zoom === 'number' ? region.zoom : (typeof zoom === 'number' ? zoom : DEFAULT_ZOOM);

  // Sun & Roost Activity Information for current region
  const sunStatus = useMemo(() => {
    return getSunAndRoostStatus(targetLat, targetLng);
  }, [targetLat, targetLng]);

  // Merge prop corridors with flight paths for all rendered roosts
  // If a roost does not have an explicit telemetry track, procedurally generate a feeder corridor polyline
  const effectiveCorridors = useMemo(() => {
    const list = Array.isArray(corridors) ? [...corridors] : [];
    const registeredRoostIds = new Set<string>();
    list.forEach((c) => {
      if (c.roostId) registeredRoostIds.add(c.roostId);
      if (c.id) registeredRoostIds.add(c.id.replace('corridor-', ''));
    });

    const safeObs = Array.isArray(observations) ? observations : [];
    safeObs.forEach((obs) => {
      const isRoost = obs.isCrowRoost || (typeof obs.howMany === 'number' && obs.howMany >= 250) || (obs.id && obs.id.startsWith('roost-'));
      if (isRoost) {
        const roostId = obs.id?.replace('ROOST_', '') || obs.id;
        const hasTrack =
          registeredRoostIds.has(roostId) ||
          list.some((c) => {
            if (c.roostId === roostId || c.id === `corridor-${roostId}`) return true;
            if (c.roostCoords) {
              return Math.abs(c.roostCoords[0] - obs.lat) < 0.03 && Math.abs(c.roostCoords[1] - obs.lng) < 0.03;
            }
            return false;
          });

        if (!hasTrack) {
          const feederTrack = getFlightPathForRoost(obs);
          list.push(feederTrack);
          registeredRoostIds.add(roostId);
        }
      }
    });

    return list;
  }, [corridors, observations]);

  // 1. Strict Mode Safe Initialization
  useEffect(() => {
    if (!mapContainerRef.current) return;
    const container = mapContainerRef.current;

    // React 18/19 Strict Mode: Clean previous instance before re-initializing
    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.remove();
      } catch (e) {}
      mapInstanceRef.current = null;
    }

    if ((container as any)._leaflet_id) {
      (container as any)._leaflet_id = null;
    }

    const L = (window as any).L;
    if (!L) return;

    try {
      const map = L.map(container, {
        center: [targetLat, targetLng],
        zoom: targetZoom,
        zoomControl: false,
        attributionControl: true,
      });

      // Default Basemap: Google Terrain / Free Google Tiles
      const config = BASEMAP_CONFIGS[selectedBasemap];
      const baseTile = L.tileLayer(config.url, {
        maxZoom: config.maxZoom,
        attribution: config.attribution,
        subdomains: config.subdomains,
        crossOrigin: true,
      }).addTo(map);
      baseTileLayerRef.current = baseTile;

      // Dedicated layer groups stored in refs
      corridorsLayerRef.current = L.layerGroup().addTo(map);
      markersLayerRef.current = L.layerGroup().addTo(map);
      userGpsLayerRef.current = L.layerGroup().addTo(map);
      meetupLayerRef.current = L.layerGroup().addTo(map);

      // Flag-guarded Leaflet events: NEVER call React state setters that would re-trigger setView/flyTo
      map.on('movestart', () => {
        if (!isProgrammaticMoveRef.current) {
          isUserInteractingRef.current = true;
        }
      });

      map.on('moveend', () => {
        isProgrammaticMoveRef.current = false;
        isUserInteractingRef.current = false;
      });

      mapInstanceRef.current = map;
      prevCenterRef.current = { lat: targetLat, lng: targetLng };
      prevZoomRef.current = targetZoom;

      // Invalidate layout after paint
      setTimeout(() => {
        try {
          map.invalidateSize();
        } catch (e) {}
      }, 150);
    } catch (err) {
      console.warn('Map initialization error safely handled:', err);
    }

    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (e) {}
        mapInstanceRef.current = null;
      }
      if (container) {
        (container as any)._leaflet_id = null;
      }
    };
  }, []); // Mount-only initialization to protect Strict Mode

  // 2. Basemap Switcher Effect (Free Google Tiles: Terrain, Satellite, Streets, Dark)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const L = (window as any).L;
    if (!map || !L) return;

    const config = BASEMAP_CONFIGS[selectedBasemap];
    if (!config) return;

    if (baseTileLayerRef.current) {
      try {
        map.removeLayer(baseTileLayerRef.current);
      } catch (e) {}
      baseTileLayerRef.current = null;
    }

    try {
      const newBaseTile = L.tileLayer(config.url, {
        maxZoom: config.maxZoom,
        attribution: config.attribution,
        subdomains: config.subdomains,
        crossOrigin: true,
      });

      // Insert at the bottom
      newBaseTile.addTo(map);
      if (typeof newBaseTile.bringToBack === 'function') {
        newBaseTile.bringToBack();
      }
      baseTileLayerRef.current = newBaseTile;
    } catch (err) {
      console.warn('Failed to switch basemap:', err);
    }
  }, [selectedBasemap]);

  // 3. Window / Container Resize Observer
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

  // 4. Region Camera Navigation guarded against recursion
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const prev = prevCenterRef.current;
    const prevZ = prevZoomRef.current;

    // Check if coordinates or zoom actually changed
    if (prev && Math.abs(prev.lat - targetLat) < 0.0001 && Math.abs(prev.lng - targetLng) < 0.0001 && prevZ === targetZoom) {
      return;
    }

    prevCenterRef.current = { lat: targetLat, lng: targetLng };
    prevZoomRef.current = targetZoom;

    isProgrammaticMoveRef.current = true;
    try {
      if (region?.bounds && Array.isArray(region.bounds) && region.bounds.length === 2) {
        map.fitBounds(region.bounds, { padding: [24, 24], maxZoom: targetZoom });
      } else {
        map.setView([targetLat, targetLng], targetZoom, { animate: false });
      }
    } catch (e) {}
  }, [targetLat, targetLng, targetZoom, region?.bounds]);

  // 5. Smooth FlyTo Selected Item (Guarded against recursion)
  const selectedLat = selectedItem?.lat;
  const selectedLng = selectedItem?.lng;
  const selectedId = (selectedItem as any)?.id || (selectedItem as any)?.locId;

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || typeof selectedLat !== 'number' || typeof selectedLng !== 'number') return;

    isProgrammaticMoveRef.current = true;
    try {
      const currentZoom = map.getZoom();
      const targetZ = Math.max(currentZoom, 13);
      map.flyTo([selectedLat, selectedLng], targetZ, {
        duration: 0.8,
        easeLinearity: 0.25,
      });

      if (selectedId) {
        setTimeout(() => {
          try {
            const marker = markerLookupRef.current.get(selectedId);
            marker?.openPopup();
          } catch (e) {}
        }, 350);
      }
    } catch (e) {}
  }, [selectedLat, selectedLng, selectedId]);

  // 6. FlyTo Selected Corridor
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedCorridor || !Array.isArray(selectedCorridor.coordinates) || selectedCorridor.coordinates.length < 2) return;

    isProgrammaticMoveRef.current = true;
    try {
      const L = (window as any).L;
      if (L) {
        const bounds = L.latLngBounds(selectedCorridor.coordinates);
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });
      }
    } catch (e) {}
  }, [selectedCorridor]);

  // 7. GPS User Location Marker
  const userLat = userLocation?.[0];
  const userLng = userLocation?.[1];

  useEffect(() => {
    const L = (window as any).L;
    const layer = userGpsLayerRef.current;
    if (!L || !layer) return;

    layer.clearLayers();

    if (typeof userLat === 'number' && typeof userLng === 'number') {
      try {
        const gpsIcon = L.divIcon({
          className: 'user-gps-pulse',
          html: `
            <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 30px; height: 30px;">
              <span style="position: absolute; width: 30px; height: 30px; border-radius: 50%; background: #0ea5e9; opacity: 0.6; animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
              <span style="position: relative; width: 15px; height: 15px; border-radius: 50%; background: #0284c7; border: 2.5px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.7);"></span>
            </div>
          `,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        });

        const marker = L.marker([userLat, userLng], { icon: gpsIcon });
        marker.bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; color: #0f172a; padding: 4px;">
            <strong style="color: #0284c7; font-size: 13px;">📍 Your Location</strong><br/>
            <span style="color: #475569; font-size: 11px;">Active birding GPS proximity zone</span>
          </div>
        `);
        layer.addLayer(marker);
      } catch (e) {}
    }
  }, [userLat, userLng]);

  // 8. Pinned Community Meetup Marker
  useEffect(() => {
    const L = (window as any).L;
    const layer = meetupLayerRef.current;
    if (!L || !layer) return;

    layer.clearLayers();

    if (pinnedMeetup && typeof pinnedMeetup.lat === 'number' && typeof pinnedMeetup.lng === 'number') {
      try {
        const icon = L.divIcon({
          className: 'meetup-pin',
          html: `<div style="width: 32px; height: 32px; border-radius: 50%; background: #10b981; border: 2.5px solid white; display: flex; align-items: center; justify-content: center; font-size: 15px; box-shadow: 0 4px 10px rgba(0,0,0,0.6);">🤝</div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });
        const marker = L.marker([pinnedMeetup.lat, pinnedMeetup.lng], { icon });
        marker.bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; color: #0f172a; padding: 4px;">
            <strong style="color: #059669; font-size: 13px;">Field Meetup</strong><br/>
            <b>${escapeHtml(pinnedMeetup.locationName)}</b><br/>
            <span style="color: #475569;">📅 ${escapeHtml(pinnedMeetup.dateTime)}</span>
          </div>
        `);
        layer.addLayer(marker);
      } catch (e) {}
    }
  }, [pinnedMeetup]);

  // 9. Radar Overlay
  useEffect(() => {
    const map = mapInstanceRef.current;
    const L = (window as any).L;
    if (!map || !L) return;

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
            opacity: 0.6,
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

  // 10. FLIGHT CORRIDORS WITH HIGH-VISIBILITY DIRECTION ARROWS FOR ALL ROOSTS
  useEffect(() => {
    const layer = corridorsLayerRef.current;
    const L = (window as any).L;
    if (!layer || !L) return;

    layer.clearLayers();

    if (!showFlightPaths || !Array.isArray(effectiveCorridors) || effectiveCorridors.length === 0) return;
    if (quickFilter === 'megaroosts' || quickFilter === 'hotspots') return;

    effectiveCorridors.forEach((c) => {
      if (!c || !Array.isArray(c.coordinates) || c.coordinates.length < 2) return;

      const isSelected =
        selectedCorridor?.id === c.id ||
        (selectedCorridor?.roostId && selectedCorridor.roostId === c.roostId) ||
        (selectedItem && (
          c.roostId === (selectedItem as any).id ||
          c.id === (selectedItem as any).id ||
          c.id === `corridor-${(selectedItem as any).id}` ||
          (c.roostCoords && Math.abs(c.roostCoords[0] - Number(selectedItem.lat)) < 0.025 && Math.abs(c.roostCoords[1] - Number(selectedItem.lng)) < 0.025)
        ));

      const corridorColor = c.color || '#38bdf8';

      try {
        // Glowing aura behind highlighted selected corridor
        if (isSelected) {
          const glowPolyline = L.polyline(c.coordinates, {
            color: corridorColor,
            weight: 12,
            opacity: 0.4,
            lineCap: 'round',
            lineJoin: 'round',
          });
          layer.addLayer(glowPolyline);
        }

        // High-contrast background polyline (outer shadow)
        const bgPolyline = L.polyline(c.coordinates, {
          color: '#020617',
          weight: isSelected ? 9 : 6,
          opacity: 0.9,
          lineCap: 'round',
          lineJoin: 'round',
        });
        layer.addLayer(bgPolyline);

        // Main colored corridor polyline
        const mainPolyline = L.polyline(c.coordinates, {
          color: corridorColor,
          weight: isSelected ? 5.5 : 3.5,
          opacity: 1,
          dashArray: isSelected ? undefined : '8, 6',
          lineCap: 'round',
          lineJoin: 'round',
        });

        const tooltipContent = `
          <div style="font-family: sans-serif; font-size: 12px; line-height: 1.4;">
            <div style="font-weight: 800; font-size: 13px; color: #f8fafc; margin-bottom: 2px;">
              🛫 ${escapeHtml(c.name)}
            </div>
            <div style="color: ${corridorColor}; font-weight: bold; font-size: 11px;">
              Heading: ${getCompassDirection(c.headingDeg || 0)} (${c.headingDeg || 0}°) &bull; ~${(c.estFlockSize || 10000).toLocaleString()} birds
            </div>
            <div style="color: #94a3b8; font-size: 10px; margin-top: 2px;">
              🕒 ${escapeHtml(c.timeWindow || 'Dusk Window')}
            </div>
          </div>
        `;
        mainPolyline.bindTooltip(tooltipContent, { className: 'leaflet-bird-tooltip', sticky: true });

        if (onSelectCorridor) {
          mainPolyline.on('click', () => onSelectCorridor(c));
          bgPolyline.on('click', () => onSelectCorridor(c));
        }
        layer.addLayer(mainPolyline);

        // DIRECTIONAL ARROW MARKERS ALONG THE PATH:
        // Places crisp, rotated directional navigation arrows along each segment
        for (let i = 0; i < c.coordinates.length - 1; i++) {
          const p1 = c.coordinates[i];
          const p2 = c.coordinates[i + 1];

          if (Array.isArray(p1) && Array.isArray(p2)) {
            const bearing = getBearing(p1[0], p1[1], p2[0], p2[1]);
            const midLat = (p1[0] + p2[0]) / 2;
            const midLng = (p1[1] + p2[1]) / 2;

            const arrowIcon = L.divIcon({
              className: 'corridor-arrow-marker',
              html: `
                <div style="transform: rotate(${Math.round(bearing)}deg); display: flex; align-items: center; justify-content: center; width: ${isSelected ? 28 : 22}px; height: ${isSelected ? 28 : 22}px; pointer-events: none;">
                  <svg width="${isSelected ? 24 : 18}" height="${isSelected ? 24 : 18}" viewBox="0 0 24 24" fill="none" style="filter: drop-shadow(0 2px 5px rgba(0,0,0,0.9)) ${isSelected ? `drop-shadow(0 0 6px ${corridorColor})` : ''};">
                    <path d="M12 2 L21 20 L12 16 L3 20 Z" fill="${corridorColor}" stroke="${isSelected ? '#ffffff' : '#0f172a'}" stroke-width="${isSelected ? 2.5 : 2}" stroke-linejoin="round" />
                  </svg>
                </div>
              `,
              iconSize: [isSelected ? 28 : 22, isSelected ? 28 : 22],
              iconAnchor: [isSelected ? 14 : 11, isSelected ? 14 : 11],
            });

            const arrowMarker = L.marker([midLat, midLng], {
              icon: arrowIcon,
              interactive: true,
            });
            if (onSelectCorridor) {
              arrowMarker.on('click', () => onSelectCorridor(c));
            }
            arrowMarker.bindTooltip(tooltipContent, { className: 'leaflet-bird-tooltip' });
            layer.addLayer(arrowMarker);
          }
        }

        // START POINT: Staging Area Marker (Flyway Origin)
        const startPoint = c.coordinates[0];
        if (Array.isArray(startPoint) && typeof startPoint[0] === 'number') {
          const stagingIcon = L.divIcon({
            className: 'corridor-origin-icon',
            html: `
              <div style="display: flex; align-items: center; gap: 5px; background: rgba(15,23,42,0.96); border: ${isSelected ? '2.5px solid #34d399' : '2px solid #10b981'}; border-radius: 9999px; padding: 2px 8px; font-family: sans-serif; font-size: 10px; font-weight: 800; color: #10b981; box-shadow: ${isSelected ? '0 0 16px rgba(16,185,129,0.9)' : '0 4px 10px rgba(0,0,0,0.8)'}; white-space: nowrap;">
                <span style="position: relative; width: 8px; height: 8px; border-radius: 50%; background: #10b981; display: inline-block;">
                  ${isSelected ? '<span style="position: absolute; inset: -4px; border-radius: 50%; background: #10b981; opacity: 0.6; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>' : ''}
                </span>
                <span>STAGING ➔</span>
              </div>
            `,
            iconSize: [80, 24],
            iconAnchor: [40, 12],
          });
          const startMarker = L.marker(startPoint, { icon: stagingIcon });
          if (onSelectCorridor) {
            startMarker.on('click', () => onSelectCorridor(c));
          }
          startMarker.bindTooltip(`<b>Staging Origin:</b> Birds congregate here before flying ${c.heading || 'to roost'}.`, {
            className: 'leaflet-bird-tooltip',
          });
          layer.addLayer(startMarker);
        }

        // END POINT: Night Roost Destination Marker
        const endPoint = c.coordinates[c.coordinates.length - 1];
        if (Array.isArray(endPoint) && typeof endPoint[0] === 'number') {
          const roostIcon = L.divIcon({
            className: 'corridor-destination-icon',
            html: `
              <div style="display: flex; align-items: center; gap: 4px; background: rgba(15,23,42,0.96); border: ${isSelected ? '2.5px solid #fbbf24' : `2px solid ${corridorColor}`}; border-radius: 9999px; padding: 2px 8px; font-family: sans-serif; font-size: 11px; font-weight: 800; color: #f8fafc; box-shadow: ${isSelected ? '0 0 16px rgba(251,191,36,0.9)' : '0 4px 12px rgba(0,0,0,0.8)'}; white-space: nowrap;">
                <span>🌙 ROOST</span>
                <span style="color: ${corridorColor}; font-family: monospace;">~${(c.estFlockSize || 10000).toLocaleString()}</span>
              </div>
            `,
            iconSize: [88, 26],
            iconAnchor: [44, 13],
          });
          const endMarker = L.marker(endPoint, { icon: roostIcon });
          if (onSelectCorridor) {
            endMarker.on('click', () => onSelectCorridor(c));
          }
          endMarker.bindTooltip(`<b>Night Roost:</b> ${escapeHtml(c.name)} (~${(c.estFlockSize || 10000).toLocaleString()} birds)`, {
            className: 'leaflet-bird-tooltip',
          });
          layer.addLayer(endMarker);
        }
      } catch (e) {}
    });
  }, [showFlightPaths, effectiveCorridors, selectedCorridor, selectedItem, onSelectCorridor, quickFilter]);

  // 11. ROOSTS & SIGHTINGS MARKERS WITH BIRD COUNT TIERS
  useEffect(() => {
    const layer = markersLayerRef.current;
    const L = (window as any).L;
    if (!layer || !L) return;

    layer.clearLayers();
    markerLookupRef.current.clear();

    const safeObsList = Array.isArray(observations) ? observations : [];
    const safeHotspots = Array.isArray(hotspots) ? hotspots : [];

    // Filter observations based on Quick Filter
    let filteredObs = safeObsList;
    if (quickFilter === 'flocks') {
      filteredObs = safeObsList.filter((o) => (o.howMany || 1) >= 50);
    } else if (quickFilter === 'megaroosts') {
      filteredObs = safeObsList.filter((o) => o.isCrowRoost || (o.howMany || 1) >= 250);
    } else if (quickFilter === 'hotspots') {
      filteredObs = [];
    }

    // Render Hotspots (if not filtering exclusively for birds/roosts)
    if (quickFilter === 'all' || quickFilter === 'hotspots') {
      safeHotspots.slice(0, 80).forEach((spot) => {
        if (!spot || typeof spot.lat !== 'number' || typeof spot.lng !== 'number') return;
        try {
          const icon = L.divIcon({
            className: 'hotspot-pin',
            html: `
              <div style="width: 26px; height: 26px; border-radius: 50%; background: #059669; border: 2.5px solid white; display: flex; align-items: center; justify-content: center; font-size: 13px; box-shadow: 0 3px 8px rgba(0,0,0,0.6); transition: transform 0.15s ease;" title="${escapeHtml(spot.locName)}">
                📍
              </div>
            `,
            iconSize: [26, 26],
            iconAnchor: [13, 13],
          });
          const marker = L.marker([spot.lat, spot.lng], { icon });
          marker.bindPopup(`
            <div style="font-family: sans-serif; font-size: 12px; color: #0f172a; padding: 4px; min-width: 180px;">
              <div style="font-size: 10px; uppercase; font-weight: 800; color: #059669; letter-spacing: 0.5px; margin-bottom: 2px;">EBIRD HOTSPOT</div>
              <strong style="font-size: 13px; color: #0f172a; display: block; margin-bottom: 4px;">${escapeHtml(spot.locName)}</strong>
              <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 6px; padding: 4px 8px; font-weight: bold; color: #065f46; font-size: 11px; margin-bottom: 4px;">
                📊 ${spot.numSpeciesAllTime || 0} Species Documented
              </div>
              ${spot.latestObsDt ? `<div style="color: #64748b; font-size: 10px;">🕒 Recent record: ${escapeHtml(spot.latestObsDt)}</div>` : ''}
            </div>
          `);

          if (onSelectItem) {
            marker.on('click', () => {
              onSelectItem({
                locId: spot.locId,
                locName: spot.locName,
                lat: spot.lat,
                lng: spot.lng,
                numSpeciesAllTime: spot.numSpeciesAllTime,
                latestObsDt: spot.latestObsDt,
              });
            });
          }
          layer.addLayer(marker);
          if (spot.locId) {
            markerLookupRef.current.set(spot.locId, marker);
          }
        } catch (e) {}
      });
    }

    // Render Observations with Color-Coded Bird Count Tiers & Roost Highlights
    filteredObs.slice(0, 150).forEach((obs) => {
      if (!obs || typeof obs.lat !== 'number' || typeof obs.lng !== 'number') return;
      try {
        const count = obs.howMany || 1;
        const isRoost = obs.isCrowRoost || count >= 250;

        // Count tiering colors & dimensions
        let bgColor = '#10b981'; // 1-9 Single / Small
        let borderColor = '#ffffff';
        let badgeSize = 26;
        let tierLabel = 'SIGHTING';

        if (isRoost) {
          bgColor = '#dc2626'; // Mega-Roost (Crimson)
          borderColor = '#fbbf24'; // Gold border
          badgeSize = 34;
          tierLabel = 'MEGA-ROOST';
        } else if (count >= 50) {
          bgColor = '#f59e0b'; // Large Flock (Amber)
          badgeSize = 30;
          tierLabel = 'LARGE FLOCK';
        } else if (count >= 10) {
          bgColor = '#059669'; // Active Group (Emerald)
          badgeSize = 28;
          tierLabel = 'GROUP';
        }

        const formattedCount = count > 9999 ? (count / 1000).toFixed(0) + 'k' : count > 999 ? (count / 1000).toFixed(1) + 'k' : count;

        const iconHtml = isRoost
          ? `
            <div style="position: relative; display: flex; align-items: center; justify-content: center; width: ${badgeSize + 8}px; height: ${badgeSize + 8}px;">
              <span style="position: absolute; width: ${badgeSize + 8}px; height: ${badgeSize + 8}px; border-radius: 50%; background: #dc2626; opacity: 0.4; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
              <div style="position: relative; width: ${badgeSize}px; height: ${badgeSize}px; border-radius: 50%; background: ${bgColor}; border: 2.5px solid ${borderColor}; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: monospace; font-size: 10px; font-weight: 800; color: white; box-shadow: 0 4px 12px rgba(0,0,0,0.7);">
                <span style="font-size: 8px; line-height: 1;">🌙</span>
                <span style="line-height: 1;">${formattedCount}</span>
              </div>
            </div>
          `
          : `
            <div style="width: ${badgeSize}px; height: ${badgeSize}px; border-radius: 50%; background: ${bgColor}; border: 2px solid ${borderColor}; display: flex; align-items: center; justify-content: center; font-family: monospace; font-size: 11px; font-weight: 800; color: white; box-shadow: 0 3px 8px rgba(0,0,0,0.6);">
              ${formattedCount}
            </div>
          `;

        const icon = L.divIcon({
          className: 'obs-pin',
          html: iconHtml,
          iconSize: [badgeSize + (isRoost ? 8 : 0), badgeSize + (isRoost ? 8 : 0)],
          iconAnchor: [(badgeSize + (isRoost ? 8 : 0)) / 2, (badgeSize + (isRoost ? 8 : 0)) / 2],
        });

        const marker = L.marker([obs.lat, obs.lng], { icon });

        // Rich, high-contrast birder popup
        marker.bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; color: #0f172a; padding: 4px; min-width: 200px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 3px;">
              <span style="font-size: 9px; font-weight: 800; background: ${isRoost ? '#fee2e2' : '#f1f5f9'}; color: ${isRoost ? '#dc2626' : '#475569'}; border-radius: 4px; padding: 2px 6px; letter-spacing: 0.5px;">
                ${isRoost ? '🔥 ' + tierLabel : tierLabel}
              </span>
              <span style="font-family: monospace; font-weight: 800; color: ${bgColor}; font-size: 13px;">
                ${count.toLocaleString()} ${count === 1 ? 'bird' : 'birds'}
              </span>
            </div>

            <strong style="font-size: 14px; color: #0f172a; display: block; margin-top: 2px;">
              ${escapeHtml(obs.comName)}
            </strong>
            <span style="font-size: 10px; color: #64748b; font-style: italic; display: block; margin-bottom: 6px;">
              ${escapeHtml(obs.sciName || '')}
            </span>

            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 5px 8px; margin-bottom: 6px;">
              <div style="color: #334155; font-size: 11px; display: flex; align-items: center; gap: 4px;">
                <span>📍</span>
                <span style="font-weight: 600;">${escapeHtml(obs.locName)}</span>
              </div>
              <div style="color: #64748b; font-size: 10px; margin-top: 2px; display: flex; align-items: center; gap: 4px;">
                <span>🕒</span>
                <span>${escapeHtml(obs.obsDt)}</span>
              </div>
            </div>

            ${obs.notes ? `<div style="font-size: 10px; color: #475569; font-style: italic; line-height: 1.3;">${escapeHtml(obs.notes)}</div>` : ''}
          </div>
        `);

        if (onSelectItem) {
          marker.on('click', () => {
            onSelectItem({
              id: obs.id,
              speciesCode: obs.speciesCode,
              comName: obs.comName,
              sciName: obs.sciName,
              locId: obs.locId,
              locName: obs.locName,
              obsDt: obs.obsDt,
              howMany: obs.howMany,
              lat: obs.lat,
              lng: obs.lng,
              obsReviewed: obs.obsReviewed,
              subId: obs.subId,
              isCrowRoost: obs.isCrowRoost,
              notes: obs.notes,
            });

            // When clicking any roost marker on the map, highlight and focus that roost's flight corridor
            if (isRoost && onSelectCorridor) {
              const flightPath = getFlightPathForRoost(obs);
              onSelectCorridor(flightPath);
            }
          });
        }

        layer.addLayer(marker);
        if (obs.id) {
          markerLookupRef.current.set(obs.id, marker);
        }
      } catch (e) {}
    });
  }, [observations, hotspots, onSelectItem, onSelectCorridor, quickFilter]);

  // Navigation handlers
  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  const handleResetNorth = () => {
    mapInstanceRef.current?.setView([targetLat, targetLng], mapInstanceRef.current?.getZoom() || targetZoom);
  };

  const handleRecenterRegion = () => {
    if (region?.bounds && Array.isArray(region.bounds) && region.bounds.length === 2) {
      mapInstanceRef.current?.fitBounds(region.bounds, { padding: [30, 30] });
    } else {
      mapInstanceRef.current?.setView([targetLat, targetLng], targetZoom);
    }
  };

  return (
    <div
      style={{ position: 'relative', width: '100%', height: '100%', flex: 1, overflow: 'hidden' }}
      className="w-full h-full min-h-0 relative flex-1 select-none"
    >
      {/* 1. Underlying Leaflet Map Canvas */}
      <div
        ref={mapContainerRef}
        style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, zIndex: 0 }}
      />

      {/* 2. Top Bar: Quick Filter Chips for Birders (All, Flocks, Roosts, Corridors, Hotspots) */}
      <div className="absolute top-3 left-3 right-16 sm:right-auto z-20 flex flex-wrap items-center gap-1.5 pointer-events-auto">
        <div className="flex items-center gap-1 bg-slate-950/90 backdrop-blur-md p-1 rounded-xl border border-slate-800 shadow-xl overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setQuickFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
              quickFilter === 'all'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-850'
            }`}
          >
            <span>All Birds</span>
            <span className="text-[10px] opacity-80 font-mono">({observations.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setQuickFilter('flocks')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
              quickFilter === 'flocks'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-850'
            }`}
          >
            <span>50+ Flocks</span>
          </button>

          <button
            type="button"
            onClick={() => setQuickFilter('megaroosts')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
              quickFilter === 'megaroosts'
                ? 'bg-rose-500 text-white font-bold shadow-sm'
                : 'text-rose-400 hover:text-rose-300 hover:bg-rose-950/50'
            }`}
          >
            <Flame size={12} />
            <span>Mega-Roosts</span>
          </button>

          <button
            type="button"
            onClick={() => setQuickFilter('corridors')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
              quickFilter === 'corridors'
                ? 'bg-sky-500 text-slate-950 font-bold shadow-sm'
                : 'text-sky-300 hover:text-white hover:bg-slate-850'
            }`}
          >
            <Wind size={12} />
            <span>Flight Paths</span>
            <span className="text-[10px] opacity-80 font-mono">({effectiveCorridors.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setQuickFilter('hotspots')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
              quickFilter === 'hotspots'
                ? 'bg-emerald-600 text-white font-bold shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-850'
            }`}
          >
            <MapPin size={12} />
            <span>Hotspots</span>
          </button>
        </div>
      </div>

      {/* 3. Top-Right Controls: Free Google Basemap Switcher & Sunset Roost Clock */}
      <div className="absolute top-3 right-3 z-30 flex items-center gap-2 pointer-events-auto">
        {/* Roost & Sunset Clock Trigger Button */}
        <button
          type="button"
          onClick={() => setShowSunClockModal((prev) => !prev)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/90 backdrop-blur-md border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-semibold shadow-xl transition-all active:scale-95"
          title="Sunset & Roost Activity Window"
        >
          <span style={{ color: sunStatus.phaseColor }}>●</span>
          <span className="hidden sm:inline">Roost Window:</span>
          <span className="font-mono text-emerald-400">{sunStatus.sunsetStr}</span>
        </button>

        {/* Free Google Basemap Selector Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsBasemapMenuOpen((prev) => !prev)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/90 backdrop-blur-md border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-semibold shadow-xl transition-all active:scale-95"
            title="Switch Map Layers (Free Google Maps)"
          >
            <Layers size={14} className="text-emerald-400" />
            <span className="hidden md:inline">{BASEMAP_CONFIGS[selectedBasemap].name}</span>
            <ChevronDown size={13} className="text-slate-400" />
          </button>

          {isBasemapMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-slate-950/95 backdrop-blur-xl border border-slate-800 rounded-xl shadow-2xl p-1.5 z-40 animate-in fade-in zoom-in-95 duration-100 flex flex-col gap-1">
              <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Google Basemaps (Free)
              </div>
              {(Object.keys(BASEMAP_CONFIGS) as BasemapType[]).map((key) => {
                const opt = BASEMAP_CONFIGS[key];
                const isActive = selectedBasemap === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setSelectedBasemap(key);
                      setIsBasemapMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors text-left ${
                      isActive
                        ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30'
                        : 'text-slate-300 hover:bg-slate-850 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span>{opt.icon}</span>
                      <span>{opt.name}</span>
                    </span>
                    {isActive && <span className="text-[10px] text-emerald-400 font-bold">ACTIVE</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 4. Roost & Sunset Activity Intel Card (Expandable Modal / Card) */}
      {showSunClockModal && (
        <div className="absolute top-14 right-3 z-30 w-80 max-w-[90vw] bg-slate-950/95 backdrop-blur-xl border border-slate-800 rounded-2xl p-4 shadow-2xl text-slate-100 animate-in fade-in zoom-in-95 duration-150 pointer-events-auto">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
            <div className="flex items-center gap-2">
              <Sun size={16} className="text-amber-400" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-200">
                Solar Roost Telemetry
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowSunClockModal(false)}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X size={14} />
            </button>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between bg-slate-900 p-2 rounded-xl border border-slate-800">
              <span className="text-slate-400">Local Sunset Time:</span>
              <span className="font-mono font-bold text-amber-400 text-sm">{sunStatus.sunsetStr}</span>
            </div>

            <div className="p-2.5 rounded-xl border" style={{ borderColor: `${sunStatus.phaseColor}40`, backgroundColor: `${sunStatus.phaseColor}15` }}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-extrabold text-xs" style={{ color: sunStatus.phaseColor }}>
                  {sunStatus.badgeText}
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {sunStatus.minutesToSunset > 0 ? `Sunset in ${sunStatus.minutesToSunset}m` : `${Math.abs(sunStatus.minutesToSunset)}m past sunset`}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {sunStatus.description}
              </p>
            </div>

            <div className="text-[10px] text-slate-400 leading-relaxed bg-slate-900/60 p-2 rounded-lg border border-slate-800">
              💡 <b>Birder Tip:</b> Peak flyway transit happens 30 minutes before to 15 minutes after sunset. Follow directional arrow markers on the map towards night roosts.
            </div>
          </div>
        </div>
      )}

      {/* 5. Floating Selected Flight Corridor Card */}
      {selectedCorridor && (
        <div className="absolute top-16 left-3 right-3 sm:right-auto sm:max-w-md z-30 bg-slate-950/95 backdrop-blur-xl border border-sky-500/50 rounded-2xl p-3.5 shadow-2xl text-slate-100 animate-in fade-in slide-in-from-top-2 duration-150 pointer-events-auto">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: selectedCorridor.color || '#38bdf8' }} />
              <div>
                <h4 className="font-bold text-xs text-white leading-tight">
                  {selectedCorridor.name}
                </h4>
                <div className="text-[10px] text-sky-400 font-medium">
                  {selectedCorridor.corridorName}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onSelectCorridor && onSelectCorridor(null)}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 my-2 bg-slate-900/80 p-2 rounded-xl border border-slate-800 text-[11px]">
            <div>
              <span className="text-slate-400 block text-[10px]">Flight Direction</span>
              <span className="font-bold text-emerald-400 flex items-center gap-1">
                <span>🧭 {getCompassDirection(selectedCorridor.headingDeg || 0)} ({selectedCorridor.headingDeg || 0}°)</span>
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Est. Flock Influx</span>
              <span className="font-bold text-sky-400 font-mono">
                ~{(selectedCorridor.estFlockSize || 10000).toLocaleString()} birds
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-300 leading-relaxed bg-slate-900/40 p-2 rounded-lg border border-slate-800/80">
            {selectedCorridor.description}
          </p>

          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800 text-[10px] text-slate-400">
            <span>🕒 {selectedCorridor.timeWindow}</span>
            <span className="text-sky-400 font-bold">Follow green Staging ➔ purple Roost</span>
          </div>
        </div>
      )}

      {/* 6. Bottom-Left: Collapsible Interactive Map Legend */}
      <div className="absolute bottom-6 left-3 z-20 pointer-events-auto">
        {showLegend ? (
          <div className="bg-slate-950/95 backdrop-blur-xl border border-slate-800 rounded-2xl p-3 shadow-2xl text-slate-100 max-w-xs animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
              <span className="text-[11px] font-bold tracking-wide text-slate-300 flex items-center gap-1.5">
                <Info size={12} className="text-emerald-400" />
                <span>Birder Map Key</span>
              </span>
              <button
                type="button"
                onClick={() => setShowLegend(false)}
                className="text-slate-400 hover:text-white p-0.5 rounded"
              >
                <X size={12} />
              </button>
            </div>

            <div className="space-y-1.5 text-[11px]">
              <div className="flex items-center gap-2">
                <div className="w-5 h-2 bg-sky-400 rounded-sm relative flex items-center justify-center">
                  <span className="text-[8px] text-slate-950 font-bold">➤</span>
                </div>
                <span className="text-slate-300">Flight Path & Direction</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-slate-900 border-2 border-emerald-500 flex items-center justify-center text-[8px] text-emerald-400 font-bold">
                  S
                </div>
                <span className="text-slate-300">Staging Area (Flight Origin)</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-rose-600 border border-amber-400 flex items-center justify-center text-[8px] text-white font-bold">
                  🌙
                </div>
                <span className="text-slate-300">Mega-Roost (250+ birds)</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-[9px] font-mono font-bold">
                  50
                </div>
                <span className="text-slate-300">Large Flock (50-249)</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 flex items-center justify-center text-[8px] text-white font-bold">
                  •
                </div>
                <span className="text-slate-300">Observation (1-49)</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-emerald-600 border border-white flex items-center justify-center text-[9px]">
                  📍
                </div>
                <span className="text-slate-300">eBird Hotspot</span>
              </div>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowLegend(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950/90 backdrop-blur-md border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-xl shadow-xl transition-all"
          >
            <Info size={13} className="text-emerald-400" />
            <span>Map Key</span>
          </button>
        )}
      </div>

      {/* 7. Bottom-Right: Map Navigation Tools (+ / - / Reset North / Recenter / Locate Me) */}
      <div className="absolute bottom-6 right-3 z-20 flex flex-col gap-1.5 pointer-events-auto">
        <button
          type="button"
          onClick={handleZoomIn}
          className="w-9 h-9 rounded-xl bg-slate-950/90 backdrop-blur-md border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white flex items-center justify-center shadow-xl active:scale-95 transition-all"
          title="Zoom In"
        >
          <ZoomIn size={16} />
        </button>

        <button
          type="button"
          onClick={handleZoomOut}
          className="w-9 h-9 rounded-xl bg-slate-950/90 backdrop-blur-md border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white flex items-center justify-center shadow-xl active:scale-95 transition-all"
          title="Zoom Out"
        >
          <ZoomOut size={16} />
        </button>

        <button
          type="button"
          onClick={handleResetNorth}
          className="w-9 h-9 rounded-xl bg-slate-950/90 backdrop-blur-md border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white flex items-center justify-center shadow-xl active:scale-95 transition-all"
          title="Reset View to North"
        >
          <Compass size={16} className="text-sky-400" />
        </button>

        <button
          type="button"
          onClick={handleRecenterRegion}
          className="w-9 h-9 rounded-xl bg-slate-950/90 backdrop-blur-md border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white flex items-center justify-center shadow-xl active:scale-95 transition-all"
          title="Recenter on Active Region"
        >
          <Crosshair size={16} className="text-emerald-400" />
        </button>

        {onLocateMe && (
          <button
            type="button"
            onClick={onLocateMe}
            disabled={isLocating}
            className="w-9 h-9 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center shadow-xl active:scale-95 transition-all font-bold disabled:opacity-50"
            title="Locate Me (GPS)"
          >
            <Navigation size={16} className={isLocating ? 'animate-spin' : ''} />
          </button>
        )}
      </div>
    </div>
  );
};

export default Map;
