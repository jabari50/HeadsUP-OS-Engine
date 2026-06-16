-- Public athlete self-intake: a tightly-constrained anon INSERT path so users
-- can join from /join without an account (prod has no service-role key).
--
-- The WITH CHECK forces every anon-created row to be UNVERIFIED, independent,
-- unattached, and tagged self_intake — anon cannot self-verify, attach to a
-- program, mark demo, or claim another user's id (entry_source = self_submitted).
-- Anon has NO select/update/
-- delete on athletes (reads still go only through public_athlete_cards), so this
-- is an insert-only lead surface. Hardening TODO before public launch:
-- captcha / rate-limit to prevent spam inserts.

create policy "athletes_anon_self_intake" on public.athletes
  for insert to anon
  with check (
    sovereign_verified = false
    and coalesce(is_demo, false) = false
    and coalesce(is_historical, false) = false
    and account_type = 'independent'
    and program_id is null
    and user_id is null
    and entry_source = 'self_submitted'
  );
