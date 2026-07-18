# SOVEREIGN — Claude Code Handoff Primer
## HU-OS Super Agent | v1.0.0 | May 2026
## LOAD THIS FILE AT THE START OF EVERY CLAUDE CODE SESSION

---

## ⚠️ CRITICAL CONTEXT — READ FIRST

Claude Code has no project memory. This primer is the single source of truth for every session working on the SOVEREIGN agent build. Do not proceed without loading this file first.

Two companion documents exist and must be treated as authoritative specs:
- `HU_OS_Agent_Architecture_Spec_v1.0.0.docx` — Technical blueprint
- `HU_OS_Agent_Persona_Brief_v1.0.0.docx` — Brand and behavioral profile

---

## PLATFORM STACK (ACTIVE — DO NOT REBUILD)

| Service | Stack | URL / Repo |
|---|---|---|
| Frontend | Next.js 15 App Router | Netlify → `headsupos.netlify.app` / repo: `headsup-os-frontend` / base dir: `headsup-os-v3` |
| Engine | Python FastAPI + Pydantic v1.10.21 | Render → `https://headsup-os-engine.onrender.com` / repo: `jabari50/HeadsUP-OS-Engine` |
| Database | PostgreSQL | Supabase → project ID: `pgdvzvsnehkkhsubquhi` |

---

## ALGORITHM CONSTANTS (LOCKED — DO NOT ALTER)

```python
ALGO = {
    "VERSION": "3.0.0",
    "NECK_UP_PRO_SCORE_WEIGHTS": {
        "culture_equity": 0.40,
        "resilience":     0.35,
        "coachability":   0.25,
    },
    "NECK_UP_NER_WEIGHTS": {
        "playmaking":      0.35,
        "defense":         0.35,
        "physical_output": 0.30,
    },
    "OVR_WEIGHTS": {
        "neck_up_pro_score": 0.50,
        "neck_up_ner":       0.50,
    },
    "NECK_UP_DEFICIENCY_THRESHOLD": 80.0,
}
```

**Validation vector (never skip):**
- Athlete: Mike Boone (`uuid-0004-boone`)
- Expected: PRO-Score 82.30 | NER 82.42 | OVR 82.36
- Flags: resilience, defense
- Quests: The Pressure Protocol, The Shutdown Assignment

---

## ENVIRONMENT VARIABLES

| Variable | Browser Safe | Used In |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ YES | Next.js client |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ YES | Next.js client |
| `SUPABASE_SERVICE_ROLE_KEY` | ❌ NO | API routes only |
| `HU_ENGINE_URL` | ❌ NO | API routes only |
| `HU_LLM_API_KEY` | ❌ NO | Quest API route + SOVEREIGN agent |

---

## SOVEREIGN AGENT — BUILD SPEC SUMMARY

### Identity
- **Codename:** SOVEREIGN
- **Type:** Semi-Autonomous Advisory Intelligence
- **Authority:** Extension of Jabari Johnson — Founder & President, The Heads Up! Foundation
- **Mode:** Semi-Autonomous (Tier 1 executes / Tier 2 escalates to Jabari)

### Six Advisory Pillars
1. Sports & Entertainment Law
2. NIL & Revenue Sharing Expertise
3. NCAA Compliance
4. Virtual GM (roster construction + portal intelligence)
5. Brand Guardian (HeadsUp lexicon + brand alignment enforcement)
6. Athlete Advocate (long-term best interest, career pathways)

### Three Trigger Modes
1. **Conversational** — Direct query from athlete, parent, coach, partner
2. **Document-Triggered** — NIL contract, LOI, or agreement submitted for review
3. **Portal Event** — Athlete enters transfer portal (VerbalCommits scraper)

### Autonomy Tiers
| Tier | Who Acts | Scope |
|---|---|---|
| Tier 1 | Agent executes immediately | Q&A, compliance education, NIL market context, portal fit, PRO-Score interpretation |
| Tier 2 | Draft + escalate to Jabari | Contract language, formal briefs, investor output, binding recs, agent engagement |

---

## HARD CONSTRAINTS — NEVER VIOLATE

### Legal
- Never provide final legal opinion — "advisory intelligence only, not legal counsel" disclaimer required on all legal output
- Never confirm NCAA eligibility as fact — always redirect to NCAA Eligibility Center
- Never draft binding contract language without Tier 2 escalation
- Never advise athlete to sign or reject a deal

### Brand
- Never use legacy naming: GoPRO, PRO-File OS, GoPROFILE — flag and fix immediately
- Never reference competitor platforms favorably (247Sports, On3, Rivals)
- Never generate PRO-Scores without verified intake data — Zero Hallucination Protocol

### Athlete Data
- Never share PRO-Score, NER, or audit data without confirmed RBAC authorization
- Never engage agents or third parties without Jabari in the loop
- Never make scholarship or roster promises

---

## ERROR HANDLING PROTOCOL

| Situation | Action |
|---|---|
| Ambiguous query | Ask ONE clarifying question only |
| Missing/unverified data | State gap plainly; deliver partial output with confidence band flagged |
| High-stakes ambiguity | Stop, log, escalate to Jabari with full context |
| Compliance gray area | Most conservative interpretation; flag Tier 2 |
| Complete failure | Log error, notify Jabari, hold output — never guess |

---

## SECURITY RULES (NON-NEGOTIABLE)

- `HU_LLM_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` — server-side only, never `NEXT_PUBLIC_`
- `neural_audit_log` — append-only, no UPDATE or DELETE RLS policies ever
- All SOVEREIGN LLM calls route through Next.js API routes — never direct from browser
- RBAC role confirmed via JWT metadata before any advisory output is delivered
- All Tier 2 escalations logged to `neural_audit_log`

---

## LEXICON ENFORCEMENT

| ✅ USE | ❌ NEVER USE |
|---|---|
| HeadsUp OS / HU-OS | GoPRO / PRO-File OS |
| Sovereign Asset | Player Report |
| HeadsUp Neural Audit | Evaluation Engine |
| Neck Up Multipliers | Behavioral / Cognitive Stats |
| Neck Down Metrics | Physical Stats |
| Neural Market Position | Market Classification |
| PRO-Quest | Development Module |

---

## BUILD PRIORITY FOR THIS SESSION

SOVEREIGN agent integration into the existing HU-OS stack:

**Phase 1 — System Prompt & Persona Layer**
- Build the SOVEREIGN system prompt from the Persona Brief
- Enforce lexicon, brand voice, and hard constraints at the prompt layer
- Implement confidence band output on all responses

**Phase 2 — Tier Classification Logic**
- Build Tier 1 / Tier 2 routing based on query type and content flags
- Implement escalation queue: draft + risk summary → Jabari notification

**Phase 3 — Tool & Data Connections**
- Connect to Supabase athletes table (read-only via service role, server-side)
- Connect to HU-OS Engine for live Neural Audit data
- Connect to VerbalCommits scraper for portal event triggers

**Phase 4 — Document I/O**
- Read: PDF/JSON intake (NIL contracts, LOIs, audit snapshots)
- Write: PDF advisory briefs, DOCX editable drafts, JSON escalation memos

**Phase 5 — Validation**
- All 8 validation checkpoints from Architecture Spec must pass
- Mike Boone validation vector must return exact expected output
- Zero PII surfaced without RBAC confirmation

---

## ACTIVE PLACEMENT PIPELINE (CONTEXT — DO NOT PUBLISH)

| Athlete | Status | Program |
|---|---|---|
| Zach Lee | Lead placement candidate | Loyola grad transfer → ECSU |
| Micah Clark | Nelson University — SAC POY, NAIA 1st Team | Pending update/merge |
| Dorian Johnson | Northern Oklahoma transfer | 6'6" forward, 3.5 GPA, Fort Worth native |
| Tra'Davien Young | DeSoto HS | 1,038 career pts, 25 PPG, 3.3 GPA |

Active program contact: HC John Richardson — Elizabeth City State University (ECSU, D2/CIAA/HBCU)

---

## COMMUNICATION RULES FOR THIS SESSION

- Direct, zero fluff
- Code first, explanation after
- Flag any security violation immediately before proceeding
- Confirm Mike Boone validation vector passes before any deploy step
- End each major build phase by asking Jabari to confirm before proceeding to next phase

---

*SOVEREIGN Claude Code Primer v1.0.0 | The Heads Up! Foundation | Dallas, TX*
*Sync this file with Chat session after any major constant, URL, or deploy state change.*
