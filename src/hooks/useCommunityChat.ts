import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase, isSupabaseConfigured, CommunityMessage, SEED_COMMUNITY_MESSAGES } from '../lib/supabase';

const LOCAL_STORAGE_MESSAGES_KEY = 'thebirdbook_community_messages_v1';
const BROADCAST_CHANNEL_NAME = 'thebirdbook_community_chat_sync';

export interface SendMessageOptions {
  text: string;
  userName?: string;
  roostId?: string | null;
  speciesTag?: string | null;
}

export function useCommunityChat(activeRoostId: string | null = null, isChatOpen: boolean = false) {
  const [messages, setMessages] = useState<CommunityMessage[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_MESSAGES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}
    return SEED_COMMUNITY_MESSAGES;
  });

  const [activeChannel, setActiveChannel] = useState<'global' | string>(activeRoostId || 'global');
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isRealtimeActive, setIsRealtimeActive] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const isChatOpenRef = useRef<boolean>(isChatOpen);
  isChatOpenRef.current = isChatOpen;

  // Sync active channel when a roost is selected
  useEffect(() => {
    if (activeRoostId) {
      setActiveChannel(activeRoostId);
    }
  }, [activeRoostId]);

  // Reset unread counter when drawer opens
  useEffect(() => {
    if (isChatOpen) {
      setUnreadCount(0);
    }
  }, [isChatOpen]);

  // Save messages to localStorage for offline persistence
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_MESSAGES_KEY, JSON.stringify(messages.slice(-100)));
    } catch {}
  }, [messages]);

  // 1. Fetch recent message history (last 50 messages)
  const fetchMessageHistory = useCallback(async () => {
    if (!isSupabaseConfigured) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('community_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && Array.isArray(data) && data.length > 0) {
        // Reverse so oldest is first, newest at bottom
        const fetchedMessages = [...data].reverse() as CommunityMessage[];
        setMessages((prev) => {
          const map = new Map<string, CommunityMessage>();
          // Preserve seed and existing messages
          SEED_COMMUNITY_MESSAGES.forEach((m) => map.set(m.id, m));
          prev.forEach((m) => map.set(m.id, m));
          fetchedMessages.forEach((m) => map.set(m.id, m));
          return Array.from(map.values()).sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        });
      }
    } catch (err) {
      console.warn('Community chat history fetch notice:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 2. Setup Supabase Realtime Subscription + Multi-tab BroadcastChannel
  useEffect(() => {
    let isSubscribed = true;
    fetchMessageHistory();

    // Multi-tab sync fallback
    let broadcast: BroadcastChannel | null = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        broadcast = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        broadcast.onmessage = (event) => {
          if (event.data && event.data.type === 'NEW_MESSAGE') {
            const incoming = event.data.payload as CommunityMessage;
            setMessages((prev) => {
              if (prev.some((m) => m.id === incoming.id)) return prev;
              return [...prev, incoming];
            });
            if (!isChatOpenRef.current) {
              setUnreadCount((c) => c + 1);
            }
          }
        };
      }
    } catch {}

    // Supabase Realtime Subscription
    let realtimeChannel: any = null;
    if (isSupabaseConfigured) {
      try {
        realtimeChannel = supabase
          .channel('public:community_messages')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'community_messages',
            },
            (payload) => {
              if (!isSubscribed) return;
              const incoming = payload.new as CommunityMessage;
              if (incoming && incoming.id) {
                setMessages((prev) => {
                  if (prev.some((m) => m.id === incoming.id)) return prev;
                  return [...prev, incoming];
                });
                if (!isChatOpenRef.current) {
                  setUnreadCount((c) => c + 1);
                }
              }
            }
          )
          .subscribe((status) => {
            if (isSubscribed) {
              setIsRealtimeActive(status === 'SUBSCRIBED');
            }
          });
      } catch (err) {
        console.warn('Realtime channel subscription error:', err);
      }
    } else {
      setIsRealtimeActive(true); // Active in local broadcast mode
    }

    return () => {
      isSubscribed = false;
      if (broadcast) {
        try {
          broadcast.close();
        } catch {}
      }
      if (realtimeChannel) {
        try {
          supabase.removeChannel(realtimeChannel);
        } catch {}
      }
    };
  }, [fetchMessageHistory]);

  // 3. Send message function
  const sendMessage = useCallback(
    async ({ text, userName, roostId, speciesTag }: SendMessageOptions) => {
      const trimmed = text.trim();
      if (!trimmed) return null;

      const optimisticMessage: CommunityMessage = {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        created_at: new Date().toISOString(),
        user_name: userName?.trim() || 'Guest Birder',
        message: trimmed,
        roost_id: roostId || null,
        species_tag: speciesTag || null,
      };

      // Optimistic update
      setMessages((prev) => [...prev, optimisticMessage]);

      // Broadcast to other tabs
      try {
        if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
          const bc = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
          bc.postMessage({ type: 'NEW_MESSAGE', payload: optimisticMessage });
          bc.close();
        }
      } catch {}

      // Send to Supabase Realtime Postgres if configured
      if (isSupabaseConfigured) {
        try {
          const { error } = await supabase.from('community_messages').insert([
            {
              id: optimisticMessage.id,
              user_name: optimisticMessage.user_name,
              message: optimisticMessage.message,
              roost_id: optimisticMessage.roost_id,
              species_tag: optimisticMessage.species_tag,
            },
          ]);
          if (error) {
            console.warn('Supabase insert notice, message retained locally:', error.message);
          }
        } catch (err) {
          console.warn('Supabase client insert caught error:', err);
        }
      }

      return optimisticMessage;
    },
    []
  );

  // 4. Messages filtered by active channel
  const filteredMessages = useMemo(() => {
    if (activeChannel === 'global') {
      return messages;
    }
    return messages.filter((m) => m.roost_id === activeChannel || !m.roost_id);
  }, [messages, activeChannel]);

  const markAsRead = useCallback(() => {
    setUnreadCount(0);
  }, []);

  return {
    messages: filteredMessages,
    allMessages: messages,
    activeChannel,
    setActiveChannel,
    unreadCount,
    markAsRead,
    isRealtimeActive,
    isSupabaseConfigured,
    isLoading,
    sendMessage,
    refreshHistory: fetchMessageHistory,
  };
}
