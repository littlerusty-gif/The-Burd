import React from 'react';
import { ListFilter, MessageSquare, SlidersHorizontal } from 'lucide-react';

interface BottomFloatingPillProps {
  isSightingsOpen: boolean;
  onToggleSightings: () => void;
  isChatOpen: boolean;
  onToggleChat: () => void;
  isLayersOpen: boolean;
  onToggleLayers: () => void;
  sightingsCount?: number;
}

export const BottomFloatingPill: React.FC<BottomFloatingPillProps> = ({
  isSightingsOpen,
  onToggleSightings,
  isChatOpen,
  onToggleChat,
  isLayersOpen,
  onToggleLayers,
  sightingsCount,
}) => {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 md:hidden pointer-events-auto">
      <div className="bg-slate-950/90 backdrop-blur-xl border border-slate-750/90 rounded-full shadow-2xl p-1.5 flex items-center gap-1 ring-1 ring-white/10">
        
        {/* 1. Sightings Button */}
        <button
          onClick={onToggleSightings}
          className={`px-3.5 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
            isSightingsOpen
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'text-slate-300 hover:text-white hover:bg-slate-850'
          }`}
          aria-label="Toggle Sightings Drawer"
        >
          <span className="text-sm">📋</span>
          <span>Sightings</span>
          {typeof sightingsCount === 'number' && (
            <span
              className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                isSightingsOpen ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {sightingsCount}
            </span>
          )}
        </button>

        {/* Divider */}
        <div className="w-px h-4 bg-slate-800" />

        {/* 2. Field Chat Button */}
        <button
          onClick={onToggleChat}
          className={`px-3.5 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
            isChatOpen
              ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
              : 'text-slate-300 hover:text-white hover:bg-slate-850'
          }`}
          aria-label="Toggle Field Chat Drawer"
        >
          <span className="text-sm">💬</span>
          <span>Field Chat</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        </button>

        {/* Divider */}
        <div className="w-px h-4 bg-slate-800" />

        {/* 3. Layers Button */}
        <button
          onClick={onToggleLayers}
          className={`px-3.5 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
            isLayersOpen
              ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
              : 'text-slate-300 hover:text-white hover:bg-slate-850'
          }`}
          aria-label="Toggle Layers & Filters Modal"
        >
          <span className="text-sm">⚙️</span>
          <span>Layers</span>
        </button>
      </div>
    </div>
  );
};
