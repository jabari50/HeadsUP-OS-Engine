-- ═══════════════════════════════════════════════════════════════════════════
-- HeadsUP Unified Portal — 0002 RLS, score-write gates, append-only audit
-- Handoff v1.1 §5. Gate 4 + Gate 7 acceptance criteria live here.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 5.0 Deny by default: EVERY table. A table missing here is a Gate 4 FAIL.
alter table operators         enable row level security;
alter table subscriptions     enable row level security;
alter table stripe_events     enable row level security;
alter table council_sessions  enable row level security;
alter table athletes          enable row level security;
alter table neural_audit_log  enable row level security;
alter table badges            enable row level security;
alter table quests            enable row level security;
alter table intake_sessions   enable row level security;
alter table intake_raw        enable row level security;
alter table programs          enable row level security;
alter table program_roster    enable row level security;
alter table roster_gaps       enable row level security;
alter table matches           enable row level security;
alter table draft_board       enable row level security;
alter table activation_locks  enable row level security;

-- Single role helper used by every policy. app_metadata is server-controlled;
-- user_metadata is user-writable and must NEVER appear in a policy (Gate 7).
create or replace function app_role() returns text
language sql stable as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '')
$$;

-- Operator row for the calling user (used to scope decision-layer tables).
create or replace function my_operator_id() returns uuid
language sql stable as $$
  select id from operators where user_id = auth.uid() limit 1
$$;

-- ─── athletes ────────────────────────────────────────────────────────────────
create policy athlete_read_own on athletes for select
  using (auth.uid() = user_id);
create policy athlete_update_own on athletes for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy scout_read_verified on athletes for select
  using (sovereign_verified = true and app_role() = 'College_Scout');
create policy operator_read_athletes on athletes for select
  using (app_role() in ('Coach','GM','Coordinator') and my_operator_id() is not null);
create policy admin_full_athletes on athletes for all
  using (app_role() = 'System_Admin') with check (app_role() = 'System_Admin');

-- U4: RLS is row-level only. Column control = GRANTs. Athletes may update
-- their identity/physical columns; NEVER technical, neural, verification,
-- or computed columns.
revoke update on athletes from authenticated;
grant  update (name, school, class_year, height_in, weight_lb, wingspan_in)
  on athletes to authenticated;
-- Browser inserts are not a thing: all intake flows through the server.
revoke insert, delete on athletes from authenticated, anon;
revoke all on athletes from anon;

-- ─── neural_audit_log: SELECT admin-only; physically append-only (U3) ───────
create policy admin_read_audit on neural_audit_log for select
  using (app_role() = 'System_Admin');

revoke update, delete on neural_audit_log from anon, authenticated, service_role;

create or replace function block_audit_mutation() returns trigger
language plpgsql as $$
begin
  raise exception 'neural_audit_log is append-only';
end $$;

create trigger trg_audit_immutable
  before update or delete on neural_audit_log
  for each row execute function block_audit_mutation();

-- ─── Score-write gate: NULL-safe, INSERT + UPDATE (U1, U2) ───────────────────
-- v1.0's `role <> 'System_Admin'` evaluated to NULL (not TRUE) for tokens with
-- no role claim — the gate never fired for exactly the callers it had to stop.
create or replace function enforce_score_write_gate() returns trigger
language plpgsql security definer as $$
declare
  jwt_role text := coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '');
  db_role  text := coalesce(current_setting('request.jwt.claim.role', true), current_user);
begin
  -- Allowed writers: System_Admin users and the server's service-role context
  -- (the Next.js API layer — sole holder of the service key).
  if jwt_role = 'System_Admin' or db_role in ('service_role', 'postgres') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.ovr is not null or new.tier is not null then
      raise exception 'Score columns are engine-write only';
    end if;
  elsif new.ovr is distinct from old.ovr or new.tier is distinct from old.tier then
    raise exception 'Score columns are engine-write only';
  end if;
  return new;
end $$;

create trigger trg_score_gate before insert or update on athletes
  for each row execute function enforce_score_write_gate();

-- matches.fit_score was marked 🔒 in v1.0 but never actually gated (U2).
create or replace function enforce_fit_score_gate() returns trigger
language plpgsql security definer as $$
declare
  jwt_role text := coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '');
  db_role  text := coalesce(current_setting('request.jwt.claim.role', true), current_user);
begin
  if jwt_role = 'System_Admin' or db_role in ('service_role', 'postgres') then
    return new;
  end if;
  if tg_op = 'INSERT' then
    if new.fit_score is not null then
      raise exception 'fit_score is engine-write only';
    end if;
  elsif new.fit_score is distinct from old.fit_score then
    raise exception 'fit_score is engine-write only';
  end if;
  return new;
end $$;

create trigger trg_fit_score_gate before insert or update on matches
  for each row execute function enforce_fit_score_gate();

-- ─── badges / quests ─────────────────────────────────────────────────────────
create policy athlete_read_own_badges on badges for select
  using (exists (select 1 from athletes a where a.id = badges.athlete_id and a.user_id = auth.uid()));
create policy admin_full_badges on badges for all
  using (app_role() = 'System_Admin') with check (app_role() = 'System_Admin');

create policy athlete_read_own_quests on quests for select
  using (exists (select 1 from athletes a where a.id = quests.athlete_id and a.user_id = auth.uid()));
-- Athlete may progress their own quests — nothing else (spec: "completed quests only").
create policy athlete_progress_quests on quests for update
  using (exists (select 1 from athletes a where a.id = quests.athlete_id and a.user_id = auth.uid()))
  with check (status in ('in_progress','completed'));
create policy admin_full_quests on quests for all
  using (app_role() = 'System_Admin') with check (app_role() = 'System_Admin');

revoke update on quests from authenticated;
grant  update (current_value, progress_pct, status) on quests to authenticated;
revoke insert, delete on quests from authenticated, anon;

-- ─── ingestion ───────────────────────────────────────────────────────────────
create policy submitter_read_own_sessions on intake_sessions for select
  using (auth.uid() = submitted_by);
create policy admin_full_sessions on intake_sessions for all
  using (app_role() = 'System_Admin') with check (app_role() = 'System_Admin');
-- Raw payloads are admin-only reading; writes happen in service context.
create policy admin_read_raw on intake_raw for select
  using (app_role() = 'System_Admin');

-- ─── decision layer ──────────────────────────────────────────────────────────
create policy authed_read_programs on programs for select
  using (auth.uid() is not null);
create policy admin_full_programs on programs for all
  using (app_role() = 'System_Admin') with check (app_role() = 'System_Admin');

create policy operator_read_roster on program_roster for select
  using (my_operator_id() is not null or app_role() = 'System_Admin');
create policy operator_read_gaps on roster_gaps for select
  using (my_operator_id() is not null or app_role() = 'System_Admin');

create policy operator_read_matches on matches for select
  using (my_operator_id() is not null or app_role() = 'System_Admin');

create policy operator_own_board_select on draft_board for select
  using (operator_id = my_operator_id() or app_role() = 'System_Admin');
create policy operator_own_board_insert on draft_board for insert
  with check (operator_id = my_operator_id());
create policy operator_own_board_update on draft_board for update
  using (operator_id = my_operator_id()) with check (operator_id = my_operator_id());
create policy operator_own_board_delete on draft_board for delete
  using (operator_id = my_operator_id());

create policy operator_read_own_locks on activation_locks for select
  using (operator_id = my_operator_id() or app_role() = 'System_Admin');
-- Lock writes go ONLY through consume_activation_credit() (0003) in service context.

-- ─── access / billing ────────────────────────────────────────────────────────
create policy user_read_own_operator on operators for select
  using (user_id = auth.uid() or app_role() = 'System_Admin');
create policy user_read_own_subscription on subscriptions for select
  using (user_id = auth.uid() or app_role() = 'System_Admin');
-- stripe_events: no policies at all — service-role/webhook context only.
create policy admin_full_council on council_sessions for all
  using (app_role() = 'System_Admin') with check (app_role() = 'System_Admin');
