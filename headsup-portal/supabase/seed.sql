-- HeadsUP Unified Portal — development seed. NEVER run against production.
-- Scores are intentionally NULL here: they are engine-computed through the
-- intake pipeline, never hand-seeded (Zero Hallucination).

insert into programs (id, name, head_coach, system, level, conference) values
  ('00000000-0000-4000-a000-000000000001', 'DFW Elite Prep', 'A. Carter', 'Pace-and-Space', 'HS', 'TAPPS'),
  ('00000000-0000-4000-a000-000000000002', 'Southside Legacy', 'M. Reeves', 'Traditional', 'HS', 'UIL 6A');

-- Dev operator (attach a real auth user id locally before use).
insert into operators (id, org_name, license_tier, seat_count, activation_credits) values
  ('00000000-0000-4000-b000-000000000001', 'HeadsUP Scouting (dev)', 'GM', 3, 10);

select recompute_roster_gaps('00000000-0000-4000-a000-000000000001');
select recompute_roster_gaps('00000000-0000-4000-a000-000000000002');
