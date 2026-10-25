import React, { useState, useMemo } from 'react';
import { Observation, Hotspot, ViewMode, FlightCorridor, RegionConfig } from '../types/bird';
import { SightingCard } from './SightingCard';
import {
  MapPin,
  Wind,
  Activity,
  Clock,
  QrCode,
  Heart,
  X,
  Flame,
  Compass,
  Navigation,
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

function getCompassHeading(deg: number = 0): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(deg / 22.5) % 16;
  return directions[index];
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
  const [activeTab, setActiveTab] = useState<'sightings' | 'roosts' | 'corridors'>('sightings');

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
  const roostObservations = useMemo(() => {
    return safeObservations.filter((obs) => obs.isCrowRoost || (obs.howMany || 1) >= 250);
  }, [safeObservations]);

  const totalBirds = safeObservations.reduce((acc, curr) => acc + (curr?.howMany || 1), 0);
  const totalCorridorBirds = (corridors || []).reduce((acc, c) => acc + (c?.estFlockSize || 0), 0);
  const totalRoostBirds = roostObservations.reduce((acc, curr) => acc + (curr?.howMany || 1), 0);

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
        className={`fixed md:relative top-0 bottom-0 left-0 z-50 md:z-10 h-full bg-slate-950/98 backdrop-blur-xl border-r border-slate-800 flex flex-col transition-all duration-300 ease-in-out shrink-0 ${
          isOpen ? 'w-80 md:w-96 translate-x-0' : 'w-0 -translate-x-full md:translate-x-0 md:w-0 overflow-hidden border-none'
        }`}
      >
        {/* Navigation Tabs (Sightings vs Roosts vs Flight Paths) */}
        <div className="p-2.5 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between gap-2 shrink-0">
          <div className="flex-1 grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('sightings')}
              className={`flex items-center justify-center gap-1 py-1.5 px-1.5 rounded-lg transition-all text-center ${
                activeTab === 'sightings'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="All Regional Sightings"
            >
              <Activity size={13} className="shrink-0" />
              <span className="truncate">Sightings</span>
              <span className="text-[10px] opacity-80 font-mono">({safeObservations.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('roosts')}
              className={`flex items-center justify-center gap-1 py-1.5 px-1.5 rounded-lg transition-all text-center ${
                activeTab === 'roosts'
                  ? 'bg-rose-500 text-white font-bold shadow-sm'
                  : 'text-rose-400 hover:text-rose-300'
              }`}
              title="Night Roosts and Mega-Flocks (250+ birds)"
            >
              <Flame size={13} className="shrink-0" />
              <span className="truncate">Roosts</span>
              <span className="text-[10px] opacity-80 font-mono">({roostObservations.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('corridors')}
              className={`flex items-center justify-center gap-1 py-1.5 px-1.5 rounded-lg transition-all text-center ${
                activeTab === 'corridors'
                  ? 'bg-sky-500 text-slate-950 font-bold shadow-sm'
                  : 'text-sky-400 hover:text-sky-300'
              }`}
              title="Documented Regional Flight Paths"
            >
              <Wind size={13} className="shrink-0" />
              <span className="truncate">Paths</span>
              <span className="text-[10px] opacity-80 font-mono">({corridors.length})</span>
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

        {/* Region & Counts Summary Banner */}
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
              {activeTab === 'roosts'
                ? `${roostObservations.length} Active Roost Sites`
                : activeTab === 'corridors'
                ? `${corridors.length} Flight Corridors`
                : mode === 'hotspots'
                ? 'eBird Hotspots'
                : `${safeObservations.length} Sighting Reports`}
            </span>
            <span className="font-mono font-bold text-emerald-400">
              {activeTab === 'roosts'
                ? `~${totalRoostBirds.toLocaleString()} Roost Birds`
                : activeTab === 'corridors'
                ? `~${totalCorridorBirds.toLocaleString()} Influx`
                : mode !== 'hotspots'
                ? `${totalBirds.toLocaleString()} Total Birds`
                : ''}
            </span>
          </div>
        </div>

        {/* ===================== TAB 1: ALL SIGHTINGS ===================== */}
        {activeTab === 'sightings' && (
          <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
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
                  {selectedSpecies || searchFilter
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
        )}

        {/* ===================== TAB 2: NIGHT ROOSTS & MEGA-FLOCKS ===================== */}
        {activeTab === 'roosts' && (
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
            <div className="p-3 bg-rose-950/30 border border-rose-900/50 rounded-xl text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="font-extrabold text-rose-300 uppercase tracking-wide text-[11px] flex items-center gap-1.5">
                  <Flame size={12} className="text-rose-400" />
                  <span>Night Roosts & Mega-Flocks</span>
                </span>
                <span className="font-mono text-rose-400 font-bold bg-rose-950 px-1.5 py-0.5 rounded text-[10px] border border-rose-800/40">
                  &ge; 250 Birds
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                High-density communal sleeping areas where birds convene before sunset.
              </p>
            </div>

            {roostObservations.length === 0 ? (
              <div className="text-center py-12 px-3 text-xs text-slate-400">
                No mega-roosts currently recorded in this specific view. Expand region to nationwide or Portland metro.
              </div>
            ) : (
              roostObservations.map((obs) => (
                <SightingCard
                  key={obs.id}
                  item={obs}
                  isSelected={selectedItem && 'id' in selectedItem && selectedItem.id === obs.id}
                  onClick={() => handleItemClick(obs)}
                />
              ))
            )}
          </div>
        )}

        {/* ===================== TAB 3: FLIGHT INFLUX CORRIDORS ===================== */}
        {activeTab === 'corridors' && (
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
            <div className="p-3 bg-sky-950/30 border border-sky-900/50 rounded-xl text-xs mb-2">
              <div className="text-sky-300 text-[11px] uppercase font-bold mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Wind size={12} className="text-sky-400" />
                  <span>{currentRegion?.name || 'Regional'} Flight Paths</span>
                </span>
                <span className="text-[10px] text-sky-400 font-mono font-bold bg-sky-950 px-1.5 py-0.5 rounded border border-sky-800/40">
                  {corridors.length} Flyways
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                Documented aerial pathways with staging origins, compass headings, and roost destinations.
              </p>
              <div className="mt-2.5 pt-2 border-t border-sky-900/40 flex justify-between items-center text-xs">
                <span className="text-slate-400">Total Corridor Influx:</span>
                <span className="font-extrabold text-sky-400 font-mono">
                  ~{totalCorridorBirds.toLocaleString()} birds
                </span>
              </div>
            </div>

            {corridors.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400">
                No flight corridors documented in this immediate boundary.
              </div>
            ) : (
              corridors.map((c) => {
                const isSelected = selectedCorridor?.id === c.id;
                const headingStr = getCompassHeading(c.headingDeg || 0);

                return (
                  <div
                    key={c.id}
                    onClick={() => handleCorridorClick(c)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-slate-850 border-sky-400 shadow-lg shadow-sky-500/20 ring-1 ring-sky-400/40'
                        : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                    }`}
                  >
                    {/* Header: Name and Estimated Flock Size */}
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-slate-100 flex items-center gap-1.5 truncate">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color || '#38bdf8' }} />
                        <span className="truncate">{c.name}</span>
                      </span>
                      <span className="text-sky-400 font-mono font-bold shrink-0 text-xs">
                        ~{c.estFlockSize.toLocaleString()}
                      </span>
                    </div>

                    {/* Clear Direction Indicator Vector */}
                    <div className="my-2 p-2 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                        <span className="font-semibold text-emerald-400">Staging</span>
                        <span className="text-slate-500 font-bold">➔</span>
                        <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                        <span className="font-semibold text-rose-400">Roost</span>
                      </div>
                      <span className="font-bold text-sky-400 font-mono text-[10px] bg-slate-900 px-1.5 py-0.5 rounded border border-slate-750">
                        🧭 {headingStr} ({c.headingDeg || 0}°)
                      </span>
                    </div>

                    {/* Timing & Flyway Info */}
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

                    {/* Species & Corridor Description */}
                    <div className="text-[11px] text-slate-300 leading-relaxed bg-slate-950/60 p-2 rounded border border-slate-800/80 mt-1.5">
                      {c.description}
                    </div>

                    {/* Action Prompt */}
                    <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/80 text-[11px] text-sky-400 font-medium mt-2">
                      <span>View path & direction on map</span>
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
          <div className="p-2.5 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between gap-2 shrink-0">
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
