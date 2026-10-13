import React, { useState, useEffect, useMemo } from 'react';
import { Observation, Hotspot, ViewMode, TaxonomyItem, CrowRoostReport, FlightCorridor, RegionConfig } from './types/bird';
import { MeetupProposal } from './types/chat';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Map } from './components/Map';
import { ReportModal } from './components/ReportModal';
import { AiRoostWidget } from './components/AiRoostWidget';
import { MobileBottomSheet } from './components/MobileBottomSheet';
import { LocationModal } from './components/LocationModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { FieldChatDrawer } from './components/FieldChatDrawer';
import { DisclaimerModal } from './components/DisclaimerModal';
import { HandleModal } from './components/HandleModal';
import { ShareModal } from './components/ShareModal';
import { DonateModal } from './components/DonateModal';
import { BottomNav } from './components/BottomNav';
import { LayersModal } from './components/LayersModal';
import { INITIAL_FALLBACK_OBSERVATIONS, MOCK_HOTSPOTS, FLIGHT_CORRIDORS } from './data/mockPortlandData';
import { PRIMARY_REGIONS, US_STATES } from './data/regions';
import { isSpeciesOptimalNow } from './data/viewingForecast';
import { fetchObservationsForRegion, fetchHotspotsForRegion } from './services/ebirdService';
import { getCorridorsForRegion } from './data/roostCorridors';

const STORAGE_KEY_HANDLE = 'thebirdbook_handle';
const STORAGE_KEY_HOME_REGION = 'thebirdbook_home_region';
const STORAGE_KEY_DISCLAIMER = 'thebirdbook_disclaimer_signed';

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

  // Initial built-in fallback array of sightings - guaranteed never undefined
  const [observations, setObservations] = useState<any[]>(INITIAL_FALLBACK_OBSERVATIONS || []);
  const [hotspots, setHotspots] = useState<Hotspot[]>(MOCK_HOTSPOTS || []);
  const [selectedItem, setSelectedItem] = useState<Observation | Hotspot | null>(null);
  const [selectedCorridor, setSelectedCorridor] = useState<FlightCorridor | null>(null);
  const [filterBestNow, setFilterBestNow] = useState<boolean>(false);
  const [filterMegaRoosts, setFilterMegaRoosts] = useState<boolean>(false);

  // Dynamic Regional Corridors: Filtered by state or 250-mile GPS radius
  const activeCorridors = useMemo(() => {
    return getCorridorsForRegion(currentRegion, 250);
  }, [currentRegion]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(typeof window !== 'undefined' ? window.innerWidth >= 768 : false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isAiWidgetOpen, setIsAiWidgetOpen] = useState(false);
  const [aiCustomQuestion, setAiCustomQuestion] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Field Chat & Community Meetup state guarded with try/catch
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
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

  // Startup Geolocation Effect: Silently cache coordinates for proximity without overriding Nationwide view
  useEffect(() => {
    // 1. If geolocation permission is already granted, dismiss onboarding modal immediately
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

    // 2. Silently acquire coordinates for proximity calculations without overriding Nationwide camera
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

  // Manual refresh sightings button handler
  const handleRefreshSightings = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  // Only trigger network fetches when currentRegion, mode, or manual refresh changes.
  useEffect(() => {
    let isCancelled = false;

    const loadData = async () => {
      setIsLoading(true);
      try {
        if (mode === 'hotspots') {
          const spots = await fetchHotspotsForRegion(currentRegion);
          if (!isCancelled && Array.isArray(spots) && spots.length > 0) {
            setHotspots(spots);
          }
        } else {
          const obs = await fetchObservationsForRegion(
            currentRegion,
            mode,
            mode === 'species' ? selectedSpecies?.speciesCode : undefined,
            refreshTrigger > 0
          );
          if (!isCancelled && Array.isArray(obs) && obs.length > 0) {
            setObservations(obs);
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
  }, [currentRegion, mode, selectedSpecies, refreshTrigger]);

  // "Use My Location" GPS Handler
  const handleLocateMe = () => {
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

        // Non-blocking parallel network fetch via Promise.allSettled
        Promise.allSettled([
          fetchObservationsForRegion(gpsRegion, 'recent', undefined, true),
          fetchHotspotsForRegion(gpsRegion),
        ]).then(([obsRes, spotsRes]) => {
          if (obsRes.status === 'fulfilled' && obsRes.value && obsRes.value.length > 0) {
            setObservations(obsRes.value);
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
  };

  // Reset to Default View handler for Error Boundary recovery
  const handleResetToDefault = () => {
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
    setObservations(INITIAL_FALLBACK_OBSERVATIONS || []);
    setHotspots(MOCK_HOTSPOTS || []);
    setPinnedMeetup(null);
  };

  // Close welcome location modal and mark session
  const handleDismissLocationModal = () => {
    setIsLocationModalOpen(false);
    try {
      sessionStorage.setItem('birdbook_welcome_dismissed', 'true');
    } catch (e) {
      console.error(e);
    }
  };

  // Field Chat: Check/Request Disclaimer agreement
  const handleRequestDisclaimer = (): boolean => {
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
  };

  // Field Chat: Check/Request Handle creation
  const handleRequestHandle = (): string | null => {
    if (userHandle && userHandle.trim().length >= 3) {
      return userHandle;
    }
    setIsHandleModalOpen(true);
    return null;
  };

  // Agree to legal disclaimer
  const handleAgreeDisclaimer = () => {
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
  };

  // Save permanent handle & home region
  const handleSaveHandle = (handle: string, homeRegion: string) => {
    setUserHandle(handle);
    setUserHomeRegion(homeRegion);
    try {
      localStorage.setItem(STORAGE_KEY_HANDLE, handle);
      localStorage.setItem(STORAGE_KEY_HOME_REGION, homeRegion);
    } catch (e) {
      console.error(e);
    }
    setIsHandleModalOpen(false);
  };

  // Clear species filter and restore all regional observations
  const handleClearSpeciesFilter = () => {
    setSelectedSpecies(null);
    setSearchFilter('');
    if (mode === 'species') {
      setMode('recent');
    }
  };

  // Open Field Chat Drawer
  const handleOpenChat = () => {
    const isAgreed = handleRequestDisclaimer();
    if (isAgreed) {
      setIsChatOpen(true);
    }
  };

  // Pin proposed meetup to map
  const handlePinMeetupToMap = (meetup: MeetupProposal) => {
    setPinnedMeetup(meetup);
    if (meetup.lat && meetup.lng) {
      setSelectedItem(null);
    }
  };

  // Null-safe nationwide search, Mega-Roosts (>250), and "Best to View Right Now" active filtering
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

      const newObs: Observation = {
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

      setObservations((prev) => [newObs, ...(prev || [])]);
      setSelectedItem(newObs);
      setIsReportModalOpen(false);
    } catch (err) {
      console.error('Failed to report sighting:', err);
    }
  };

  const handleOpenAiWithQuestion = (question: string) => {
    setAiCustomQuestion(question);
    setIsAiWidgetOpen(true);
  };

  return (
    <ErrorBoundary onReset={handleResetToDefault}>
      <div className="flex flex-col w-full h-screen min-h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
        {/* Clean Header: Logo, Search Bar, and Region Selector */}
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
            setObservations(INITIAL_FALLBACK_OBSERVATIONS || []);
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
        />

        {/* Main View Area */}
        <div className="flex-1 w-full h-full relative flex overflow-hidden">
          {/* Clickable Mobile Backdrop Overlay behind Sidebar */}
          {isSidebarOpen && (
            <div 
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          {/* Collapsible Left Intelligence Sidebar */}
          <Sidebar
            isOpen={isSidebarOpen}
            onToggle={() => setIsSidebarOpen((prev) => !prev)}
            onClose={() => setIsSidebarOpen(false)}
            mode={mode}
            observations={displayedObservations || []}
            hotspots={hotspots || []}
            selectedItem={selectedItem}
            onSelectItem={(item) => {
              setSelectedItem(item);
              setSelectedCorridor(null);
              if (typeof window !== 'undefined' && window.innerWidth < 768) {
                setIsSidebarOpen(false);
              }
            }}
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
            filterBestNow={filterBestNow}
            onToggleFilterBestNow={() => setFilterBestNow((prev) => !prev)}
            filterMegaRoosts={filterMegaRoosts}
            onToggleFilterMegaRoosts={() => setFilterMegaRoosts((prev) => !prev)}
            currentRegion={currentRegion}
            onClearSpeciesFilter={handleClearSpeciesFilter}
            totalUnfilteredCount={observations?.length || 0}
            selectedSpecies={selectedSpecies}
            searchFilter={searchFilter}
            onOpenShare={() => setIsShareModalOpen(true)}
            onOpenDonate={() => setIsDonateModalOpen(true)}
          />

          {/* 100% Viewport Height Leaflet Map Container */}
          <div className="flex-1 w-full h-full min-w-0 relative">
            <Map
              observations={displayedObservations || []}
              hotspots={hotspots || []}
              selectedItem={selectedItem}
              mode={mode}
              onSelectItem={(item) => {
                setSelectedItem(item);
                setSelectedCorridor(null);
              }}
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

        {/* Regional Community Meetup & Field Chat Drawer */}
        <FieldChatDrawer
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          currentRegion={currentRegion}
          nearbyHotspots={hotspots || []}
          onPinMeetupToMap={handlePinMeetupToMap}
          onRequestDisclaimer={handleRequestDisclaimer}
          onRequestHandle={handleRequestHandle}
          homeRegion={userHomeRegion}
        />

        {/* Explicit Legal Liability & Outdoor Excursion Disclaimer Modal */}
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
            setObservations(INITIAL_FALLBACK_OBSERVATIONS || []);
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

        {/* Gemini AI Roost Intelligence & Optimal Viewing Forecast Widget */}
        <AiRoostWidget
          isOpen={isAiWidgetOpen}
          onClose={() => setIsAiWidgetOpen(false)}
          initialQuestion={aiCustomQuestion}
          observations={observations || []}
          filterBestNow={filterBestNow}
          onToggleFilterBestNow={() => setFilterBestNow((prev) => !prev)}
        />

        {/* Share Modal with Dynamic & Crisp QR Code Display */}
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          appName="The Burd"
        />

        {/* PayPal Custom Amount Donation Modal */}
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
            if (isChatOpen) {
              setIsChatOpen(false);
            } else {
              handleOpenChat();
            }
            setIsLayersOpen(false);
          }}
          isLayersOpen={isLayersOpen}
          onToggleLayers={() => {
            setIsLayersOpen((prev) => !prev);
          }}
          observationsCount={displayedObservations?.length || 0}
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
        />
      </div>
    </ErrorBoundary>
  );
};

export default App;
