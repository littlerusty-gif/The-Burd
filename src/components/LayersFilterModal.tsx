import React from 'react';
import { ViewMode, TaxonomyItem } from '../types/bird';
import {
  X,
  RotateCcw,
  Wind,
  Radio,
  Flame,
  Sparkles,
  Layers,
  Compass,
  AlertTriangle,
  MapPin,
  Check,
} from 'lucide-react';

interface LayersFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  showFlightPaths: boolean;
  onToggleFlightPaths: () => void;
  filterMegaRoosts: boolean;
  onToggleFilterMegaRoosts: () => void;
  showDopplerRadar: boolean;
  onToggleDopplerRadar: () => void;
  mode: ViewMode;
  onSetMode: (mode: ViewMode) => void;
  filterBestNow: boolean;
  onToggleFilterBestNow: () => void;
  selectedSpecies: TaxonomyItem | null;
  onClearSpeciesFilter: () => void;
  searchFilter: string;
  onResetAllFilters: () => void;
  corridorsCount?: number;
  megaRoostCount?: number;
}

export const LayersFilterModal: React.FC<LayersFilterModalProps> = ({
  isOpen,
  onClose,
  showFlightPaths,
  onToggleFlightPaths,
  filterMegaRoosts,
  onToggleFilterMegaRoosts,
  showDopplerRadar,
  onToggleDopplerRadar,
  mode,
  onSetMode,
  filterBestNow,
  onToggleFilterBestNow,
  selectedSpecies,
  onClearSpeciesFilter,
  searchFilter,
  onResetAllFilters,
  corridorsCount = 0,
  megaRoostCount = 0,
}) => {
  if (!isOpen) return null;

  const activeFiltersCount =
    (filterMegaRoosts ? 1 : 0) +
    (showDopplerRadar ? 1 : 0) +
    (!showFlightPaths ? 1 : 0) +
    (filterBestNow ? 1 : 0) +
    (mode !== 'recent' ? 1 : 0) +
    (selectedSpecies || searchFilter ? 1 : 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      {/* Outside-Tap Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-label="Close layers modal"
      />

      {/* Modal / Slide-up Drawer Container */}
      <div className="relative z-10 w-full md:max-w-lg bg-slate-900/95 border-t md:border border-slate-750 backdrop-blur-xl md:rounded-2xl rounded-t-2xl shadow-2xl max-h-[85vh] md:max-h-[80vh] flex flex-col overflow-hidden text-slate-100 animate-in slide-in-from-bottom md:zoom-in-95 duration-200">
        
        {/* Grab Handle for Mobile */}
        <div className="flex justify-center pt-2.5 pb-1 md:hidden">
          <div className="w-10 h-1 bg-slate-700 rounded-full" />
        </div>

        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Layers size={18} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
                <span>Layers & Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {activeFiltersCount} Active
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">Configure map overlays and observation filters</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-750 transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Prominent Reset All Filters Banner */}
        <div className="px-4 py-2.5 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            {activeFiltersCount > 0 ? (
              <span className="text-amber-400 font-medium">{activeFiltersCount} customized filter(s) active</span>
            ) : (
              <span>All layers and filters in default state</span>
            )}
          </div>

          <button
            onClick={onResetAllFilters}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 hover:text-rose-200 text-xs font-bold rounded-lg transition-all active:scale-95 shadow-sm"
            title="Reset all filters and layers to default"
          >
            <RotateCcw size={13} />
            <span>Reset All Filters</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {/* Section 1: Map Layers & Telemetry */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
              <span>Map Overlays & Telemetry</span>
            </div>

            <div className="space-y-2">
              {/* Flight Corridors Toggle */}
              <div
                onClick={onToggleFlightPaths}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-850/80 border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${showFlightPaths ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30' : 'bg-slate-800 text-slate-400'}`}>
                    <Wind size={18} className={showFlightPaths ? 'animate-pulse' : ''} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                      <span>Flight Corridors</span>
                      <span className="text-[10px] text-sky-400 font-mono">({corridorsCount} flyways)</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Show vector routes and staging directions
                    </div>
                  </div>
                </div>

                <div className={`w-11 h-6 rounded-full transition-colors relative p-0.5 flex items-center ${showFlightPaths ? 'bg-sky-500 justify-end' : 'bg-slate-700 justify-start'}`}>
                  <div className="w-5 h-5 rounded-full bg-white shadow-md transform transition-transform" />
                </div>
              </div>

              {/* Roosting Sites (Mega-Roosts) Toggle */}
              <div
                onClick={onToggleFilterMegaRoosts}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-850/80 border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${filterMegaRoosts ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' : 'bg-slate-800 text-slate-400'}`}>
                    <Flame size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                      <span>Roosting Sites (Mega-Roosts)</span>
                      <span className="text-[10px] text-rose-400 font-mono">({megaRoostCount} gatherings)</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Isolate major roosts with 250+ birds
                    </div>
                  </div>
                </div>

                <div className={`w-11 h-6 rounded-full transition-colors relative p-0.5 flex items-center ${filterMegaRoosts ? 'bg-rose-500 justify-end' : 'bg-slate-700 justify-start'}`}>
                  <div className="w-5 h-5 rounded-full bg-white shadow-md transform transition-transform" />
                </div>
              </div>

              {/* Doppler Radar Overlay Toggle */}
              <div
                onClick={onToggleDopplerRadar}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-850/80 border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${showDopplerRadar ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'}`}>
                    <Radio size={18} className={showDopplerRadar ? 'animate-pulse' : ''} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                      <span>Doppler Radar</span>
                      <span className="text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 px-1 py-0.2 rounded border border-emerald-500/30">NEXRAD</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Live weather & nocturnal migration radar tiles
                    </div>
                  </div>
                </div>

                <div className={`w-11 h-6 rounded-full transition-colors relative p-0.5 flex items-center ${showDopplerRadar ? 'bg-emerald-500 justify-end' : 'bg-slate-700 justify-start'}`}>
                  <div className="w-5 h-5 rounded-full bg-white shadow-md transform transition-transform" />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Observation Categories */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">
              Observation Feed Mode
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => onSetMode('recent')}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center gap-1.5 transition-all ${
                  mode === 'recent'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md ring-1 ring-emerald-500/30'
                    : 'bg-slate-850/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <Compass size={16} className={mode === 'recent' ? 'text-emerald-400' : ''} />
                <span>Recent</span>
              </button>

              <button
                onClick={() => onSetMode('notable')}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center gap-1.5 transition-all ${
                  mode === 'notable'
                    ? 'bg-pink-500/20 border-pink-500 text-pink-300 shadow-md ring-1 ring-pink-500/30'
                    : 'bg-slate-850/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <AlertTriangle size={16} className={mode === 'notable' ? 'text-pink-400' : ''} />
                <span>Notable & Rare</span>
              </button>

              <button
                onClick={() => onSetMode('hotspots')}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center gap-1.5 transition-all ${
                  mode === 'hotspots'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md ring-1 ring-emerald-500/30'
                    : 'bg-slate-850/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <MapPin size={16} className={mode === 'hotspots' ? 'text-emerald-400' : ''} />
                <span>Hotspots</span>
              </button>
            </div>
          </div>

          {/* Section 3: Smart Filters */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">
              Viewing Enhancements
            </div>

            <div className="space-y-2">
              {/* Best Right Now Toggle */}
              <div
                onClick={onToggleFilterBestNow}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-850/80 border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${filterBestNow ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' : 'bg-slate-800 text-slate-400'}`}>
                    <Sparkles size={18} className={filterBestNow ? 'animate-spin' : ''} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-100">Best Right Now</div>
                    <div className="text-[11px] text-slate-400">
                      Highlight species in their peak active viewing window
                    </div>
                  </div>
                </div>

                <div className={`w-11 h-6 rounded-full transition-colors relative p-0.5 flex items-center ${filterBestNow ? 'bg-amber-500 justify-end' : 'bg-slate-700 justify-start'}`}>
                  <div className="w-5 h-5 rounded-full bg-white shadow-md transform transition-transform" />
                </div>
              </div>

              {/* Species Filter Status */}
              {(selectedSpecies || searchFilter) && (
                <div className="p-3 rounded-xl bg-slate-850/80 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-200">
                      Species Filter Active
                    </div>
                    <div className="text-[11px] text-emerald-400 font-medium">
                      {selectedSpecies ? selectedSpecies.comName : searchFilter}
                    </div>
                  </div>

                  <button
                    onClick={onClearSpeciesFilter}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700"
                  >
                    Clear Filter
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-end">
          <button
            onClick={onClose}
            className="w-full md:w-auto px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md active:scale-95"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
