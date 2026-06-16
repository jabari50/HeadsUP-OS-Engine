"use server";

import { createClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import {
  calculateOvr,
  TECHNICAL_FIELDS,
  NEURAL_FIELDS,
  POSITIONS,
} from "@/lib/vgm/ovr";

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

  const { ovr, tier } = calculateOvr(technical, neural, physical);

  const assessment = {
    email,
    height: height || null,
    self_reported: true,
    submitted_at: new Date().toISOString(),
    technical: Object.fromEntries(
      TECHNICAL_FIELDS.map(([k], i) => [k, technical[i]])
    ),
    neural: Object.fromEntries(NEURAL_FIELDS.map(([k], i) => [k, neural[i]])),
    physical,
  };

  const sb = anonClient();
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
