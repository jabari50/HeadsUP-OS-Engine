# The Virtual GM — Project Context (CLAUDE.md)

> **Status:** ACTIVE — reconstructed from the Phase 0 kickoff prompt and reconciled
> against the live Supabase schema. The §9 open decisions were **resolved by Jabari
> on 2026-06-16** (see §9 for the chosen answers). Build proceeds in dependency order.
>
> This file is the authoritative project context. Read it in full before writing code.
> Last reconciled: 2026-06-16 against Supabase project `HeadsUP OS` (`pgdvzvsnehkkhsubquhi`).

---

## 1. What this is

The Virtual GM is the operating system for high school basketball programs — and
the front-office layer over the broader HeadsUP / HU-OS athlete-intelligence
platform. It serves coaches (roster building, fit), independent athletes
(self-serve recruiting profiles), parents, scouts/operators (licensed access to
verified athlete data), and Jabari as the super-admin operator.

**Tagline / north star:** "We Scout From The Neck Up." The scoring IP is the
**Neck Up** model (see §6), not a generic skills rubric.

## 2. Source of truth & architecture (DECIDED)

- **The app is [`the-virtual-gm/`](.)** — a standalone Next.js 14 (App Router,
  TypeScript strict, Tailwind) app on Vercel, backed by Supabase (Auth + Postgres
  + RLS). This **supersedes all prototypes**. We **evolve it**; we do not rebuild.
- **No monorepo / no Turborepo / no separate FastAPI service** unless a specific
  task proves it's required. The original kickoff prompt described a from-scratch
  `apps/web` + `apps/api` + `packages/*` monorepo — that is **superseded** by the
  existing single-app build. Server logic lives in Next.js Route Handlers /
  Server Actions; the Supabase service-role key stays server-only.
- **Database changes are always numbered SQL migrations** in
  [`supabase/migrations/`](supabase/migrations). Never edit tables in the
  dashboard. The live DB already holds 42 tables from prior HU-OS work — new
  migrations are **additive and reversible**; we do not drop/rewrite existing
  columns without an explicit decision.
- **TypeScript types** are generated from the schema into `lib/` (currently
  hand-maintained in [`lib/types.ts`](lib/types.ts); migrate to
  `supabase gen types` output and regenerate on every schema change).

## 3. Current build (what already exists)

App routes (`app/`): `landing`, `login`, `signup`, `wizard`, `dashboard`,
`gm`, `athlete`, `auth`. Auth is Supabase magic-link via
[`middleware.ts`](middleware.ts) + [`lib/supabase/`](lib/supabase). Operator
self-provisioning in [`lib/operator.ts`](lib/operator.ts). Stripe SDK installed.

Migrations applied: [`0001_virtual_gm_core.sql`](supabase/migrations/0001_virtual_gm_core.sql)
(operators/rosters/match_requests + RLS),
[`0002_vgm_operators_read_verified_athletes.sql`](supabase/migrations/0002_vgm_operators_read_verified_athletes.sql).

### Live tables relevant to Phase 0 (already in DB)

| Table | Role | Notes |
|---|---|---|
| `athletes` (67 cols) | core athlete record | has `user_id`, `full_name`, `graduation_year`, `school`, `position`, `gpa`, `uil_eligible`, `profile_public`, `ovr`, `market_position`, `confidence_band`, `stripe_customer_id`, `stripe_subscription_id`, `subscription_plan`, `entry_status`, `entry_source`, `placement_interest`, and the 8 `neck_up_*` scores. **Missing:** `program_id`, `profile_slug`, `account_type`, `is_demo`, `is_historical`. |
| `subscriptions` | generic Stripe sub | `user_id`, `stripe_customer_id`, `stripe_sub_id`, `plan`, `status`, `current_period_end`, `cancel_at_period_end`. |
| `operators`, `rosters`, `match_requests` | **operator system A** (app uses this) | auth-linked; `license_tier` ∈ scout/coordinator/gm/white_label. |
| `vgm_operator_licenses`, `vgm_activation_locks`, `vgm_matchmaking_log` | **operator system B** | richer: seats, unlock credits, term dates, confidentiality; **not** auth-linked. |
| `vgm_programs` | scouting-intel view of a program | `program_name`, `head_coach` (text), `competition_level`, `roster_gaps`, `culture_signals`. **Not** an account/tenant (no head-coach user link, no subscription tier, no UIL district/classification, no `is_demo`). |
| `coach_profiles`, `coach_athlete_links`, `parent_athlete_links` | role linkage | |
| `events`, `event_registrations` | events | supports historical `event_id` linkage. |
| `nil_profiles`, `hu_os_demo_athletes` | NIL / demo seed | `hu_os_demo_athletes` has 1 row. |

## 4. Roles (target: 6)

`super_admin`, `coach`, `assistant_coach`, `athlete` (program), `independent_athlete`,
`parent`. **Open decision:** how role is stored/derived — see §9.

Role → landing route:
`super_admin`→`/admin`, `coach`/`assistant_coach`→`/coach/roster`,
`athlete`/`independent_athlete`→`/athlete/profile` (independent shows billing UI),
`parent`→`/parent/dashboard`.

## 5. Subscription tiers — UNRESOLVED (see §9)

The prompt defines **6 program/athlete tiers**:
`athlete_direct` $19, `family_direct` $29, `starter` $49, `pro` $99,
`elite` $199, `district` $499 (mo). The live DB instead has operator
`license_tier` (scout/coordinator/gm/white_label) + a generic `subscriptions.plan`.
These are **two different monetization models** and must be reconciled before any
Stripe product/price or webhook work.

## 6. Scoring IP — Neck Up model (NOT generic GCOS)

The kickoff prompt's "GCOS 8 dimensions" (Athleticism, Ball Handling, Shooting,
Defensive IQ, Basketball IQ, Coachability, Motor, Upside) **do not match** the
live model. `athletes` already stores the **Neck Up 8**:
`neck_up_pro_score`, `neck_up_culture_equity`, `neck_up_resilience`,
`neck_up_coachability`, `neck_up_ner`, `neck_up_playmaking`, `neck_up_defense`,
`neck_up_physical_output` (+ `neck_up_cognitive_stability`), feeding `ovr`,
`market_position`, `confidence_band`.

**Rule:** This is 20+ years of domain IP. Do not invent dimension definitions,
weights, or position adjustments. The OVR/Neck-Up engine logic lives in the
existing Python (`ovr_engine.py`, `hu_os_engine.py`, PRO-File OS) at repo root;
porting/packaging it is a Phase 0 item but the **methodology is Jabari's call**.

## 7. Operator License & Masquerade (target spec)

Jabari (`super_admin`) can experience the platform as any customer with full
Elite/white-label access regardless of that account's real tier.

- `/admin` super-admin dashboard: programs + athletes lists with search/filter;
  platform stats (programs, athletes, MRR, active subs by tier, **excluding demos**);
  per-record "View as Coach/Athlete/Parent".
- Masquerade: server endpoints to start/exit, secure **HTTP-only** cookie holding
  `{ real_user_id, target, role, is_operator_session }`. Server middleware must
  verify `real_user_id` is a genuine `super_admin` on **every** request and
  invalidate otherwise. When `is_operator_session`, tier checks are bypassed
  (full access), toggled by a "Tier Override" switch.
- Persistent operator banner in the root layout (gold `#F5A623`, black bold):
  `[OPERATOR MODE] Viewing as: role / name / program (tier) [Tier Override] [EXIT]`.
  Renders **only** when a valid masquerade cookie is present — never for real users.
- Demo programs: `is_demo` flagged, created at any tier with **no Stripe charge**,
  excluded from all revenue/MRR analytics.

## 8. Phase 0 task map (adapted) — status

Legend: ✅ exists · 🟡 partial · 🔴 to build · ⛔ blocked on §9 decision

1. Repo scaffold — ✅ (single app; monorepo dropped)
2. Supabase + RLS for 6 roles — 🟡 (tables exist; role model + program RLS ⛔)
3. Server foundation (health/env-validation/Sentry/logging) — 🔴 (Next-native, not FastAPI)
4. Stripe 6 tiers + webhook — ⛔ (tier model unresolved, §5)
5. Magic-link auth + role routing — 🟡 (auth ✅; 6-role routing 🔴)
6. Independent athlete self-signup (slug + account_type + Stripe) — 🔴⛔
7. Coach signup → program (account-grade `programs`) — 🔴⛔
8. Connect-to-Program atomic merge — 🔴 (needs `program_id`/`account_type`/`profile_slug`)
9. Public profile `/profile/[slug]` (OG/Twitter cards, privacy gate) — 🔴 (needs `profile_slug`)
10. Operator/super-admin dashboard + masquerade + banner — 🔴 (canonical operator system ⛔)
11. Demo programs (`is_demo`) — 🔴
12. Historical import (CSV athletes + JSON evals) + `seed_historical.py` — 🔴 (uses Neck-Up engine)

## 9. DECISIONS — RESOLVED 2026-06-16

1. **Tier model:** **Run both.** Keep operator `license_tier` (B2B access licensing)
   AND add the prompt's athlete/program subscription tiers — distinct products.
2. **Scoring:** **Neck Up is canonical.** The prompt's "GCOS" names were a
   placeholder. Package the existing root Python engine (`ovr_engine.py`,
   `hu_os_engine.py`); never invent dimensions/weights.
3. **Operator system:** **Keep `operators/rosters/match_requests`** (app already
   wired) and extend it with credits/seats as needed; do not adopt
   `vgm_operator_licenses` as canonical (leave it as legacy/intel until retired).
4. **Programs as accounts:** **New account-grade `programs` table** (head-coach
   user link, `subscription_tier`, `uil_district`, `classification`, `is_demo`,
   `is_historical`). `vgm_programs` stays as the scouting-intel view.
5. **Role storage:** **Dedicated `user_roles` table** as the single source of
   truth for RLS, with `is_super_admin()` / `current_app_role()` helper functions.
6. **`athletes` columns to add:** `program_id` (nullable FK→programs), `account_type`
   ('independent'|'program'), `profile_slug` (unique), `is_demo`, `is_historical`,
   `historical_source`, `historical_eval_date`.

### Migration build order (dependency-correct)
`0003` user_roles + role helpers → `0004` programs (account table) →
`0005` athletes columns (program_id FK needs programs first) + slug backfill +
program-vs-independent RLS. Then: public profile, merge, Stripe/webhooks,
masquerade, historical import.

## 10. Working agreement

- Confirm before any change to **billing, schema, or security**.
- Ask on **Neck Up / evaluation methodology** — do not infer domain logic.
- Surface blockers immediately; never silently work around them.
- After each task: report what was built, what was tested, what's next.
- Never mark a task done with failing or partial tests.
- Run the HU-OS security audit before any production push. Zero tolerance for
  client-exposed secrets.
- `athletes.program_id` is **nullable by design** (independent athletes).
- The public `/profile/[slug]` page is the primary viral mechanic — fast,
  beautiful, shareable.
