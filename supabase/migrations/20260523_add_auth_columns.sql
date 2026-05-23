-- Add authentication columns to admin_users and community codes to communities

-- ─── admin_users: link to Supabase Auth + approval status ───
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS auth_id uuid UNIQUE;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'approved'
  CHECK (status IN ('pending', 'approved', 'denied'));

-- ─── communities: short alphanumeric code for kiosk entry ───
ALTER TABLE communities ADD COLUMN IF NOT EXISTS community_code text UNIQUE;

-- Seed codes for existing communities
UPDATE communities SET community_code = 'MAPLE1' WHERE name LIKE 'Maple Ridge%' AND community_code IS NULL;
UPDATE communities SET community_code = 'GARDVW' WHERE name LIKE 'Garden View%' AND community_code IS NULL;
UPDATE communities SET community_code = 'HERTGE' WHERE name LIKE 'Heritage%' AND community_code IS NULL;

-- Auto-generate community codes on insert when not provided
CREATE OR REPLACE FUNCTION generate_community_code()
RETURNS trigger AS $$
DECLARE
  code text;
  attempts int := 0;
BEGIN
  IF NEW.community_code IS NOT NULL THEN RETURN NEW; END IF;
  LOOP
    code := upper(substr(md5(random()::text), 1, 6));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM communities WHERE community_code = code);
    attempts := attempts + 1;
    EXIT WHEN attempts > 10;
  END LOOP;
  NEW.community_code := code;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_communities_code
  BEFORE INSERT ON communities
  FOR EACH ROW EXECUTE FUNCTION generate_community_code();
