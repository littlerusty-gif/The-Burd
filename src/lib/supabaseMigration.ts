/**
 * Raw SQL Migration for Supabase Realtime Community Birder Chat
 * Users can execute this in the Supabase SQL Editor if provisioning a new project.
 */
export const COMMUNITY_MESSAGES_MIGRATION_SQL = `
-- 1. Create the community_messages table
CREATE TABLE IF NOT EXISTS public.community_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  user_name TEXT DEFAULT 'Guest Birder' NOT NULL,
  message TEXT NOT NULL,
  roost_id TEXT,
  species_tag TEXT
);

-- 2. Performance indexes
CREATE INDEX IF NOT EXISTS idx_community_messages_created_at 
  ON public.community_messages (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_community_messages_roost_id 
  ON public.community_messages (roost_id);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.community_messages ENABLE ROW LEVEL SECURITY;

-- 4. Public read policy
CREATE POLICY "Allow public read access to community messages"
  ON public.community_messages
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- 5. Public insert policy
CREATE POLICY "Allow public insert to community messages"
  ON public.community_messages
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (length(trim(message)) > 0 AND length(message) <= 1000);

-- 6. Add to realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'community_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.community_messages;
  END IF;
END $$;
`.trim();
