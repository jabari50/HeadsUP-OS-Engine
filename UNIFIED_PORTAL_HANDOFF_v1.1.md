# Unified Portal — Claude Code Build Handoff **v1.1 (Upgraded)**
**Project:** HeadsUP Unified Data Pipeline Portal ("Command Center")
**Owner:** Jabari L. Johnson — HeadsUP MEDIA & Scouting
**Architecture ratified by:** LLM Council (portal-over-layers, ingestion-first) — see `council_unified_portal_architecture.json`
**Status:** Ready for Claude Code execution
**Governing policy:** Zero Hallucination · HU-OS 8-Gate Security Standard

---

## v1.1 Upgrade Changelog (what changed from v1.0 and why)

| # | Area | Upgrade | Severity |
|---|---|---|---|
| U1 | §5 Score-write-gate | **Fixed NULL-bypass hole.** v1.0 trigger compared `auth.jwt()->…->>'role' <> 'System_Admin'`; when the JWT has no role claim (service role, anon, malformed) the comparison is `NULL`, the `IF` never fires, and the gate is silently bypassed. Now uses `coalesce(..., '')` and an explicit service-context allowlist. | 🔴 Critical |
| U2 | §5 Score-write-gate | Gate now covers **INSERT as well as UPDATE** (v1.0 only fired on UPDATE — a non-admin could insert a row with `ovr`/`tier` pre-set). Also added an identical gate on `matches.fit_score`, which was marked 🔒 but had no trigger. | 🔴 Critical |
| U3 | §5 Audit log | "No UPDATE/DELETE policies" is not enough — service role bypasses RLS. Append-only is now enforced with `REVOKE` + a hard trigger that raises on UPDATE/DELETE regardless of role. | 🔴 Critical |
| U4 | §5 RLS | Added explicit `ENABLE ROW LEVEL SECURITY` on every table (deny-by-default) — v1.0 showed policies but never enabled RLS. Narrowed `athlete_update_own`: RLS is row-level only, so athlete-editable columns are now enforced with **column-level GRANTs** + a trigger; v1.0 let an athlete update any column on their own row, including neural inputs. | 🔴 Critical |
| U5 | §9 Field gating | RLS cannot hide columns. Role-scoped **views** (`athletes_scout_view`, `sovereign_card_view`) now carry the field-visibility rules; API routes select from views, never `select *` on base tables. | 🟠 High |
| U6 | §2/§6 Data flow | Clarified: **the engine is stateless compute.** Only the Next.js server writes to Supabase (service role). The Render engine holds no Supabase credentials — smaller blast radius, matches the approved env surface exactly. | 🟠 High |
| U7 | §8 Engine auth | Engine calls authenticated with HMAC-SHA256 signature over body + timestamp (constant-time compare, 5-min replay window) instead of a bare shared-secret header. | 🟠 High |
| U8 | §8 Activation unlock | Credit consumption is now a single atomic Postgres RPC (`consume_activation_credit`) with a row lock — v1.0 flow allowed a double-spend race between read and decrement. | 🟠 High |
| U9 | §8 Stripe | Added webhook **event-idempotency table** (Stripe redelivers); raw-body verification called out explicitly. | 🟠 High |
| U10 | §6 Idempotency | (`name`,`school`,`class_year`) alone collides. Added `external_id` + normalized generated column + unique index; collision on natural key without external_id → flag for human review instead of silent merge. | 🟡 Medium |
| U11 | §4 Schema hygiene | Added `tier` CHECK constraint, `updated_at` trigger, `draft_board` FK/unique constraints, `intake_raw.athlete_id` traceability link, indexes on hot paths. | 🟡 Medium |
| U12 | §7 Pydantic | Replaced untyped `technical: dict` / `neural: dict` with bounded submodels; enums via `Literal`. | 🟡 Medium |
| U13 | §12 Phase 0 | **Partially resolved from live repo** (`HeadsUP Hub`): `ovr_engine.py` (weights .45/.35/.20 confirmed at lines 13–15), `badge_engine.py`, `quest_engine.py`, `data_models.py`, `athlete_api.py`, `hu_os_engine.py`, `the-virtual-gm/` with migrations `0001–0009` (incl. `0006_security_remediation`, `0008_intake_throttle`), `headsup-os/` portal shell (draft-board, roster, onboard, api). Boone benchmark string present in repo engines. See §12.0 inventory. | ✅ Resolved |
| U14 | §4 Activation model | Resolved `athletes.activation_state` vs `activation_locks` duplication: `activation_locks` is the per-operator source of truth; `athletes.activation_state` is the global floor, engine/route-maintained. | 🟡 Medium |
| U15 | §6 Intake | Added per-identity rate limiting on `/api/intake` (pattern already proven in `the-virtual-gm/supabase/migrations/0008_intake_throttle.sql`). | 🟡 Medium |

---

## 0. How to use this document
This is the single source of truth for Claude Code. Build in the phase order of Section 12. Do not skip the security gates in Section 11 — they are acceptance criteria, not suggestions. Every score value is engine-computed and never client-writable. Where a real secret or ID is required, use the `_YOUR_..._HERE` placeholder convention and read from environment variables only.

**Unverified items are labeled `[NEEDS INPUT]`.** Do not invent values for these.

---

## 1. What we are building
A single operator **Portal** (one command-center UI) sitting over **three preserved logical layers**. This is a UI/access unification, not a data-model merge — the layer boundaries are load-bearing for licensing, gating, and security.

```
INGESTION (Neural Data Agency)  →  intake, validate, stage
        ↓
HU-OS INTELLIGENCE              →  OVR / neural / badges / quests (engine-computed)
        ↓
THE VIRTUAL GM (Decision)       →  roster sync, matchmaking, draft board, activation lock
        ↓
OPERATOR PORTAL (Command Center) →  role-scoped views governed by Activation Lock
```

**Non-negotiable design rules**
- One monorepo, one Supabase schema, one portal UI — **three enforced internal module boundaries**.
- Ingestion is the spine. Everything is architected intake-first: `intake → validate → score → surface → gate`.
- Scores are written **only** by the Next.js server layer after engine computation. The browser never writes a score, never calls the engine directly, never holds a service-role key. **The engine itself is stateless: it computes and returns; it never touches the database.** (U6)
- Athlete profile visibility is governed by Activation Lock at every surface, implemented as role-scoped views — never `select *` on base tables. (U5)

---

## 2. Canonical stack

| Layer | Technology | Hosting |
|---|---|---|
| Portal UI + API routes | Next.js 14 (App Router), TypeScript, Tailwind | Vercel |
| Scoring engine | Python 3.12 (pin 3.12.7 — matches the Render fix already shipped in commit `a10f743`), FastAPI, Pydantic v2, Pandas/NumPy | Render (service) |
| Database + Auth + RLS | Supabase (Postgres) | Supabase |
| Payments / licensing | Stripe | — |

**Why a separate Python engine:** the OVR, neural, badge, and quest logic already lives in this repo's Python (`ovr_engine.py`, `badge_engine.py`, `quest_engine.py`, `data_models.py`). Keep it as a FastAPI service so scoring logic stays in one auditable place. The Next.js `/api/*` routes proxy to it server-side; the browser only ever talks to `/api`.

**Data flow for every sensitive call (U6 — exactly one component holds DB write power):**
```
Browser → Next.js /api route (session + role check)
        → Python engine (HMAC-authed, stateless: validate + compute, returns JSON)
        → Next.js route writes results via Supabase service role
        → response (shaped by role view)
```
The Render service receives **no** Supabase credentials. If the engine box is compromised, the attacker gets math, not data.

---

## 3. Monorepo structure

```
headsup-portal/
├── apps/
│   └── web/                        # Next.js 14 portal
│       ├── app/
│       │   ├── (portal)/           # authenticated command-center shell
│       │   │   ├── dashboard/
│       │   │   ├── intake/         # ingestion UI
│       │   │   ├── draft-board/
│       │   │   ├── roster/[programId]/
│       │   │   ├── matchmaking/
│       │   │   └── athletes/[id]/
│       │   ├── api/                # server-only route handlers (Section 8)
│       │   └── auth/
│       ├── components/
│       ├── lib/
│       │   ├── supabaseServer.ts   # service-role client — SERVER ONLY (assert typeof window === 'undefined')
│       │   ├── supabaseClient.ts   # anon client — browser
│       │   ├── engineClient.ts     # server-only HMAC-signed fetch to HU_ENGINE_URL
│       │   └── huosEngine.ts       # const BASE = "/api"  (never a Render URL)
│       └── types/database.types.ts # generated: supabase gen types typescript
├── engine/                         # Python FastAPI scoring engine (stateless)
│   ├── hu_os_api_v4.py             # FastAPI app + HMAC auth middleware
│   ├── ovr_engine.py               # ← port from repo root (weights verified)
│   ├── badge_engine.py             # ← port from repo root
│   ├── quest_engine.py             # ← port from repo root
│   ├── data_models.py              # Pydantic v2 schemas (← port + upgrade per §7)
│   ├── pipeline.py                 # ingestion normalization
│   └── tests/
│       └── test_benchmarks.py      # locked benchmark athletes (Boone) — CI-gated
├── supabase/
│   ├── migrations/                 # numbered SQL migrations (reconcile with the-virtual-gm/supabase/migrations 0001–0009)
│   └── seed.sql
└── README.md
```

---

## 4. Data model — Supabase schema (layer-scoped)
Full DDL sketch. Types are indicative; refine on build. Score columns are marked 🔒 (engine-computed, server-written, protected by the write gate in §5).

### 4.1 Ingestion layer
```sql
create table intake_sessions (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('scout_manual','combine_csv','free_agents','ner_anchor','film_event')),
  submitted_by uuid references auth.users(id),
  idempotency_key text unique,       -- U10: client-supplied; safe retries never double-process
  status text not null default 'received' check (status in ('received','validated','rejected','processed')),
  created_at timestamptz default now()
);

create table intake_raw (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references intake_sessions(id) on delete cascade,
  payload jsonb not null,            -- raw, pre-validation
  validation_errors jsonb,           -- populated on failed validation
  athlete_id uuid references athletes(id),  -- U11: set on process; full trace raw → canonical
  created_at timestamptz default now()
);
create index on intake_raw (session_id);
```

### 4.2 Intelligence layer (HU-OS)
```sql
create table athletes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),      -- for athlete self-access RLS
  external_id text unique,                     -- U10: stable source ID when available
  name text not null,
  -- U10: normalized natural key for idempotent upsert when external_id absent
  name_school_class_key text generated always as (
    lower(trim(name)) || '|' || lower(coalesce(trim(school),'')) || '|' || coalesce(class_year,'')
  ) stored,
  position text check (position in ('PG','SG','SF','PF','C')),
  school text,
  class_year text,
  classification text check (classification in ('HS','JUCO','College','Pro')),
  scout_id uuid,
  -- physical
  height_in numeric, weight_lb numeric, wingspan_in numeric,
  physical_score numeric check (physical_score between 1 and 99),
  -- technical (1-10 raw)  🔒 engine may recompute derived
  tech_ball_handling numeric check (tech_ball_handling between 1 and 10),
  tech_shooting numeric check (tech_shooting between 1 and 10),
  tech_finishing numeric check (tech_finishing between 1 and 10),
  tech_passing numeric check (tech_passing between 1 and 10),
  tech_defense numeric check (tech_defense between 1 and 10),
  tech_rebounding numeric check (tech_rebounding between 1 and 10),
  tech_athleticism numeric check (tech_athleticism between 1 and 10),
  -- neural (1-99)
  neural_composure numeric check (neural_composure between 1 and 99),
  neural_coachability numeric check (neural_coachability between 1 and 99),
  neural_iq numeric check (neural_iq between 1 and 99),
  neural_resilience numeric check (neural_resilience between 1 and 99),
  neural_leadership numeric check (neural_leadership between 1 and 99),
  neural_drive numeric check (neural_drive between 1 and 99),
  -- computed  🔒
  ovr numeric check (ovr between 1 and 99),                                   -- 🔒 server/engine only
  tier text check (tier in ('Elite','Impact','Contributor','Developing','Prospect')),  -- 🔒 U11
  activation_state text not null default 'Locked'                             -- U14: global floor only
    check (activation_state in ('Locked','Preview Unlocked','Full Unlocked','Exclusive Lock')),
  sovereign_verified boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create unique index athletes_natural_key on athletes (name_school_class_key) where external_id is null;  -- U10
create index on athletes (sovereign_verified) where sovereign_verified = true;

-- U11: standard moddatetime
create extension if not exists moddatetime;
create trigger athletes_updated_at before update on athletes
  for each row execute function moddatetime(updated_at);

create table neural_audit_log (      -- APPEND-ONLY FOREVER (enforced in §5, not just by policy absence)
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid references athletes(id),
  event_type text not null,
  ovr_before numeric, ovr_after numeric,
  actor uuid,
  detail jsonb,
  created_at timestamptz default now()
);
create index on neural_audit_log (athlete_id, created_at);

create table badges (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid references athletes(id) on delete cascade,
  badge_id text not null,
  name text, category text check (category in ('performance','character','milestone','quest')),
  awarded_at timestamptz default now(),
  unique (athlete_id, badge_id)      -- U11: no duplicate awards on re-ingest
);

create table quests (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid references athletes(id) on delete cascade,
  title text, target_attribute text, target_value numeric,
  current_value numeric, progress_pct numeric default 0 check (progress_pct between 0 and 100),
  status text default 'active' check (status in ('active','in_progress','completed','failed')),
  reward_badge_id text, deadline timestamptz
);
```

### 4.3 Decision layer (The Virtual GM)
> Reconcile against existing `the-virtual-gm/supabase/migrations/0001–0009` before writing new migrations — several of these tables (athletes identity, operators, programs, intake throttle) already exist there in some form. Migrate/rename, don't duplicate.

```sql
create table programs (
  id uuid primary key default gen_random_uuid(),
  name text not null, head_coach text,
  system text check (system in ('Positionless','Traditional','Pace-and-Space')),
  level text, conference text
);

create table roster_gaps (
  id uuid primary key default gen_random_uuid(),
  program_id uuid references programs(id) on delete cascade,
  position text, attribute_need text,
  priority text check (priority in ('HIGH','MED','LOW'))
);

create table matches (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid references athletes(id),
  program_id uuid references programs(id),
  fit_score numeric check (fit_score between 0 and 100),   -- 🔒 engine only (gated in §5 — U2)
  style_fit numeric, need_fit numeric, level_fit numeric, cultural_fit numeric,
  recommendation text check (recommendation in ('Pursue','Monitor','Pass')),
  created_at timestamptz default now(),
  unique (athlete_id, program_id)    -- U11: recompute updates, never duplicates
);

create table draft_board (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid not null references operators(id) on delete cascade,  -- U11: FK was missing
  athlete_id uuid not null references athletes(id) on delete cascade,
  rank int, notes text,
  unique (operator_id, athlete_id)   -- U11
);

create table activation_locks (      -- U14: per-operator SOURCE OF TRUTH for visibility
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references athletes(id),
  operator_id uuid not null references operators(id),
  state text not null check (state in ('Locked','Preview Unlocked','Full Unlocked','Exclusive Lock')),
  expires_at timestamptz,            -- for Exclusive Lock windows
  created_at timestamptz default now(),
  unique (athlete_id, operator_id)
);
```
**U14 — activation precedence rule:** effective visibility for operator O on athlete A = `activation_locks(A,O).state` if a non-expired row exists, else `athletes.activation_state` (the global floor). One resolver function server-side (`resolveActivation(athleteId, operatorId)`); every surface calls it — no view re-implements the logic.

### 4.4 Access / billing layer
```sql
create table operators (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  org_name text,
  license_tier text check (license_tier in ('Scout','Coordinator','GM','White Label')),
  seat_count int, activation_credits int default 0 check (activation_credits >= 0)  -- U8
);

create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  stripe_customer_id text, stripe_sub_id text unique,
  tier text, status text, current_period_end timestamptz
);

create table stripe_events (         -- U9: webhook idempotency — Stripe redelivers
  id text primary key,               -- Stripe event id (evt_...)
  type text not null,
  processed_at timestamptz default now()
);

create table council_sessions (      -- LLM Council audit trail
  id uuid primary key default gen_random_uuid(),
  topic text, prompt text, consensus text,
  confidence text check (confidence in ('HIGH','MODERATE','LOW')),
  top_model text, rankings jsonb, created_at timestamptz default now()
);
```

---

## 5. RLS, score-write-gate, append-only audit

**All role checks use `app_metadata` (server-controlled), never `user_metadata`.**

### 5.0 Deny by default (U4 — was missing entirely in v1.0)
```sql
-- EVERY table. No exceptions. A table without this line is a failed Gate 4.
alter table intake_sessions   enable row level security;
alter table intake_raw        enable row level security;
alter table athletes          enable row level security;
alter table neural_audit_log  enable row level security;
alter table badges            enable row level security;
alter table quests            enable row level security;
alter table programs          enable row level security;
alter table roster_gaps       enable row level security;
alter table matches           enable row level security;
alter table draft_board       enable row level security;
alter table activation_locks  enable row level security;
alter table operators         enable row level security;
alter table subscriptions     enable row level security;
alter table stripe_events     enable row level security;
alter table council_sessions  enable row level security;

-- role helper: single definition, used by every policy
create or replace function app_role() returns text
language sql stable as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '')
$$;
```

### 5.1 Policies
```sql
-- athletes
create policy athlete_read_own      on athletes for select using (auth.uid() = user_id);
create policy athlete_update_own    on athletes for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy scout_read_verified   on athletes for select
  using (sovereign_verified = true and app_role() = 'College_Scout');
create policy admin_full            on athletes for all
  using (app_role() = 'System_Admin') with check (app_role() = 'System_Admin');

-- U4: RLS is row-level; column control is done with GRANTs.
-- Athletes may update ONLY their identity/profile columns — never technical,
-- neural, physical, verification, or computed columns.
revoke update on athletes from authenticated;
grant  update (name, school, class_year, height_in, weight_lb, wingspan_in)
  on athletes to authenticated;

-- quests: athlete may progress their own quests, nothing else
create policy athlete_read_own_quests   on quests for select
  using (exists (select 1 from athletes a where a.id = quests.athlete_id and a.user_id = auth.uid()));
create policy athlete_progress_quests   on quests for update
  using  (exists (select 1 from athletes a where a.id = quests.athlete_id and a.user_id = auth.uid()))
  with check (status in ('in_progress','completed'));
revoke update on quests from authenticated;
grant  update (current_value, progress_pct, status) on quests to authenticated;

-- neural_audit_log : SELECT for admin only. NO update/delete policies — EVER.
create policy admin_read_audit      on neural_audit_log for select
  using (app_role() = 'System_Admin');
```

### 5.2 Append-only audit — enforced, not implied (U3)
Policy absence only blocks RLS-subject roles. The service role bypasses RLS, so v1.0's audit log was mutable by exactly the credential most worth stealing. Make it physically append-only:
```sql
revoke update, delete on neural_audit_log from anon, authenticated, service_role;

create or replace function block_audit_mutation() returns trigger
language plpgsql as $$
begin
  raise exception 'neural_audit_log is append-only';
end $$;

create trigger trg_audit_immutable
  before update or delete on neural_audit_log
  for each row execute function block_audit_mutation();
```

### 5.3 Score-write-gate — NULL-safe, INSERT-covered (U1, U2)
v1.0's trigger had two holes: (a) `role <> 'System_Admin'` evaluates to NULL — not TRUE — when the claim is absent, so the gate never fired for exactly the callers it most needed to stop; (b) it only fired on UPDATE, so an INSERT with `ovr` pre-set sailed through.
```sql
create or replace function enforce_score_write_gate() returns trigger
language plpgsql security definer as $$
declare
  jwt_role text := coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '');
  db_role  text := current_setting('request.jwt.claim.role', true);
begin
  -- Allowed writers: System_Admin users, and the server's service-role context
  -- (the Next.js API layer — the ONLY holder of the service key).
  if jwt_role = 'System_Admin' or coalesce(db_role, current_user) = 'service_role' then
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
```
```sql
-- U2: matches.fit_score was marked 🔒 in v1.0 but had no gate. Same pattern:
create or replace function enforce_fit_score_gate() returns trigger
language plpgsql security definer as $$
declare
  jwt_role text := coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '');
  db_role  text := current_setting('request.jwt.claim.role', true);
begin
  if jwt_role = 'System_Admin' or coalesce(db_role, current_user) = 'service_role' then
    return new;
  end if;
  if tg_op = 'INSERT' then
    if new.fit_score is not null then raise exception 'fit_score is engine-write only'; end if;
  elsif new.fit_score is distinct from old.fit_score then
    raise exception 'fit_score is engine-write only';
  end if;
  return new;
end $$;

create trigger trg_fit_score_gate before insert or update on matches
  for each row execute function enforce_fit_score_gate();
```

### 5.4 Role-scoped views (U5 — RLS cannot hide columns)
```sql
-- College_Scout surface: verified athletes, gated field set only
create view athletes_scout_view with (security_invoker = true) as
  select id, name, position, school, class_year, classification,
         height_in, weight_lb, wingspan_in, ovr, tier, sovereign_verified
  from athletes where sovereign_verified = true;

-- Sovereign Asset shareable card: the §9 approved list, nothing else
create view sovereign_card_view with (security_invoker = true) as
  select id, name, position, school, class_year, ovr, tier,
         height_in, weight_lb, wingspan_in
  from athletes;
```
API routes read from the view matching the caller's role. `select *` on `athletes` from any non-admin path is a Gate 8 failure.

### 5.5 RBAC roles and scope
```
Athlete        → SELECT own row; UPDATE own identity/physical columns + quest progress only (column-granted)
College_Scout  → SELECT athletes_scout_view (sovereign_verified = TRUE only)
Coach          → NER/calibration writes via server route only
NDA_Analyst    → SELECT analytics views only
System_Admin   → Full access; passes score-write-gate
```

---

## 6. Ingestion pipeline (the spine)

### 6.1 Sources & intake contracts

| Source | Enum | Contract highlights |
|---|---|---|
| Scout manual entry | `scout_manual` | Full athlete fields; scout-authenticated |
| Combine/showcase CSV | `combine_csv` | Batch upload; header-mapped; row-level validation; per-row error report (good rows process, bad rows reject individually) |
| Free Agents self-enroll | `free_agents` | Athlete-submitted; limited fields; auto `Locked`; rate-limited (U15) |
| NER anchor responses | `ner_anchor` | Enum-validated behavioral responses (coach portal) |
| Film-tagged events | `film_event` | Event tags → technical inputs |

### 6.2 Flow
```
1. POST /api/intake            → session check + role check + rate limit (U15)
                                 → write intake_sessions (+ idempotency_key) + intake_raw (status: received)
2. Server calls engine (HMAC)  → Pydantic bounds + enum whitelist + cross-field checks
   ├─ fail → intake_raw.validation_errors, session status: rejected  → 422 with row-level errors
   └─ pass → session status: validated
3. Server (service role) idempotent UPSERT into athletes (canonical)      [U6: server writes, not engine]
4. Engine computes OVR / tier / neural / badges / quests → returns JSON
5. Server writes computed columns 🔒 + APPENDs neural_audit_log (ovr_before → ovr_after, actor, session ref)
6. Surface: athlete auto-appears in Draft Board queue; Roster Sync recomputes gaps
7. session status: processed; intake_raw.athlete_id backfilled (U11)
```
Steps 3–5 run in **one Postgres transaction** — a crash between upsert and audit-append must never leave a scored row without its audit entry.

### 6.3 Idempotency (U10)
- Preferred upsert key: `external_id` when the source supplies one.
- Fallback: unique index on normalized `name_school_class_key` (see §4.2).
- **Collision policy:** same natural key + materially different physicals (e.g., height delta > 2") → do NOT silently merge; write session status `rejected` with `validation_errors: {"collision": ...}` and surface in the admin ingestion monitor for human resolution. Zero Hallucination applies to identity too.
- Request-level: `intake_sessions.idempotency_key` (client retry of the same POST returns the original session, processes nothing twice).
- Every score change appends to `neural_audit_log` — the log is the immutable history (§5.2 makes "immutable" literal).

---

## 7. Scoring engine (Python / FastAPI)

Ported from the engines already in this repo (`ovr_engine.py`, `badge_engine.py`, `quest_engine.py`, `data_models.py`). **Grounded constants — verified live in `ovr_engine.py` lines 13–15 — do not alter without a version bump:**

```python
# OVR
OVR = (technical_avg * 0.45) + (neural_avg * 0.35) + (physical_score * 0.20)
# technical 1-10 → 1-99 :  ((v - 1) / 9) * 98 + 1
# tiers: Elite ≥85 · Impact ≥70 · Contributor ≥55 · Developing ≥40 · else Prospect

NEURAL_ATTRIBUTES = ["composure","coachability","iq","resilience","leadership","drive"]   # 1-99
TECHNICAL_SKILLS  = ["ball_handling","shooting","finishing","passing","defense","rebounding","athleticism"]  # 1-10

# Matchmaking (VGM)
FIT_SCORE = (style*0.30) + (need*0.30) + (level*0.25) + (cultural*0.15)
```

**Pydantic v2 intake model — fully typed, no loose dicts (U12, Gate 5 compliance):**
```python
from typing import Literal
from pydantic import BaseModel, Field, model_validator

Score10 = Field(ge=1, le=10)
Score99 = Field(ge=1, le=99)

class TechnicalScores(BaseModel):
    model_config = {"extra": "forbid"}
    ball_handling: float = Score10
    shooting: float = Score10
    finishing: float = Score10
    passing: float = Score10
    defense: float = Score10
    rebounding: float = Score10
    athleticism: float = Score10

class NeuralScores(BaseModel):
    model_config = {"extra": "forbid"}
    composure: float = Score99
    coachability: float = Score99
    iq: float = Score99
    resilience: float = Score99
    leadership: float = Score99
    drive: float = Score99

class IntakePayload(BaseModel):
    model_config = {"extra": "forbid"}          # unknown fields are rejected, not ignored
    name: str = Field(min_length=1, max_length=120)
    external_id: str | None = None
    position: Literal["PG", "SG", "SF", "PF", "C"]
    classification: Literal["HS", "JUCO", "College", "Pro"]
    height_ft: int = Field(ge=4, le=8)
    height_in: int = Field(ge=0, le=11)
    height_inches: float = Field(ge=48, le=95)
    physical_score: float = Field(ge=1, le=99)
    technical: TechnicalScores
    neural: NeuralScores

    @model_validator(mode="after")
    def validate_height_derived(self):
        expected = (self.height_ft * 12) + self.height_in
        if abs(self.height_inches - expected) > 0.5:
            raise ValueError("height_inches inconsistent with ft/in")
        return self
```

**Engine auth middleware (U7):** every request carries `X-HU-Timestamp` and `X-HU-Signature = HMAC_SHA256(HU_ENGINE_SECRET, timestamp + "." + raw_body)`. Reject if `abs(now - timestamp) > 300s` or signature fails `hmac.compare_digest`. No signature header → 401 before any parsing.

Engine modules: `ovr_engine.py`, `badge_engine.py`, `quest_engine.py`, `data_models.py`, `pipeline.py`. Docstrings + type hints on every function. Missing data → `None`/`"Unverified"`, never fabricated. **The engine imports no database client** (U6).

**Benchmark lock (Definition of Done):** `tests/test_benchmarks.py` asserts the Boone reference athlete scores exactly the locked value; runs in CI on every engine change. Locked value present in repo engines — `[NEEDS INPUT: confirm 81.82 is the canonical figure before locking the test]`.

---

## 8. API route map (Next.js `/api/*`)
Every write route verifies session first. Every sensitive call proxies server-side. Every response is shaped by the caller's role view (§5.4).

| Route | Method | Auth | Purpose |
|---|---|---|---|
| `/api/intake` | POST | scout/coach/athlete | Submit intake → engine validate/score. Rate-limited (U15); accepts `Idempotency-Key` header (U10) |
| `/api/athletes/[id]` | GET | role-scoped | Athlete profile via role view + `resolveActivation()` (U5/U14) |
| `/api/score/run` | POST | System_Admin | Re-run engine scoring |
| `/api/matchmaking` | POST | GM/Coordinator | Athlete↔program Fit Score |
| `/api/roster/[programId]` | GET | operator (must own program) | Roster state + gaps |
| `/api/draft-board` | GET/POST | operator (rows scoped to own operator_id) | Ranked prospect queue |
| `/api/activation/unlock` | POST | GM | Atomic credit-consume RPC → unlock profile (U8) |
| `/api/council` | POST | System_Admin | LLM Council → `council_sessions` |
| `/api/stripe/checkout` | POST | authed | Create checkout (server-side whitelisted price IDs only; `user_id` in metadata) |
| `/api/stripe/webhook` | POST | signature-verified, raw body | Sub lifecycle; event-id idempotency via `stripe_events` (U9) |

**U8 — activation unlock is one RPC, not read-then-write:**
```sql
create or replace function consume_activation_credit(p_operator uuid, p_athlete uuid, p_state text)
returns boolean language plpgsql security definer as $$
declare v_credits int;
begin
  select activation_credits into v_credits from operators where id = p_operator for update;
  if v_credits is null or v_credits < 1 then return false; end if;
  update operators set activation_credits = activation_credits - 1 where id = p_operator;
  insert into activation_locks (athlete_id, operator_id, state)
    values (p_athlete, p_operator, p_state)
    on conflict (athlete_id, operator_id) do update set state = excluded.state, created_at = now();
  return true;
end $$;
```
Two concurrent unlock clicks can never spend one credit twice or two credits for one unlock.

---

## 9. Portal views by role

```
Command Center (authenticated shell)
├── System_Admin (Jabari)  → all layers, audit log, council, ingestion monitor (incl. U10 collision queue)
├── Coach / Operator       → GM Dashboard, Roster Sync, Draft Board, Matchmaking,
│                             Activation Unlock (credit-gated)
├── College_Scout          → Draft Board (verified only), read-only profiles (athletes_scout_view)
└── Athlete                → own PRO-File, quests, badges, activation status
```

Activation Lock governs field visibility at every view via `resolveActivation()` + role views — the gating lives in SQL views and one resolver function, not scattered through JSX (U5/U14). Shareable "Sovereign Asset" card is served from `sovereign_card_view` and exposes **only**: name, position, school, grad_year, PRO-Score/NER/OVR/CRS, market_position, confidence_band, secondary_tags, physical measurements. Never: quest assignments, open-response text, deficiency/consistency flags, raw NER anchor responses.

---

## 10. Environment variable surface (approved — do not add others)

```bash
# Vercel — client-safe
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

# Vercel — server-only (NEVER NEXT_PUBLIC_)
SUPABASE_SERVICE_ROLE_KEY
HU_ENGINE_URL
HU_ENGINE_SECRET
HU_LLM_API_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET

# Render (engine) — must match Vercel value exactly
HU_ENGINE_SECRET
# U6: deliberately NOTHING else on Render. The engine gets no Supabase URL,
# no service key, no Stripe key. If someone adds one, that is a Gate 1 failure.
```

---

## 11. Security acceptance criteria — the 8 gates (all must PASS before deploy)

1. **Secret exposure** — zero real-format secrets in code; env-only; Render env contains exactly one secret (U6).
2. **`NEXT_PUBLIC_` leakage** — no server secret carries the public prefix.
3. **Client-side direct calls** — `huosEngine.ts` uses `BASE = "/api"`; no browser→engine/service-role calls; `supabaseServer.ts` throws if imported in a browser bundle.
4. **Supabase RLS** — `ENABLE ROW LEVEL SECURITY` on **every** table (U4); base + additive policies present; score-write-gate live on `athletes` **and** `matches`, covering INSERT **and** UPDATE, NULL-safe (U1/U2); `neural_audit_log` REVOKE + immutability trigger in place (U3); athlete column grants restricted (U4).
5. **Input validation** — every score bounded, every enum whitelisted (`Literal`, `extra="forbid"`), cross-field validators present (U12); engine requests HMAC-verified with replay window (U7).
6. **Stripe** — webhook signature verified on raw body; event-id idempotency (U9); `user_id` in checkout metadata; price IDs whitelisted server-side.
7. **Auth & least privilege** — all role checks use `app_metadata` via the single `app_role()` helper; every write route checks session; 5 RBAC roles defined; unlock is atomic RPC (U8).
8. **Output sanitization** — no cross-role data leakage; all non-admin reads go through role views (U5); shareable card served only from `sovereign_card_view`; no `select *` on base tables outside admin paths.

One FAIL = blocked deploy. Re-run the full audit (the `hu-os-security-audit` skill) after any fix.

---

## 12. Phased build plan

### Phase 0 — repo reconciliation (U13: largely resolved from the live `HeadsUP Hub` repo)

| Asset | Location | Disposition |
|---|---|---|
| OVR engine (weights .45/.35/.20 confirmed) | `ovr_engine.py` | Port into `engine/` as-is; add benchmark test |
| Badge / Quest engines | `badge_engine.py`, `quest_engine.py` | Port into `engine/` |
| Pydantic schemas | `data_models.py` | Port + upgrade per §7 (U12) |
| Existing FastAPI intake | `athlete_api.py`, `hu_os_engine.py` | Mine for `hu_os_api_v4.py`; strip any direct-DB code (U6) |
| VGM schema + RLS history | `the-virtual-gm/supabase/migrations/0001–0009` | **Baseline.** New migrations continue from these; `0006_security_remediation` and `0008_intake_throttle` patterns carry forward |
| Portal shell (draft-board, roster, onboard, api) | `headsup-os/app/*`, `headsup-os/lib/*` | Reuse as the `(portal)` shell skeleton |
| VGM decision logic | `the-virtual-gm/lib/vgm/*` (engine, live-pool, ovr, public-profile) | Reuse for matchmaking/roster sync |

Remaining Phase 0 input: `[NEEDS INPUT: GitHub/Vercel access to the deployed vgm-command-center to diff against local]`.

| Phase | Deliverable | Gate |
|---|---|---|
| **0** | Repo reconciliation (table above) | — |
| 1 | Supabase schema + RLS + score-write-gates + audit immutability + role views (§4–5) | Gate 4, 7 |
| 2 | Python scoring engine (OVR/neural/badge/quest) + Pydantic + HMAC auth + **benchmark test in CI** | Gate 5 |
| 3 | Ingestion pipeline end-to-end (all 5 sources) incl. idempotency + collision queue + rate limit | Gate 5 |
| 4 | VGM decision layer (matchmaking, roster sync, draft board, atomic activation lock) | Gate 8 |
| 5 | Portal UI + role-scoped views + `/api` proxy routes | Gate 3 |
| 6 | Stripe billing + Operator License tiers + webhook idempotency | Gate 6 |
| 7 | Full 8-gate audit → deploy (Vercel + Render + Supabase) | All |

---

## 13. Definition of Done

- [ ] A test athlete ingested through **each** of the 5 sources lands correctly in `athletes`.
- [ ] OVR/tier auto-computed on ingest; every change appended to `neural_audit_log`; upsert + score + audit committed in one transaction.
- [ ] Engine integrity check: benchmark athlete PRO-Score matches the locked value (Boone — confirm 81.82) **as an automated CI test**, not a manual check — any drift = engine failure, not a build pass.
- [ ] Re-ingesting the same athlete (same `external_id` or natural key) updates in place — row count unchanged; identity collisions land in the admin review queue, never silently merged.
- [ ] Ingested athlete auto-surfaces in Draft Board + triggers Roster Sync gap recompute.
- [ ] Activation Lock correctly gates fields across all 4 role views; per-operator lock overrides global floor (U14).
- [ ] Negative security tests pass: non-admin INSERT with `ovr` set → rejected; JWT with no role claim writing `ovr` → rejected (U1); UPDATE/DELETE on `neural_audit_log` as service_role → rejected (U3); athlete PATCH to own `neural_iq` → rejected (U4); two concurrent unlocks with 1 credit → exactly one succeeds (U8); replayed Stripe event → processed once (U9); engine call with stale timestamp → 401 (U7).
- [ ] Stripe checkout → subscription row → Operator License tier provisioned.
- [ ] All 8 security gates PASS.
- [ ] No browser call reaches the engine or Supabase service role directly; Render env contains only `HU_ENGINE_SECRET`.

---

## Appendix — open inputs required from Jabari

- `[NEEDS INPUT]` GitHub/Vercel access to the **deployed** `vgm-command-center` to diff against the local `headsup-os/` + `the-virtual-gm/` (local inventory in §12.0 is done).
- ~~Confirm scoring engine hosting~~ → **Resolved:** Render, per existing `render.yaml` + commit `a10f743` (Python 3.12.7 pin). Reuse: port `athlete_api.py`/`hu_os_engine.py` into `engine/hu_os_api_v4.py`, stripped of any direct DB access (U6).
- `[NEEDS INPUT]` Stripe price IDs and Operator License pricing per tier.
- `[NEEDS INPUT]` Confirm Boone = **81.82** as the locked benchmark (the figure appears in repo engines; confirm it is canonical before the CI test hard-locks it).
