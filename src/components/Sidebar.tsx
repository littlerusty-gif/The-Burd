import React, { useState } from 'react';
import { Observation, Hotspot, ViewMode, FlightCorridor, RegionConfig } from '../types/bird';
import { SightingCard } from './SightingCard';
import {
  MapPin,
  ChevronLeft,
  ChevronRight,
  Wind,
  Activity,
  Clock,
  QrCode,
  Heart,
  X,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose?: () => void;
  mode: ViewMode;
  observations: Observation[];
  hotspots?: Hotspot[];
  selectedItem: Observation | Hotspot | null;
  onSelectItem: (item: Observation | Hotspot) => void;
  isLoading?: boolean;
  corridors?: FlightCorridor[];
  selectedCorridor?: FlightCorridor | null;
  onSelectCorridor?: (corridor: FlightCorridor) => void;
  filterBestNow?: boolean;
  onToggleFilterBestNow?: () => void;
  filterMegaRoosts?: boolean;
  onToggleFilterMegaRoosts?: () => void;
  currentRegion?: RegionConfig;
  onClearSpeciesFilter?: () => void;
  totalUnfilteredCount?: number;
  selectedSpecies?: any;
  searchFilter?: string;
  onOpenShare?: () => void;
  onOpenDonate?: () => void;
  onOpenLayersModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onToggle,
  onClose,
  mode,
  observations,
  hotspots,
  selectedItem,
  onSelectItem,
  isLoading = false,
  corridors = [],
  selectedCorridor,
  onSelectCorridor,
  currentRegion,
  onClearSpeciesFilter,
  totalUnfilteredCount = 0,
  selectedSpecies,
  searchFilter = '',
  onOpenShare,
  onOpenDonate,
  onOpenLayersModal,
}) => {
  const [activeTab, setActiveTab] = useState<'sightings' | 'influx'>('sightings');

  // Auto-close on mobile when an item or corridor is clicked
  const handleItemClick = (item: Observation | Hotspot) => {
    onSelectItem(item);
    if (typeof window !== 'undefined' && window.innerWidth < 768 && onClose) {
      onClose();
    }
  };

  const handleCorridorClick = (c: FlightCorridor) => {
    if (onSelectCorridor) onSelectCorridor(c);
    if (typeof window !== 'undefined' && window.innerWidth < 768 && onClose) {
      onClose();
    }
  };

  const safeObservations = Array.isArray(observations) ? observations : [];
  const totalBirds = safeObservations.reduce((acc, curr) => acc + (curr?.howMany || 1), 0);
  const totalCorridorBirds = (corridors || []).reduce((acc, c) => acc + (c?.estFlockSize || 0), 0);

  return (
    <>
      {/* Clickable Mobile Backdrop Overlay */}
      {isOpen && onClose && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={onClose}
          aria-label="Close sidebar"
        />
      )}

      {/* Main Sidebar Pane */}
      <aside
        className={`fixed md:relative top-0 bottom-0 left-0 z-50 md:z-10 h-full bg-slate-950/95 backdrop-blur-md border-r border-slate-800 flex flex-col transition-all duration-300 ease-in-out shrink-0 ${
          isOpen ? 'w-80 md:w-96 translate-x-0' : 'w-0 -translate-x-full md:translate-x-0 md:w-0 overflow-hidden border-none'
        }`}
      >
        {/* Navigation Tabs (Sightings vs Regional Flight Corridors) & Mobile Close Button */}
        <div className="p-2.5 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between gap-2 shrink-0">
          <div className="flex-1 grid grid-cols-2 gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('sightings')}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg transition-all ${
                activeTab === 'sightings'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity size={13} />
              <span>Sightings ({observations.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('influx')}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg transition-all ${
                activeTab === 'influx'
                  ? 'bg-sky-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Wind size={13} />
              <span>Corridors ({corridors.length})</span>
            </button>
          </div>

          {onClose && (
            <button 
              onClick={onClose} 
              aria-label="Close sidebar"
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 active:scale-95 shrink-0 flex items-center justify-center"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* ===================== TAB 1: SIGHTINGS FEED ===================== */}
        {activeTab === 'sightings' && (
          <>
            {/* Top Region & Count Banner */}
            <div className="p-3 border-b border-slate-800 bg-slate-900/60 shrink-0">
              {currentRegion && (
                <div className="mb-2 px-2.5 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin size={12} className="text-emerald-400 shrink-0" />
                    <span className="font-bold text-slate-200 truncate">{currentRegion.name}</span>
                  </div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 font-mono shrink-0">
                    {currentRegion.regionCode || currentRegion.category}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-400">
                  {mode === 'hotspots' ? 'eBird Hotspots' : `${observations.length} Sightings`}
                </span>
                <span className="font-mono text-emerald-400 font-bold">
                  {mode !== 'hotspots' && `${totalBirds.toLocaleString()} Birds Recorded`}
                </span>
              </div>
            </div>

            {/* Observation / Hotspot Scrollable List with 3-Line Clarified Cards */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {isLoading && (
                <div className="flex items-center justify-center py-10 text-xs text-slate-400 gap-2">
                  <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                  <span>Fetching live regional telemetry...</span>
                </div>
              )}

              {mode === 'hotspots' &&
                hotspots?.map((spot) => (
                  <SightingCard
                    key={spot.locId}
                    item={spot}
                    isSelected={selectedItem && 'locId' in selectedItem && selectedItem.locId === spot.locId}
                    onClick={() => handleItemClick(spot)}
                  />
                ))}

              {mode !== 'hotspots' &&
                safeObservations?.map((obs) => (
                  <SightingCard
                    key={obs.id}
                    item={obs}
                    isSelected={selectedItem && 'id' in selectedItem && selectedItem.id === obs.id}
                    onClick={() => handleItemClick(obs)}
                  />
                ))}

              {!isLoading && safeObservations?.length === 0 && (
                <div className="text-center py-12 px-3 text-xs text-slate-400 space-y-3">
                  <p>
                    {(selectedSpecies || searchFilter)
                      ? `No observations found matching "${selectedSpecies?.comName || searchFilter}".`
                      : 'No observations found matching the current filters.'}
                  </p>

                  {(selectedSpecies || searchFilter) && onClearSpeciesFilter && (
                    <button
                      onClick={onClearSpeciesFilter}
                      className="w-full py-2 px-3 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-xl font-bold text-xs transition-all active:scale-95"
                    >
                      Clear Species Filter ({totalUnfilteredCount} total)
                    </button>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* ===================== TAB 2: FLIGHT INFLUX CORRIDORS ===================== */}
        {activeTab === 'influx' && (
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs mb-2">
              <div className="text-slate-400 text-[11px] uppercase font-bold mb-1 flex items-center justify-between">
                <span>{currentRegion?.name || 'Regional'} Flight Corridors</span>
                <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800/40">
                  {corridors.length} Flyways
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Documented flight corridors & staging vectors with convergence points.
              </p>
              <div className="mt-2.5 pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-400">Estimated Total Influx:</span>
                <span className="font-extrabold text-emerald-400 font-mono">
                  ~{totalCorridorBirds.toLocaleString()} birds
                </span>
              </div>
            </div>

            {corridors.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400">
                No corridors in this immediate sector.
              </div>
            ) : (
              corridors.map((c) => {
                const isSelected = selectedCorridor?.id === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => handleCorridorClick(c)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-slate-850 border-sky-400 shadow-lg shadow-sky-500/10'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-slate-100 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                        <span className="truncate">{c.name}</span>
                      </span>
                      <span className="text-emerald-400 font-mono font-bold shrink-0">
                        ~{c.estFlockSize.toLocaleString()}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Clock size={11} className="text-slate-400" />
                        <span>{c.timeWindow}</span>
                      </span>
                      {c.state && (
                        <span className="text-[10px] uppercase font-bold text-slate-400 font-mono px-1 py-0.5 rounded bg-slate-800">
                          {c.state} • {c.flyway}
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-sky-300/90 leading-relaxed bg-slate-950/60 p-2 rounded border border-slate-800/80 mt-2">
                      {c.description}
                    </div>

                    <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/80 text-[11px] text-sky-400 font-medium mt-2">
                      <span>Tap to view on map</span>
                      <span className="text-xs">→</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Support & Community Footer */}
        {(onOpenShare || onOpenDonate) && (
          <div className="p-2.5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-2 shrink-0">
            {onOpenShare && (
              <button
                onClick={onOpenShare}
                className="flex-1 py-1.5 px-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg border border-slate-750 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                title="Share QR Code & Link"
              >
                <QrCode size={13} className="text-emerald-400" />
                <span>Share App</span>
              </button>
            )}
            {onOpenDonate && (
              <button
                onClick={onOpenDonate}
                className="flex-1 py-1.5 px-2 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 hover:text-amber-200 rounded-lg border border-amber-500/40 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm active:scale-95"
                title="Donate with PayPal"
              >
                <Heart size={13} className="text-amber-400 fill-amber-400/20" />
                <span>Donate</span>
              </button>
            )}
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;
