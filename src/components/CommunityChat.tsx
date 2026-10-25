import React, { useState, useEffect, useRef } from 'react';
import { Send, X, Radio, MessageSquare, Flame, Sparkles, User, Tag, RefreshCw, CheckCircle2 } from 'lucide-react';
import { CommunityMessage } from '../lib/supabase';

interface CommunityChatProps {
  isOpen: boolean;
  onClose: () => void;
  messages: CommunityMessage[];
  sendMessage: (options: { text: string; userName?: string; roostId?: string | null; speciesTag?: string | null }) => Promise<any>;
  activeRoostId?: string | null;
  activeRoostName?: string | null;
  activeSpecies?: string | null;
  activeChannel: 'global' | string;
  onSelectChannel: (channel: 'global' | string) => void;
  isRealtimeActive: boolean;
  isSupabaseConfigured: boolean;
  isLoading?: boolean;
}

const STORAGE_KEY_USER_HANDLE = 'thebirdbook_handle';

const QUICK_TAG_PILLS = [
  { label: 'Flock Inbound 🪶', text: 'Flock Inbound! 🪶 ' },
  { label: 'Pre-Roost Staging ⏱️', text: 'Active pre-roost staging assembling now ⏱️ ' },
  { label: 'Spotted 🦅', text: 'Spotted in flight! 🦅 ' },
  { label: 'Vortex Forming 🌪️', text: 'Vortex starting to form overhead! 🌪️ ' },
  { label: 'Departing 🌅', text: 'Dawn departure underway 🌅 ' },
];

function getInitials(name: string = ''): string {
  const parts = name.trim().split(/[\s_]+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || 'BB';
}

function getAvatarColor(name: string = ''): string {
  const colors = [
    'bg-emerald-600',
    'bg-sky-600',
    'bg-rose-600',
    'bg-amber-600',
    'bg-indigo-600',
    'bg-teal-600',
    'bg-purple-600',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function formatRelativeTime(isoString: string): string {
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 45) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return new Date(isoString).toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch {
    return 'Recent';
  }
}

export const CommunityChat: React.FC<CommunityChatProps> = ({
  isOpen,
  onClose,
  messages,
  sendMessage,
  activeRoostId,
  activeRoostName,
  activeSpecies,
  activeChannel,
  onSelectChannel,
  isRealtimeActive,
  isSupabaseConfigured,
  isLoading,
}) => {
  const [inputText, setInputText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userHandle, setUserHandle] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_USER_HANDLE) || 'Birder_' + Math.floor(100 + Math.random() * 900);
    } catch {
      return 'Birder_42';
    }
  });
  const [isEditingHandle, setIsEditingHandle] = useState(false);
  const [tempHandle, setTempHandle] = useState(userHandle);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSaveHandle = () => {
    const clean = tempHandle.trim();
    if (clean.length >= 2) {
      setUserHandle(clean);
      try {
        localStorage.setItem(STORAGE_KEY_USER_HANDLE, clean);
      } catch {}
    }
    setIsEditingHandle(false);
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await sendMessage({
        text: trimmed,
        userName: userHandle,
        roostId: activeChannel !== 'global' ? activeChannel : activeRoostId || null,
        speciesTag: activeSpecies || null,
      });
      setInputText('');
    } catch (err) {
      console.warn('Send message notice:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAddQuickTag = (tagText: string) => {
    setInputText((prev) => (prev ? `${prev} ${tagText}` : tagText));
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Mobile backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden transition-opacity"
        onClick={onClose}
        aria-label="Close chat"
      />

      {/* Main Slide-Over Drawer */}
      <aside
        aria-label="Community Birder Chat"
        className="fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[420px] bg-slate-950/98 backdrop-blur-2xl border-l border-slate-800 flex flex-col shadow-2xl animate-in slide-in-from-right duration-250 select-none"
      >
        {/* 1. Header & Live Indicator */}
        <div className="p-3.5 border-b border-slate-800 bg-slate-900/90 flex flex-col gap-2.5 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <MessageSquare size={17} />
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                  <span>Community Birder Chat</span>
                </h2>
                <div className="flex items-center gap-1.5 text-[11px]">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isRealtimeActive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                    }`}
                  />
                  <span className="text-slate-300 font-medium">
                    {isSupabaseConfigured ? '⚡ Supabase Realtime' : '⚡ Local Realtime Synced'}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Close chat"
            >
              <X size={18} />
            </button>
          </div>

          {/* Channel Selector: All Flocks vs Active Roost */}
          <div className="grid grid-cols-2 gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => onSelectChannel('global')}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg transition-all ${
                activeChannel === 'global'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🌐 All Flocks</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectChannel(activeRoostId || 'active-roost')}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg transition-all truncate ${
                activeChannel !== 'global'
                  ? 'bg-rose-500 text-white font-bold shadow-sm'
                  : 'text-rose-400 hover:text-rose-300'
              }`}
              title={activeRoostName || 'Select a roost on map'}
            >
              <Flame size={12} className="shrink-0" />
              <span className="truncate">{activeRoostName ? activeRoostName.split(' ')[0] + ' Roost' : 'Active Roost'}</span>
            </button>
          </div>
        </div>

        {/* 2. User Handle Settings Bar */}
        <div className="px-3.5 py-2 bg-slate-900/50 border-b border-slate-800/80 flex items-center justify-between text-xs text-slate-300 shrink-0">
          {isEditingHandle ? (
            <div className="flex items-center gap-1.5 w-full">
              <input
                type="text"
                value={tempHandle}
                onChange={(e) => setTempHandle(e.target.value)}
                maxLength={24}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-emerald-500"
                placeholder="Enter birder handle..."
                autoFocus
              />
              <button
                type="button"
                onClick={handleSaveHandle}
                className="px-2.5 py-1 bg-emerald-500 text-slate-950 font-bold text-xs rounded-lg hover:bg-emerald-400 transition-colors"
              >
                Save
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-1.5 text-slate-400">
                <User size={13} className="text-slate-400" />
                <span>Posting as:</span>
                <span className="font-bold text-emerald-400 font-mono">@{userHandle}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setTempHandle(userHandle);
                  setIsEditingHandle(true);
                }}
                className="text-[11px] text-slate-400 hover:text-emerald-400 hover:underline font-medium"
              >
                Change handle
              </button>
            </>
          )}
        </div>

        {/* 3. Messages Stream Feed */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3 custom-scrollbar">
          {isLoading && (
            <div className="flex items-center justify-center py-6 text-slate-400 text-xs gap-2">
              <RefreshCw size={14} className="animate-spin text-emerald-400" />
              <span>Syncing live birder feed...</span>
            </div>
          )}

          {messages.length === 0 && !isLoading && (
            <div className="text-center py-16 px-4 text-xs text-slate-400 flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 text-lg">
                💬
              </div>
              <p className="font-semibold text-slate-300">No messages in this channel yet.</p>
              <p className="text-[11px] text-slate-400 max-w-xs">
                Be the first to post flock sightings, staging activity, or roost coordinates!
              </p>
            </div>
          )}

          {messages.map((m) => {
            const isMe = m.user_name === userHandle;
            const initials = getInitials(m.user_name);
            const avatarColor = getAvatarColor(m.user_name);

            return (
              <div
                key={m.id}
                className={`flex gap-2.5 items-start ${isMe ? 'flex-row-reverse' : ''}`}
              >
                {/* Avatar Icon */}
                <div
                  className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold text-white shadow-md ${avatarColor}`}
                >
                  {initials}
                </div>

                {/* Message Bubble */}
                <div className={`flex flex-col max-w-[82%] ${isMe ? 'items-end' : 'items-start'}`}>
                  {/* Sender & Timestamp */}
                  <div className="flex items-center gap-1.5 mb-1 text-[11px]">
                    <span className={`font-bold ${isMe ? 'text-emerald-400' : 'text-slate-300'}`}>
                      {m.user_name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {formatRelativeTime(m.created_at)}
                    </span>
                  </div>

                  {/* Bubble Content */}
                  <div
                    className={`rounded-2xl px-3 py-2 text-xs leading-relaxed shadow-sm ${
                      isMe
                        ? 'bg-emerald-600 text-slate-950 font-medium rounded-tr-sm'
                        : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-sm'
                    }`}
                  >
                    <p className="break-words select-text">{m.message}</p>

                    {/* Roost & Species Tags */}
                    {(m.roost_id || m.species_tag) && (
                      <div className="flex flex-wrap items-center gap-1 mt-1.5 pt-1.5 border-t border-black/10">
                        {m.roost_id && (
                          <span
                            className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                              isMe ? 'bg-slate-950/20 text-slate-950' : 'bg-rose-950 text-rose-300 border border-rose-800/40'
                            }`}
                          >
                            <span>📍 Roost Alert</span>
                          </span>
                        )}
                        {m.species_tag && (
                          <span
                            className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                              isMe ? 'bg-slate-950/20 text-slate-950' : 'bg-sky-950 text-sky-300 border border-sky-800/40'
                            }`}
                          >
                            <span>🦅 {m.species_tag}</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* 4. Quick-Tag Pills */}
        <div className="px-3 pt-2 pb-1 bg-slate-900/60 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          {QUICK_TAG_PILLS.map((pill, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleAddQuickTag(pill.text)}
              className="text-[10px] font-bold whitespace-nowrap px-2 py-1 bg-slate-950 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 rounded-full transition-all active:scale-95 shrink-0"
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* 5. Input Field & Send Action */}
        <form onSubmit={handleSend} className="p-3 bg-slate-900 border-t border-slate-800 shrink-0">
          {activeChannel !== 'global' && activeRoostName && (
            <div className="mb-2 flex items-center justify-between text-[11px] text-rose-300 bg-rose-950/40 border border-rose-900/40 px-2 py-1 rounded-lg">
              <span className="flex items-center gap-1 truncate font-semibold">
                <Flame size={12} className="shrink-0 text-rose-400" />
                <span className="truncate">Tagging: {activeRoostName}</span>
              </span>
              <button
                type="button"
                onClick={() => onSelectChannel('global')}
                className="text-[10px] text-slate-400 hover:text-white underline shrink-0 ml-1"
              >
                Clear
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                activeChannel === 'global'
                  ? 'Broadcast field sighting to All Flocks...'
                  : `Report update for ${activeRoostName || 'roost'}...`
              }
              maxLength={500}
              className="flex-1 bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none transition-colors"
            />

            <button
              type="submit"
              disabled={!inputText.trim() || isSubmitting}
              className="p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-400 text-slate-950 font-bold transition-all shadow-md active:scale-95 shrink-0 flex items-center justify-center"
              title="Send message"
            >
              <Send size={15} />
            </button>
          </div>
        </form>
      </aside>
    </>
  );
};
