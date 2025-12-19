-- users table
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique not null,
  name text,
  favorite_genres text[],
  location text,
  onboarding_completed boolean default false,
  created_at timestamptz default now()
);

-- likes
create table if not exists likes (
  id bigserial primary key,
  user_id uuid references users(id) on delete cascade,
  item_id text not null,
  meta jsonb,
  created_at timestamptz default now()
);

-- dislikes
create table if not exists dislikes (
  id bigserial primary key,
  user_id uuid references users(id) on delete cascade,
  item_id text not null,
  meta jsonb,
  created_at timestamptz default now()
);

create index on likes (user_id);
create index on dislikes (user_id);

-- Enable RLS
alter table users enable row level security;
alter table likes enable row level security;
alter table dislikes enable row level security;

-- Policies
create policy "Users can view own data" on users for all using (auth.uid() = auth_user_id);
create policy "Users can view own likes" on likes for all using (auth.uid() = user_id);
create policy "Users can view own dislikes" on dislikes for all using (auth.uid() = user_id);
