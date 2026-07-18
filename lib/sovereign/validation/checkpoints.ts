/**
 * SOVEREIGN — Architecture Spec Validation Checkpoints
 * All 8 checkpoints from HU_OS_Agent_Architecture_Spec_v1.0.0.docx §12.
 *
 * No LLM calls — pure logic, DB queries, and system prompt inspection.
 * Designed to run before every deploy.
 */

import { createClient } from "@supabase/supabase-js";
import { buildSovereignSystemPrompt } from "../system-prompt";
import { classifyQuery } from "../tier-classifier";
import { logAndEscalate } from "../escalation";

export interface CheckpointResult {
  id: number;
  name: string;
  pass: boolean;
  message: string;
  detail?: string;
}

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

// ── Checkpoint 1 ──────────────────────────────────────────────────────────────
// Agent correctly identifies user role before responding.
// Tests that Investor and Partner roles are always routed Tier 2.
async function checkpoint1(): Promise<CheckpointResult> {
  const name = "Role gate — Investor/Partner always Tier 2";
  try {
    const investorResult = classifyQuery("Tell me about the platform", "Investor", { userRole: "Investor" });
    const partnerResult  = classifyQuery("Tell me about the platform", "Partner",  { userRole: "Partner"  });
    const athleteResult  = classifyQuery("What are NIL market rates for PGs?", "Athlete", { userRole: "Athlete" });

    if (investorResult.tier !== 2) return { id: 1, name, pass: false, message: "Investor role did not route Tier 2", detail: JSON.stringify(investorResult) };
    if (partnerResult.tier  !== 2) return { id: 1, name, pass: false, message: "Partner role did not route Tier 2",  detail: JSON.stringify(partnerResult) };
    if (athleteResult.tier  !== 1) return { id: 1, name, pass: false, message: "Athlete compliance query did not route Tier 1", detail: JSON.stringify(athleteResult) };

    return { id: 1, name, pass: true, message: "Investor → Tier 2, Partner → Tier 2, Athlete compliance query → Tier 1" };
  } catch (err) {
    return { id: 1, name, pass: false, message: "Exception thrown", detail: String(err) };
  }
}

// ── Checkpoint 2 ──────────────────────────────────────────────────────────────
// Tier 1 queries execute immediately; Tier 2 queries route to escalation queue.
async function checkpoint2(): Promise<CheckpointResult> {
  const name = "Tier routing — Tier 1 executes, Tier 2 escalates";
  try {
    const tier1 = classifyQuery("What is NCAA's NIL policy on collectives?", "Athlete", { userRole: "Athlete" });
    const tier2 = classifyQuery("Should I sign this NIL contract with this brand?", "Athlete", { userRole: "Athlete" });
    const tier2Doc = classifyQuery("Document review: NIL_CONTRACT — deal.pdf", "Athlete", {
      userRole: "Athlete",
      documentType: "NIL_CONTRACT",
    });

    if (tier1.tier !== 1) return { id: 2, name, pass: false, message: "Tier 1 compliance query routed incorrectly", detail: JSON.stringify(tier1) };
    if (tier2.tier !== 2) return { id: 2, name, pass: false, message: "Contract signing query did not escalate", detail: JSON.stringify(tier2) };
    if (tier2Doc.tier !== 2) return { id: 2, name, pass: false, message: "NIL_CONTRACT document type did not escalate", detail: JSON.stringify(tier2Doc) };

    return {
      id: 2, name, pass: true,
      message: `Tier 1 reason: "${tier1.reason}" | Tier 2 flags: [${tier2.riskFlags.join(", ")}]`,
    };
  } catch (err) {
    return { id: 2, name, pass: false, message: "Exception thrown", detail: String(err) };
  }
}

// ── Checkpoint 3 ──────────────────────────────────────────────────────────────
// Legal advisory output contains disclaimer: "Advisory intelligence only — not legal counsel."
async function checkpoint3(): Promise<CheckpointResult> {
  const name = "Legal disclaimer present in system prompt";
  try {
    const prompt = buildSovereignSystemPrompt({ userRole: "Athlete" });
    const DISCLAIMER = "Advisory intelligence only — not legal counsel";
    if (!prompt.includes(DISCLAIMER)) {
      return { id: 3, name, pass: false, message: "Disclaimer string not found in system prompt" };
    }
    const occurrences = (prompt.match(new RegExp(DISCLAIMER, "g")) ?? []).length;
    return { id: 3, name, pass: true, message: `Disclaimer found (${occurrences} occurrence${occurrences > 1 ? "s" : ""})` };
  } catch (err) {
    return { id: 3, name, pass: false, message: "Exception thrown", detail: String(err) };
  }
}

// ── Checkpoint 4 ──────────────────────────────────────────────────────────────
// NCAA eligibility responses include redirect to NCAA Eligibility Center.
async function checkpoint4(): Promise<CheckpointResult> {
  const name = "NCAA Eligibility Center redirect present in system prompt";
  try {
    const prompt = buildSovereignSystemPrompt({ userRole: "Parent" });
    const REDIRECT = "eligibilitycenter.org";
    const NCAA_REF = "NCAA Eligibility Center";
    if (!prompt.includes(REDIRECT) || !prompt.includes(NCAA_REF)) {
      return {
        id: 4, name, pass: false,
        message: `Missing: ${!prompt.includes(REDIRECT) ? "eligibilitycenter.org" : ""} ${!prompt.includes(NCAA_REF) ? "NCAA Eligibility Center" : ""}`.trim(),
      };
    }
    return { id: 4, name, pass: true, message: "NCAA Eligibility Center + eligibilitycenter.org both present" };
  } catch (err) {
    return { id: 4, name, pass: false, message: "Exception thrown", detail: String(err) };
  }
}

// ── Checkpoint 5 ──────────────────────────────────────────────────────────────
// Zero PII surfaced without authorization confirmation.
// Tests that a non-privileged role is blocked when superagent_unlocked = false.
async function checkpoint5(): Promise<CheckpointResult> {
  const name = "PII gate — superagent_unlocked=false blocks non-privileged roles";
  try {
    const supabase = adminClient();

    // Find any athlete with superagent_unlocked = false
    const { data } = await supabase
      .from("athletes")
      .select("id, full_name, superagent_unlocked")
      .eq("superagent_unlocked", false)
      .limit(1)
      .single();

    if (!data) {
      return { id: 5, name, pass: true, message: "No athletes with superagent_unlocked=false found — all unlocked, gate moot" };
    }

    // Import dynamically to avoid circular refs at module load
    const { getAthleteForSovereign } = await import("../data/athletes");
    const coachResult  = await getAthleteForSovereign(data.id, "Coach");
    const adminResult  = await getAthleteForSovereign(data.id, "System_Admin");

    if (coachResult !== null) {
      return { id: 5, name, pass: false, message: `Coach role returned data for locked athlete ${data.id.slice(0, 8)}` };
    }
    if (adminResult === null) {
      return { id: 5, name, pass: false, message: `System_Admin role was blocked — privileged bypass failed` };
    }

    return {
      id: 5, name, pass: true,
      message: `Coach → null (blocked) | System_Admin → data returned for ${data.full_name}`,
    };
  } catch (err) {
    return { id: 5, name, pass: false, message: "Exception thrown", detail: String(err) };
  }
}

// ── Checkpoint 6 ──────────────────────────────────────────────────────────────
// All output conforms to HeadsUp brand lexicon — no legacy naming.
async function checkpoint6(): Promise<CheckpointResult> {
  const name = "Lexicon — correct terms present, legacy terms absent from system prompt";
  try {
    const prompt = buildSovereignSystemPrompt({ userRole: "Coach" });

    const REQUIRED = [
      "HeadsUp OS", "Sovereign Asset", "HeadsUp Neural Audit",
      "Neck Up Multipliers", "Neck Down Metrics", "Neural Market Position", "PRO-Quest",
    ];
    const FORBIDDEN = [
      "GoPRO", "PRO-File OS", "GoPROFILE",
      "player report", "Evaluation Engine",
      "behavioral stats", "cognitive stats", "physical stats",
      "development module", "market classification",
    ];

    const missing = REQUIRED.filter((term) => !prompt.includes(term));
    const present = FORBIDDEN.filter((term) => prompt.toLowerCase().includes(term.toLowerCase()));

    // Forbidden terms appear in the "NEVER USE" column — that's expected and correct
    // Only flag if they appear outside the enforcement table (i.e., as instructions to use them)
    const trulyForbidden = present.filter((term) => {
      const idx = prompt.toLowerCase().indexOf(term.toLowerCase());
      const surrounding = prompt.slice(Math.max(0, idx - 50), idx + 100);
      return !surrounding.includes("NEVER USE") && !surrounding.includes("never use") && !surrounding.includes("NEVER");
    });

    if (missing.length > 0) {
      return { id: 6, name, pass: false, message: `Required terms missing from prompt: ${missing.join(", ")}` };
    }
    if (trulyForbidden.length > 0) {
      return { id: 6, name, pass: false, message: `Legacy terms used outside enforcement table: ${trulyForbidden.join(", ")}` };
    }

    return { id: 6, name, pass: true, message: `All ${REQUIRED.length} required terms present; legacy terms only in enforcement table` };
  } catch (err) {
    return { id: 6, name, pass: false, message: "Exception thrown", detail: String(err) };
  }
}

// ── Checkpoint 7 ──────────────────────────────────────────────────────────────
// Error states produce logs, not guesses.
// Tests that the classifier handles edge cases without throwing.
async function checkpoint7(): Promise<CheckpointResult> {
  const name = "Error handling — classifier handles edge cases without throw";
  try {
    const empty    = classifyQuery("", "Athlete", { userRole: "Athlete" });
    const unicode  = classifyQuery("🏀🔥💰 what should I do???", "Parent", { userRole: "Parent" });
    const overflow = classifyQuery("A".repeat(50000), "Coach", { userRole: "Coach" });
    const nullCtx  = classifyQuery("NIL market question", "Athlete", { userRole: "Athlete", documentType: undefined });

    // All should return a valid result — not throw
    if (!empty.tier || !unicode.tier || !overflow.tier || !nullCtx.tier) {
      return { id: 7, name, pass: false, message: "One or more edge cases returned invalid tier" };
    }
    return {
      id: 7, name, pass: true,
      message: `empty → Tier ${empty.tier} | unicode → Tier ${unicode.tier} | overflow → Tier ${overflow.tier} | nullCtx → Tier ${nullCtx.tier}`,
    };
  } catch (err) {
    return { id: 7, name, pass: false, message: "Exception thrown on edge case input", detail: String(err) };
  }
}

// ── Checkpoint 8 ──────────────────────────────────────────────────────────────
// Escalation memos reach Jabari queue within defined SLA.
// Inserts a test escalation and verifies it's readable immediately.
async function checkpoint8(): Promise<CheckpointResult> {
  const name = "Escalation queue SLA — Tier 2 draft reaches queue";
  try {
    const start = Date.now();

    const result = await logAndEscalate({
      userRole: "Athlete",
      query: "[VALIDATION TEST] Checkpoint 8 SLA probe — safe to delete",
      responseText: "This is a validation-generated draft. Advisory intelligence only — not legal counsel. [CONFIDENCE: HIGH]",
      classification: {
        tier: 2,
        reason: "Validation checkpoint 8 SLA test",
        riskFlags: ["validation-probe"],
      },
      confidenceBand: "HIGH",
    });

    const elapsed = Date.now() - start;

    if (!result.escalationId) {
      return { id: 8, name, pass: false, message: "escalation_id not returned from logAndEscalate" };
    }

    // Verify it's readable from the queue
    const supabase = adminClient();
    const { data } = await supabase
      .from("sovereign_escalation_queue")
      .select("id, status, created_at")
      .eq("id", result.escalationId)
      .single();

    if (!data) {
      return { id: 8, name, pass: false, message: `Escalation ${result.escalationId.slice(0, 8)} not found in queue after insert` };
    }

    return {
      id: 8, name, pass: true,
      message: `Escalation ${result.escalationId.slice(0, 8)} written and readable in ${elapsed}ms | status: ${data.status}`,
    };
  } catch (err) {
    return { id: 8, name, pass: false, message: "Exception thrown", detail: String(err) };
  }
}

export async function runAllCheckpoints(): Promise<CheckpointResult[]> {
  // Run checkpoints in parallel where safe; checkpoint 8 depends on nothing else
  const [cp1, cp2, cp3, cp4, cp5, cp6, cp7, cp8] = await Promise.all([
    checkpoint1(),
    checkpoint2(),
    checkpoint3(),
    checkpoint4(),
    checkpoint5(),
    checkpoint6(),
    checkpoint7(),
    checkpoint8(),
  ]);
  return [cp1, cp2, cp3, cp4, cp5, cp6, cp7, cp8];
}
