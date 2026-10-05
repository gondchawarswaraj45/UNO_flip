-- ============================================================================
-- Migration: 001_initial_schema.sql
-- Description: Complete initial schema for UNO Flip persistent layer in PostgreSQL / Supabase.
-- Real-time gameplay state is strictly maintained in Node.js server memory.
-- PostgreSQL / Supabase stores users, rooms, membership logs, game records, 
-- results, statistics, and leaderboard data.
-- ============================================================================

-- Enable pgcrypto for UUID generation if needed
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── 0. Migration History Tracking ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public._migrations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 1. Users / Player Profiles ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  username VARCHAR(64) NOT NULL,
  avatar_url TEXT,
  avatar TEXT, -- backwards-compatibility alias
  is_anonymous BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_last_seen ON public.users(last_seen_at DESC);

-- ─── 2. Player Persistent Statistics ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.player_stats (
  user_id TEXT PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  matches_played INTEGER NOT NULL DEFAULT 0,
  matches_won INTEGER NOT NULL DEFAULT 0,
  cards_played INTEGER NOT NULL DEFAULT 0,
  uno_calls INTEGER NOT NULL DEFAULT 0,
  caught_success INTEGER NOT NULL DEFAULT 0,
  caught_penalized INTEGER NOT NULL DEFAULT 0,
  total_score INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_player_stats_wins ON public.player_stats(matches_won DESC);
CREATE INDEX IF NOT EXISTS idx_player_stats_score ON public.player_stats(total_score DESC);
CREATE INDEX IF NOT EXISTS idx_player_stats_matches ON public.player_stats(matches_played DESC);

-- ─── 3. Game Rooms ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code VARCHAR(16) NOT NULL UNIQUE,
  host_id TEXT NOT NULL,
  game_mode VARCHAR(32) NOT NULL DEFAULT 'CLASSIC',
  color_mode VARCHAR(16) NOT NULL DEFAULT 'FOUR',
  status VARCHAR(24) NOT NULL DEFAULT 'WAITING', -- 'WAITING', 'PLAYING', 'FINISHED', 'ABANDONED'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rooms_code ON public.rooms(room_code);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON public.rooms(status);
CREATE INDEX IF NOT EXISTS idx_rooms_created ON public.rooms(created_at DESC);

-- ─── 4. Room Participants / Membership Audit Log ─────────────────────────────
CREATE TABLE IF NOT EXISTS public.room_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code VARCHAR(16) NOT NULL,
  user_id TEXT NOT NULL,
  username VARCHAR(64) NOT NULL,
  is_bot BOOLEAN NOT NULL DEFAULT FALSE,
  role VARCHAR(20) NOT NULL DEFAULT 'PLAYER', -- 'HOST', 'PLAYER', 'SPECTATOR'
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  left_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_room_participants_room ON public.room_participants(room_code);
CREATE INDEX IF NOT EXISTS idx_room_participants_user ON public.room_participants(user_id);

-- Backward-compatibility view for room_members
CREATE OR REPLACE VIEW public.room_members AS
SELECT id, room_code, user_id, username, is_bot, role, joined_at, left_at
FROM public.room_participants;

-- ─── 5. Game Matches (Historical Match Records) ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.game_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code VARCHAR(16) NOT NULL,
  game_mode VARCHAR(32) NOT NULL,
  color_mode VARCHAR(16) NOT NULL,
  winner_id TEXT,
  winner_name VARCHAR(64),
  total_turns INTEGER NOT NULL DEFAULT 0,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  total_flips INTEGER NOT NULL DEFAULT 0,
  final_standings JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_game_matches_room ON public.game_matches(room_code);
CREATE INDEX IF NOT EXISTS idx_game_matches_winner ON public.game_matches(winner_id);
CREATE INDEX IF NOT EXISTS idx_game_matches_created ON public.game_matches(created_at DESC);

-- ─── 6. Match Player Placements / Breakdown ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.match_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.game_matches(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  username VARCHAR(64) NOT NULL,
  is_bot BOOLEAN NOT NULL DEFAULT FALSE,
  placement INTEGER NOT NULL,
  rank INTEGER GENERATED ALWAYS AS (placement) STORED,
  cards_remaining INTEGER NOT NULL DEFAULT 0,
  score_awarded INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_match_players_match ON public.match_players(match_id);
CREATE INDEX IF NOT EXISTS idx_match_players_user ON public.match_players(user_id);

-- ─── 7. Automatic Updated-At Triggers ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_player_stats_updated_at ON public.player_stats;
CREATE TRIGGER trg_player_stats_updated_at
  BEFORE UPDATE ON public.player_stats
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_rooms_updated_at ON public.rooms;
CREATE TRIGGER trg_rooms_updated_at
  BEFORE UPDATE ON public.rooms
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ─── 8. Public Leaderboard View ───────────────────────────────────────────────
CREATE OR REPLACE VIEW public.leaderboard_view AS
SELECT 
  u.id AS user_id,
  u.username,
  COALESCE(u.avatar_url, u.avatar) AS avatar,
  u.avatar_url,
  s.matches_played,
  s.matches_won,
  ROUND(CASE WHEN s.matches_played > 0 THEN (s.matches_won::NUMERIC / s.matches_played::NUMERIC) * 100 ELSE 0 END, 1) AS win_rate_pct,
  s.cards_played,
  s.uno_calls,
  s.caught_success,
  s.caught_penalized,
  s.total_score,
  s.updated_at
FROM public.users u
JOIN public.player_stats s ON u.id = s.user_id
ORDER BY s.matches_won DESC, s.total_score DESC, s.matches_played ASC;

-- ─── 9. Security & Row Level Security (RLS) ───────────────────────────────────
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_players ENABLE ROW LEVEL SECURITY;

-- Public read access policies (for client leaderboard, public profiles, and match history queries)
DROP POLICY IF EXISTS "Allow public read access on users" ON public.users;
CREATE POLICY "Allow public read access on users" ON public.users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read access on player_stats" ON public.player_stats;
CREATE POLICY "Allow public read access on player_stats" ON public.player_stats FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read access on rooms" ON public.rooms;
CREATE POLICY "Allow public read access on rooms" ON public.rooms FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read access on room_participants" ON public.room_participants;
CREATE POLICY "Allow public read access on room_participants" ON public.room_participants FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read access on game_matches" ON public.game_matches;
CREATE POLICY "Allow public read access on game_matches" ON public.game_matches FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read access on match_players" ON public.match_players;
CREATE POLICY "Allow public read access on match_players" ON public.match_players FOR SELECT USING (true);

-- Service-role write access policies for Supabase PostgREST
DROP POLICY IF EXISTS "Allow service role full access on users" ON public.users;
CREATE POLICY "Allow service role full access on users" ON public.users FOR ALL 
  USING ((SELECT auth.jwt() ->> 'role') = 'service_role') 
  WITH CHECK ((SELECT auth.jwt() ->> 'role') = 'service_role');

DROP POLICY IF EXISTS "Allow service role full access on player_stats" ON public.player_stats;
CREATE POLICY "Allow service role full access on player_stats" ON public.player_stats FOR ALL 
  USING ((SELECT auth.jwt() ->> 'role') = 'service_role') 
  WITH CHECK ((SELECT auth.jwt() ->> 'role') = 'service_role');

DROP POLICY IF EXISTS "Allow service role full access on rooms" ON public.rooms;
CREATE POLICY "Allow service role full access on rooms" ON public.rooms FOR ALL 
  USING ((SELECT auth.jwt() ->> 'role') = 'service_role') 
  WITH CHECK ((SELECT auth.jwt() ->> 'role') = 'service_role');

DROP POLICY IF EXISTS "Allow service role full access on room_participants" ON public.room_participants;
CREATE POLICY "Allow service role full access on room_participants" ON public.room_participants FOR ALL 
  USING ((SELECT auth.jwt() ->> 'role') = 'service_role') 
  WITH CHECK ((SELECT auth.jwt() ->> 'role') = 'service_role');

DROP POLICY IF EXISTS "Allow service role full access on game_matches" ON public.game_matches;
CREATE POLICY "Allow service role full access on game_matches" ON public.game_matches FOR ALL 
  USING ((SELECT auth.jwt() ->> 'role') = 'service_role') 
  WITH CHECK ((SELECT auth.jwt() ->> 'role') = 'service_role');

DROP POLICY IF EXISTS "Allow service role full access on match_players" ON public.match_players;
CREATE POLICY "Allow service role full access on match_players" ON public.match_players FOR ALL 
  USING ((SELECT auth.jwt() ->> 'role') = 'service_role') 
  WITH CHECK ((SELECT auth.jwt() ->> 'role') = 'service_role');
