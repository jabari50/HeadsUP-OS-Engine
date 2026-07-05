-- ═══════════════════════════════════════════════════════════════════════════
-- HeadsUP Unified Portal — 0003 role-scoped views + atomic RPCs
-- Handoff v1.1 §5.4 (views — RLS cannot hide columns), §6.2 (one-transaction
-- ingest), §8 (atomic credit consumption).
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── Role-scoped views (U5) ─────────────────────────────────────────────────
-- security_invoker: base-table RLS still applies to the querying user; the
-- view only narrows the COLUMN surface.

create view athletes_scout_view with (security_invoker = true) as
  select id, name, position, school, class_year, classification,
         height_in, weight_lb, wingspan_in, ovr, tier, sovereign_verified
  from athletes
  where sovereign_verified = true;

-- Sovereign Asset shareable card: §9 approved field list, nothing else.
-- Never: quests, open-response text, deficiency flags, raw NER responses.
create view sovereign_card_view with (security_invoker = true) as
  select id, name, position, school, class_year, ovr, tier,
         height_in, weight_lb, wingspan_in
  from athletes;

-- ─── resolve_activation (U14) ───────────────────────────────────────────────
-- Effective visibility = per-operator lock if present and unexpired,
-- else the athlete's global floor.
create or replace function resolve_activation(p_athlete uuid, p_operator uuid)
returns text language sql stable as $$
  select coalesce(
    (select state from activation_locks
      where athlete_id = p_athlete and operator_id = p_operator
        and (expires_at is null or expires_at > now())),
    (select activation_state from athletes where id = p_athlete),
    'Locked'
  )
$$;

-- ─── consume_activation_credit (U8) ─────────────────────────────────────────
-- One atomic RPC with a row lock: two concurrent unlock clicks can never
-- double-spend a credit or double-unlock for one credit.
create or replace function consume_activation_credit(
  p_operator uuid, p_athlete uuid, p_state text
) returns boolean
language plpgsql security definer set search_path = public as $$
declare
  v_credits int;
begin
  if p_state not in ('Preview Unlocked','Full Unlocked','Exclusive Lock') then
    raise exception 'invalid activation state %', p_state;
  end if;

  select activation_credits into v_credits
    from operators where id = p_operator for update;
  if v_credits is null or v_credits < 1 then
    return false;
  end if;

  update operators set activation_credits = activation_credits - 1
    where id = p_operator;

  insert into activation_locks (athlete_id, operator_id, state)
    values (p_athlete, p_operator, p_state)
    on conflict (athlete_id, operator_id)
    do update set state = excluded.state, created_at = now(), expires_at = null;

  return true;
end $$;

revoke execute on function consume_activation_credit(uuid, uuid, text) from public, anon, authenticated;

-- ─── process_intake (§6.2 steps 3–5, ONE transaction) ───────────────────────
-- Called by the Next.js server (service role) after the engine validates and
-- scores. Upsert + score write + audit append commit or roll back together:
-- a scored row without its audit entry can never exist.
create or replace function process_intake(
  p_session   uuid,
  p_actor     uuid,
  p_canonical jsonb,   -- validated athlete fields from the engine
  p_computed  jsonb,   -- {ovr, tier} or {} for provisional (unscored) intake
  p_badges    jsonb,   -- [{badge_id, name, category}]
  p_quests    jsonb    -- [{title, target_attribute, target_value, current_value, progress_pct, status}]
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_athlete_id uuid;
  v_ovr_before numeric;
  v_ovr_after  numeric := nullif(p_computed ->> 'ovr', '')::numeric;
  v_ext_id     text    := nullif(p_canonical ->> 'external_id', '');
  v_key        text;
  b jsonb;
  q jsonb;
begin
  -- Locate existing athlete: external_id first, then normalized natural key.
  if v_ext_id is not null then
    select id, ovr into v_athlete_id, v_ovr_before
      from athletes where external_id = v_ext_id;
  else
    v_key := lower(trim(p_canonical ->> 'name')) || '|'
          || lower(coalesce(trim(p_canonical ->> 'school'), '')) || '|'
          || coalesce(p_canonical ->> 'class_year', '');
    select id, ovr into v_athlete_id, v_ovr_before
      from athletes where name_school_class_key = v_key and external_id is null;
  end if;

  if v_athlete_id is null then
    insert into athletes (
      external_id, name, position, school, class_year, classification,
      height_in, weight_lb, wingspan_in, physical_score,
      tech_ball_handling, tech_shooting, tech_finishing, tech_passing,
      tech_defense, tech_rebounding, tech_athleticism,
      neural_composure, neural_coachability, neural_iq,
      neural_resilience, neural_leadership, neural_drive,
      ovr, tier
    ) values (
      v_ext_id,
      p_canonical ->> 'name',
      p_canonical ->> 'position',
      p_canonical ->> 'school',
      p_canonical ->> 'class_year',
      p_canonical ->> 'classification',
      nullif(p_canonical ->> 'height_in', '')::numeric,
      nullif(p_canonical ->> 'weight_lb', '')::numeric,
      nullif(p_canonical ->> 'wingspan_in', '')::numeric,
      nullif(p_canonical ->> 'physical_score', '')::numeric,
      nullif(p_canonical -> 'technical' ->> 'ball_handling', '')::numeric,
      nullif(p_canonical -> 'technical' ->> 'shooting', '')::numeric,
      nullif(p_canonical -> 'technical' ->> 'finishing', '')::numeric,
      nullif(p_canonical -> 'technical' ->> 'passing', '')::numeric,
      nullif(p_canonical -> 'technical' ->> 'defense', '')::numeric,
      nullif(p_canonical -> 'technical' ->> 'rebounding', '')::numeric,
      nullif(p_canonical -> 'technical' ->> 'athleticism', '')::numeric,
      nullif(p_canonical -> 'neural' ->> 'composure', '')::numeric,
      nullif(p_canonical -> 'neural' ->> 'coachability', '')::numeric,
      nullif(p_canonical -> 'neural' ->> 'iq', '')::numeric,
      nullif(p_canonical -> 'neural' ->> 'resilience', '')::numeric,
      nullif(p_canonical -> 'neural' ->> 'leadership', '')::numeric,
      nullif(p_canonical -> 'neural' ->> 'drive', '')::numeric,
      v_ovr_after,
      nullif(p_computed ->> 'tier', '')
    ) returning id into v_athlete_id;
  else
    update athletes set
      name           = coalesce(p_canonical ->> 'name', name),
      position       = coalesce(p_canonical ->> 'position', position),
      school         = coalesce(p_canonical ->> 'school', school),
      class_year     = coalesce(p_canonical ->> 'class_year', class_year),
      classification = coalesce(p_canonical ->> 'classification', classification),
      height_in      = coalesce(nullif(p_canonical ->> 'height_in', '')::numeric, height_in),
      weight_lb      = coalesce(nullif(p_canonical ->> 'weight_lb', '')::numeric, weight_lb),
      wingspan_in    = coalesce(nullif(p_canonical ->> 'wingspan_in', '')::numeric, wingspan_in),
      physical_score = coalesce(nullif(p_canonical ->> 'physical_score', '')::numeric, physical_score),
      tech_ball_handling = coalesce(nullif(p_canonical -> 'technical' ->> 'ball_handling', '')::numeric, tech_ball_handling),
      tech_shooting      = coalesce(nullif(p_canonical -> 'technical' ->> 'shooting', '')::numeric, tech_shooting),
      tech_finishing     = coalesce(nullif(p_canonical -> 'technical' ->> 'finishing', '')::numeric, tech_finishing),
      tech_passing       = coalesce(nullif(p_canonical -> 'technical' ->> 'passing', '')::numeric, tech_passing),
      tech_defense       = coalesce(nullif(p_canonical -> 'technical' ->> 'defense', '')::numeric, tech_defense),
      tech_rebounding    = coalesce(nullif(p_canonical -> 'technical' ->> 'rebounding', '')::numeric, tech_rebounding),
      tech_athleticism   = coalesce(nullif(p_canonical -> 'technical' ->> 'athleticism', '')::numeric, tech_athleticism),
      neural_composure    = coalesce(nullif(p_canonical -> 'neural' ->> 'composure', '')::numeric, neural_composure),
      neural_coachability = coalesce(nullif(p_canonical -> 'neural' ->> 'coachability', '')::numeric, neural_coachability),
      neural_iq           = coalesce(nullif(p_canonical -> 'neural' ->> 'iq', '')::numeric, neural_iq),
      neural_resilience   = coalesce(nullif(p_canonical -> 'neural' ->> 'resilience', '')::numeric, neural_resilience),
      neural_leadership   = coalesce(nullif(p_canonical -> 'neural' ->> 'leadership', '')::numeric, neural_leadership),
      neural_drive        = coalesce(nullif(p_canonical -> 'neural' ->> 'drive', '')::numeric, neural_drive),
      ovr  = coalesce(v_ovr_after, ovr),
      tier = coalesce(nullif(p_computed ->> 'tier', ''), tier)
    where id = v_athlete_id;
  end if;

  -- Audit append: every score change, always in the same transaction.
  if v_ovr_after is not null and v_ovr_after is distinct from v_ovr_before then
    insert into neural_audit_log (athlete_id, event_type, ovr_before, ovr_after, actor, detail)
    values (v_athlete_id, 'intake_score', v_ovr_before, v_ovr_after, p_actor,
            jsonb_build_object('session_id', p_session));
  end if;

  -- Badges: idempotent on (athlete_id, badge_id).
  for b in select * from jsonb_array_elements(coalesce(p_badges, '[]'::jsonb)) loop
    insert into badges (athlete_id, badge_id, name, category)
    values (v_athlete_id, b ->> 'badge_id', b ->> 'name', b ->> 'category')
    on conflict (athlete_id, badge_id) do nothing;
  end loop;

  -- Quests: seed only when the athlete has no active arc (re-ingest must not
  -- wipe in-flight progress).
  if not exists (
    select 1 from quests where athlete_id = v_athlete_id and status in ('active','in_progress')
  ) then
    for q in select * from jsonb_array_elements(coalesce(p_quests, '[]'::jsonb)) loop
      insert into quests (athlete_id, title, target_attribute, target_value,
                          current_value, progress_pct, status)
      values (v_athlete_id, q ->> 'title', q ->> 'target_attribute',
              nullif(q ->> 'target_value', '')::numeric,
              nullif(q ->> 'current_value', '')::numeric,
              coalesce(nullif(q ->> 'progress_pct', '')::numeric, 0),
              coalesce(q ->> 'status', 'active'));
    end loop;
  end if;

  update intake_sessions set status = 'processed' where id = p_session;
  update intake_raw set athlete_id = v_athlete_id where session_id = p_session;

  return v_athlete_id;
end $$;

revoke execute on function process_intake(uuid, uuid, jsonb, jsonb, jsonb, jsonb) from public, anon, authenticated;

-- ─── recompute_roster_gaps (§6.2 step 6) ────────────────────────────────────
-- v1 deterministic heuristic: a position with zero rostered athletes is a
-- HIGH-priority gap; exactly one is MED (no depth); two+ is covered.
create or replace function recompute_roster_gaps(p_program uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  pos text;
  n int;
begin
  delete from roster_gaps where program_id = p_program and attribute_need = 'auto:position_depth';
  foreach pos in array array['PG','SG','SF','PF','C'] loop
    select count(*) into n
      from program_roster pr join athletes a on a.id = pr.athlete_id
      where pr.program_id = p_program and a.position = pos;
    if n = 0 then
      insert into roster_gaps (program_id, position, attribute_need, priority)
      values (p_program, pos, 'auto:position_depth', 'HIGH');
    elsif n = 1 then
      insert into roster_gaps (program_id, position, attribute_need, priority)
      values (p_program, pos, 'auto:position_depth', 'MED');
    end if;
  end loop;
end $$;

revoke execute on function recompute_roster_gaps(uuid) from public, anon, authenticated;
