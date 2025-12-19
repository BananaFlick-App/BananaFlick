-- Drop ALL existing policies on likes and dislikes first (to remove dependencies)
DROP POLICY IF EXISTS "Users can view own likes" ON likes;
DROP POLICY IF EXISTS "Users manage own likes" ON likes;
DROP POLICY IF EXISTS "Users can view own dislikes" ON dislikes;
DROP POLICY IF EXISTS "Users manage own dislikes" ON dislikes;

-- Drop any other policies that might exist (catch-all)
DO $$ 
DECLARE
  pol record;
BEGIN
  -- Drop all policies on likes table
  FOR pol IN 
    SELECT policyname FROM pg_policies WHERE tablename = 'likes'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON likes', pol.policyname);
  END LOOP;
  
  -- Drop all policies on dislikes table
  FOR pol IN 
    SELECT policyname FROM pg_policies WHERE tablename = 'dislikes'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON dislikes', pol.policyname);
  END LOOP;
END $$;

-- Now fix schema issues: Remove incorrect auth_user_id columns if they exist
DO $$ 
BEGIN
  -- Remove auth_user_id from likes if it exists (should be user_id instead)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'likes' AND column_name = 'auth_user_id'
  ) THEN
    ALTER TABLE likes DROP COLUMN auth_user_id;
  END IF;
  
  -- Remove auth_user_id from dislikes if it exists (should be user_id instead)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'dislikes' AND column_name = 'auth_user_id'
  ) THEN
    ALTER TABLE dislikes DROP COLUMN auth_user_id;
  END IF;
END $$;

-- Ensure user_id columns exist (in case tables were created without them)
ALTER TABLE likes ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE dislikes ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES users(id) ON DELETE CASCADE;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS likes_user_id_idx ON likes(user_id);
CREATE INDEX IF NOT EXISTS dislikes_user_id_idx ON dislikes(user_id);

-- Create correct RLS policies that join with users table
CREATE POLICY "Users can view own likes" ON likes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = likes.user_id
      AND users.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view own dislikes" ON dislikes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = dislikes.user_id
      AND users.auth_user_id = auth.uid()
    )
  );
