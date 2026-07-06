-- 0007 — Free Agents self-enrollment links the athlete row to the account.
--
-- process_intake gains an opt-in link: when the canonical payload carries
-- link_self = 'true' (set server-side by /api/intake for the free_agents
-- source only — never client-controlled), the INSERT branch stamps
-- user_id = p_actor so the athlete's own surface (/me, RLS athlete_read_own)
-- can find the row.
--
-- Deliberately insert-only: a dedup match against an EXISTING athlete never
-- links. Otherwise any signup could submit a known athlete's name/school and
-- claim that profile. Claiming existing rows stays a System_Admin action.
--
-- Same signature as 0003 — clean replace, callers unchanged.

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
  v_link_user  uuid    := case when p_canonical ->> 'link_self' = 'true' then p_actor end;
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
      user_id,
      external_id, name, position, school, class_year, classification,
      height_in, weight_lb, wingspan_in, physical_score,
      tech_ball_handling, tech_shooting, tech_finishing, tech_passing,
      tech_defense, tech_rebounding, tech_athleticism,
      neural_composure, neural_coachability, neural_iq,
      neural_resilience, neural_leadership, neural_drive,
      ovr, tier
    ) values (
      v_link_user,
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

-- Re-assert least privilege (idempotent) and pin search_path per 0005.
revoke execute on function process_intake(uuid, uuid, jsonb, jsonb, jsonb, jsonb) from public, anon, authenticated;
alter function process_intake(uuid, uuid, jsonb, jsonb, jsonb, jsonb) set search_path = pg_catalog, public;
