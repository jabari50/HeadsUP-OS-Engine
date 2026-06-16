-- User role assignments — single source of truth for app role + RLS.
-- Roles: super_admin, coach, assistant_coach, athlete, independent_athlete, parent.
-- A user may hold multiple roles (e.g. coach + parent). Policies consult the
-- SECURITY DEFINER helpers below to avoid recursive RLS on this table.
-- NOT yet applied — pending Jabari review (2026-06-16).

create table public.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in (
    'super_admin','coach','assistant_coach',
    'athlete','independent_athlete','parent'
  )),
  granted_at timestamptz not null default now(),
  primary key (user_id, role)
);

alter table public.user_roles enable row level security;

-- Helpers run as SECURITY DEFINER so they read user_roles without triggering
-- this table's own RLS (prevents infinite recursion in the policies below).
create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = 'super_admin'
  );
$$;

create or replace function public.has_role(target_role text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = target_role
  );
$$;

-- A user can read their own roles; super_admins can read all.
create policy "user_roles_select_own" on public.user_roles
  for select to authenticated
  using ((select auth.uid()) = user_id or public.is_super_admin());

-- Role grants are privileged: super_admin (or service role) only.
create policy "user_roles_admin_write" on public.user_roles
  for all to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- Seed the founder as super_admin (no-op until that auth user exists / on re-run).
insert into public.user_roles (user_id, role)
select id, 'super_admin' from auth.users where email = 'jabari50@gmail.com'
on conflict do nothing;
