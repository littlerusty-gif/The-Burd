import React from 'react';

interface BottomNavProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  isChatOpen: boolean;
  onToggleChat: () => void;
  isLayersOpen: boolean;
  onToggleLayers: () => void;
  observationsCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  isSidebarOpen,
  onToggleSidebar,
  isChatOpen,
  onToggleChat,
  isLayersOpen,
  onToggleLayers,
  observationsCount,
}) => {
  return (
    <nav
      aria-label="Bottom Navigation"
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 flex items-center bg-slate-900/90 hover:bg-slate-900/95 backdrop-blur-xl border border-slate-750/90 rounded-full p-1.5 shadow-2xl transition-all select-none"
    >
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Tab 1: Sightings */}
        <button
          type="button"
          onClick={onToggleSidebar}
          className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-full text-xs font-bold transition-all active:scale-95 ${
            isSidebarOpen
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25 ring-1 ring-emerald-400'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
          }`}
          title="Toggle Sightings List"
        >
          <span className="text-sm">📋</span>
          <span>Sightings</span>
          {typeof observationsCount === 'number' && observationsCount > 0 && (
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-semibold ml-0.5 ${
                isSidebarOpen
                  ? 'bg-slate-950/20 text-slate-950'
                  : 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              {observationsCount > 99 ? '99+' : observationsCount}
            </span>
          )}
        </button>

        {/* Tab 2: Chat */}
        <button
          type="button"
          onClick={onToggleChat}
          className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-full text-xs font-bold transition-all active:scale-95 relative ${
            isChatOpen
              ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/25 ring-1 ring-teal-400'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
          }`}
          title="Toggle Field Chat & Community Meetup"
        >
          <span className="text-sm">💬</span>
          <span>Chat</span>
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isChatOpen ? 'bg-slate-950' : 'bg-emerald-400 animate-pulse'
            }`}
          />
        </button>

        {/* Tab 3: Layers */}
        <button
          type="button"
          onClick={onToggleLayers}
          className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-full text-xs font-bold transition-all active:scale-95 ${
            isLayersOpen
              ? 'bg-purple-500 text-slate-950 shadow-md shadow-purple-500/25 ring-1 ring-purple-400'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
          }`}
          title="Toggle Map Layers & Filters"
        >
          <span className="text-sm">⚙️</span>
          <span>Layers</span>
        </button>
      </div>
    </nav>
  );
};
