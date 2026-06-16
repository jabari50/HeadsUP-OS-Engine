-- Security remediation for pre-existing HU-OS RLS debt surfaced by the
-- pre-deploy audit (2026-06-16). NOT YET APPLIED — platform-wide behavior
-- change, pending Jabari review. `athletes` is currently ~0 rows so there is no
-- live data exposure, but this must land before real athlete data is loaded.
--
-- Fixes:
--   1. Anon full-table read of athletes (public_demo_read USING true).
--   2. Three reporting views running as SECURITY DEFINER (owner privileges).
--   3. persona_intel with RLS disabled.

-- ---------------------------------------------------------------------------
-- 1. Close the anon full-table read on athletes.
-- Replace blanket anon access with a column-scoped, row-scoped public VIEW so
-- the public recruiting profile (/profile/[slug]) gets only the approved
-- shareable-card fields for rows the athlete has made public. RLS is row-level
-- only, so column safety is enforced by exposing a view rather than the table.
-- ---------------------------------------------------------------------------
drop policy if exists "public_demo_read" on public.athletes;

create or replace view public.public_athlete_cards
with (security_invoker = on) as
  select
    profile_slug,
    full_name,
    position,
    graduation_year,
    school,
    location_city,
    location_state,
    ovr,
    market_position,
    confidence_band,
    secondary_tags,
    neck_up_pro_score,
    neck_up_ner
  from public.athletes
  where profile_public = true
    and coalesce(is_demo, false) = false;

-- The view is security_invoker, so callers still need a row-readable path on
-- athletes. Grant anon a narrow, public-only SELECT policy scoped to public rows.
create policy "athletes_anon_public_profile" on public.athletes
  for select to anon
  using (profile_public = true and coalesce(is_demo, false) = false);

grant select on public.public_athlete_cards to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. Make reporting views respect the caller's RLS (not the view owner's).
-- ---------------------------------------------------------------------------
alter view public.self_awareness_report        set (security_invoker = on);
alter view public.scout_ledger                 set (security_invoker = on);
alter view public.coach_intelligence_summary   set (security_invoker = on);

-- ---------------------------------------------------------------------------
-- 3. Enable RLS on persona_intel (default-deny) with admin-only read.
-- Matches existing convention: System_Admin via app_metadata, plus the new
-- super_admin role model. Service role bypasses RLS for ETL.
-- ---------------------------------------------------------------------------
alter table public.persona_intel enable row level security;

create policy "persona_intel_admin_read" on public.persona_intel
  for select to authenticated
  using (
    ((auth.jwt() -> 'app_metadata' ->> 'role') = 'System_Admin')
    or public.is_super_admin()
  );
