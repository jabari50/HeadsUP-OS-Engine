-- The Heads Up! Foundation — auth shell + intake
-- Enforces the recommended role/permission matrix (pending Jabari sign-off +
-- legal/COPPA review before real minor data goes live).

-- ── Roles ─────────────────────────────────────────────────────────────
create type public.user_role as enum ('athlete', 'parent', 'coach', 'mentor', 'admin');

-- ── Profiles ──────────────────────────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  role public.user_role not null default 'athlete',
  -- Recruiter visibility: locked by default (activation-lock pattern);
  -- only a linked guardian (or admin) may unlock a minor's profile.
  visibility_unlocked boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Auto-create a profile on signup, honoring the role chosen at registration.
-- SECURITY NOTE: 'admin' can never be self-assigned — it is stripped here and
-- must be granted manually by an existing admin.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  requested_role text := coalesce(new.raw_user_meta_data ->> 'role', 'athlete');
begin
  if requested_role not in ('athlete', 'parent', 'coach', 'mentor') then
    requested_role := 'athlete';
  end if;
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data ->> 'full_name', requested_role::public.user_role);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Guardian ↔ athlete links (consent for minors) ─────────────────────
create table public.guardian_links (
  guardian_id uuid not null references public.profiles (id) on delete cascade,
  athlete_id uuid not null references public.profiles (id) on delete cascade,
  approved boolean not null default false, -- set by admin after verification
  created_at timestamptz not null default now(),
  primary key (guardian_id, athlete_id)
);

alter table public.guardian_links enable row level security;

-- ── Coach rosters (coaches see roster only, never the full database) ──
create table public.roster_assignments (
  coach_id uuid not null references public.profiles (id) on delete cascade,
  athlete_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (coach_id, athlete_id)
);

alter table public.roster_assignments enable row level security;

-- ── Helper: current user's role (avoids recursive RLS lookups) ────────
-- (named to avoid the reserved SQL keyword current_role)
create or replace function public.current_user_role()
returns public.user_role
language sql
security definer set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- ── RLS: profiles ─────────────────────────────────────────────────────
-- Own profile: view
create policy "own profile select" on public.profiles
  for select using (id = auth.uid());

-- Own profile: edit basics (role/visibility changes blocked via column grants below)
create policy "own profile update" on public.profiles
  for update using (id = auth.uid());

-- Guardian: view linked athlete
create policy "guardian views linked athlete" on public.profiles
  for select using (
    exists (
      select 1 from public.guardian_links gl
      where gl.athlete_id = profiles.id
        and gl.guardian_id = auth.uid()
        and gl.approved
    )
  );

-- Guardian: update linked (minor) athlete basics + visibility unlock
create policy "guardian updates linked athlete" on public.profiles
  for update using (
    exists (
      select 1 from public.guardian_links gl
      where gl.athlete_id = profiles.id
        and gl.guardian_id = auth.uid()
        and gl.approved
    )
  );

-- Coach: view own roster only
create policy "coach views roster" on public.profiles
  for select using (
    exists (
      select 1 from public.roster_assignments ra
      where ra.athlete_id = profiles.id
        and ra.coach_id = auth.uid()
    )
  );

-- Admin: all
create policy "admin all profiles" on public.profiles
  for all using (public.current_user_role() = 'admin');

-- Column-level hardening: regular users may only edit name basics.
-- role and visibility_unlocked are NOT grantable to authenticated — role is
-- admin-managed, and visibility unlock goes through the guardian RPC below
-- (athletes must not be able to unlock their own recruiter visibility).
revoke update on public.profiles from authenticated;
grant update (full_name) on public.profiles to authenticated;

-- Guardian-controlled visibility unlock (activation-lock pattern).
create or replace function public.set_athlete_visibility(
  target_athlete uuid,
  unlocked boolean
)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if public.current_user_role() = 'admin'
     or exists (
       select 1 from public.guardian_links gl
       where gl.athlete_id = target_athlete
         and gl.guardian_id = auth.uid()
         and gl.approved
     )
  then
    update public.profiles
      set visibility_unlocked = unlocked
      where id = target_athlete;
  else
    raise exception 'not authorized to change this athlete''s visibility';
  end if;
end;
$$;

-- ── RLS: guardian_links ───────────────────────────────────────────────
create policy "guardian sees own links" on public.guardian_links
  for select using (guardian_id = auth.uid() or athlete_id = auth.uid());

create policy "guardian requests link" on public.guardian_links
  for insert with check (guardian_id = auth.uid() and approved = false);

create policy "admin all guardian_links" on public.guardian_links
  for all using (public.current_user_role() = 'admin');

-- ── RLS: roster_assignments ───────────────────────────────────────────
create policy "coach sees own roster rows" on public.roster_assignments
  for select using (coach_id = auth.uid() or athlete_id = auth.uid());

create policy "admin all rosters" on public.roster_assignments
  for all using (public.current_user_role() = 'admin');

-- ── Intake submissions (Get Involved / Contact forms) ─────────────────
create table public.intake_submissions (
  id uuid primary key default gen_random_uuid(),
  segment text not null, -- volunteer | mentor | sponsor | contact
  email text not null,
  payload jsonb not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.intake_submissions enable row level security;

-- Inserts happen server-side via service role; only admins may read.
create policy "admin reads intake" on public.intake_submissions
  for select using (public.current_user_role() = 'admin');
