import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Observation, Hotspot, ViewMode, TaxonomyItem, CrowRoostReport, FlightCorridor, RegionConfig } from './types/bird';
import { MeetupProposal } from './types/chat';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Map as BirdMap } from './components/Map';
import { ReportModal } from './components/ReportModal';
import { AiRoostWidget } from './components/AiRoostWidget';
import { MobileBottomSheet } from './components/MobileBottomSheet';
import { LocationModal } from './components/LocationModal';
import { CommunityChat } from './components/CommunityChat';
import { useCommunityChat } from './hooks/useCommunityChat';
import { DisclaimerModal } from './components/DisclaimerModal';
import { HandleModal } from './components/HandleModal';
import { ShareModal } from './components/ShareModal';
import { DonateModal } from './components/DonateModal';
import { BottomNav } from './components/BottomNav';
import { LayersModal } from './components/LayersModal';
import { PreflightModal } from './components/PreflightModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PreflightSummary, runPreflightDiagnostics } from './utils/preflightCheck';
import { INITIAL_FALLBACK_OBSERVATIONS, MOCK_HOTSPOTS } from './data/mockPortlandData';
import { PRIMARY_REGIONS } from './data/regions';
import { isSpeciesOptimalNow } from './data/viewingForecast';
import { fetchObservationsForRegion, fetchHotspotsForRegion } from './services/ebirdService';
import { getCorridorsForRegion } from './data/roostCorridors';
import { getRoostsAsObservations, getFlightPathForRoost } from './data/roosts';

const STORAGE_KEY_HANDLE = 'thebirdbook_handle';
const STORAGE_KEY_HOME_REGION = 'thebirdbook_home_region';
const STORAGE_KEY_DISCLAIMER = 'thebirdbook_disclaimer_signed';

/**
 * Normalizes raw sightings into clean, flat JSON objects.
 * Prevents circular references or deeply nested Leaflet event objects from polluting state.
 */
export function normalizeObservation(raw: any): Observation {
  if (!raw) {
    return {
      id: `obs-${Math.random()}`,
      speciesCode: 'unknown',
      comName: 'Unknown Bird',
      sciName: '',
      locId: '',
      locName: 'Unknown Location',
      obsDt: 'Recent',
      howMany: 1,
      lat: 0,
      lng: 0,
      obsReviewed: false,
      subId: '',
    };
  }
  return {
    id: String(raw.id || raw.obsId || `obs-${Math.random()}`),
    speciesCode: String(raw.speciesCode || 'unknown'),
    comName: String(raw.comName || 'Unknown Bird'),
    sciName: String(raw.sciName || ''),
    locId: String(raw.locId || ''),
    locName: String(raw.locName || 'Field Observation'),
    obsDt: String(raw.obsDt || 'Recently'),
    howMany: typeof raw.howMany === 'number' && !isNaN(raw.howMany) ? raw.howMany : 1,
    lat: Number(raw.lat) || 0,
    lng: Number(raw.lng) || 0,
    obsReviewed: Boolean(raw.obsReviewed),
    subId: String(raw.subId || ''),
    direction: raw.direction ? String(raw.direction) : undefined,
    isCrowRoost: Boolean(raw.isCrowRoost || (raw.howMany && raw.howMany >= 250)),
    notes: raw.notes ? String(raw.notes) : undefined,
    flightHeadingDeg: typeof raw.flightHeadingDeg === 'number' ? raw.flightHeadingDeg : undefined,
    originStagingArea: raw.originStagingArea ? String(raw.originStagingArea) : undefined,
  };
}

export const App: React.FC = () => {
  // Primary default region is Nationwide View (Contiguous US)
  const [selectedRegion, setSelectedRegion] = useState<string>('US');
  const [currentRegion, setCurrentRegion] = useState<RegionConfig>(
    PRIMARY_REGIONS.find((r) => r.id === 'nationwide') || PRIMARY_REGIONS[2] || PRIMARY_REGIONS[0]
  );
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [isLocationModalOpen, setIsLocationModalOpen] = useState<boolean>(() => {
    try {
      return !sessionStorage.getItem('birdbook_welcome_dismissed');
    } catch (e) {
      console.error(e);
      return false;
    }
  });

  const [mode, setMode] = useState<ViewMode>('recent');
  const [selectedSpecies, setSelectedSpecies] = useState<TaxonomyItem | null>(null);

  // Initial sanitized fallback array of sightings + 15 Premier Roost Sites
  const [observations, setObservations] = useState<Observation[]>(() => {
    const fallbacks = (INITIAL_FALLBACK_OBSERVATIONS || []).map(normalizeObservation);
    const roosts = getRoostsAsObservations().map(normalizeObservation);
    const obsMap = new globalThis.Map<string, Observation>();
    roosts.forEach((r) => obsMap.set(r.id, r));
    fallbacks.forEach((f) => {
      if (!obsMap.has(f.id)) obsMap.set(f.id, f);
    });
    return Array.from(obsMap.values());
  });
  const [hotspots, setHotspots] = useState<Hotspot[]>(MOCK_HOTSPOTS || []);
  const [selectedItem, setSelectedItem] = useState<Observation | Hotspot | null>(null);
  const [selectedCorridor, setSelectedCorridor] = useState<FlightCorridor | null>(null);
  const [filterBestNow, setFilterBestNow] = useState<boolean>(false);
  const [filterMegaRoosts, setFilterMegaRoosts] = useState<boolean>(false);

  // Dynamic Regional Corridors: Filtered by state or 250-mile GPS radius
  const activeCorridors = useMemo(() => {
    return getCorridorsForRegion(currentRegion, 250);
  }, [currentRegion]);

  // Persistent sidebar on desktop (>=768px), togglable on mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  );
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isAiWidgetOpen, setIsAiWidgetOpen] = useState(false);
  const [aiCustomQuestion, setAiCustomQuestion] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Community Birder Chat state
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);

  // Active roost information for community chat channel filtering & auto-switch
  const activeRoostId = useMemo(() => {
    if (selectedCorridor?.roostId) return selectedCorridor.roostId;
    if (selectedCorridor?.id && selectedCorridor.id.startsWith('corridor-roost-')) {
      return selectedCorridor.id.replace('corridor-', '');
    }
    const obs = selectedItem as Observation;
    if (obs && (obs.isCrowRoost || (typeof obs.howMany === 'number' && obs.howMany >= 250) || (obs.id && obs.id.startsWith('roost-')))) {
      return obs.id?.replace('ROOST_', '') || obs.id;
    }
    return null;
  }, [selectedItem, selectedCorridor]);

  const activeRoostName = useMemo(() => {
    if (selectedCorridor?.name) return selectedCorridor.name;
    const obs = selectedItem as Observation;
    if (obs && (obs.isCrowRoost || (typeof obs.howMany === 'number' && obs.howMany >= 250) || (obs.id && obs.id.startsWith('roost-')))) {
      return obs.locName || obs.comName || 'Roost Staging';
    }
    return null;
  }, [selectedItem, selectedCorridor]);

  const activeSpecies = useMemo(() => {
    if (selectedCorridor?.species) return selectedCorridor.species;
    const obs = selectedItem as Observation;
    if (obs && obs.comName) {
      return obs.comName;
    }
    return null;
  }, [selectedItem, selectedCorridor]);

  // Real-time Community Birder Chat Hook powered by Supabase Realtime
  const {
    messages: communityChatMessages,
    sendMessage: sendCommunityMessage,
    activeChannel: chatChannel,
    setActiveChannel: setChatChannel,
    unreadCount: unreadChatCount,
    isRealtimeActive,
    isSupabaseConfigured,
    isLoading: isChatLoading,
  } = useCommunityChat(activeRoostId, isChatOpen);

  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState<boolean>(false);
  const [isHandleModalOpen, setIsHandleModalOpen] = useState<boolean>(false);
  const [userHandle, setUserHandle] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HANDLE);
      return saved || '';
    } catch (e) {
      console.error('localStorage handle read error:', e);
      return '';
    }
  });
  const [userHomeRegion, setUserHomeRegion] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HOME_REGION);
      return saved || 'OR-Metro';
    } catch (e) {
      console.error('localStorage home region read error:', e);
      return 'OR-Metro';
    }
  });
  const [pinnedMeetup, setPinnedMeetup] = useState<MeetupProposal | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [isDonateModalOpen, setIsDonateModalOpen] = useState<boolean>(false);
  const [isLayersOpen, setIsLayersOpen] = useState<boolean>(false);
  const [isPreflightOpen, setIsPreflightOpen] = useState<boolean>(false);
  const [preflightSummary, setPreflightSummary] = useState<PreflightSummary | null>(null);
  const [isPreflightLoading, setIsPreflightLoading] = useState<boolean>(false);

  // Safe Non-Blocking Execution: Automated Pre-Flight Diagnostics Check on app mount
  useEffect(() => {
    let isMounted = true;
    const runDiagnostics = async () => {
      try {
        const result = await runPreflightDiagnostics();
        if (isMounted) {
          setPreflightSummary(result);
        }
      } catch (err) {
        console.warn('Pre-flight background diagnostics error:', err);
      }
    };

    // Run slightly deferred to avoid competing with initial map paint
    const timer = setTimeout(runDiagnostics, 500);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);

  const handleRefreshPreflight = useCallback(async () => {
    setIsPreflightLoading(true);
    try {
      const result = await runPreflightDiagnostics();
      setPreflightSummary(result);
    } catch (err) {
      console.warn('Pre-flight refresh error:', err);
    } finally {
      setIsPreflightLoading(false);
    }
  }, []);

  // Startup Geolocation Handshake: cached coordinates without overriding camera
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'permissions' in navigator) {
      navigator.permissions
        ?.query({ name: 'geolocation' })
        .then((perm) => {
          if (perm.state === 'granted') {
            setIsLocationModalOpen(false);
            try {
              sessionStorage.setItem('birdbook_welcome_dismissed', 'true');
            } catch {}
          }
        })
        .catch(() => {});
    }

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setUserLocation([lat, lng]);
        },
        (error) => {
          console.warn('Geolocation silent handshake:', error?.message);
        },
        { timeout: 3000, maximumAge: 300000, enableHighAccuracy: false }
      );
    }
  }, []);

  // Data fetching: guarded against coordinate fluctuation loops
  const regionId = currentRegion.id;
  const regionCode = currentRegion.regionCode;
  const modeKey = mode;
  const speciesKey = selectedSpecies?.speciesCode;

  useEffect(() => {
    let isCancelled = false;

    const loadData = async () => {
      setIsLoading(true);
      try {
        if (modeKey === 'hotspots') {
          const spots = await fetchHotspotsForRegion(currentRegion);
          if (!isCancelled && Array.isArray(spots) && spots.length > 0) {
            setHotspots(spots);
          }
        } else {
          const obs = await fetchObservationsForRegion(
            currentRegion,
            modeKey,
            modeKey === 'species' ? speciesKey : undefined,
            refreshTrigger > 0
          );
          if (!isCancelled && Array.isArray(obs) && obs.length > 0) {
            const fetched = obs.map(normalizeObservation);
            const roosts = getRoostsAsObservations().map(normalizeObservation);
            const obsMap = new globalThis.Map<string, Observation>();
            roosts.forEach((r) => obsMap.set(r.id, r));
            fetched.forEach((f) => obsMap.set(f.id, f));
            setObservations(Array.from(obsMap.values()));
          }
        }
      } catch (err) {
        console.warn('Safe catch in loadData, retaining fallback:', err);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isCancelled = true;
    };
  }, [regionId, regionCode, modeKey, speciesKey, refreshTrigger]);

  // "Use My Location" GPS Handler
  const handleLocateMe = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setUserLocation([lat, lng]);

        const gpsRegion: RegionConfig = {
          id: 'gps',
          name: 'Current Location (GPS Nearby)',
          category: 'gps',
          center: [lat, lng],
          zoom: 12,
          description: 'Observations within 30 miles / 50 km of your current GPS location.',
          lat,
          lng,
          distMiles: 30,
        };

        setCurrentRegion(gpsRegion);
        setSelectedRegion('GPS');
        setIsLocating(false);
        setIsLocationModalOpen(false);
        try {
          sessionStorage.setItem('birdbook_welcome_dismissed', 'true');
        } catch {}

        Promise.allSettled([
          fetchObservationsForRegion(gpsRegion, 'recent', undefined, true),
          fetchHotspotsForRegion(gpsRegion),
        ]).then(([obsRes, spotsRes]) => {
          if (obsRes.status === 'fulfilled' && obsRes.value && obsRes.value.length > 0) {
            setObservations(obsRes.value.map(normalizeObservation));
          }
          if (spotsRes.status === 'fulfilled' && spotsRes.value && spotsRes.value.length > 0) {
            setHotspots(spotsRes.value);
          }
        });
      },
      (error) => {
        console.warn('Geolocation error:', error);
        setIsLocating(false);
        alert(`Unable to retrieve your location: ${error.message || 'Permission denied'}.`);
      },
      {
        enableHighAccuracy: false,
        timeout: 3000,
        maximumAge: 300000,
      }
    );
  }, []);

  // Reset to Default View handler for Error Boundary recovery
  const handleResetToDefault = useCallback(() => {
    setCurrentRegion(PRIMARY_REGIONS[0]);
    setSelectedRegion('GPS');
    setUserLocation(null);
    setSelectedSpecies(null);
    setSelectedItem(null);
    setSelectedCorridor(null);
    setSearchFilter('');
    setFilterBestNow(false);
    setFilterMegaRoosts(false);
    setMode('recent');
    setObservations((INITIAL_FALLBACK_OBSERVATIONS || []).map(normalizeObservation));
    setHotspots(MOCK_HOTSPOTS || []);
    setPinnedMeetup(null);
  }, []);

  // Close welcome location modal and mark session
  const handleDismissLocationModal = useCallback(() => {
    setIsLocationModalOpen(false);
    try {
      sessionStorage.setItem('birdbook_welcome_dismissed', 'true');
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Field Chat Disclaimer check
  const handleRequestDisclaimer = useCallback((): boolean => {
    try {
      const agreed = localStorage.getItem(STORAGE_KEY_DISCLAIMER) === 'true';
      if (!agreed) {
        setIsDisclaimerOpen(true);
        return false;
      }
      return true;
    } catch (e) {
      console.error(e);
      return true;
    }
  }, []);

  // Field Chat Handle check
  const handleRequestHandle = useCallback((): string | null => {
    if (userHandle && userHandle.trim().length >= 3) {
      return userHandle;
    }
    setIsHandleModalOpen(true);
    return null;
  }, [userHandle]);

  // Agree to legal disclaimer
  const handleAgreeDisclaimer = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY_DISCLAIMER, 'true');
    } catch (e) {
      console.error(e);
    }
    setIsDisclaimerOpen(false);
    setIsChatOpen(true);

    if (!userHandle) {
      setIsHandleModalOpen(true);
    }
  }, [userHandle]);

  // Save permanent handle & home region
  const handleSaveHandle = useCallback((handle: string, homeRegion: string) => {
    setUserHandle(handle);
    setUserHomeRegion(homeRegion);
    try {
      localStorage.setItem(STORAGE_KEY_HANDLE, handle);
      localStorage.setItem(STORAGE_KEY_HOME_REGION, homeRegion);
    } catch (e) {
      console.error(e);
    }
    setIsHandleModalOpen(false);
  }, []);

  // Clear species filter and restore all regional observations
  const handleClearSpeciesFilter = useCallback(() => {
    setSelectedSpecies(null);
    setSearchFilter('');
    if (mode === 'species') {
      setMode('recent');
    }
  }, [mode]);

  // Open Community Birder Chat
  const handleOpenChat = useCallback(() => {
    setIsChatOpen(true);
  }, []);

  // Pin proposed meetup to map
  const handlePinMeetupToMap = useCallback((meetup: MeetupProposal) => {
    setPinnedMeetup(meetup);
    if (meetup.lat && meetup.lng) {
      setSelectedItem(null);
    }
  }, []);

  // Memoized Item Selection: Sanitizes clicked item into a pure, flat object with no Leaflet internals
  const handleSelectItem = useCallback((item: Observation | Hotspot | null) => {
    if (!item) {
      setSelectedItem(null);
      return;
    }
    const cleanItem = {
      ...item,
      lat: Number(item.lat),
      lng: Number(item.lng),
    };
    setSelectedItem(cleanItem);

    // When selecting any roost from sidebar or map, highlight and focus that roost's flight corridor
    const obs = cleanItem as Observation;
    const isRoost = obs.isCrowRoost || (typeof obs.howMany === 'number' && obs.howMany >= 250) || (obs.id && obs.id.startsWith('roost-'));
    if (isRoost) {
      const flightPath = getFlightPathForRoost(obs);
      setSelectedCorridor(flightPath);
    } else {
      setSelectedCorridor(null);
    }

    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, []);

  // Null-safe filtered observations
  const displayedObservations = useMemo(() => {
    let result = observations || [];

    if (filterBestNow) {
      result = (result || []).filter((obs) => obs && isSpeciesOptimalNow(obs.speciesCode));
    }

    if (filterMegaRoosts) {
      result = (result || []).filter((obs) => obs && ((obs.howMany && obs.howMany >= 250) || obs.isCrowRoost));
    }

    if (selectedSpecies?.speciesCode) {
      const code = selectedSpecies.speciesCode.toLowerCase();
      const com = (selectedSpecies.comName || '').toLowerCase();
      result = (result || []).filter(
        (obs) =>
          obs &&
          ((obs.speciesCode && obs.speciesCode.toLowerCase() === code) ||
           (obs.comName && obs.comName.toLowerCase().includes(com)) ||
           (obs.sciName && selectedSpecies.sciName && obs.sciName.toLowerCase().includes(selectedSpecies.sciName.toLowerCase())))
      );
    }

    const q = (searchFilter || '').trim().toLowerCase();
    if (q && (!selectedSpecies || q !== selectedSpecies.comName.toLowerCase())) {
      result = (result || []).filter(
        (obs) =>
          obs &&
          (String(obs.comName || '').toLowerCase().includes(q) ||
            String(obs.sciName || '').toLowerCase().includes(q) ||
            String(obs.speciesCode || '').toLowerCase().includes(q) ||
            String(obs.locName || '').toLowerCase().includes(q) ||
            (obs.notes && String(obs.notes).toLowerCase().includes(q)))
      );
    }

    return result || [];
  }, [observations, filterBestNow, filterMegaRoosts, selectedSpecies, searchFilter]);

  // Handle reporting new community roost sighting
  const handleReportSighting = async (report: Omit<CrowRoostReport, 'id' | 'timestamp'>) => {
    try {
      let newRep = report as any;
      try {
        const res = await fetch('/api/birds/reports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(report),
        });
        newRep = await res.json();
      } catch (postErr) {
        console.warn('Proxy post failed, appending locally:', postErr);
      }

      const heading = report.flightHeadingDeg ?? 225;
      const backAngle = (heading + 180) % 360;
      const originLat = report.lat + Math.cos((backAngle * Math.PI) / 180) * 0.024;
      const originLng =
        report.lng + (Math.sin((backAngle * Math.PI) / 180) * 0.024) / Math.cos((report.lat * Math.PI) / 180);
      const trajectoryCoords: [number, number][] = [
        [originLat, originLng],
        [report.lat, report.lng],
      ];

      const rawObs: Observation = {
        id: `comm-${newRep.id || Date.now()}`,
        speciesCode: 'amecro',
        comName: `${newRep.species || report.species} (Community Sighting)`,
        sciName: 'Corvus brachyrhynchos',
        locId: 'COMM_USER',
        locName: newRep.locationName || report.locationName,
        obsDt: 'Just now',
        howMany: newRep.count || report.count,
        lat: newRep.lat || report.lat,
        lng: newRep.lng || report.lng,
        obsReviewed: true,
        subId: 'COMMUNITY',
        direction: newRep.direction || report.direction,
        originStagingArea: newRep.originStagingArea || report.originStagingArea,
        flightHeadingDeg: heading,
        trajectoryCoords,
        isCrowRoost: (newRep.count || report.count) >= 250,
        notes: `${newRep.behavior || report.behavior}: ${newRep.notes || report.notes}`,
      };

      const cleanObs = normalizeObservation(rawObs);
      setObservations((prev) => [cleanObs, ...(prev || [])]);
      handleSelectItem(cleanObs);
      setIsReportModalOpen(false);
    } catch (err) {
      console.error('Failed to report sighting:', err);
    }
  };

  const handleOpenAiWithQuestion = useCallback((question: string) => {
    setAiCustomQuestion(question);
    setIsAiWidgetOpen(true);
  }, []);

  return (
    <ErrorBoundary onReset={handleResetToDefault}>
      <div className="flex flex-col w-full h-screen min-h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans select-none">
        {/* Clean Header: Branded as "The Burd" with Search & Region Selector */}
        <Header
          currentRegion={currentRegion}
          onSelectRegion={(reg) => {
            setCurrentRegion(reg);
            setSelectedRegion(reg.category === 'gps' ? 'GPS' : (reg.regionCode || reg.id));
            setSelectedSpecies(null);
            setSearchFilter('');
            if (mode === 'species') {
              setMode('recent');
            }
            setSelectedItem(null);
            setSelectedCorridor(null);
          }}
          searchFilter={searchFilter}
          onSearchFilterChange={setSearchFilter}
          selectedSpecies={selectedSpecies}
          onSelectSpecies={(species) => {
            setSelectedSpecies(species);
            setSelectedItem(null);
            if (species) {
              setSearchFilter(species.comName);
            }
          }}
          onSetMode={(newMode) => {
            setMode(newMode);
            setSelectedItem(null);
          }}
          onLocateMe={handleLocateMe}
          observations={observations || []}
          onOpenPreflight={() => setIsPreflightOpen(true)}
          preflightSummary={preflightSummary}
          onOpenChat={handleOpenChat}
          unreadChatCount={unreadChatCount}
        />

        {/* Main View Area: Persistent Left Sidebar on Desktop & Full-height Interactive Map */}
        <div className="flex-1 w-full h-full relative flex overflow-hidden">
          {/* Collapsible Mobile Backdrop Overlay behind Sidebar */}
          {isSidebarOpen && (
            <div 
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          {/* Persistent Left Sidebar on Desktop / Drawer on Mobile */}
          <Sidebar
            isOpen={isSidebarOpen}
            onToggle={() => setIsSidebarOpen((prev) => !prev)}
            onClose={() => setIsSidebarOpen(false)}
            mode={mode}
            observations={displayedObservations || []}
            hotspots={hotspots || []}
            selectedItem={selectedItem}
            onSelectItem={handleSelectItem}
            isLoading={isLoading}
            corridors={activeCorridors}
            selectedCorridor={selectedCorridor}
            onSelectCorridor={(corridor) => {
              setSelectedCorridor(corridor);
              setSelectedItem(null);
              if (typeof window !== 'undefined' && window.innerWidth < 768) {
                setIsSidebarOpen(false);
              }
            }}
            currentRegion={currentRegion}
            onClearSpeciesFilter={handleClearSpeciesFilter}
            totalUnfilteredCount={observations?.length || 0}
            selectedSpecies={selectedSpecies}
            searchFilter={searchFilter}
            onOpenShare={() => setIsShareModalOpen(true)}
            onOpenDonate={() => setIsDonateModalOpen(true)}
            onOpenLayersModal={() => setIsLayersOpen(true)}
          />

          {/* Full-Height Interactive Map on the Right */}
          <div className="flex-1 w-full h-full min-w-0 relative">
            <BirdMap
              observations={displayedObservations || []}
              hotspots={hotspots || []}
              selectedItem={selectedItem}
              onSelectItem={handleSelectItem}
              corridors={activeCorridors}
              selectedCorridor={selectedCorridor}
              onSelectCorridor={(corridor) => {
                setSelectedCorridor(corridor);
                setSelectedItem(null);
              }}
              region={currentRegion}
              activeRegion={selectedRegion}
              userLocation={userLocation}
              onLocateMe={handleLocateMe}
              isLocating={isLocating}
              pinnedMeetup={pinnedMeetup}
            />
          </div>
        </div>

        {/* Native Real-time Community Birder Chat Slide-Over Drawer */}
        <CommunityChat
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          messages={communityChatMessages}
          sendMessage={sendCommunityMessage}
          activeRoostId={activeRoostId}
          activeRoostName={activeRoostName}
          activeSpecies={activeSpecies}
          activeChannel={chatChannel}
          onSelectChannel={setChatChannel}
          isRealtimeActive={isRealtimeActive}
          isSupabaseConfigured={isSupabaseConfigured}
          isLoading={isChatLoading}
        />

        {/* Legal Liability Disclaimer Modal */}
        <DisclaimerModal
          isOpen={isDisclaimerOpen}
          onAgree={handleAgreeDisclaimer}
          onClose={() => setIsDisclaimerOpen(false)}
        />

        {/* Permanent Field Handle Selection Modal */}
        <HandleModal
          isOpen={isHandleModalOpen}
          currentHandle={userHandle}
          currentHomeRegion={userHomeRegion}
          onSave={handleSaveHandle}
          onClose={() => setIsHandleModalOpen(false)}
        />

        {/* Initial Welcome Location Selection Modal */}
        <LocationModal
          isOpen={isLocationModalOpen}
          onClose={handleDismissLocationModal}
          onSelectRegion={(reg) => {
            setCurrentRegion(reg);
            setSelectedRegion(reg.category === 'gps' ? 'GPS' : (reg.regionCode || reg.id));
            setSelectedItem(null);
            setSelectedCorridor(null);
          }}
          onLocateMe={handleLocateMe}
          isLocating={isLocating}
        />

        {/* Mobile Sighting Details Bottom Sheet (<768px) */}
        <MobileBottomSheet
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onOpenAiWidget={handleOpenAiWithQuestion}
        />

        {/* Community Report Modal */}
        <ReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          onSubmit={handleReportSighting}
        />

        {/* Gemini AI Roost Intelligence Widget */}
        <AiRoostWidget
          isOpen={isAiWidgetOpen}
          onClose={() => setIsAiWidgetOpen(false)}
          initialQuestion={aiCustomQuestion}
          observations={observations || []}
          filterBestNow={filterBestNow}
          onToggleFilterBestNow={() => setFilterBestNow((prev) => !prev)}
        />

        {/* Share Modal with Dynamic QR Code Display */}
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          appName="The Burd"
        />

        {/* PayPal Custom Donation Modal */}
        <DonateModal
          isOpen={isDonateModalOpen}
          onClose={() => setIsDonateModalOpen(false)}
          paypalEmail="littlerusty@gmail.com"
        />

        {/* Clean Fixed Bottom Navigation Bar Pill: [ 📋 Sightings ] [ 💬 Chat ] [ ⚙️ Layers ] */}
        <BottomNav
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => {
            setIsSidebarOpen((prev) => !prev);
            setIsLayersOpen(false);
          }}
          isChatOpen={isChatOpen}
          onToggleChat={() => {
            setIsChatOpen((prev) => !prev);
            setIsLayersOpen(false);
          }}
          isLayersOpen={isLayersOpen}
          onToggleLayers={() => {
            setIsLayersOpen((prev) => !prev);
          }}
          observationsCount={displayedObservations?.length || 0}
          unreadChatCount={unreadChatCount}
        />

        {/* Map Layers & Controls Sheet Modal */}
        <LayersModal
          isOpen={isLayersOpen}
          onClose={() => setIsLayersOpen(false)}
          mode={mode}
          onSetMode={(newMode) => {
            setMode(newMode);
            setSelectedItem(null);
          }}
          filterBestNow={filterBestNow}
          onToggleFilterBestNow={() => setFilterBestNow((prev) => !prev)}
          filterMegaRoosts={filterMegaRoosts}
          onToggleFilterMegaRoosts={() => setFilterMegaRoosts((prev) => !prev)}
          onLocateMe={handleLocateMe}
          isLocating={isLocating}
          onOpenReportModal={() => setIsReportModalOpen(true)}
          onOpenAiWidget={() => {
            setAiCustomQuestion(undefined);
            setIsAiWidgetOpen(true);
          }}
          onOpenShare={() => setIsShareModalOpen(true)}
          onOpenDonate={() => setIsDonateModalOpen(true)}
          onOpenPreflight={() => setIsPreflightOpen(true)}
        />

        {/* Production Readiness & Pre-Flight Diagnostics Check Modal */}
        <PreflightModal
          isOpen={isPreflightOpen}
          onClose={() => setIsPreflightOpen(false)}
          summary={preflightSummary}
          onRefresh={handleRefreshPreflight}
          isLoading={isPreflightLoading}
        />
      </div>
    </ErrorBoundary>
  );
};

export default App;
