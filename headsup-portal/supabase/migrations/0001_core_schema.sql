-- ═══════════════════════════════════════════════════════════════════════════
-- HeadsUP Unified Portal — 0001 core schema
-- Handoff v1.1 §4. Layer-scoped: ingestion → intelligence → decision → access.
--
-- ⚠ TARGET: a FRESH Supabase project. The live "HeadsUP OS" project
-- (pgdvzvsnehkkhsubquhi) already holds a 67-column `athletes` table and 42
-- tables from prior HU-OS work. Applying this file there WILL collide.
-- Reconciliation against the live project is a separate, explicit migration
-- pass that Jabari signs off on (working agreement: confirm before schema
-- changes). Nothing in this repo applies itself automatically.
-- ═══════════════════════════════════════════════════════════════════════════

create extension if not exists moddatetime schema extensions;

-- ─── Access layer (referenced by decision tables) ───────────────────────────

create table operators (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  org_name text,
  license_tier text check (license_tier in ('Scout','Coordinator','GM','White Label')),
  seat_count int,
  activation_credits int not null default 0 check (activation_credits >= 0)
);
create index operators_user_idx on operators (user_id);

create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  stripe_customer_id text,
  stripe_sub_id text unique,
  tier text,
  status text,
  current_period_end timestamptz
);
create index subscriptions_user_idx on subscriptions (user_id);

-- Webhook idempotency (U9): Stripe redelivers; every event id processes once.
create table stripe_events (
  id text primary key,               -- Stripe event id (evt_...)
  type text not null,
  processed_at timestamptz default now()
);

create table council_sessions (
  id uuid primary key default gen_random_uuid(),
  topic text, prompt text, consensus text,
  confidence text check (confidence in ('HIGH','MODERATE','LOW')),
  top_model text, rankings jsonb,
  created_at timestamptz default now()
);

-- ─── Intelligence layer (HU-OS) ─────────────────────────────────────────────

create table athletes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  external_id text unique,           -- stable source ID when available (U10)
  name text not null,
  -- normalized natural key for idempotent upsert when external_id is absent
  name_school_class_key text generated always as (
    lower(trim(name)) || '|' || lower(coalesce(trim(school), '')) || '|' || coalesce(class_year, '')
  ) stored,
  position text check (position in ('PG','SG','SF','PF','C')),
  school text,
  class_year text,
  classification text check (classification in ('HS','JUCO','College','Pro')),
  scout_id uuid,
  -- physical
  height_in numeric, weight_lb numeric, wingspan_in numeric,
  physical_score numeric check (physical_score between 1 and 99),
  -- technical inputs (1-10 raw)
  tech_ball_handling numeric check (tech_ball_handling between 1 and 10),
  tech_shooting      numeric check (tech_shooting between 1 and 10),
  tech_finishing     numeric check (tech_finishing between 1 and 10),
  tech_passing       numeric check (tech_passing between 1 and 10),
  tech_defense       numeric check (tech_defense between 1 and 10),
  tech_rebounding    numeric check (tech_rebounding between 1 and 10),
  tech_athleticism   numeric check (tech_athleticism between 1 and 10),
  -- neural inputs (1-99)
  neural_composure    numeric check (neural_composure between 1 and 99),
  neural_coachability numeric check (neural_coachability between 1 and 99),
  neural_iq           numeric check (neural_iq between 1 and 99),
  neural_resilience   numeric check (neural_resilience between 1 and 99),
  neural_leadership   numeric check (neural_leadership between 1 and 99),
  neural_drive        numeric check (neural_drive between 1 and 99),
  -- computed 🔒 (engine-computed, server-written; gated in 0002)
  ovr  numeric check (ovr between 1 and 99),
  tier text check (tier in ('Elite','Impact','Contributor','Developing','Prospect')),
  -- global visibility floor; per-operator truth lives in activation_locks (U14)
  activation_state text not null default 'Locked'
    check (activation_state in ('Locked','Preview Unlocked','Full Unlocked','Exclusive Lock')),
  sovereign_verified boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create unique index athletes_natural_key on athletes (name_school_class_key)
  where external_id is null;
create index athletes_verified_idx on athletes (sovereign_verified)
  where sovereign_verified = true;
create index athletes_user_idx on athletes (user_id);

create trigger athletes_updated_at before update on athletes
  for each row execute procedure extensions.moddatetime (updated_at);

-- APPEND-ONLY FOREVER. Immutability is enforced in 0002 (revoke + trigger),
-- not merely implied by policy absence (U3).
create table neural_audit_log (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid references athletes(id),
  event_type text not null,
  ovr_before numeric,
  ovr_after numeric,
  actor uuid,
  detail jsonb,
  created_at timestamptz default now()
);
create index audit_athlete_idx on neural_audit_log (athlete_id, created_at);

create table badges (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references athletes(id) on delete cascade,
  badge_id text not null,
  name text,
  category text check (category in ('performance','character','milestone','quest')),
  awarded_at timestamptz default now(),
  unique (athlete_id, badge_id)      -- no duplicate awards on re-ingest (U11)
);

create table quests (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references athletes(id) on delete cascade,
  title text,
  target_attribute text,
  target_value numeric,
  current_value numeric,
  progress_pct numeric default 0 check (progress_pct between 0 and 100),
  status text default 'active' check (status in ('active','in_progress','completed','failed')),
  reward_badge_id text,
  deadline timestamptz
);
create index quests_athlete_idx on quests (athlete_id);

-- ─── Ingestion layer ─────────────────────────────────────────────────────────

create table intake_sessions (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('scout_manual','combine_csv','free_agents','ner_anchor','film_event')),
  submitted_by uuid references auth.users(id),
  idempotency_key text unique,       -- safe client retries never double-process (U10)
  status text not null default 'received' check (status in ('received','validated','rejected','processed')),
  created_at timestamptz default now()
);
create index intake_sessions_submitter_idx on intake_sessions (submitted_by, created_at);

create table intake_raw (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references intake_sessions(id) on delete cascade,
  payload jsonb not null,            -- raw, pre-validation
  validation_errors jsonb,           -- populated on failed validation
  athlete_id uuid references athletes(id),  -- backfilled on process: raw → canonical trace
  created_at timestamptz default now()
);
create index intake_raw_session_idx on intake_raw (session_id);

-- ─── Decision layer (The Virtual GM) ────────────────────────────────────────

create table programs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  head_coach text,
  system text check (system in ('Positionless','Traditional','Pace-and-Space')),
  level text,
  conference text
);

-- Roster membership. Not in handoff v1.0/v1.1 §4 but required: roster-gap
-- recompute is undefined without knowing who is ON the roster.
create table program_roster (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references programs(id) on delete cascade,
  athlete_id uuid not null references athletes(id) on delete cascade,
  added_at timestamptz default now(),
  unique (program_id, athlete_id)
);

create table roster_gaps (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references programs(id) on delete cascade,
  position text check (position in ('PG','SG','SF','PF','C')),
  attribute_need text,
  priority text check (priority in ('HIGH','MED','LOW'))
);
create index roster_gaps_program_idx on roster_gaps (program_id);

create table matches (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references athletes(id),
  program_id uuid not null references programs(id),
  fit_score numeric check (fit_score between 0 and 100),  -- 🔒 gated in 0002 (U2)
  style_fit numeric, need_fit numeric, level_fit numeric, cultural_fit numeric,
  recommendation text check (recommendation in ('Pursue','Monitor','Pass')),
  created_at timestamptz default now(),
  unique (athlete_id, program_id)    -- recompute updates, never duplicates
);

create table draft_board (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid not null references operators(id) on delete cascade,
  athlete_id uuid not null references athletes(id) on delete cascade,
  rank int,
  notes text,
  unique (operator_id, athlete_id)
);

-- Per-operator activation truth (U14). Effective visibility for operator O on
-- athlete A = non-expired activation_locks(A,O).state, else athletes.activation_state.
create table activation_locks (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references athletes(id),
  operator_id uuid not null references operators(id),
  state text not null check (state in ('Locked','Preview Unlocked','Full Unlocked','Exclusive Lock')),
  expires_at timestamptz,            -- Exclusive Lock windows
  created_at timestamptz default now(),
  unique (athlete_id, operator_id)
);
