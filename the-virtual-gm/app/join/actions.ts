"use server";

import { createHash } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { TECHNICAL_FIELDS, NEURAL_FIELDS, POSITIONS } from "@/lib/vgm/ovr";
import { scoreIntake, EngineUnavailable } from "@/lib/vgm/engine";
import { verifyTurnstile } from "@/lib/turnstile";

export type IntakeState = { ok: boolean; message: string } | null;

const err = (message: string): IntakeState => ({ ok: false, message });

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function rating(formData: FormData, key: string): number {
  const v = Number(formData.get(key));
  if (!Number.isFinite(v)) return 5;
  return Math.min(10, Math.max(1, v));
}

// Anon client (no session) — role = anon, governed by the athletes_anon_self_intake policy.
function anonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function submitIntake(
  _prev: IntakeState,
  formData: FormData
): Promise<IntakeState> {
  // Honeypot — bots fill every field; humans never see this one.
  if (String(formData.get("company") ?? "").trim() !== "") {
    return err("Could not submit your profile. Please try again.");
  }

  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const position = String(formData.get("position") ?? "");
  const school = String(formData.get("school") ?? "").trim();
  const gradYear = parseInt(String(formData.get("grad_year") ?? ""), 10);
  const height = String(formData.get("height") ?? "").trim();
  const gpaRaw = String(formData.get("gpa") ?? "").trim();

  if (fullName.length < 2) return err("Enter your full name.");
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return err("Enter a valid email.");
  if (!POSITIONS.includes(position as (typeof POSITIONS)[number]))
    return err("Select a position.");
  if (school.length < 2) return err("Enter your school.");
  if (!gradYear || gradYear < 2000 || gradYear > 2035)
    return err("Enter a valid graduation year.");
  const gpa = gpaRaw ? Number(gpaRaw) : null;
  if (gpa != null && (Number.isNaN(gpa) || gpa < 0 || gpa > 5))
    return err("GPA must be between 0 and 5.");

  const technical = TECHNICAL_FIELDS.map(([k]) => rating(formData, `t_${k}`));
  const neural = NEURAL_FIELDS.map(([k]) => rating(formData, `n_${k}`));
  const physical = rating(formData, "physical");

  // Source of truth: score via the HeadsUp OS Python engine (ovr_engine.py).
  // Fail closed — never fabricate a score if the engine is unavailable (ZHR).
  let ovr: number;
  let tier: string;
  let breakdown: Record<string, number> | null = null;
  try {
    const scored = await scoreIntake({
      name: fullName,
      position,
      school,
      classYear: String(gradYear),
      classification: "HS",
      technical10: technical,
      neural10: neural,
      physical10: physical,
    });
    ovr = scored.ovr;
    tier = scored.tier;
    breakdown = scored.ovr_breakdown;
  } catch (e) {
    if (e instanceof EngineUnavailable) {
      return err(
        "Scoring is temporarily unavailable. Please try again in a few minutes."
      );
    }
    return err("Could not submit your profile. Please try again.");
  }

  const assessment = {
    email,
    height: height || null,
    self_reported: true,
    submitted_at: new Date().toISOString(),
    scored_by: "hu-os-engine/ovr_engine.py",
    ovr_breakdown: breakdown,
    technical: Object.fromEntries(
      TECHNICAL_FIELDS.map(([k], i) => [k, technical[i]])
    ),
    neural: Object.fromEntries(NEURAL_FIELDS.map(([k], i) => [k, neural[i]])),
    physical,
  };

  const sb = anonClient();

  // Rate limit: max 3 submissions per IP per hour (server-enforced via SECURITY
  // DEFINER RPC; IP is hashed, never stored raw).
  const ipRaw =
    headers().get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers().get("x-real-ip") ||
    "unknown";
  // Captcha (Cloudflare Turnstile) — no-op until TURNSTILE_SECRET_KEY is set.
  const human = await verifyTurnstile(
    String(formData.get("cf-turnstile-response") ?? "") || null,
    ipRaw
  );
  if (!human) {
    return err("Verification failed — please complete the challenge and retry.");
  }

  const ipHash = createHash("sha256")
    .update(`${ipRaw}:hu-os-intake`)
    .digest("hex")
    .slice(0, 40);
  const { data: allowed, error: rlError } = await sb.rpc(
    "record_and_check_intake",
    { p_ip_hash: ipHash, p_max: 3, p_window_minutes: 60 }
  );
  if (!rlError && allowed === false) {
    return err("Too many submissions from your network. Please try again later.");
  }

  const base = slugify(`${fullName}-${gradYear}`) || "athlete";

  // Insert, retrying the slug on unique-constraint collisions (23505).
  let slug = base;
  for (let attempt = 0; attempt < 6; attempt++) {
    const { error } = await sb.from("athletes").insert({
      full_name: fullName,
      position,
      school,
      graduation_year: gradYear,
      gpa,
      ovr,
      market_position: tier,
      account_type: "independent",
      sovereign_verified: false,
      is_demo: false,
      is_historical: false,
      entry_source: "self_submitted",
      entry_status: "audit_pending",
      profile_public: true,
      profile_slug: slug,
      assessment_answers: assessment,
    });

    if (!error) redirect(`/profile/${slug}`);
    if (error.code !== "23505") {
      return err("Could not submit your profile. Please try again.");
    }
    slug = `${base}-${attempt + 2}`;
  }
  return err("Could not generate a unique profile link. Try again.");
}
