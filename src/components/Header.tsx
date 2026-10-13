import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ViewMode, TaxonomyItem, RegionConfig, Observation } from '../types/bird';
import { PRIMARY_REGIONS, US_STATES, NATIONWIDE_TAXONOMY } from '../data/regions';
import { Search, MapPin, Navigation, ChevronDown, Globe, X, Download } from 'lucide-react';

// Global variable to store beforeinstallprompt event across header lifecycles
let deferredPrompt: any = null;

interface HeaderProps {
  currentRegion: RegionConfig;
  onSelectRegion: (region: RegionConfig) => void;
  searchFilter: string;
  onSearchFilterChange: (val: string) => void;
  selectedSpecies: TaxonomyItem | null;
  onSelectSpecies: (species: TaxonomyItem | null) => void;
  onSetMode?: (mode: ViewMode) => void;
  onLocateMe: () => void;
  observations?: Observation[];
  // Backwards compatibility optional props
  mode?: ViewMode;
  onOpenReportModal?: () => void;
  onOpenAiWidget?: () => void;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  filterBestNow?: boolean;
  onToggleFilterBestNow?: () => void;
  isLocating?: boolean;
  onOpenChat?: () => void;
  onOpenShare?: () => void;
  onOpenDonate?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRegion,
  onSelectRegion,
  searchFilter,
  onSearchFilterChange,
  selectedSpecies,
  onSelectSpecies,
  onSetMode,
  onLocateMe,
  observations = [],
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // In-App PWA Install State
  const [canInstall, setCanInstall] = useState(false);
  const [showIosModal, setShowIosModal] = useState(false);

  // Close species autocomplete on outside click with explicit mount-only dependencies
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // PWA beforeinstallprompt and iOS Safari detection
  useEffect(() => {
    // If already running in standalone mode, keep install button hidden
    const isStandalone = typeof window !== 'undefined' && (
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true
    );

    if (isStandalone) {
      setCanInstall(false);
      return;
    }

    // Check iOS Safari (beforeinstallprompt is not supported on iOS Safari)
    const isIos = typeof navigator !== 'undefined' && (
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    );

    if (isIos && !isStandalone) {
      setCanInstall(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the browser default banner
      e.preventDefault();
      // Store event in global variable
      deferredPrompt = e;
      // Reveal the button
      setCanInstall(true);
    };

    const handleAppInstalled = () => {
      deferredPrompt = null;
      setCanInstall(false);
      setShowIosModal(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Handle clicking the In-App Install Button
  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult && choiceResult.outcome === 'accepted') {
        setCanInstall(false);
        deferredPrompt = null;
      }
    } else {
      // Fallback for iOS Safari or unsupported prompt
      setShowIosModal(true);
    }
  };

  // Compute active region dropdown value
  const currentRegionValue = useMemo(() => {
    if (currentRegion.category === 'gps') return 'gps';
    if (currentRegion.id === 'portland' || currentRegion.regionCode === 'US-OR-051') return 'portland';
    if (currentRegion.regionCode === 'US-WA' || currentRegion.id === 'state-us-wa') return 'US-WA';
    if (currentRegion.regionCode === 'US-OR' || currentRegion.id === 'state-us-or') return 'US-OR';
    if (currentRegion.regionCode === 'US' || currentRegion.id === 'nationwide') return 'US';
    return currentRegion.regionCode || currentRegion.id;
  }, [currentRegion]);

  // Synchronized dropdown selection handler
  const handleDropdownSelect = (val: string) => {
    onSelectSpecies(null);
    onSearchFilterChange('');
    if (onSetMode) {
      onSetMode('recent');
    }

    if (val === 'gps') {
      onLocateMe();
    } else if (val === 'portland') {
      const portland = PRIMARY_REGIONS.find((r) => r.id === 'portland') || PRIMARY_REGIONS[1] || PRIMARY_REGIONS[0];
      onSelectRegion(portland);
    } else if (val === 'US-WA') {
      const wa: RegionConfig = {
        id: 'state-us-wa',
        name: 'Washington State (US-WA)',
        category: 'state',
        regionCode: 'US-WA',
        center: [47.5000, -120.5000],
        zoom: 7,
        bounds: [[45.54, -124.85], [49.00, -116.92]],
        description: 'Puget Sound, Cascades, Olympic Peninsula, Skagit Flats & Columbia Basin flyways.',
        endpoint: 'data/obs/US-WA/recent/notable?detail=full&back=7',
      };
      onSelectRegion(wa);
    } else if (val === 'US-OR') {
      const or = PRIMARY_REGIONS.find((r) => r.regionCode === 'US-OR') || {
        id: 'state-us-or',
        name: 'Oregon State (US-OR)',
        category: 'state',
        regionCode: 'US-OR',
        center: [43.8041, -120.5542],
        zoom: 7,
        bounds: [[41.99, -124.57], [46.24, -116.46]],
        description: 'Oregon coast, Willamette Valley, Cascades, and High Desert.',
        endpoint: 'data/obs/US-OR/recent/notable?detail=full&back=7',
      };
      onSelectRegion(or);
    } else if (val === 'US' || val === 'nationwide') {
      const nation = PRIMARY_REGIONS.find((r) => r.regionCode === 'US') || {
        id: 'nationwide',
        name: 'Nationwide Rare & Notable (US)',
        category: 'nationwide',
        regionCode: 'US',
        center: [39.8283, -98.5795],
        zoom: 4,
        bounds: [[24.39, -125.0], [49.38, -66.93]],
        description: 'Live alerts across the United States.',
        endpoint: 'data/obs/US/recent/notable?detail=full&back=7',
      };
      onSelectRegion(nation);
    } else {
      const st = US_STATES.find((s) => s.code === val);
      if (st) {
        onSelectRegion({
          id: `state-${st.code.toLowerCase()}`,
          name: `${st.code} - ${st.name}`,
          category: 'state',
          regionCode: st.code,
          center: st.center,
          zoom: st.zoom,
          bounds: st.bounds,
          description: `Live observations from ${st.name} (${st.code}).`,
          endpoint: `data/obs/${st.code}/recent/notable?detail=full&back=7`,
        });
      }
    }
  };

  // Combined nationwide taxonomy + observed species for autocomplete
  const combinedTaxonomy = useMemo(() => {
    const map = new Map<string, TaxonomyItem>();
    NATIONWIDE_TAXONOMY.forEach((t) => map.set(t.speciesCode.toLowerCase(), t));
    observations.forEach((obs) => {
      const code = obs.speciesCode.toLowerCase();
      if (!map.has(code)) {
        map.set(code, {
          comName: obs.comName.replace(/\(Community Sighting\)/g, '').trim(),
          sciName: obs.sciName,
          speciesCode: obs.speciesCode,
        });
      }
    });
    return Array.from(map.values());
  }, [observations]);

  // Filtered taxonomy matches for search bar
  const filteredTaxonomy = useMemo(() => {
    const q = searchFilter.toLowerCase().trim();
    if (!q) return [];
    return combinedTaxonomy
      .filter(
        (item) =>
          item.comName.toLowerCase().includes(q) ||
          item.sciName.toLowerCase().includes(q) ||
          item.speciesCode.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [searchFilter, combinedTaxonomy]);

  const getRegionIcon = (region: RegionConfig) => {
    if (region.category === 'gps') return <Navigation size={14} className="text-sky-400" />;
    if (region.category === 'metro') return <MapPin size={14} className="text-emerald-400" />;
    if (region.regionCode === 'US-WA') return <MapPin size={14} className="text-teal-400" />;
    if (region.category === 'state') return <MapPin size={14} className="text-amber-400" />;
    return <Globe size={14} className="text-purple-400" />;
  };

  return (
    <>
      <header className="bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80 text-slate-100 px-3 md:px-5 py-2.5 z-30 fixed md:relative top-0 inset-x-0 shadow-lg w-full">
        <div className="w-full max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-4">
          {/* 1. Logo & App Brand */}
          <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center">
            <img
              src="/logo.svg"
              alt="The Burd Logo"
              className="w-7 h-7 sm:w-8 sm:h-8 object-contain drop-shadow-md shrink-0"
            />
            <div>
              <h1 className="font-extrabold text-sm sm:text-base tracking-tight flex items-center gap-1.5">
                <span>The Burd</span>
                <span className="text-[9px] uppercase font-bold tracking-widest bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  USA
                </span>
              </h1>
            </div>
          </div>

          {/* 2. Simple, Fast Autocomplete Search Bar */}
          <div className="relative flex-1 w-full sm:max-w-md" ref={dropdownRef}>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => {
                  onSearchFilterChange(e.target.value);
                  setIsDropdownOpen(true);
                }}
                onFocus={() => setIsDropdownOpen(true)}
                placeholder="Search bird or species (Crow, Swift, Falcon)..."
                className="w-full bg-slate-900/90 border border-slate-750 focus:border-emerald-500 rounded-lg pl-8 pr-7 py-1.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
              />
              {(searchFilter || selectedSpecies) && (
                <button
                  type="button"
                  onClick={() => {
                    onSearchFilterChange('');
                    onSelectSpecies(null);
                  }}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-200"
                  title="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Species Dropdown Menu */}
            {isDropdownOpen && filteredTaxonomy.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-750 rounded-lg shadow-xl overflow-hidden z-50 max-h-60 overflow-y-auto">
                <div className="p-1.5 text-[11px] font-semibold text-slate-400 border-b border-slate-800 flex justify-between">
                  <span>Species Matches</span>
                  <span className="text-[10px] text-emerald-400 font-normal">Select to isolate on map</span>
                </div>
                {filteredTaxonomy.map((item) => (
                  <button
                    type="button"
                    key={item.speciesCode}
                    onClick={() => {
                      onSelectSpecies(item);
                      onSearchFilterChange(item.comName);
                      setIsDropdownOpen(false);
                      if (onSetMode) onSetMode('species');
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-800 flex items-center justify-between text-xs transition-colors"
                  >
                    <div>
                      <span className="font-bold text-slate-100">{item.comName}</span>
                      <span className="text-slate-400 italic text-[11px] ml-1.5">{item.sciName}</span>
                    </div>
                    <span className="bg-slate-800 text-emerald-400 text-[10px] px-1.5 py-0.5 rounded font-mono font-bold">
                      {item.speciesCode}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 3. Top Controls: In-App Install Button & Region Selector Dropdown */}
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
            {/* In-App Install Button: default style display: none, revealed on confirmed support */}
            <button
              type="button"
              id="pwa-install-button"
              onClick={handleInstallClick}
              style={{ display: canInstall ? 'inline-flex' : 'none' }}
              className="items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg transition-all shadow-sm active:scale-95 shrink-0"
              title="Install The Burd App"
            >
              <Download size={14} />
              <span>Install App</span>
            </button>

            {/* Region Selector Dropdown */}
            <div className="relative flex items-center shrink-0 flex-1 sm:flex-initial">
              <div className="absolute left-2.5 pointer-events-none text-slate-400 z-10">
                {getRegionIcon(currentRegion)}
              </div>
              <select
                id="region-selector"
                data-testid="region-selector"
                aria-label="Region Selector"
                value={currentRegionValue}
                onChange={(e) => handleDropdownSelect(e.target.value)}
                className="w-full sm:w-auto pl-8 pr-7 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-750 hover:border-slate-600 focus:border-emerald-500 rounded-lg text-xs font-semibold text-slate-200 transition-colors shadow-sm appearance-none cursor-pointer focus:outline-none"
              >
                <option value="gps">Current Location (GPS Nearby)</option>
                <option value="portland">Portland Metro (Roost Focus)</option>
                <option value="US">Nationwide Rare & Notable (US)</option>
                <optgroup label="All 50 US States">
                  {US_STATES.map((st) => (
                    <option key={st.code} value={st.code}>
                      {st.code} - {st.name}
                    </option>
                  ))}
                </optgroup>
              </select>
              <ChevronDown size={14} className="absolute right-2.5 pointer-events-none text-slate-400 z-10" />
            </div>
          </div>
        </div>
      </header>

      {/* iOS Safari Installation Fallback Modal */}
      {showIosModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setShowIosModal(false)}
        >
          <div
            className="bg-slate-900 border border-slate-750 rounded-2xl p-5 max-w-sm w-full shadow-2xl text-slate-100 flex flex-col gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-emerald-400 flex items-center gap-1.5">
                <span>📲 Install The Burd</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowIosModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
                title="Close"
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              To install The Burd: tap the Share icon and select &apos;Add to Home Screen&apos;.
            </p>
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setShowIosModal(false)}
                className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg active:scale-95 transition-all shadow-sm"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
