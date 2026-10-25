import React from 'react';
import { Observation, Hotspot } from '../types/bird';
import { MapPin, Flame, Users, Sparkles } from 'lucide-react';

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
    const count = obs.howMany || 1;
    const isRoost = count >= 250 || obs.isCrowRoost;
    const isLargeFlock = count >= 50 && !isRoost;

    return (
      <div
        onClick={onClick}
        className={`p-3 rounded-xl border text-xs cursor-pointer transition-all active:scale-[0.99] ${
          isSelected
            ? 'bg-slate-850 border-emerald-400 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-400/40'
            : isRoost
            ? 'bg-slate-900/90 border-rose-950 hover:border-rose-700/60 hover:bg-slate-850'
            : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
        }`}
      >
        {/* Line 1: Common Name & Count Badge */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="truncate flex-1">
            <div className="font-bold text-slate-100 text-sm truncate flex items-center gap-1.5">
              <span className="truncate">{obs.comName}</span>
              {isRoost && (
                <span className="text-[9px] uppercase tracking-wider font-extrabold bg-rose-950 text-rose-400 border border-rose-800/60 px-1.5 py-0.5 rounded shrink-0 flex items-center gap-1">
                  <Flame size={10} />
                  <span>Roost</span>
                </span>
              )}
            </div>
            {obs.sciName && (
              <div className="text-[10px] text-slate-500 italic truncate font-serif">
                {obs.sciName}
              </div>
            )}
          </div>

          {/* Bird Count Badge */}
          <div className="shrink-0">
            {isRoost ? (
              <span className="font-mono text-rose-300 font-extrabold bg-rose-950/80 border border-rose-700/60 px-2 py-0.5 rounded-lg text-xs shadow-sm flex items-center gap-1">
                <span>🌙</span>
                <span>{count.toLocaleString()}</span>
              </span>
            ) : isLargeFlock ? (
              <span className="font-mono text-amber-300 font-bold bg-amber-950/60 border border-amber-700/40 px-2 py-0.5 rounded-lg text-xs shadow-sm flex items-center gap-1">
                <span>🪶</span>
                <span>{count.toLocaleString()}</span>
              </span>
            ) : count >= 10 ? (
              <span className="font-mono text-emerald-300 font-bold bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded-lg text-xs">
                {count.toLocaleString()}
              </span>
            ) : (
              <span className="font-mono text-slate-300 font-semibold bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-[11px]">
                {count}
              </span>
            )}
          </div>
        </div>

        {/* Line 2: Time/Date */}
        <div className="text-[11px] text-slate-400 mb-1 flex items-center justify-between">
          <span>🕒 {obs.obsDt || 'Recent sighting'}</span>
          {obs.obsReviewed && (
            <span className="text-[9px] text-emerald-400/80 font-medium">✓ eBird Verified</span>
          )}
        </div>

        {/* Line 3: Location */}
        <div className="text-xs text-slate-300 flex items-center gap-1.5 truncate mb-2">
          <MapPin size={12} className="text-emerald-400 shrink-0" />
          <span className="truncate">{obs.locName}</span>
        </div>

        {/* Footer Action */}
        <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/80 text-[11px] text-emerald-400 font-medium">
          <span>View on map</span>
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
            ? 'bg-slate-850 border-emerald-400 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-400/40'
            : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
        }`}
      >
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="font-bold text-slate-100 text-sm truncate">
            {spot.locName}
          </div>
          <span className="font-mono text-emerald-300 font-bold bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded-lg text-xs shrink-0">
            {spot.numSpeciesAllTime} species
          </span>
        </div>

        <div className="text-[11px] text-slate-400 mb-1">
          {spot.latestObsDt ? `🕒 Recent activity: ${spot.latestObsDt}` : 'Active eBird Hotspot'}
        </div>

        <div className="text-xs text-slate-300 flex items-center gap-1.5 truncate mb-2">
          <MapPin size={12} className="text-emerald-400 shrink-0" />
          <span className="truncate">Public birding location</span>
        </div>

        <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/80 text-[11px] text-emerald-400 font-medium">
          <span>Explore hotspot</span>
          <span className="text-xs">→</span>
        </div>
      </div>
    );
  }

  return null;
};

export default SightingCard;
