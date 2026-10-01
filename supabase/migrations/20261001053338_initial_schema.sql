-- Initial schema for Plog.
-- Table/column names follow the API shapes in docs/spec.md (Parts A4, C6, D7,
-- F6, G7). Anonymous sign-in (A4): auth.users row is created by
-- supabase.auth.signInAnonymously(), then the client inserts the matching
-- profiles row once it has a nickname — there's no auth trigger that
-- auto-creates an empty profile, since nickname is required.

-- ---------------------------------------------------------------------------
-- profiles (A4)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nickname text not null check (char_length(nickname) between 2 and 20),
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles are self-readable"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

create policy "profiles are self-insertable"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

create policy "profiles are self-updatable"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ---------------------------------------------------------------------------
-- sessions (C6 session save, D2-D5 litter log, F session detail, G7.2 list)
-- ---------------------------------------------------------------------------
create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,

  -- C6
  title text not null, -- server-generated per G4.4, not user-editable
  place_name text, -- reverse-geocoded on save (B5.1/G7.2) — [Proposed], not computed here yet
  started_at timestamptz not null,
  ended_at timestamptz not null,
  timezone text not null,
  duration_sec integer not null,
  distance_km numeric(6, 2) not null,
  elevation_gain_m numeric(7, 1),
  avg_pace_sec_per_km integer,
  route jsonb not null default '[]'::jsonb, -- [{lat,lng,alt,t}, ...], G7.3
  route_thumbnail_url text, -- generated server-side [Proposed], not computed here yet

  -- D2-D5 litter log — all null until "Finish & Log litter" (D8: 0 L sessions keep liters = 0, not null)
  fill_ratio numeric(3, 2),
  bag_size_liters numeric(5, 1),
  liters numeric(6, 1),
  photo_url text,

  -- E impact card
  impact_card_url text, -- generated server-side [Proposed], not computed here yet

  created_at timestamptz not null default now(),

  constraint sessions_duration_positive check (duration_sec > 0),
  constraint sessions_distance_non_negative check (distance_km >= 0)
);

create index sessions_user_started_at_idx on public.sessions (user_id, started_at desc);

alter table public.sessions enable row level security;

create policy "sessions are owner-readable"
  on public.sessions for select
  to authenticated
  using (user_id = auth.uid());

create policy "sessions are owner-insertable"
  on public.sessions for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "sessions are owner-updatable"
  on public.sessions for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "sessions are owner-deletable"
  on public.sessions for delete
  to authenticated
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- badges (G5.4) — static catalog + per-user progress
-- ---------------------------------------------------------------------------
create table public.badges (
  id text primary key, -- e.g. 'distance_1', 'streak_5'
  type text not null check (type in ('distance', 'streak')),
  label text not null,
  threshold numeric not null
);

alter table public.badges enable row level security;

create policy "badges catalog is readable by signed-in users"
  on public.badges for select
  to authenticated
  using (true);

create table public.user_badges (
  user_id uuid not null references public.profiles (id) on delete cascade,
  badge_id text not null references public.badges (id) on delete cascade,
  achieved_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);

alter table public.user_badges enable row level security;

create policy "user_badges are owner-readable"
  on public.user_badges for select
  to authenticated
  using (user_id = auth.uid());

-- Badge awarding itself (computing streaks/distance thresholds and inserting
-- rows here) is application/Edge Function logic, not set up by this
-- migration — see D7's `newBadges` response and claude.md.

-- ---------------------------------------------------------------------------
-- Grants — RLS policies above restrict which *rows* a role can touch, but
-- Postgres also requires the table-level privilege for the operation at all.
-- ---------------------------------------------------------------------------
grant usage on schema public to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.sessions to authenticated;
grant select on public.badges to authenticated;
grant select on public.user_badges to authenticated;
