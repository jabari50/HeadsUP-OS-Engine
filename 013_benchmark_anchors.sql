-- ============================================================================
-- Migration: 013_benchmark_anchors.sql
-- HeadsUp OS (HU-OS) — Expert Retrospective Benchmark Anchors
--
-- Purpose: Store FOUNDER-ASSIGNED calibration anchors derived from documented
--          career evidence (Wade Taylor IV, Marcus Garrett, the 2019 DFW class...).
--          These calibrate the algorithm's ceiling. They are NOT Neural Audit
--          outputs and NOT Sovereign Assets. They never surface to scouts/coaches.
--
-- Depends on: base schema (app_metadata RBAC role model)
-- Algo version: 4.1.0
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. benchmark_anchors — the anchor set
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS benchmark_anchors (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Identity (public record)
  athlete_name            TEXT NOT NULL,
  dfw_school              TEXT,                    -- verified HS
  destination             TEXT,                    -- college / pro
  involvement_tier        TEXT CHECK (involvement_tier IN ('T1','T2','T3')),

  -- Provenance lock — makes it impossible to mistake this for an audit output
  score_type              TEXT NOT NULL DEFAULT 'expert_retrospective_benchmark'
                          CHECK (score_type = 'expert_retrospective_benchmark'),
  assigned_by             TEXT NOT NULL DEFAULT 'Jabari Johnson (Founder / Evaluator of Record)',
  evidence_basis          TEXT NOT NULL,           -- documented record behind the anchor. No evidence, no anchor.

  -- Founder-assigned Neck-Up inputs (0-100). NULL until assigned from evidence.
  neck_up_culture_equity  NUMERIC(5,2) CHECK (neck_up_culture_equity  BETWEEN 0 AND 100),
  neck_up_resilience      NUMERIC(5,2) CHECK (neck_up_resilience      BETWEEN 0 AND 100),
  neck_up_coachability    NUMERIC(5,2) CHECK (neck_up_coachability    BETWEEN 0 AND 100),
  neck_up_playmaking      NUMERIC(5,2) CHECK (neck_up_playmaking      BETWEEN 0 AND 100),
  neck_up_defense         NUMERIC(5,2) CHECK (neck_up_defense         BETWEEN 0 AND 100),
  neck_up_physical_output NUMERIC(5,2) CHECK (neck_up_physical_output BETWEEN 0 AND 100),

  -- Derived anchors (0-100). Either founder target bands or engine-computed from
  -- the inputs above. Cross-field consistency is enforced by the calibration
  -- harness (benchmark_calibration.py), not at the row level.
  neck_up_pro_score       NUMERIC(5,2) CHECK (neck_up_pro_score BETWEEN 0 AND 100),
  neck_up_ner             NUMERIC(5,2) CHECK (neck_up_ner       BETWEEN 0 AND 100),
  ovr                     NUMERIC(5,2) CHECK (ovr               BETWEEN 0 AND 100),

  -- Scholastic band targets (letter grades). Founder-assigned per axis.
  pro_band_target         TEXT CHECK (pro_band_target IN ('A+','A','B+','B','C+','C')),
  ner_band_target         TEXT CHECK (ner_band_target IN ('A+','A','B+','B','C+','C')),

  -- Firsthand founder Neck-Up evaluation on record (Gate 15 ground-truth)
  firsthand_founder_eval  BOOLEAN NOT NULL DEFAULT FALSE,

  -- "Generational" designation. PRO-axis only, by construction.
  generational            BOOLEAN NOT NULL DEFAULT FALSE,

  -- HARD GUARDRAIL: an anchor can NEVER be treated as a live, placeable asset.
  is_live_asset           BOOLEAN NOT NULL DEFAULT FALSE CHECK (is_live_asset = FALSE),

  algo_version            TEXT NOT NULL DEFAULT '4.1.0',

  -- INTEGRITY: generational requires a firsthand founder eval AND an A+ PRO target.
  -- Encodes "no generational tag without the founder's firsthand record behind it."
  CONSTRAINT generational_requires_firsthand_and_apf CHECK (
    NOT generational OR (firsthand_founder_eval AND pro_band_target = 'A+')
  ),

  UNIQUE (athlete_name)
);

COMMENT ON TABLE benchmark_anchors IS
  'Founder-assigned expert benchmarks for algorithm calibration. Not audit outputs, not Sovereign Assets. NDA_Analyst read / System_Admin write only.';

-- keep updated_at fresh on edits
CREATE OR REPLACE FUNCTION touch_benchmark_anchors_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_benchmark_anchors ON benchmark_anchors;
CREATE TRIGGER trg_touch_benchmark_anchors
  BEFORE UPDATE ON benchmark_anchors
  FOR EACH ROW EXECUTE FUNCTION touch_benchmark_anchors_updated_at();

-- ---------------------------------------------------------------------------
-- 2. benchmark_calibration_runs — append-only calibration audit trail
--    One row per pass of the engine against the anchor set. No UPDATE/DELETE.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS benchmark_calibration_runs (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_timestamp      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  algo_version       TEXT NOT NULL,
  anchors_evaluated  INT  NOT NULL,
  consistency_report JSONB NOT NULL,   -- per-anchor computed-vs-assigned deltas
  run_by             TEXT NOT NULL
);

COMMENT ON TABLE benchmark_calibration_runs IS
  'Append-only. Each row is one calibration pass against benchmark_anchors. No UPDATE/DELETE policies, ever.';

-- ---------------------------------------------------------------------------
-- 3. RLS — least privilege. Benchmarks are internal calibration data.
--    System_Admin: full. NDA_Analyst: read. Everyone else: no access.
--    app_metadata only (user_metadata is client-writable — never use it).
-- ---------------------------------------------------------------------------
ALTER TABLE benchmark_anchors          ENABLE ROW LEVEL SECURITY;
ALTER TABLE benchmark_calibration_runs ENABLE ROW LEVEL SECURITY;

-- benchmark_anchors
CREATE POLICY "admin_full_benchmarks" ON benchmark_anchors
  USING      ((auth.jwt() -> 'app_metadata' ->> 'role') = 'System_Admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'System_Admin');

CREATE POLICY "analyst_read_benchmarks" ON benchmark_anchors FOR SELECT
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'NDA_Analyst');

-- benchmark_calibration_runs — append-only: SELECT + INSERT only.
CREATE POLICY "read_calibration" ON benchmark_calibration_runs FOR SELECT
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('System_Admin','NDA_Analyst'));

CREATE POLICY "insert_calibration" ON benchmark_calibration_runs FOR INSERT
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'System_Admin');
-- INTENTIONAL: no UPDATE and no DELETE policy on benchmark_calibration_runs (append-only).
