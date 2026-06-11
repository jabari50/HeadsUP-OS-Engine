-- The Virtual GM: operator platform tables (operators, rosters, match_requests)
-- Applied to Supabase project "HeadsUP OS" (pgdvzvsnehkkhsubquhi) on 2026-06-10
-- via MCP migration: virtual_gm_operators_rosters_match_requests

create table public.operators (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  license_tier text not null default 'scout'
    check (license_tier in ('scout','coordinator','gm','white_label')),
  stripe_customer_id text unique,
  active boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.rosters (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid not null references public.operators(id) on delete cascade,
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  activation_status text not null default 'locked'
    check (activation_status in ('locked','preview_unlocked','full_unlocked','exclusive_lock')),
  added_at timestamptz not null default now(),
  unique (operator_id, athlete_id)
);

create table public.match_requests (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid not null references public.operators(id) on delete cascade,
  position text not null,
  height_min integer check (height_min between 48 and 96),
  height_max integer check (height_max between 48 and 96),
  class_year text,
  status text not null default 'pending'
    check (status in ('pending','matched','closed')),
  created_at timestamptz not null default now(),
  check (height_min is null or height_max is null or height_min <= height_max)
);

create index rosters_operator_id_idx on public.rosters (operator_id);
create index rosters_athlete_id_idx on public.rosters (athlete_id);
create index match_requests_operator_id_idx on public.match_requests (operator_id);

alter table public.operators enable row level security;
alter table public.rosters enable row level security;
alter table public.match_requests enable row level security;

-- operators: each operator can read/update only their own row.
-- Insert allowed only for self-provisioning (id must equal auth.uid()).
-- No delete policy: license removal is service-role only.
create policy "operators_select_own" on public.operators
  for select using ((select auth.uid()) = id);
create policy "operators_insert_own" on public.operators
  for insert with check ((select auth.uid()) = id);
create policy "operators_update_own" on public.operators
  for update using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- rosters: full CRUD scoped to the owning operator
create policy "rosters_select_own" on public.rosters
  for select using ((select auth.uid()) = operator_id);
create policy "rosters_insert_own" on public.rosters
  for insert with check ((select auth.uid()) = operator_id);
create policy "rosters_update_own" on public.rosters
  for update using ((select auth.uid()) = operator_id) with check ((select auth.uid()) = operator_id);
create policy "rosters_delete_own" on public.rosters
  for delete using ((select auth.uid()) = operator_id);

-- match_requests: full CRUD scoped to the owning operator
create policy "match_requests_select_own" on public.match_requests
  for select using ((select auth.uid()) = operator_id);
create policy "match_requests_insert_own" on public.match_requests
  for insert with check ((select auth.uid()) = operator_id);
create policy "match_requests_update_own" on public.match_requests
  for update using ((select auth.uid()) = operator_id) with check ((select auth.uid()) = operator_id);
create policy "match_requests_delete_own" on public.match_requests
  for delete using ((select auth.uid()) = operator_id);
