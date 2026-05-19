-- Migration: Move kiosk settings from localStorage to Supabase
-- Adds logo_url to communities and creates community_settings table

-- 0. Ensure update_updated_at function exists
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$ LANGUAGE plpgsql;

-- 1. Add logo column to communities
ALTER TABLE communities ADD COLUMN IF NOT EXISTS logo_url text;

-- 2. Create community_settings table for catalog + floor plans
CREATE TABLE IF NOT EXISTS community_settings (
  community_id  uuid PRIMARY KEY REFERENCES communities(id) ON DELETE CASCADE,
  settings      jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at    timestamptz DEFAULT now()
);

CREATE TRIGGER trg_community_settings_updated
  BEFORE UPDATE ON community_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE community_settings ENABLE ROW LEVEL SECURITY;

-- 3. Add missing write policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'communities' AND policyname = 'Allow update access') THEN
    CREATE POLICY "Allow update access" ON communities FOR UPDATE USING (true);
  END IF;
END $$;

CREATE POLICY "Allow read access"   ON community_settings FOR SELECT USING (true);
CREATE POLICY "Allow insert access" ON community_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update access" ON community_settings FOR UPDATE USING (true);

-- Add missing insert policies for residents and collections (needed by kiosk)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'residents' AND policyname = 'Allow insert access') THEN
    CREATE POLICY "Allow insert access" ON residents FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'collections' AND policyname = 'Allow insert access') THEN
    CREATE POLICY "Allow insert access" ON collections FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'collections' AND policyname = 'Allow delete access') THEN
    CREATE POLICY "Allow delete access" ON collections FOR DELETE USING (true);
  END IF;
END $$;

-- 4. Grant API role access
GRANT ALL ON community_settings TO anon, authenticated, service_role;
