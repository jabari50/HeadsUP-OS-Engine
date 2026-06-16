-- Account-grade programs (tenants). Created at coach signup.
-- DISTINCT from public.vgm_programs, which remains the scouting-intel view.
-- Depends on 0003 (is_super_admin helper). NOT yet applied — pending review.

create table public.programs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  head_coach_user_id uuid references auth.users(id) on delete set null,
  school text,
  uil_district text,
  classification text,            -- UIL classification, e.g. 6A / 5A / ...
  subscription_tier text not null default 'starter'
    check (subscription_tier in ('starter','pro','elite','district')),
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  is_demo boolean not null default false,
  is_historical boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index programs_head_coach_idx on public.programs (head_coach_user_id);

alter table public.programs enable row level security;

-- Head coach reads/updates own program; super_admin full access.
-- NOTE: assistant_coach membership is not yet modeled — when needed, add a
-- program_members table and widen these policies. Head coach is the MVP owner.
create policy "programs_select_member" on public.programs
  for select to authenticated
  using (head_coach_user_id = (select auth.uid()) or public.is_super_admin());

create policy "programs_insert_coach" on public.programs
  for insert to authenticated
  with check (head_coach_user_id = (select auth.uid()) or public.is_super_admin());

create policy "programs_update_member" on public.programs
  for update to authenticated
  using (head_coach_user_id = (select auth.uid()) or public.is_super_admin())
  with check (head_coach_user_id = (select auth.uid()) or public.is_super_admin());

-- Delete is super_admin only (program teardown is privileged).
create policy "programs_admin_delete" on public.programs
  for delete to authenticated
  using (public.is_super_admin());
