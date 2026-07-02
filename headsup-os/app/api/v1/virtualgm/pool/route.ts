// ============================================================================
// app/api/v1/virtualgm/pool/route.ts
// HU-OS v4.0.0 | VirtualGM Prospect Pool Endpoint (Lane 3 — We Place)
// ----------------------------------------------------------------------------
// GET   — role-aware listing:
//           System_Admin       → full pool (locked + unlocked)
//           Licensed_Operator  → unlocked + sovereign_verified only (RLS-backed)
//           Coach              → unlocked + sovereign_verified only (RLS-backed)
// PATCH — System_Admin only: activation lock/unlock, placement_status,
//           positional_profile, target_levels, program_matches.
// Output sanitization: operator/coach responses never include CIR data,
// contact PII, deficiency flags, or quest details.
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ANON_KEY = process.env.SUPABASE_ANON_KEY!;

const VALID_STATUSES = new Set([
  "pool", "shortlisted", "presented", "committed", "placed", "archived",
]);
const ALLOWED_ROLES = new Set(["System_Admin", "Licensed_Operator", "Coach"]);

// Approved field surface for non-admin readers (Gate 8 — output sanitization)
const OPERATOR_ATHLETE_FIELDS =
  "id, full_name, graduation_year, school, position, sport, " +
  "neck_up_pro_score, neck_up_ner, ovr, market_position, confidence_band, " +
  "secondary_tags, sport_specific_metrics";

interface SessionInfo {
  userId: string;
  role: string;
  token: string;
}

async function getSession(req: NextRequest): Promise<SessionInfo | null> {
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const supabase = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false },
  });
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;
  const role = (data.user.app_metadata as Record<string, unknown>)?.role;
  if (typeof role !== "string" || !ALLOWED_ROLES.has(role)) return null;
  return { userId: data.user.id, role, token };
}

/** RLS-scoped client: queries run AS the caller, so pool policies apply. */
function rlsClient(token: string): SupabaseClient {
  return createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = req.nextUrl.searchParams.get("status");

  if (session.role === "System_Admin") {
    const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { persistSession: false },
    });
    let q = admin
      .from("virtual_gm_prospect_pool")
      .select(
        `id, athlete_id, activation_locked, placement_status,
         positional_profile, target_levels, program_matches, updated_at,
         athletes ( full_name, graduation_year, school, position,
                    sovereign_verified, market_position, ovr )`,
      )
      .order("updated_at", { ascending: false });
    if (status && VALID_STATUSES.has(status)) q = q.eq("placement_status", status);
    const { data, error } = await q;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ role: "System_Admin", pool: data });
  }

  // Licensed_Operator / Coach — RLS-scoped client double-enforces the unlock
  // + sovereign_verified gate at the database layer, not just here.
  const scoped = rlsClient(session.token);
  let q = scoped
    .from("virtual_gm_prospect_pool")
    .select(
      `id, athlete_id, placement_status, positional_profile, target_levels,
       athletes ( ${OPERATOR_ATHLETE_FIELDS} )`,
    )
    .order("updated_at", { ascending: false });
  if (status && VALID_STATUSES.has(status)) q = q.eq("placement_status", status);
  const { data, error } = await q;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ role: session.role, pool: data });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.role !== "System_Admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const poolId = body.pool_id;
  if (typeof poolId !== "string") {
    return NextResponse.json({ error: "pool_id required" }, { status: 400 });
  }

  // Whitelist of mutable fields — nothing else passes through
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof body.activation_locked === "boolean")
    patch.activation_locked = body.activation_locked;
  if (typeof body.placement_status === "string") {
    if (!VALID_STATUSES.has(body.placement_status)) {
      return NextResponse.json({ error: "Invalid placement_status" }, { status: 422 });
    }
    patch.placement_status = body.placement_status;
  }
  if (typeof body.positional_profile === "string")
    patch.positional_profile = body.positional_profile.slice(0, 120);
  if (Array.isArray(body.target_levels))
    patch.target_levels = body.target_levels
      .filter((t): t is string => typeof t === "string")
      .slice(0, 10);
  if (Array.isArray(body.program_matches))
    patch.program_matches = body.program_matches.slice(0, 50);

  // Unlock guard: an asset can only be unlocked if sovereign_verified = TRUE.
  // Both maturity gates must have cleared via the Neural Audit first.
  const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false },
  });
  if (patch.activation_locked === false) {
    const { data: poolRow, error: lookupError } = await admin
      .from("virtual_gm_prospect_pool")
      .select("athlete_id, athletes ( sovereign_verified )")
      .eq("id", poolId)
      .single();
    if (lookupError || !poolRow) {
      return NextResponse.json({ error: "Pool row not found" }, { status: 404 });
    }
    const verified = (poolRow.athletes as unknown as { sovereign_verified: boolean })
      ?.sovereign_verified;
    if (!verified) {
      return NextResponse.json(
        {
          error: "UNLOCK_BLOCKED",
          detail:
            "Athlete is not sovereign_verified. Run the Neural Audit first — " +
            "pre-maturity data is NULL data and never reaches operators.",
        },
        { status: 409 },
      );
    }
  }

  const { data, error } = await admin
    .from("virtual_gm_prospect_pool")
    .update(patch)
    .eq("id", poolId)
    .select()
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ status: "UPDATED", pool_row: data });
}
