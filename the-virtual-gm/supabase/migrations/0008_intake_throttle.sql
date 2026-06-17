-- Server-side rate limit for anon /join self-intake. The table is locked down
-- (RLS on, no policies) and only the SECURITY DEFINER function touches it; anon
-- gets EXECUTE on the function, not the table.

create table public.intake_attempts (
  id bigint generated always as identity primary key,
  ip_hash text not null,
  created_at timestamptz not null default now()
);
create index intake_attempts_ip_idx on public.intake_attempts (ip_hash, created_at);

alter table public.intake_attempts enable row level security;
-- (intentionally no policies — table is function-only)

-- Records an attempt and returns true if the caller was UNDER the limit in the window.
create or replace function public.record_and_check_intake(
  p_ip_hash text,
  p_max integer,
  p_window_minutes integer
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  recent_count integer;
begin
  delete from public.intake_attempts where created_at < now() - interval '1 day';
  select count(*) into recent_count
    from public.intake_attempts
    where ip_hash = p_ip_hash
      and created_at > now() - make_interval(mins => p_window_minutes);
  insert into public.intake_attempts (ip_hash) values (p_ip_hash);
  return recent_count < p_max;
end;
$$;

revoke all on function public.record_and_check_intake(text, integer, integer) from public;
grant execute on function public.record_and_check_intake(text, integer, integer) to anon, authenticated;
