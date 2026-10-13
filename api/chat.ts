import type { Request, Response } from 'express';
import { ChatMessage } from '../src/types/chat';
import { INITIAL_CHAT_MESSAGES } from '../src/data/mockChatData';

// Shared in-memory store for serverless warm container instances
let globalMessages: ChatMessage[] = [...INITIAL_CHAT_MESSAGES];

// Presence tracking: clientId -> { channelId: string, lastSeen: number }
interface PresenceEntry {
  channelId: string;
  lastSeen: number;
}
const globalPresence = new Map<string, PresenceEntry>();

function cleanStalePresence() {
  const cutoff = Date.now() - 35000; // 35 seconds
  for (const [id, entry] of globalPresence.entries()) {
    if (entry.lastSeen < cutoff) {
      globalPresence.delete(id);
    }
  }
}

function getPresenceCount(channelId: string): number {
  cleanStalePresence();
  let count = 0;
  for (const entry of globalPresence.values()) {
    if (entry.channelId === channelId) {
      count++;
    }
  }
  // Baseline minimum presence so rooms feel alive
  return Math.max(count, 3);
}

export default async function handler(req: Request, res: Response) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Handle Presence Heartbeat or Posting
  if (req.method === 'POST') {
    try {
      const body = req.body || {};

      // 1. Presence Heartbeat
      if (body.action === 'presence' || body.type === 'presence') {
        const clientId = body.clientId || 'anon';
        const channelId = body.channelId || 'portland';
        globalPresence.set(clientId, { channelId, lastSeen: Date.now() });
        const count = getPresenceCount(channelId);
        return res.status(200).json({ success: true, presenceCount: count });
      }

      // 2. Post Chat Message
      const message: ChatMessage = body.message || body;
      if (!message || !message.text) {
        return res.status(400).json({ error: 'Message payload required' });
      }

      // Check for deduplication
      const existing = globalMessages.find((m) => m.id === message.id);
      if (!existing) {
        const enriched: ChatMessage = {
          ...message,
          status: 'synced',
          timestamp: message.timestamp || Date.now(),
        };
        globalMessages.push(enriched);
        // Keep last 400 messages to bound memory
        if (globalMessages.length > 400) {
          globalMessages = globalMessages.slice(-400);
        }
      }

      // Update sender presence
      if (body.clientId) {
        globalPresence.set(body.clientId, {
          channelId: message.channelId,
          lastSeen: Date.now(),
        });
      }

      const presenceCount = getPresenceCount(message.channelId);
      return res.status(200).json({
        success: true,
        message: existing || message,
        presenceCount,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to process message' });
    }
  }

  // Handle GET /api/chat?channelId=...&since=...
  if (req.method === 'GET') {
    const channelId = (req.query?.channelId as string) || '';
    const since = req.query?.since ? parseInt(req.query.since as string, 10) : 0;
    const clientId = (req.query?.clientId as string) || '';

    if (clientId && channelId) {
      globalPresence.set(clientId, { channelId, lastSeen: Date.now() });
    }

    let filtered = globalMessages;
    if (channelId) {
      filtered = filtered.filter((m) => m.channelId === channelId);
    }
    if (since > 0) {
      filtered = filtered.filter((m) => {
        const time = typeof m.timestamp === 'number' ? m.timestamp : new Date(m.timestamp).getTime();
        return time > since;
      });
    }

    const presenceCount = getPresenceCount(channelId || 'portland');
    return res.status(200).json({
      messages: filtered,
      presenceCount,
      timestamp: Date.now(),
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
