-- Fix A (2026-06-18): close the anon column-leak on public athlete profiles.
--
-- BUG: migration 0006 added `athletes_anon_public_profile`, a ROW-level
-- SELECT policy granting anon (and authenticated) read of the `athletes` base
-- table for any `profile_public = true` row. RLS is row-level only, so this
-- exposed EVERY column of those rows — including `assessment_answers`, which is
-- the only place a self-intake applicant's email is stored. Public intake would
-- have made every applicant's email anon-harvestable.
--
-- FIX: the public recruiting card must be served exclusively by the
-- column-scoped `public_athlete_cards` view, with NO direct anon read of the
-- base table. The view is owned by `postgres` (BYPASSRLS), so running it as a
-- definer view (security_invoker = off) lets anon resolve ONLY the approved
-- card columns for published, non-demo rows — never assessment_answers/email.
--
-- Read paths verified before this change:
--   * Public profile (/profile/[slug], OG image) -> public_athlete_cards view only.
--   * Anon self-intake INSERT -> athletes_anon_self_intake (unaffected; INSERT only).
--   * Operators/admins/athletes -> their own authenticated SELECT policies.
--
-- NOTE: Supabase's security advisor flags security_invoker=off views as
-- "SECURITY DEFINER view". That is the intended, correct pattern here — a
-- deliberately public, column-restricted card — and is acknowledged.

-- 1. Remove the anon/authenticated full-column read on the base table.
drop policy if exists "athletes_anon_public_profile" on public.athletes;

-- 2. Run the public card view with the (BYPASSRLS) owner's privileges so it
--    resolves without any base-table RLS grant to the caller.
alter view public.public_athlete_cards set (security_invoker = off);

-- 3. Re-affirm the view is the public read surface (idempotent).
grant select on public.public_athlete_cards to anon, authenticated;
