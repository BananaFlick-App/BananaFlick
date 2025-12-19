-- Update users table to include onboarding data
ALTER TABLE users ADD COLUMN IF NOT EXISTS favorite_genres text[];
ALTER TABLE users ADD COLUMN IF NOT EXISTS location text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_user_id uuid; -- Links to Supabase auth.users

-- Update dislikes to track when to show again (1 week from creation)
ALTER TABLE dislikes ADD COLUMN IF NOT EXISTS hide_until timestamptz DEFAULT (now() + interval '7 days');

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_dislikes_hide_until ON dislikes(user_id, hide_until);
CREATE INDEX IF NOT EXISTS idx_likes_user_item ON likes(user_id, item_id);

