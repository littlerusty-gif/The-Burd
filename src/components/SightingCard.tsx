import React from 'react';
import { Observation, Hotspot } from '../types/bird';
import { MapPin } from 'lucide-react';

interface SightingCardProps {
  item: Observation | Hotspot;
  isSelected?: boolean;
  onClick: () => void;
}

export const SightingCard: React.FC<SightingCardProps> = ({ item, isSelected = false, onClick }) => {
  const isObs = 'howMany' in item;
  const obs = isObs ? (item as Observation) : null;
  const spot = !isObs ? (item as Hotspot) : null;

  if (obs) {
    const isRoost = (obs.howMany && obs.howMany >= 250) || obs.isCrowRoost;
    return (
      <div
        onClick={onClick}
        className={`p-3 rounded-xl border text-xs cursor-pointer transition-all active:scale-[0.99] ${
          isSelected
            ? 'bg-slate-800/95 border-emerald-500 shadow-lg ring-1 ring-emerald-500/50'
            : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
        }`}
      >
        {/* Line 1: Common Name */}
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="font-bold text-slate-100 text-sm truncate flex items-center gap-1.5">
            <span className="truncate">{obs.comName}</span>
            {isRoost && (
              <span className="text-[9px] uppercase tracking-wider font-extrabold bg-red-950 text-red-400 border border-red-800/60 px-1.5 py-0.5 rounded shrink-0">
                Roost
              </span>
            )}
          </div>
          {obs.howMany ? (
            <span className="font-mono text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-800/40 px-1.5 py-0.5 rounded text-[11px] shrink-0">
              {obs.howMany.toLocaleString()}
            </span>
          ) : null}
        </div>

        {/* Line 2: Time/Date */}
        <div className="text-[11px] text-slate-400 mb-1">
          {obs.obsDt || 'Recent sighting'}
        </div>

        {/* Line 3: Location */}
        <div className="text-xs text-slate-300 flex items-center gap-1.5 truncate mb-2">
          <MapPin size={12} className="text-emerald-400 shrink-0" />
          <span className="truncate">{obs.locName}</span>
        </div>

        {/* Clear Helper Label */}
        <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/80 text-[11px] text-emerald-400 font-medium">
          <span>Tap to view on map</span>
          <span className="text-xs">→</span>
        </div>
      </div>
    );
  }

  if (spot) {
    return (
      <div
        onClick={onClick}
        className={`p-3 rounded-xl border text-xs cursor-pointer transition-all active:scale-[0.99] ${
          isSelected
            ? 'bg-slate-800/95 border-emerald-500 shadow-lg ring-1 ring-emerald-500/50'
            : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
        }`}
      >
        {/* Line 1: Hotspot Name */}
        <div className="font-bold text-slate-100 text-sm truncate mb-1">
          {spot.locName}
        </div>

        {/* Line 2: Time/Date or Latest Activity */}
        <div className="text-[11px] text-slate-400 mb-1">
          {spot.latestObsDt ? `Latest activity: ${spot.latestObsDt}` : 'Active eBird Hotspot'}
        </div>

        {/* Line 3: Location / Recorded Stats */}
        <div className="text-xs text-slate-300 flex items-center gap-1.5 truncate mb-2">
          <MapPin size={12} className="text-emerald-400 shrink-0" />
          <span className="truncate">{spot.numSpeciesAllTime} recorded species</span>
        </div>

        {/* Clear Helper Label */}
        <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/80 text-[11px] text-emerald-400 font-medium">
          <span>Tap to view on map</span>
          <span className="text-xs">→</span>
        </div>
      </div>
    );
  }

  return null;
};
