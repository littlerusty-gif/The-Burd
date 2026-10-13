import React, { useEffect } from 'react';
import { ViewMode } from '../types/bird';
import {
  Compass,
  Feather,
  AlertTriangle,
  MapPin,
  Sparkles,
  Flame,
  Navigation,
  Plus,
  QrCode,
  Heart,
  X,
} from 'lucide-react';

interface LayersModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: ViewMode;
  onSetMode: (mode: ViewMode) => void;
  filterBestNow: boolean;
  onToggleFilterBestNow: () => void;
  filterMegaRoosts: boolean;
  onToggleFilterMegaRoosts: () => void;
  onLocateMe: () => void;
  isLocating?: boolean;
  onOpenReportModal: () => void;
  onOpenAiWidget: () => void;
  onOpenShare: () => void;
  onOpenDonate: () => void;
}

export const LayersModal: React.FC<LayersModalProps> = ({
  isOpen,
  onClose,
  mode,
  onSetMode,
  filterBestNow,
  onToggleFilterBestNow,
  filterMegaRoosts,
  onToggleFilterMegaRoosts,
  onLocateMe,
  isLocating = false,
  onOpenReportModal,
  onOpenAiWidget,
  onOpenShare,
  onOpenDonate,
}) => {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Floating Layers Panel directly positioned above bottom pill */}
      <div
        className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 w-[94vw] max-w-sm sm:max-w-md bg-slate-950/95 backdrop-blur-2xl border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xl text-slate-100 flex flex-col gap-4 max-h-[75vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-label="Map Layers and Filters"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚙️</span>
            <div>
              <h2 className="text-sm font-bold text-slate-100 tracking-tight">Map Layers & Controls</h2>
              <p className="text-[11px] text-slate-400">Configure telemetry layers and viewing modes</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 transition-colors"
            title="Close Layers"
          >
            <X size={16} />
          </button>
        </div>

        {/* Section 1: View Modes / Layers */}
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
            Observation Layer Mode
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                onSetMode('recent');
                onClose();
              }}
              className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all text-left ${
                mode === 'recent'
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-sm'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850 hover:border-slate-700'
              }`}
            >
              <Compass size={16} className={mode === 'recent' ? 'text-emerald-400' : 'text-slate-400'} />
              <div>
                <div className="font-bold">Recent</div>
                <div className="text-[10px] text-slate-400 font-normal">All sightings</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                onSetMode('species');
                onClose();
              }}
              className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all text-left ${
                mode === 'species'
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-sm'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850 hover:border-slate-700'
              }`}
            >
              <Feather size={16} className={mode === 'species' ? 'text-emerald-400' : 'text-slate-400'} />
              <div>
                <div className="font-bold">Species</div>
                <div className="text-[10px] text-slate-400 font-normal">Targeted tracking</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                onSetMode('notable');
                onClose();
              }}
              className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all text-left ${
                mode === 'notable'
                  ? 'bg-pink-500/20 border-pink-500 text-pink-300 shadow-sm'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850 hover:border-slate-700'
              }`}
            >
              <AlertTriangle size={16} className={mode === 'notable' ? 'text-pink-400' : 'text-slate-400'} />
              <div>
                <div className="font-bold">Notable & Rare</div>
                <div className="text-[10px] text-slate-400 font-normal">Rare bird alerts</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                onSetMode('hotspots');
                onClose();
              }}
              className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all text-left ${
                mode === 'hotspots'
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-sm'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850 hover:border-slate-700'
              }`}
            >
              <MapPin size={16} className={mode === 'hotspots' ? 'text-emerald-400' : 'text-slate-400'} />
              <div>
                <div className="font-bold">Hotspots</div>
                <div className="text-[10px] text-slate-400 font-normal">eBird birding spots</div>
              </div>
            </button>
          </div>
        </div>

        {/* Section 2: Quick Filter Toggles */}
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
            Telemetry Overlays
          </label>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={onToggleFilterBestNow}
              className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-medium transition-all ${
                filterBestNow
                  ? 'bg-amber-500/15 border-amber-500/50 text-amber-300'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850'
              }`}
            >
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-amber-400" />
                <div className="text-left">
                  <div className="font-semibold text-slate-200">Best to View Right Now</div>
                  <div className="text-[10px] text-slate-400">Peak circadian viewing window</div>
                </div>
              </div>
              <div
                className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
                  filterBestNow ? 'bg-amber-500' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    filterBestNow ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </div>
            </button>

            <button
              type="button"
              onClick={onToggleFilterMegaRoosts}
              className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-medium transition-all ${
                filterMegaRoosts
                  ? 'bg-red-500/15 border-red-500/50 text-red-300'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850'
              }`}
            >
              <div className="flex items-center gap-2">
                <Flame size={16} className="text-red-400" />
                <div className="text-left">
                  <div className="font-semibold text-slate-200">Mega-Roosts Only</div>
                  <div className="text-[10px] text-slate-400">Flocks with &ge; 250 birds</div>
                </div>
              </div>
              <div
                className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
                  filterMegaRoosts ? 'bg-red-500' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    filterMegaRoosts ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </div>
            </button>
          </div>
        </div>

        {/* Section 3: Field Utilities */}
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
            Field Utilities
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                onLocateMe();
                onClose();
              }}
              disabled={isLocating}
              className="flex items-center gap-2 p-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs font-medium text-sky-400 transition-colors"
            >
              <Navigation size={14} className={isLocating ? 'animate-spin' : ''} />
              <span>{isLocating ? 'Locating...' : 'Locate Me'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onOpenReportModal();
                onClose();
              }}
              className="flex items-center gap-2 p-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-xs font-medium text-emerald-300 transition-colors"
            >
              <Plus size={14} />
              <span>Report Sighting</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onOpenAiWidget();
                onClose();
              }}
              className="flex items-center gap-2 p-2 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/40 text-xs font-medium text-purple-300 transition-colors"
            >
              <Sparkles size={14} />
              <span>AI Roost Intel</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onOpenShare();
                onClose();
              }}
              className="flex items-center gap-2 p-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs font-medium text-slate-300 transition-colors"
            >
              <QrCode size={14} className="text-emerald-400" />
              <span>Share App</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              onOpenDonate();
              onClose();
            }}
            className="w-full mt-2 flex items-center justify-center gap-2 p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-xs font-medium text-amber-300 transition-colors"
          >
            <Heart size={14} className="text-amber-400 fill-amber-400/20" />
            <span>Support Field Telemetry (Donate)</span>
          </button>
        </div>
      </div>
    </>
  );
};
