import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Intake endpoint for Volunteer / Mentor / Sponsor / Contact forms.
 * Writes to Supabase `intake_submissions` when configured (see
 * supabase/migrations/0001_init.sql). Segment tag routes to CRM later.
 */
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid request." }, { status: 400 });
  }

  const segment = typeof body.segment === "string" ? body.segment.slice(0, 40) : "";
  const email = typeof body.email === "string" ? body.email.slice(0, 200) : "";
  if (!segment || !email) {
    return NextResponse.json(
      { message: "Missing required fields." },
      { status: 400 }
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    // Not yet wired to Supabase/CRM — dev-only log so test submissions aren't lost.
    // Never log submitted PII in production.
    if (process.env.NODE_ENV !== "production") {
      console.log("[intake:unwired]", JSON.stringify(body));
    }
    return NextResponse.json({
      message:
        "Received (dev mode — CRM not yet connected). We'll be in touch.",
    });
  }

  const supabase = createClient(url, serviceKey);
  const payload = Object.fromEntries(
    Object.entries(body).filter(([k]) => k !== "segment" && k !== "email")
  );
  const { error } = await supabase.from("intake_submissions").insert({
    segment,
    email,
    payload,
  });

  if (error) {
    console.error("[intake:error]", error.message);
    return NextResponse.json(
      { message: "Could not save your submission — try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({ message: "Received. We'll be in touch." });
}
