import React from 'react';
import { Observation, Hotspot, ViewMode, TaxonomyItem } from '../types/bird';
import { SightingCard } from './SightingCard';
import {
  ClipboardList,
  MessageSquare,
  Layers,
  X,
  RotateCcw,
  Wind,
  Flame,
  Radio,
  Compass,
  AlertTriangle,
  MapPin,
  Sparkles,
} from 'lucide-react';

export type MobileTab = 'sightings' | 'chat' | 'layers' | null;

interface MobileBottomNavProps {
  activeTab: MobileTab;
  onSelectTab: (tab: MobileTab) => void;
  // Sightings data
  observations: Observation[];
  hotspots?: Hotspot[];
  selectedItem: Observation | Hotspot | null;
  onSelectItem: (item: Observation | Hotspot) => void;
  mode: ViewMode;
  isLoading?: boolean;
  // Layers & Filters data
  showFlightPaths: boolean;
  onToggleFlightPaths: () => void;
  filterMegaRoosts: boolean;
  onToggleFilterMegaRoosts: () => void;
  showDopplerRadar: boolean;
  onToggleDopplerRadar: () => void;
  onSetMode: (mode: ViewMode) => void;
  filterBestNow: boolean;
  onToggleFilterBestNow: () => void;
  selectedSpecies: TaxonomyItem | null;
  onClearSpeciesFilter: () => void;
  searchFilter: string;
  onResetAllFilters: () => void;
  corridorsCount?: number;
  megaRoostCount?: number;
  // Chat content renderer or slot
  chatSlot?: React.ReactNode;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  observations,
  hotspots = [],
  selectedItem,
  onSelectItem,
  mode,
  isLoading = false,
  showFlightPaths,
  onToggleFlightPaths,
  filterMegaRoosts,
  onToggleFilterMegaRoosts,
  showDopplerRadar,
  onToggleDopplerRadar,
  onSetMode,
  filterBestNow,
  onToggleFilterBestNow,
  selectedSpecies,
  onClearSpeciesFilter,
  searchFilter,
  onResetAllFilters,
  corridorsCount = 0,
  megaRoostCount = 0,
  chatSlot,
}) => {
  const activeFiltersCount =
    (filterMegaRoosts ? 1 : 0) +
    (showDopplerRadar ? 1 : 0) +
    (!showFlightPaths ? 1 : 0) +
    (filterBestNow ? 1 : 0) +
    (mode !== 'recent' ? 1 : 0) +
    (selectedSpecies || searchFilter ? 1 : 0);

  const handleCardClick = (item: Observation | Hotspot) => {
    onSelectItem(item);
    // Auto-close the drawer so user sees the map flying to the marker and opening popup
    onSelectTab(null);
  };

  return (
    <>
      {/* 1. Compact Floating Action Pill Centered at Bottom of Mobile Screen */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 md:hidden pointer-events-auto">
        <nav
          aria-label="Mobile Navigation"
          className="flex items-center gap-1 bg-slate-950/90 backdrop-blur-xl border border-slate-750/90 rounded-full p-1.5 shadow-2xl shadow-black/80 ring-1 ring-white/10"
        >
          {/* [ 📋 Sightings ] */}
          <button
            onClick={() => onSelectTab(activeTab === 'sightings' ? null : 'sightings')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 ${
              activeTab === 'sightings'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-850'
            }`}
          >
            <ClipboardList size={14} />
            <span>Sightings</span>
            <span className={`text-[10px] px-1 rounded-full font-mono ${activeTab === 'sightings' ? 'bg-slate-950/30 text-slate-950' : 'bg-slate-800 text-emerald-400'}`}>
              {observations.length}
            </span>
          </button>

          {/* [ 💬 Field Chat ] */}
          <button
            onClick={() => onSelectTab(activeTab === 'chat' ? null : 'chat')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 ${
              activeTab === 'chat'
                ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-850'
            }`}
          >
            <MessageSquare size={14} />
            <span>Field Chat</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          </button>

          {/* [ ⚙️ Layers ] */}
          <button
            onClick={() => onSelectTab(activeTab === 'layers' ? null : 'layers')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 ${
              activeTab === 'layers'
                ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-850'
            }`}
          >
            <Layers size={14} />
            <span>Layers</span>
            {activeFiltersCount > 0 && (
              <span className={`text-[10px] px-1 rounded-full font-mono font-black ${activeTab === 'layers' ? 'bg-slate-950/30 text-slate-950' : 'bg-sky-500/30 text-sky-300'}`}>
                {activeFiltersCount}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* 2. Outside-Tap Backdrop (immediately dismisses bottom drawer) */}
      {activeTab !== null && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => onSelectTab(null)}
          aria-label="Close bottom drawer"
        />
      )}

      {/* 3. Smooth Bottom Drawer Covering at Most 60% of Screen */}
      {activeTab !== null && (
        <div className="fixed inset-x-0 bottom-0 z-50 md:hidden bg-slate-950/95 border-t border-slate-750 backdrop-blur-2xl rounded-t-3xl shadow-2xl max-h-[60vh] h-[60vh] flex flex-col overflow-hidden text-slate-100 animate-in slide-in-from-bottom duration-300 ease-out">
          
          {/* Grab Handle */}
          <div className="flex justify-center pt-2.5 pb-1 shrink-0">
            <div className="w-10 h-1 bg-slate-700 rounded-full" />
          </div>

          {/* ================= SIGHTINGS DRAWER ================= */}
          {activeTab === 'sightings' && (
            <div className="flex flex-col h-full overflow-hidden">
              {/* Drawer Header */}
              <div className="px-4 py-2.5 border-b border-slate-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                    <ClipboardList size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                      <span>Recent Sightings</span>
                      <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-800/40">
                        {mode === 'hotspots' ? `${hotspots.length} Hotspots` : `${observations.length} Reports`}
                      </span>
                    </h3>
                  </div>
                </div>

                <button
                  onClick={() => onSelectTab(null)}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200"
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Scrollable Observation Feed */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {isLoading && (
                  <div className="flex items-center justify-center py-10 text-xs text-slate-400 gap-2">
                    <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading sightings...</span>
                  </div>
                )}

                {mode === 'hotspots' &&
                  hotspots.map((spot) => (
                    <SightingCard
                      key={spot.locId}
                      item={spot}
                      isSelected={selectedItem && 'locId' in selectedItem && selectedItem.locId === spot.locId}
                      onClick={() => handleCardClick(spot)}
                    />
                  ))}

                {mode !== 'hotspots' &&
                  observations.map((obs) => (
                    <SightingCard
                      key={obs.id}
                      item={obs}
                      isSelected={selectedItem && 'id' in selectedItem && selectedItem.id === obs.id}
                      onClick={() => handleCardClick(obs)}
                    />
                  ))}

                {!isLoading && observations.length === 0 && (
                  <div className="text-center py-12 text-xs text-slate-400">
                    No sightings found matching active filters.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= FIELD CHAT DRAWER ================= */}
          {activeTab === 'chat' && (
            <div className="flex flex-col h-full overflow-hidden">
              <div className="px-4 py-2.5 border-b border-slate-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400">
                    <MessageSquare size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                      <span>Field Chat & Meetups</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    </h3>
                  </div>
                </div>

                <button
                  onClick={() => onSelectTab(null)}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200"
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Chat View Slot */}
              <div className="flex-1 overflow-y-auto min-h-0">
                {chatSlot}
              </div>
            </div>
          )}

          {/* ================= LAYERS & FILTERS DRAWER ================= */}
          {activeTab === 'layers' && (
            <div className="flex flex-col h-full overflow-hidden">
              <div className="px-4 py-2.5 border-b border-slate-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
                    <Layers size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                      <span>Layers & Filters</span>
                      {activeFiltersCount > 0 && (
                        <span className="text-[10px] bg-sky-500/20 text-sky-300 font-bold px-1.5 py-0.2 rounded border border-sky-500/30">
                          {activeFiltersCount} Active
                        </span>
                      )}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={onResetAllFilters}
                    className="flex items-center gap-1 px-2.5 py-1 bg-rose-500/15 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-bold active:scale-95"
                    title="Reset all filters"
                  >
                    <RotateCcw size={11} />
                    <span>Reset All</span>
                  </button>
                  <button
                    onClick={() => onSelectTab(null)}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200"
                    aria-label="Close"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Scrollable Layer & Filter Options */}
              <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
                {/* 1. Map Layers */}
                <div className="space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Map Layers
                  </div>

                  {/* Flight Corridors */}
                  <div
                    onClick={onToggleFlightPaths}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`p-1.5 rounded-lg ${showFlightPaths ? 'bg-sky-500/15 text-sky-400' : 'bg-slate-800 text-slate-400'}`}>
                        <Wind size={16} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-200">Flight Corridors ({corridorsCount})</div>
                        <div className="text-[11px] text-slate-400">Flyways & staging vectors</div>
                      </div>
                    </div>
                    <div className={`w-10 h-5 rounded-full relative p-0.5 flex items-center ${showFlightPaths ? 'bg-sky-500 justify-end' : 'bg-slate-700 justify-start'}`}>
                      <div className="w-4 h-4 rounded-full bg-white shadow-md" />
                    </div>
                  </div>

                  {/* Mega-Roosts */}
                  <div
                    onClick={onToggleFilterMegaRoosts}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`p-1.5 rounded-lg ${filterMegaRoosts ? 'bg-rose-500/15 text-rose-400' : 'bg-slate-800 text-slate-400'}`}>
                        <Flame size={16} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-200">Roosting Sites ({megaRoostCount})</div>
                        <div className="text-[11px] text-slate-400">Mega-roosts &gt;250 birds</div>
                      </div>
                    </div>
                    <div className={`w-10 h-5 rounded-full relative p-0.5 flex items-center ${filterMegaRoosts ? 'bg-rose-500 justify-end' : 'bg-slate-700 justify-start'}`}>
                      <div className="w-4 h-4 rounded-full bg-white shadow-md" />
                    </div>
                  </div>

                  {/* Doppler Radar */}
                  <div
                    onClick={onToggleDopplerRadar}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`p-1.5 rounded-lg ${showDopplerRadar ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                        <Radio size={16} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-200">Doppler Radar (NEXRAD)</div>
                        <div className="text-[11px] text-slate-400">Weather & migration biomass</div>
                      </div>
                    </div>
                    <div className={`w-10 h-5 rounded-full relative p-0.5 flex items-center ${showDopplerRadar ? 'bg-emerald-500 justify-end' : 'bg-slate-700 justify-start'}`}>
                      <div className="w-4 h-4 rounded-full bg-white shadow-md" />
                    </div>
                  </div>
                </div>

                {/* 2. Feed Mode */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Observation Feed
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      onClick={() => onSetMode('recent')}
                      className={`py-2 px-1 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1 ${
                        mode === 'recent' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      <Compass size={13} />
                      <span>Recent</span>
                    </button>
                    <button
                      onClick={() => onSetMode('notable')}
                      className={`py-2 px-1 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1 ${
                        mode === 'notable' ? 'bg-pink-500/20 border-pink-500 text-pink-300' : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      <AlertTriangle size={13} />
                      <span>Notable</span>
                    </button>
                    <button
                      onClick={() => onSetMode('hotspots')}
                      className={`py-2 px-1 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1 ${
                        mode === 'hotspots' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      <MapPin size={13} />
                      <span>Hotspots</span>
                    </button>
                  </div>
                </div>

                {/* 3. Best Right Now & Species Status */}
                <div className="space-y-2">
                  <div
                    onClick={onToggleFilterBestNow}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`p-1.5 rounded-lg ${filterBestNow ? 'bg-amber-500/15 text-amber-400' : 'bg-slate-800 text-slate-400'}`}>
                        <Sparkles size={16} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-200">Best Right Now</div>
                        <div className="text-[11px] text-slate-400">Optimal viewing time window</div>
                      </div>
                    </div>
                    <div className={`w-10 h-5 rounded-full relative p-0.5 flex items-center ${filterBestNow ? 'bg-amber-500 justify-end' : 'bg-slate-700 justify-start'}`}>
                      <div className="w-4 h-4 rounded-full bg-white shadow-md" />
                    </div>
                  </div>

                  {(selectedSpecies || searchFilter) && (
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <div className="text-slate-400 text-[10px]">Active Species Filter:</div>
                        <div className="font-bold text-emerald-400">{selectedSpecies ? selectedSpecies.comName : searchFilter}</div>
                      </div>
                      <button
                        onClick={onClearSpeciesFilter}
                        className="px-2 py-1 bg-slate-800 text-slate-300 rounded font-semibold border border-slate-700 text-xs"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};
