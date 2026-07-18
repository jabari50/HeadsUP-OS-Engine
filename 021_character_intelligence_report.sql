-- ============================================================
-- Migration: 021_character_intelligence_report.sql
-- Project:   pgdvzvsnehkkhsubquhi (HeadsUp OS — Supabase)
-- Version:   3.0.0
-- Purpose:   Create the character_intelligence_reports table,
--            enforce append-only RLS, and install the Oracle
--            gate function check_cir_oracle_clearance().
-- ============================================================
-- SECURITY RULES (non-negotiable):
--   1. No DELETE policy at any role level — ever.
--   2. CIR data is NEVER surfaced to athletes, parents, scouts,
--      or any public-facing view.
--   3. Only service_role may INSERT or UPDATE.
--   4. Authenticated users may read their own CIR existence status
--      via the gate function ONLY — raw JSONB is never exposed.
-- ============================================================


-- ──────────────────────────────────────────────────────────────
-- STEP 1 — CREATE TABLE
-- ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.character_intelligence_reports (
    -- Primary key
    cir_id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Athlete reference (no FK — intentional; athletes table may differ per env)
    athlete_id        UUID         NOT NULL,

    -- CIR classification
    disposition       TEXT         NOT NULL
                        CHECK (disposition IN ('CLEAR','FLAG_ONLY','HUMAN_GATE','AIS_EXCLUSION')),
    category          TEXT         NOT NULL,
    summary           TEXT         NOT NULL,

    -- Filing metadata
    filed_by          TEXT         NOT NULL,
    filed_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),

    -- Status
    active            BOOLEAN      NOT NULL DEFAULT TRUE,
    admin_cleared     BOOLEAN      NOT NULL DEFAULT FALSE,
    admin_cleared_by  TEXT,
    notes             TEXT,

    -- Audit timestamps
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Index for Oracle gate lookups (athlete_id + active)
CREATE INDEX IF NOT EXISTS idx_cir_athlete_active
    ON public.character_intelligence_reports (athlete_id, active);

-- Index for disposition filtering
CREATE INDEX IF NOT EXISTS idx_cir_disposition
    ON public.character_intelligence_reports (disposition);

-- Auto-update updated_at on any row change
CREATE OR REPLACE FUNCTION public.cir_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cir_updated_at ON public.character_intelligence_reports;
CREATE TRIGGER trg_cir_updated_at
    BEFORE UPDATE ON public.character_intelligence_reports
    FOR EACH ROW EXECUTE FUNCTION public.cir_set_updated_at();


-- ──────────────────────────────────────────────────────────────
-- STEP 2 — ROW LEVEL SECURITY
-- ──────────────────────────────────────────────────────────────

ALTER TABLE public.character_intelligence_reports ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to ensure idempotency
DROP POLICY IF EXISTS cir_service_role_all    ON public.character_intelligence_reports;
DROP POLICY IF EXISTS cir_service_role_select ON public.character_intelligence_reports;
DROP POLICY IF EXISTS cir_service_role_insert ON public.character_intelligence_reports;
DROP POLICY IF EXISTS cir_service_role_update ON public.character_intelligence_reports;

-- service_role: full SELECT + INSERT + UPDATE (no DELETE — ever)
CREATE POLICY cir_service_role_select
    ON public.character_intelligence_reports
    FOR SELECT
    TO service_role
    USING (TRUE);

CREATE POLICY cir_service_role_insert
    ON public.character_intelligence_reports
    FOR INSERT
    TO service_role
    WITH CHECK (TRUE);

CREATE POLICY cir_service_role_update
    ON public.character_intelligence_reports
    FOR UPDATE
    TO service_role
    USING (TRUE)
    WITH CHECK (TRUE);

-- NO DELETE POLICY — append-only at all role levels.
-- Deactivate rows by setting active = FALSE only.


-- ──────────────────────────────────────────────────────────────
-- STEP 3 — ORACLE GATE FUNCTION
-- ──────────────────────────────────────────────────────────────
-- check_cir_oracle_clearance(p_athlete_id)
--
-- Returns a single row with:
--   cleared                BOOLEAN  — may Oracle proceed?
--   aggregate_disposition  TEXT     — CLEAR | FLAG_ONLY | HUMAN_GATE | AIS_EXCLUSION
--   oracle_release_blocked BOOLEAN  — TRUE if AIS_EXCLUSION or uncleared HUMAN_GATE
--   human_review_required  BOOLEAN  — TRUE if HUMAN_GATE and not admin_cleared
--   peg_expansion_applied  BOOLEAN  — TRUE if FLAG_ONLY treatment active
--   cir_id                 UUID     — dominant CIR entry id (NULL if CLEAR)
--   active_cir_count       INT      — count of active CIR entries
--   reason                 TEXT     — plain-language explanation
-- ──────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.check_cir_oracle_clearance(
    p_athlete_id UUID
)
RETURNS TABLE (
    cleared                BOOLEAN,
    aggregate_disposition  TEXT,
    oracle_release_blocked BOOLEAN,
    human_review_required  BOOLEAN,
    peg_expansion_applied  BOOLEAN,
    cir_id                 UUID,
    active_cir_count       INTEGER,
    reason                 TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count     INTEGER;
    v_dominant  RECORD;
    v_priority  INTEGER;
    v_max_prio  INTEGER := 0;
BEGIN
    -- Count all active CIR entries for this athlete
    SELECT COUNT(*) INTO v_count
    FROM public.character_intelligence_reports
    WHERE athlete_id = p_athlete_id
      AND active = TRUE;

    -- No active CIR → CLEAR
    IF v_count = 0 THEN
        RETURN QUERY SELECT
            TRUE,                            -- cleared
            'CLEAR'::TEXT,                   -- aggregate_disposition
            FALSE,                           -- oracle_release_blocked
            FALSE,                           -- human_review_required
            FALSE,                           -- peg_expansion_applied
            NULL::UUID,                      -- cir_id
            0::INTEGER,                      -- active_cir_count
            'No active CIR on file. Oracle proceeds without restriction.'::TEXT;
        RETURN;
    END IF;

    -- Find the dominant (highest-priority) active entry
    -- Priority: AIS_EXCLUSION=4, HUMAN_GATE=3, FLAG_ONLY=2, CLEAR=1
    SELECT
        r.cir_id,
        r.disposition,
        r.admin_cleared,
        r.admin_cleared_by,
        r.category,
        CASE r.disposition
            WHEN 'AIS_EXCLUSION' THEN 4
            WHEN 'HUMAN_GATE'    THEN 3
            WHEN 'FLAG_ONLY'     THEN 2
            ELSE 1
        END AS priority
    INTO v_dominant
    FROM public.character_intelligence_reports r
    WHERE r.athlete_id = p_athlete_id
      AND r.active = TRUE
    ORDER BY priority DESC, r.filed_at DESC
    LIMIT 1;

    -- ── AIS_EXCLUSION — full Oracle suppression ──────────────────────────
    IF v_dominant.disposition = 'AIS_EXCLUSION' THEN
        RETURN QUERY SELECT
            FALSE,
            'AIS_EXCLUSION'::TEXT,
            TRUE,
            FALSE,
            FALSE,
            v_dominant.cir_id,
            v_count::INTEGER,
            'AIS_EXCLUSION flag active. Oracle output suppressed. No LLM call fired.'::TEXT;
        RETURN;
    END IF;

    -- ── HUMAN_GATE — blocked unless admin_cleared ────────────────────────
    IF v_dominant.disposition = 'HUMAN_GATE' THEN
        IF v_dominant.admin_cleared THEN
            -- Cleared → FLAG_ONLY treatment
            RETURN QUERY SELECT
                TRUE,
                'FLAG_ONLY'::TEXT,
                FALSE,
                FALSE,
                TRUE,
                v_dominant.cir_id,
                v_count::INTEGER,
                ('HUMAN_GATE cleared by ' || COALESCE(v_dominant.admin_cleared_by, 'admin') ||
                 '. Oracle proceeds with FLAG_ONLY treatment and Δ_PEG expansion.')::TEXT;
        ELSE
            RETURN QUERY SELECT
                FALSE,
                'HUMAN_GATE'::TEXT,
                TRUE,
                TRUE,
                FALSE,
                v_dominant.cir_id,
                v_count::INTEGER,
                'HUMAN_GATE active. Admin review required before Oracle release.'::TEXT;
        END IF;
        RETURN;
    END IF;

    -- ── FLAG_ONLY — non-blocking, PEG expansion ──────────────────────────
    IF v_dominant.disposition = 'FLAG_ONLY' THEN
        RETURN QUERY SELECT
            TRUE,
            'FLAG_ONLY'::TEXT,
            FALSE,
            FALSE,
            TRUE,
            v_dominant.cir_id,
            v_count::INTEGER,
            ('FLAG_ONLY CIR on file (category: ' || v_dominant.category ||
             '). Oracle proceeds. Δ_PEG expanded 15% to reflect behavioral uncertainty.')::TEXT;
        RETURN;
    END IF;

    -- ── Fallback CLEAR ───────────────────────────────────────────────────
    RETURN QUERY SELECT
        TRUE,
        'CLEAR'::TEXT,
        FALSE,
        FALSE,
        FALSE,
        NULL::UUID,
        v_count::INTEGER,
        'CIR resolved or inactive. Oracle proceeds without restriction.'::TEXT;
END;
$$;

-- Grant execute to service_role
GRANT EXECUTE ON FUNCTION public.check_cir_oracle_clearance(UUID) TO service_role;


-- ──────────────────────────────────────────────────────────────
-- STEP 4 — ADMIN REVIEW QUEUE VIEW
-- (internal only — never exposed to any public API)
-- ──────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW public.cir_admin_review_queue AS
SELECT
    cir_id,
    athlete_id,
    disposition,
    category,
    summary,
    filed_by,
    filed_at,
    admin_cleared,
    admin_cleared_by,
    notes,
    created_at,
    updated_at
FROM public.character_intelligence_reports
WHERE active = TRUE
  AND (
    disposition IN ('HUMAN_GATE', 'AIS_EXCLUSION')
    OR (disposition = 'FLAG_ONLY' AND admin_cleared = FALSE)
  )
ORDER BY
    CASE disposition
        WHEN 'AIS_EXCLUSION' THEN 1
        WHEN 'HUMAN_GATE'    THEN 2
        WHEN 'FLAG_ONLY'     THEN 3
        ELSE 4
    END,
    filed_at DESC;

-- Restrict view to service_role only
REVOKE ALL ON public.cir_admin_review_queue FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.cir_admin_review_queue TO service_role;


-- ──────────────────────────────────────────────────────────────
-- STEP 5 — VERIFICATION QUERIES
-- Run each after applying this migration. All must return expected results.
-- ──────────────────────────────────────────────────────────────

-- V1: Table exists with correct columns
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_schema = 'public'
--   AND table_name = 'character_intelligence_reports'
-- ORDER BY ordinal_position;
-- Expected: cir_id, athlete_id, disposition, category, summary, filed_by,
--           filed_at, active, admin_cleared, admin_cleared_by, notes,
--           created_at, updated_at

-- V2: RLS is enabled
-- SELECT relname, relrowsecurity
-- FROM pg_class
-- WHERE relname = 'character_intelligence_reports';
-- Expected: relrowsecurity = TRUE

-- V3: NO DELETE policy exists (confirm 0 rows)
-- SELECT policyname, cmd
-- FROM pg_policies
-- WHERE tablename = 'character_intelligence_reports'
--   AND cmd = 'DELETE';
-- Expected: 0 rows

-- V4: check_cir_oracle_clearance() function exists
-- SELECT routine_name, routine_type
-- FROM information_schema.routines
-- WHERE routine_schema = 'public'
--   AND routine_name = 'check_cir_oracle_clearance';
-- Expected: 1 row, routine_type = 'FUNCTION'

-- V5: cir_admin_review_queue view exists
-- SELECT table_name, table_type
-- FROM information_schema.tables
-- WHERE table_schema = 'public'
--   AND table_name = 'cir_admin_review_queue';
-- Expected: 1 row, table_type = 'VIEW'

-- V6: Gate function returns CLEAR for unknown athlete_id
-- SELECT * FROM check_cir_oracle_clearance('00000000-0000-0000-0000-000000000000');
-- Expected: cleared=TRUE, aggregate_disposition='CLEAR', oracle_release_blocked=FALSE
