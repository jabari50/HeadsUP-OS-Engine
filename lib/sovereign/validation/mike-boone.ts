/**
 * SOVEREIGN — Mike Boone Validation Vector
 * Primer spec: PRO-Score 82.30 | NER 82.42 | OVR 82.36
 * Flags: resilience, defense
 * Quests: The Pressure Protocol, The Shutdown Assignment
 *
 * Uses ALGO constants (locked — never alter):
 *   NECK_UP_DEFICIENCY_THRESHOLD = 80.0
 */

import { createClient } from "@supabase/supabase-js";
import { getAthleteForSovereign } from "../data/athletes";
import { getDeficiencyReport } from "../data/engine";

export interface BoonVectorResult {
  pass: boolean;
  athleteId: string | null;
  checks: BoneCheck[];
  summary: string;
}

interface BoneCheck {
  field: string;
  expected: string | number;
  actual: string | number | null;
  pass: boolean;
}

const EXPECTED = {
  fullName:    "Mike Boone",
  proScore:    82.30,
  ner:         82.42,
  ovr:         82.36,
  deficiencies: ["resilience", "defense"] as string[],
  quests:      ["The Pressure Protocol", "The Shutdown Assignment"] as string[],
} as const;

const TOLERANCE = 0.01; // floating point tolerance for score comparisons

function near(actual: number | null, expected: number): boolean {
  if (actual === null || actual === undefined) return false;
  return Math.abs(Number(actual) - expected) <= TOLERANCE;
}

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function runBoonevVector(): Promise<BoonVectorResult> {
  const checks: BoneCheck[] = [];

  // 1. Find Mike Boone
  const supabase = adminClient();
  const { data: booneRow } = await supabase
    .from("athletes")
    .select("id")
    .eq("full_name", "Mike Boone")
    .single();

  if (!booneRow?.id) {
    return {
      pass: false,
      athleteId: null,
      checks: [{ field: "athlete_record", expected: "Mike Boone in athletes table", actual: null, pass: false }],
      summary: "FAIL — Mike Boone not found in athletes table",
    };
  }

  const athleteId: string = booneRow.id;

  // 2. Fetch full profile as System_Admin (bypasses superagent_unlocked gate)
  const profile = await getAthleteForSovereign(athleteId, "System_Admin");

  if (!profile) {
    return {
      pass: false,
      athleteId,
      checks: [{ field: "profile_fetch", expected: "AthleteProfile object", actual: null, pass: false }],
      summary: "FAIL — getAthleteForSovereign returned null for System_Admin",
    };
  }

  // 3. Score checks
  checks.push({
    field: "PRO-Score",
    expected: EXPECTED.proScore,
    actual: profile.proScore !== null ? Number(profile.proScore) : null,
    pass: near(profile.proScore, EXPECTED.proScore),
  });

  checks.push({
    field: "NER",
    expected: EXPECTED.ner,
    actual: profile.ner !== null ? Number(profile.ner) : null,
    pass: near(profile.ner, EXPECTED.ner),
  });

  checks.push({
    field: "OVR",
    expected: EXPECTED.ovr,
    actual: profile.ovr !== null ? Number(profile.ovr) : null,
    pass: near(profile.ovr, EXPECTED.ovr),
  });

  // 4. Deficiency flags
  const defReport = await getDeficiencyReport(athleteId);
  const actualFlags = (defReport?.deficiencies ?? []).sort();
  const expectedFlags = [...EXPECTED.deficiencies].sort();
  const flagsMatch =
    actualFlags.length === expectedFlags.length &&
    actualFlags.every((f, i) => f === expectedFlags[i]);

  checks.push({
    field: "deficiency_flags",
    expected: expectedFlags.join(", "),
    actual: actualFlags.join(", ") || "(none)",
    pass: flagsMatch,
  });

  // 5. Quest assignments
  const { data: questRows } = await supabase
    .from("quests")
    .select("quest_title, status")
    .eq("athlete_id", athleteId);

  const questTitles = (questRows ?? []).map((q: { quest_title: string }) => q.quest_title).sort();
  const expectedQuests = [...EXPECTED.quests].sort();
  const questsMatch =
    expectedQuests.every((q) => questTitles.includes(q));

  checks.push({
    field: "quests_assigned",
    expected: expectedQuests.join(", "),
    actual: questTitles.join(", ") || "(none)",
    pass: questsMatch,
  });

  // 6. superagent_unlocked (must be true for full validation to work)
  checks.push({
    field: "superagent_unlocked",
    expected: "true",
    actual: String(profile.superagentUnlocked),
    pass: profile.superagentUnlocked === true,
  });

  const allPass = checks.every((c) => c.pass);
  const failedFields = checks.filter((c) => !c.pass).map((c) => c.field);

  return {
    pass: allPass,
    athleteId,
    checks,
    summary: allPass
      ? `PASS — All Boone vector checks passed (id: ${athleteId.slice(0, 8)}...)`
      : `FAIL — Failed checks: ${failedFields.join(", ")}`,
  };
}
