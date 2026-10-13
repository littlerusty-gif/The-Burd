import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { RegionConfig, Hotspot } from '../types/bird';
import { ChatMessage, ChatChannel, MeetupProposal } from '../types/chat';
import { INITIAL_CHAT_CHANNELS, INITIAL_CHAT_MESSAGES } from '../data/mockChatData';
import { sanitizeMessageText } from '../utils/chatModeration';
import { db } from '../services/firebase';
import { collection, addDoc, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import {
  Send,
  Calendar,
  MapPin,
  Flag,
  VolumeX,
  X,
  AlertTriangle,
  ChevronDown,
  Sparkles,
  Shield,
  Clock,
  Pin,
  CheckCircle2,
  Users,
  Radio,
  Wifi,
  WifiOff,
  RefreshCw,
} from 'lucide-react';

interface FieldChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentRegion: RegionConfig;
  nearbyHotspots?: Hotspot[];
  onPinMeetupToMap: (meetup: MeetupProposal) => void;
  onRequestDisclaimer: () => boolean; // returns true if disclaimer is already agreed
  onRequestHandle: () => string | null; // returns current handle or prompts
  homeRegion: string;
}

const STORAGE_KEY_MESSAGES = 'thebirdbook_field_chat_messages_v2';
const STORAGE_KEY_MUTED = 'thebirdbook_muted_handles_v1';
const STORAGE_KEY_FLAGGED = 'thebirdbook_flagged_messages_v1';
const STORAGE_KEY_CLIENT_ID = 'thebirdbook_chat_client_id';
const POST_COOLDOWN_MS = 3000;

function getClientId(): string {
  try {
    let id = localStorage.getItem(STORAGE_KEY_CLIENT_ID);
    if (!id) {
      id = `client_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      localStorage.setItem(STORAGE_KEY_CLIENT_ID, id);
    }
    return id;
  } catch {
    return `client_${Date.now()}`;
  }
}

export const FieldChatDrawer: React.FC<FieldChatDrawerProps> = ({
  isOpen,
  onClose,
  currentRegion,
  nearbyHotspots = [],
  onPinMeetupToMap,
  onRequestDisclaimer,
  onRequestHandle,
  homeRegion,
}) => {
  const clientId = useMemo(() => getClientId(), []);

  // Messages state persisted in localStorage
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_MESSAGES);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return INITIAL_CHAT_MESSAGES;
  });

  // Muted handles set
  const [mutedHandles, setMutedHandles] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_MUTED);
      if (stored) return JSON.parse(stored);
    } catch {}
    return [];
  });

  // Flagged messages set
  const [flaggedIds, setFlaggedIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_FLAGGED);
      if (stored) return JSON.parse(stored);
    } catch {}
    return [];
  });

  // Active channel
  const [activeChannelId, setActiveChannelId] = useState<string>('portland');
  const [messageInput, setMessageInput] = useState<string>('');
  const [isProposingMeetup, setIsProposingMeetup] = useState<boolean>(false);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
  const [lastPostTime, setLastPostTime] = useState<number>(0);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [livePresenceCount, setLivePresenceCount] = useState<number>(6);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Meetup snippet form fields
  const [meetupLocation, setMeetupLocation] = useState<string>('');
  const [meetupDateTime, setMeetupDateTime] = useState<string>('');
  const [meetupSpecies, setMeetupSpecies] = useState<string>('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  // Dynamic channels list including real nearby eBird hotspots
  const channels = useMemo(() => {
    const list: ChatChannel[] = [...INITIAL_CHAT_CHANNELS];

    if (nearbyHotspots && nearbyHotspots.length > 0) {
      nearbyHotspots.slice(0, 4).forEach((h) => {
        const id = `hotspot-${h.locId}`;
        if (!list.some((c) => c.id === id)) {
          list.push({
            id,
            name: `#${h.locName.replace(/[^a-zA-Z0-9]/g, '-').slice(0, 22)}-Meetups`,
            scopeType: 'hotspot',
            description: `Field walks and group sightings at ${h.locName}.`,
            memberCount: Math.floor(Math.random() * 40) + 12,
            lat: h.lat,
            lng: h.lng,
          });
        }
      });
    }

    return list;
  }, [nearbyHotspots]);

  const activeChannel = useMemo(() => {
    return channels.find((c) => c.id === activeChannelId) || channels[0];
  }, [channels, activeChannelId]);

  // Synchronize channel directly when top-bar map region changes
  useEffect(() => {
    const regCode = (currentRegion.regionCode || '').toUpperCase();
    if (regCode === 'US-WA' || currentRegion.id === 'state-us-wa') {
      setActiveChannelId('US-WA');
    } else if (regCode === 'US-OR' || currentRegion.id === 'state-us-or') {
      setActiveChannelId('US-OR');
    } else if (currentRegion.category === 'gps') {
      setActiveChannelId('gps');
    } else if (currentRegion.category === 'nationwide' || regCode === 'US') {
      setActiveChannelId('nationwide');
    } else {
      setActiveChannelId('portland');
    }
  }, [currentRegion]);

  // Online / offline event detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Auto-sync any unsynced or failed messages
      syncPendingMessages();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Multi-tab instant synchronization using Web BroadcastChannel
  useEffect(() => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return;

    try {
      const channel = new BroadcastChannel('thebirdbook_field_chat_broadcast');
      broadcastChannelRef.current = channel;

      channel.onmessage = (event) => {
        const { type, message, presenceUpdate } = event.data || {};
        if (type === 'NEW_MESSAGE' && message) {
          setMessages((prev) => {
            const exists = prev.some((m) => m.id === message.id);
            if (exists) {
              return prev.map((m) => (m.id === message.id ? message : m));
            }
            return [...prev, message];
          });
        }
        if (type === 'PRESENCE' && presenceUpdate && presenceUpdate.channelId === activeChannelId) {
          setLivePresenceCount((prev) => Math.max(prev, presenceUpdate.count));
        }
      };

      return () => {
        channel.close();
      };
    } catch (e) {
      console.warn('BroadcastChannel not available:', e);
    }
  }, [activeChannelId]);

  // Persist messages to storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(messages));
    } catch {}
  }, [messages]);

  // Persist muted handles
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_MUTED, JSON.stringify(mutedHandles));
    } catch {}
  }, [mutedHandles]);

  // Persist flagged ids
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_FLAGGED, JSON.stringify(flaggedIds));
    } catch {}
  }, [flaggedIds]);

  // Rate-limit cooldown timer countdown
  useEffect(() => {
    if (cooldownRemaining <= 0) return;
    const timer = setInterval(() => {
      setCooldownRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownRemaining]);

  // Scroll to bottom on new message or channel change
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeChannelId, isOpen]);

  // Live Multi-User Firestore Synchronization (thebirdbook-web project)
  useEffect(() => {
    if (!isOpen) return;

    try {
      const messagesRef = collection(db, 'channels', activeChannelId, 'messages');
      const q = query(messagesRef, orderBy('timestamp', 'asc'), limit(50));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const liveMessages: ChatMessage[] = snapshot.docs.map((doc) => {
              const data = doc.data() as any;
              return {
                id: doc.id,
                handle: data.handle || 'Anonymous',
                text: data.text || '',
                timestamp: data.timestamp || Date.now(),
                homeRegion: data.homeRegion || 'OR-Metro',
                channelId: data.channelId || activeChannelId,
                channelName: data.channelName,
                meetup: data.meetup,
                status: 'synced',
              };
            });

            setMessages((prev) => {
              const otherChannelMsgs = prev.filter((m) => m.channelId !== activeChannelId);
              return [...otherChannelMsgs, ...liveMessages];
            });
          }
        },
        (error) => {
          console.warn('Firestore onSnapshot error, falling back to local/broadcast:', error);
        }
      );
      return () => unsubscribe();
    } catch (e) {
      console.warn('Firestore listener setup error:', e);
    }
  }, [isOpen, activeChannelId]);

  // Remote Server Broadcasting: Polling & Presence Heartbeat
  const pollChannelMessages = useCallback(async () => {
    if (!isOpen || !isOnline) return;

    try {
      const res = await fetch(`/api/chat?channelId=${encodeURIComponent(activeChannelId)}&clientId=${encodeURIComponent(clientId)}`);
      if (!res.ok) return;

      const data = await res.json();
      if (data.presenceCount) {
        setLivePresenceCount(data.presenceCount);
      }

      if (Array.isArray(data.messages) && data.messages.length > 0) {
        setMessages((prev) => {
          const idMap = new Map(prev.map((m) => [m.id, m]));
          let hasNew = false;

          data.messages.forEach((remoteMsg: ChatMessage) => {
            if (!idMap.has(remoteMsg.id)) {
              idMap.set(remoteMsg.id, { ...remoteMsg, status: 'synced' });
              hasNew = true;
            }
          });

          return hasNew ? Array.from(idMap.values()) : prev;
        });
      }
    } catch (err) {
      // Quiet fail if network unavailable
    }
  }, [isOpen, isOnline, activeChannelId, clientId]);

  // Polling loop while drawer is open
  useEffect(() => {
    if (!isOpen) return;

    // Immediate initial fetch
    pollChannelMessages();

    // 3-second live refresh
    const interval = setInterval(pollChannelMessages, 3000);
    return () => clearInterval(interval);
  }, [isOpen, pollChannelMessages]);

  // Presence heartbeat every 15s
  useEffect(() => {
    if (!isOpen || !isOnline) return;

    const sendHeartbeat = async () => {
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'presence',
            clientId,
            channelId: activeChannelId,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.presenceCount) {
            setLivePresenceCount(data.presenceCount);
          }
        }
      } catch {}
    };

    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 15000);
    return () => clearInterval(interval);
  }, [isOpen, isOnline, activeChannelId, clientId]);

  // Auto-sync pending or failed messages
  const syncPendingMessages = useCallback(async () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_MESSAGES);
      if (!stored) return;
      const allMsgs: ChatMessage[] = JSON.parse(stored);
      const pending = allMsgs.filter((m) => m.status === 'uploading' || m.status === 'failed');

      if (pending.length === 0) return;
      setIsSyncing(true);

      for (const msg of pending) {
        try {
          const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: msg, clientId }),
          });
          if (res.ok) {
            setMessages((prev) =>
              prev.map((m) => (m.id === msg.id ? { ...m, status: 'synced' } : m))
            );
          }
        } catch {}
      }
    } catch {} finally {
      setIsSyncing(false);
    }
  }, [clientId]);

  // Filter messages for current channel, excluding muted users
  const visibleMessages = useMemo(() => {
    return messages.filter((m) => {
      if (m.channelId !== activeChannelId) return false;
      if (mutedHandles.includes(m.handle.toLowerCase())) return false;
      return true;
    });
  }, [messages, activeChannelId, mutedHandles]);

  // Handle post message with Optimistic Instant UI
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Legal disclaimer check
    const isDisclaimerAgreed = onRequestDisclaimer();
    if (!isDisclaimerAgreed) return;

    // 2. Handle check
    const handle = onRequestHandle();
    if (!handle) return;

    // 3. Anti-spam 3-second rate limit
    const now = Date.now();
    const elapsed = now - lastPostTime;
    if (elapsed < POST_COOLDOWN_MS) {
      const waitSec = Math.ceil((POST_COOLDOWN_MS - elapsed) / 1000);
      setCooldownRemaining(waitSec);
      return;
    }

    const trimmed = messageInput.trim();
    if (!trimmed && !isProposingMeetup) return;

    // 4. Text & link sanitization
    const { sanitized } = sanitizeMessageText(trimmed);

    // 5. Build meetup proposal if attached
    let proposal: MeetupProposal | undefined = undefined;
    if (isProposingMeetup && meetupLocation.trim()) {
      proposal = {
        locationName: sanitizeMessageText(meetupLocation.trim()).sanitized,
        dateTime: sanitizeMessageText(meetupDateTime.trim() || 'Upcoming Weekend').sanitized,
        targetSpecies: sanitizeMessageText(meetupSpecies.trim() || 'Regional Waterfowl & Songbirds').sanitized,
        lat: activeChannel.lat || currentRegion?.center?.[0] || 39.8283,
        lng: activeChannel.lng || currentRegion?.center?.[1] || -98.5795,
      };
    }

    // 6. Optimistic Instant UI - generate and show immediately with 'uploading' status
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      handle,
      homeRegion: homeRegion || 'OR-Metro',
      channelId: activeChannel.id,
      channelName: activeChannel.name,
      text: sanitized,
      timestamp: now,
      meetup: proposal,
      status: 'uploading',
    };

    // Instant local append
    setMessages((prev) => [...prev, newMsg]);
    setMessageInput('');
    setLastPostTime(now);
    setCooldownRemaining(3);

    // Broadcast immediately across open tabs
    try {
      broadcastChannelRef.current?.postMessage({
        type: 'NEW_MESSAGE',
        message: newMsg,
      });
    } catch {}

    // Reset meetup fields
    if (isProposingMeetup) {
      setIsProposingMeetup(false);
      setMeetupLocation('');
      setMeetupDateTime('');
      setMeetupSpecies('');
    }

    // 7. Write message directly to Firestore (thebirdbook-web)
    try {
      const docPayload: any = {
        handle,
        text: sanitized,
        timestamp: new Date().toISOString(),
        homeRegion: homeRegion || 'OR-Metro',
        channelId: activeChannelId,
      };
      if (proposal) {
        docPayload.meetup = proposal;
      }
      if (activeChannel.name) {
        docPayload.channelName = activeChannel.name;
      }

      await addDoc(collection(db, 'channels', activeChannelId, 'messages'), docPayload);

      // Mark local optimistic message as synced
      setMessages((prev) =>
        prev.map((m) => (m.id === newMsg.id ? { ...m, status: 'synced' } : m))
      );
    } catch (firestoreErr) {
      console.warn('Firestore write error, falling back to serverless broadcast:', firestoreErr);
      // Secondary fallback to serverless broadcast
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'post',
            message: newMsg,
            clientId,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          setMessages((prev) =>
            prev.map((m) => (m.id === newMsg.id ? { ...m, status: 'synced' } : m))
          );
          if (data.presenceCount) {
            setLivePresenceCount(data.presenceCount);
          }
        } else {
          setMessages((prev) =>
            prev.map((m) => (m.id === newMsg.id ? { ...m, status: 'failed' } : m))
          );
        }
      } catch (networkErr) {
        // Offline fallback: keep in localStorage, mark as failed for auto-sync
        setMessages((prev) =>
          prev.map((m) => (m.id === newMsg.id ? { ...m, status: 'failed' } : m))
        );
      }
    }
  };

  // Retry sending an offline/failed message
  const handleRetryMessage = async (failedMsg: ChatMessage) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === failedMsg.id ? { ...m, status: 'uploading' } : m))
    );

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: failedMsg, clientId }),
      });

      if (res.ok) {
        setMessages((prev) =>
          prev.map((m) => (m.id === failedMsg.id ? { ...m, status: 'synced' } : m))
        );
      } else {
        setMessages((prev) =>
          prev.map((m) => (m.id === failedMsg.id ? { ...m, status: 'failed' } : m))
        );
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) => (m.id === failedMsg.id ? { ...m, status: 'failed' } : m))
      );
    }
  };

  // Flag/Report Message
  const handleFlagMessage = (id: string) => {
    setFlaggedIds((prev) => [...prev, id]);
    alert('Thank you. This message has been flagged for community safety review.');
  };

  // Mute / Block Handle
  const handleMuteHandle = (handleToMute: string) => {
    const lower = handleToMute.toLowerCase();
    if (confirm(`Block @${handleToMute}? You will no longer see messages from this handle on your feed.`)) {
      setMutedHandles((prev) => [...prev, lower]);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Outside-tap Backdrop for Mobile */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
        onClick={onClose}
        aria-label="Close chat"
      />

      <aside className="fixed inset-x-0 bottom-0 md:inset-x-auto md:inset-y-0 md:right-0 z-50 md:z-40 w-full md:w-[420px] max-h-[60vh] h-[60vh] md:max-h-full md:h-full bg-slate-950/95 backdrop-blur-xl border-t md:border-t-0 md:border-l border-slate-750 md:border-slate-800 flex flex-col shadow-2xl rounded-t-2xl md:rounded-none animate-in slide-in-from-bottom md:slide-in-from-right duration-300">
        {/* Grab Handle for Mobile */}
        <div className="flex justify-center pt-2 pb-1 md:hidden shrink-0">
          <div className="w-10 h-1 bg-slate-700 rounded-full" />
        </div>
      {/* Header */}
      <div className="p-3.5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Radio size={16} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-slate-100">Live Field Chat</span>
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              {isOnline ? (
                <span className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-0.5">
                  <Wifi size={10} /> Online
                </span>
              ) : (
                <span className="text-[10px] text-amber-400 font-mono font-bold flex items-center gap-0.5">
                  <WifiOff size={10} /> Offline Mode
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400">Real-time multi-user regional broadcast</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition-colors cursor-pointer"
          title="Close Field Chat"
        >
          <X size={16} />
        </button>
      </div>

      {/* Channel Switcher Dropdown & Live Presence Counter */}
      <div className="p-2.5 bg-slate-900/60 border-b border-slate-800">
        <div className="flex items-center justify-between mb-1">
          <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-400">
            Active Chat Channel:
          </label>
          <div className="flex items-center gap-1.5 font-mono text-[10px] text-emerald-400 font-bold bg-emerald-950/70 border border-emerald-800/40 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <Users size={10} />
            <span>{livePresenceCount} Active Viewers</span>
          </div>
        </div>

        <div className="relative">
          <select
            value={activeChannelId}
            onChange={(e) => setActiveChannelId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-750 hover:border-slate-600 focus:border-emerald-500 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-200 focus:outline-none appearance-none pr-8 cursor-pointer shadow-sm"
          >
            <optgroup label="Current Region Meetups (Matches Active View)">
              {channels
                .filter((c) => c.scopeType === 'current_region')
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </optgroup>
            {channels.some((c) => c.scopeType === 'hotspot') && (
              <optgroup label="Nearby Hotspot Feeds">
                {channels
                  .filter((c) => c.scopeType === 'hotspot')
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </optgroup>
            )}
            <optgroup label="Nationwide Channels">
              {channels
                .filter((c) => c.scopeType === 'nationwide')
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </optgroup>
          </select>
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
            <ChevronDown size={14} />
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5">
          <span className="truncate">{activeChannel.description}</span>
          {isSyncing && (
            <span className="text-sky-400 flex items-center gap-1 font-mono text-[9px] shrink-0 animate-pulse">
              <RefreshCw size={9} className="animate-spin" /> Syncing...
            </span>
          )}
        </div>
      </div>

      {/* Safety Notice Banner */}
      <div className="px-3 py-1.5 bg-slate-950 border-b border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
        <span className="flex items-center gap-1">
          <Shield size={11} className="text-emerald-400" />
          <span>Public Field Safety: Meet in daylit public parks. Never trespass.</span>
        </span>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {visibleMessages.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            <Radio size={24} className="mx-auto mb-2 text-slate-600 animate-pulse" />
            <p className="font-semibold text-slate-300">No messages in this broadcast channel yet.</p>
            <p className="text-[11px] mt-1 text-slate-400">Be the first to post a bird sighting or meetup!</p>
          </div>
        ) : (
          visibleMessages.map((msg) => {
            const isFlagged = flaggedIds.includes(msg.id);
            const timeStr = new Date(msg.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={msg.id}
                className={`p-3 rounded-xl border text-xs transition-all ${
                  msg.meetup
                    ? 'bg-gradient-to-br from-emerald-950/30 to-slate-900 border-emerald-500/40 shadow-md shadow-emerald-500/5'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-750'
                }`}
              >
                {/* Message Header: Handle badge + region tag + time + sync status */}
                <div className="flex items-center justify-between gap-1.5 mb-1.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-slate-100 font-mono">@{msg.handle}</span>
                    <span className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
                      [{msg.homeRegion}]
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                    {/* Optimistic Status Indicators */}
                    {msg.status === 'uploading' && (
                      <span title="Broadcasting to network..." className="flex items-center gap-0.5 text-sky-400 font-mono text-[9px] animate-pulse">
                        <Clock size={10} /> Syncing
                      </span>
                    )}
                    {msg.status === 'synced' && (
                      <span title="Live on broadcast network" className="flex items-center gap-0.5 text-emerald-400 font-mono text-[9px]">
                        <CheckCircle2 size={10} /> Live
                      </span>
                    )}
                    {msg.status === 'failed' && (
                      <button
                        onClick={() => handleRetryMessage(msg)}
                        title="Offline. Click to retry broadcast."
                        className="flex items-center gap-0.5 text-amber-400 hover:text-amber-300 font-mono text-[9px] bg-amber-950/60 px-1 py-0.2 rounded border border-amber-800/50 cursor-pointer"
                      >
                        <AlertTriangle size={10} /> Retry
                      </button>
                    )}

                    <span>{timeStr}</span>

                    {/* Flag button */}
                    <button
                      onClick={() => handleFlagMessage(msg.id)}
                      className={`p-1 rounded hover:bg-slate-800 cursor-pointer ${
                        isFlagged ? 'text-amber-400' : 'text-slate-500 hover:text-slate-300'
                      }`}
                      title="Report message"
                    >
                      <Flag size={11} />
                    </button>
                    {/* Mute handle button */}
                    <button
                      onClick={() => handleMuteHandle(msg.handle)}
                      className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-slate-800 cursor-pointer"
                      title={`Mute @${msg.handle}`}
                    >
                      <VolumeX size={11} />
                    </button>
                  </div>
                </div>

                {/* Message Text */}
                {msg.text && (
                  <p className="text-slate-200 leading-relaxed break-words mb-2">{msg.text}</p>
                )}

                {/* Styled Meetup Alert Card */}
                {msg.meetup && (
                  <div className="mt-2 p-3 bg-slate-950/80 border border-emerald-500/30 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                        <Sparkles size={11} />
                        <span>Meetup Proposal</span>
                      </span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.5 rounded">
                        Open Coordination
                      </span>
                    </div>

                    <div className="space-y-1 text-[11px]">
                      <div className="flex items-start gap-1.5 text-slate-200 font-semibold">
                        <MapPin size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                        <span>{msg.meetup.locationName}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Calendar size={13} className="text-sky-400 shrink-0" />
                        <span>{msg.meetup.dateTime}</span>
                      </div>
                      <div className="flex items-start gap-1.5 text-amber-300">
                        <Sparkles size={13} className="text-amber-400 shrink-0 mt-0.5" />
                        <span>Targets: {msg.meetup.targetSpecies}</span>
                      </div>
                    </div>

                    {/* Pin to Map Action */}
                    <button
                      onClick={() => onPinMeetupToMap(msg.meetup!)}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 hover:text-emerald-200 border border-emerald-500/40 rounded-lg text-xs font-bold transition-all active:scale-95 shadow-sm cursor-pointer"
                    >
                      <Pin size={12} />
                      <span>Pin Location to Map</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Meetup Proposal Drawer Toggle Form */}
      {isProposingMeetup && (
        <div className="p-3 bg-slate-900 border-t border-slate-800 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-emerald-400 flex items-center gap-1.5 text-xs">
              <Calendar size={13} />
              <span>Attach Meetup Proposal</span>
            </span>
            <button
              onClick={() => setIsProposingMeetup(false)}
              className="text-slate-400 hover:text-slate-200 p-0.5"
            >
              <X size={14} />
            </button>
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 mb-0.5">Location / Meeting Point:</label>
            <input
              type="text"
              placeholder="e.g. South Park Blocks (SW Salmon & Park)"
              value={meetupLocation}
              onChange={(e) => setMeetupLocation(e.target.value)}
              className="w-full bg-slate-950 border border-slate-750 focus:border-emerald-500 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-slate-400 mb-0.5">Date & Time:</label>
              <input
                type="text"
                placeholder="e.g. Saturday 5:15 PM"
                value={meetupDateTime}
                onChange={(e) => setMeetupDateTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-750 focus:border-emerald-500 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 mb-0.5">Target Species:</label>
              <input
                type="text"
                placeholder="e.g. Crow Mega-Roost"
                value={meetupSpecies}
                onChange={(e) => setMeetupSpecies(e.target.value)}
                className="w-full bg-slate-950 border border-slate-750 focus:border-emerald-500 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Message Input & Action Controls */}
      <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 bg-slate-900/90">
        <div className="flex items-center gap-1.5 mb-2">
          <button
            type="button"
            onClick={() => setIsProposingMeetup(!isProposingMeetup)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold border transition-all cursor-pointer ${
              isProposingMeetup
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-750'
            }`}
          >
            <Calendar size={12} />
            <span>{isProposingMeetup ? 'Cancel Meetup' : 'Propose Meetup'}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder={
              cooldownRemaining > 0
                ? `Cooldown active (${cooldownRemaining}s)...`
                : `Broadcast to ${activeChannel.name}...`
            }
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            disabled={cooldownRemaining > 0}
            className="flex-1 bg-slate-950 border border-slate-750 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none disabled:opacity-50 transition-all"
          />

          <button
            type="submit"
            disabled={(!messageInput.trim() && !isProposingMeetup) || cooldownRemaining > 0}
            className="p-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 disabled:opacity-40 disabled:hover:bg-emerald-500 transition-all cursor-pointer shadow-md shadow-emerald-500/20 active:scale-95 shrink-0"
            title="Send Message"
          >
            <Send size={15} />
          </button>
        </div>
      </form>
    </aside>
  </>
  );
};

export default FieldChatDrawer;
