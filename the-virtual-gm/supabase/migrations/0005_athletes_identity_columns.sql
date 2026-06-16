-- Phase 0 identity/tenancy columns on athletes + self/program RLS.
-- program_id is NULLABLE BY DESIGN: independent athletes have NULL until a
-- Connect-to-Program merge sets it. Depends on 0003 + 0004. NOT yet applied.

alter table public.athletes
  add column if not exists program_id uuid references public.programs(id) on delete set null,
  add column if not exists account_type text not null default 'independent'
    check (account_type in ('independent','program')),
  add column if not exists profile_slug text,
  add column if not exists is_demo boolean not null default false,
  add column if not exists is_historical boolean not null default false,
  add column if not exists historical_source text,
  add column if not exists historical_eval_date date;

create index if not exists athletes_program_id_idx on public.athletes (program_id);

-- Backfill profile_slug for existing rows: firstname-lastname-gradyear.
-- (Live table is ~0 rows; this is defensive. App de-dupes new slugs with a suffix.)
update public.athletes
set profile_slug = trim(both '-' from regexp_replace(
      lower(coalesce(full_name, 'athlete') || '-' ||
            coalesce(graduation_year::text, '')),
      '[^a-z0-9]+', '-', 'g'))
where profile_slug is null;

-- Public profile URLs require globally-unique slugs (NULLs remain allowed).
create unique index if not exists athletes_profile_slug_key on public.athletes (profile_slug);

-- ---------------------------------------------------------------------------
-- RLS: additive self/program access. These are OR-combined with any existing
-- athletes policies.
-- SECURITY NOTE: a pre-existing `public_demo_read` policy grants anon full read
-- of every athletes row (flagged earlier, NOT changed here). The public profile
-- feature should rely on profile_public + an explicit anon policy, and
-- public_demo_read should be tightened in a dedicated security migration before
-- production. Do not treat these new policies as closing that exposure.
-- ---------------------------------------------------------------------------

-- Owner (independent or program athlete) can read own row; head coach of the
-- athlete's program can read program athletes; super_admin reads all.
create policy "vgm_athletes_select_self_or_program" on public.athletes
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or public.is_super_admin()
    or (program_id is not null and exists (
      select 1 from public.programs p
      where p.id = athletes.program_id
        and p.head_coach_user_id = (select auth.uid())
    ))
  );

-- Athlete can create their own record; super_admin may create on anyone's behalf.
create policy "vgm_athletes_insert_self" on public.athletes
  for insert to authenticated
  with check (user_id = (select auth.uid()) or public.is_super_admin());

-- Athlete can update own row; super_admin can update any.
create policy "vgm_athletes_update_self" on public.athletes
  for update to authenticated
  using (user_id = (select auth.uid()) or public.is_super_admin())
  with check (user_id = (select auth.uid()) or public.is_super_admin());
