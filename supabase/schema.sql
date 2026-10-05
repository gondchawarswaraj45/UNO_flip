-- ============================================================================
-- UNO Flip — Supabase / PostgreSQL Schema Definition
-- Clean, high-performance schema for persistent metadata, users,
-- rooms, player membership, game records, results, statistics, and history.
-- Active real-time gameplay remains authoritative in the Node.js memory server.
-- ============================================================================

-- Enable pgcrypto for UUID generation if needed
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── 1. Users / Profiles ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  username VARCHAR(64) NOT NULL,
  avatar TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);

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

-- ─── 3. Rooms ─────────────────────────────────────────────────────────────────
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

-- ─── 4. Room Membership (Audit & Presence Log) ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.room_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code VARCHAR(16) NOT NULL,
  user_id TEXT NOT NULL,
  username VARCHAR(64) NOT NULL,
  is_bot BOOLEAN NOT NULL DEFAULT FALSE,
  role VARCHAR(20) NOT NULL DEFAULT 'PLAYER', -- 'HOST', 'PLAYER', 'SPECTATOR'
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  left_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_room_members_room ON public.room_members(room_code);
CREATE INDEX IF NOT EXISTS idx_room_members_user ON public.room_members(user_id);

-- ─── 5. Game Matches (Persistent Match Records) ──────────────────────────────
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

-- ─── 6. Match Player Placements / Per-Match Breakdown ─────────────────────────
CREATE TABLE IF NOT EXISTS public.match_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.game_matches(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  username VARCHAR(64) NOT NULL,
  is_bot BOOLEAN NOT NULL DEFAULT FALSE,
  rank INTEGER NOT NULL,
  cards_remaining INTEGER NOT NULL DEFAULT 0,
  score_awarded INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_match_players_match ON public.match_players(match_id);
CREATE INDEX IF NOT EXISTS idx_match_players_user ON public.match_players(user_id);

-- ─── 7. Helper View for Public Leaderboard ────────────────────────────────────
CREATE OR REPLACE VIEW public.leaderboard_view AS
SELECT 
  u.id AS user_id,
  u.username,
  u.avatar,
  s.matches_played,
  s.matches_won,
  ROUND(CASE WHEN s.matches_played > 0 THEN (s.matches_won::NUMERIC / s.matches_played::NUMERIC) * 100 ELSE 0 END, 1) AS win_rate_pct,
  s.cards_played,
  s.uno_calls,
  s.caught_success,
  s.total_score,
  s.updated_at
FROM public.users u
JOIN public.player_stats s ON u.id = s.user_id
ORDER BY s.matches_won DESC, s.total_score DESC, s.matches_played ASC;
