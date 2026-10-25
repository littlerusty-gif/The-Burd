import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface CommunityMessage {
  id: string;
  created_at: string;
  user_name: string;
  message: string;
  roost_id: string | null;
  species_tag: string | null;
}

// Read Vite environment variables
const envSupabaseUrl = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_URL) || '';
const envSupabaseAnonKey = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY) || '';

export const isSupabaseConfigured: boolean = Boolean(
  envSupabaseUrl &&
  envSupabaseAnonKey &&
  !envSupabaseUrl.includes('placeholder') &&
  !envSupabaseUrl.includes('your-project')
);

// Fallback URL and anon key to prevent Supabase constructor crashes if env vars are pending
const activeUrl = isSupabaseConfigured ? envSupabaseUrl : 'https://thebirdbook-chat.supabase.co';
const activeKey = isSupabaseConfigured ? envSupabaseAnonKey : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.mock';

export const supabase: SupabaseClient = createClient(activeUrl, activeKey, {
  realtime: {
    params: {
      eventsPerSecond: 15,
    },
  },
});

/**
 * Lively seed messages for community roosts and field reporting
 */
export const SEED_COMMUNITY_MESSAGES: CommunityMessage[] = [
  {
    id: 'msg-seed-1',
    created_at: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    user_name: 'SkyWatcher_OR',
    message: 'Flock of ~4,000 Vaux’s Swifts just entered pre-roost staging over Forest Park ridgeline. Vortex is starting to form!',
    roost_id: 'roost-chapman-swifts',
    species_tag: "Vaux's Swift",
  },
  {
    id: 'msg-seed-2',
    created_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    user_name: 'CorvidLover',
    message: 'Streaming past Lloyd Center rooftop staging toward Hawthorne Bridge. Huge roost gathering tonight!',
    roost_id: 'roost-portland-downtown',
    species_tag: 'American Crow',
  },
  {
    id: 'msg-seed-3',
    created_at: new Date(Date.now() - 1000 * 60 * 6).toISOString(),
    user_name: 'CraneSpotter99',
    message: 'Over 12,000 Sandhill Cranes audible calling across Sturgeon Lake marshlands as the sun dips below the ridge.',
    roost_id: 'roost-sauvie-waterfowl',
    species_tag: 'Sandhill Crane',
  },
  {
    id: 'msg-seed-4',
    created_at: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    user_name: 'FieldBirder_Dave',
    message: 'Clear visibility along the Willamette River. Herons assembling along Ross Island sandbars.',
    roost_id: 'roost-oaks-bottom',
    species_tag: 'Great Blue Heron',
  },
];
