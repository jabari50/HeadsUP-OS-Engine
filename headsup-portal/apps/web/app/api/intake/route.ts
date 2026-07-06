/* POST /api/intake — the spine (§6).
   Browser → this route (auth + rate limit) → engine (HMAC, validate/score)
   → process_intake RPC (ONE transaction: upsert + scores + audit).
   The browser never touches the engine or the service role. */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAuth } from "@/lib/auth";
import { engineFetch } from "@/lib/engineClient";
import { handleRouteError, jsonError } from "@/lib/routeUtils";
import { serviceClient } from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RATE_LIMIT_WINDOW_MINUTES = 10;
const RATE_LIMIT_MAX_SESSIONS = 10;

/* Least privilege: each role may only feed its own sources (§6.1).
   "" = fresh /join signup (no app_metadata.role yet) — self-enrollment only. */
const SOURCES_BY_ROLE: Record<string, string[]> = {
  System_Admin: ["scout_manual", "combine_csv", "free_agents", "ner_anchor", "film_event"],
  College_Scout: ["scout_manual", "combine_csv"],
  Coach: ["ner_anchor", "film_event", "scout_manual"],
  Athlete: ["free_agents"],
  "": ["free_agents"],
};

const bodySchema = z.object({
  source: z.enum(["scout_manual", "combine_csv", "free_agents", "ner_anchor", "film_event"]),
  payload: z.record(z.unknown()),
  idempotency_key: z.string().max(128).optional(),
});

interface EngineIntakeResponse {
  status: "validated" | "rejected";
  kind?: "scored" | "batch" | "provisional" | "neural_update" | "observations";
  canonical?: Record<string, unknown>;
  computed?: { ovr: number; tier: string } | null;
  badges?: unknown[];
  quests?: unknown[];
  rows?: Array<{
    index: number;
    ok: boolean;
    canonical?: Record<string, unknown>;
    computed?: { ovr: number; tier: string } | null;
    badges?: unknown[];
    quests?: unknown[];
    errors?: unknown[];
  }>;
  errors?: unknown[];
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    const allowedSources = SOURCES_BY_ROLE[auth.role];
    if (!allowedSources) return jsonError(403, "Role cannot submit intake");

    const parsed = bodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return jsonError(400, "Invalid intake request body");
    const { source, payload, idempotency_key } = parsed.data;

    if (!allowedSources.includes(source)) {
      return jsonError(403, `Role ${auth.role} may not submit source '${source}'`);
    }

    const db = serviceClient();

    // Rate limit (U15) — admins exempt.
    if (auth.role !== "System_Admin") {
      const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60_000).toISOString();
      const { count } = await db
        .from("intake_sessions")
        .select("id", { count: "exact", head: true })
        .eq("submitted_by", auth.user.id)
        .gte("created_at", windowStart);
      if ((count ?? 0) >= RATE_LIMIT_MAX_SESSIONS) {
        return jsonError(429, "Intake rate limit reached — try again shortly");
      }
    }

    // Idempotent replay (U10): same key returns the original session untouched.
    if (idempotency_key) {
      const { data: existing } = await db
        .from("intake_sessions")
        .select("id, status")
        .eq("idempotency_key", idempotency_key)
        .maybeSingle();
      if (existing) {
        return NextResponse.json({ replayed: true, session: existing });
      }
    }

    const { data: session, error: sessionError } = await db
      .from("intake_sessions")
      .insert({
        source,
        submitted_by: auth.user.id,
        idempotency_key: idempotency_key ?? null,
      })
      .select("id")
      .single();
    if (sessionError || !session) return jsonError(500, "Could not open intake session");

    await db.from("intake_raw").insert({ session_id: session.id, payload });

    const engine = await engineFetch<EngineIntakeResponse>("/v4/intake/process", {
      source,
      payload,
    });

    if (engine.status === "rejected") {
      await db
        .from("intake_raw")
        .update({ validation_errors: engine.errors ?? [] })
        .eq("session_id", session.id);
      await db.from("intake_sessions").update({ status: "rejected" }).eq("id", session.id);
      return NextResponse.json(
        { session_id: session.id, status: "rejected", errors: engine.errors ?? [] },
        { status: 422 }
      );
    }

    await db.from("intake_sessions").update({ status: "validated" }).eq("id", session.id);

    /* Self-enrollment link (migration 0007): only a free-agents submission by
       the athlete themselves stamps user_id on a NEWLY created row. Set here
       server-side — any link_self arriving in engine output is discarded. */
    const selfEnrollment =
      source === "free_agents" && (auth.role === "Athlete" || auth.role === "");

    const processOne = async (
      canonical: Record<string, unknown>,
      computed: { ovr: number; tier: string } | null | undefined,
      badges: unknown[] | undefined,
      quests: unknown[] | undefined
    ) => {
      const { link_self: _discarded, ...cleanCanonical } = canonical;
      const { data, error } = await db.rpc("process_intake", {
        p_session: session.id,
        p_actor: auth.user.id,
        p_canonical: selfEnrollment ? { ...cleanCanonical, link_self: "true" } : cleanCanonical,
        p_computed: computed ?? {},
        p_badges: badges ?? [],
        p_quests: quests ?? [],
      });
      if (error) throw new Error(`process_intake failed: ${error.message}`);
      return data as string;
    };

    if (engine.kind === "batch") {
      const results: Array<Record<string, unknown>> = [];
      let processedCount = 0;
      for (const row of engine.rows ?? []) {
        if (!row.ok || !row.canonical) {
          results.push({ index: row.index, ok: false, errors: row.errors ?? [] });
          continue;
        }
        const athleteId = await processOne(row.canonical, row.computed, row.badges, row.quests);
        results.push({ index: row.index, ok: true, athlete_id: athleteId, computed: row.computed });
        processedCount += 1;
      }
      if (processedCount === 0) {
        await db.from("intake_sessions").update({ status: "rejected" }).eq("id", session.id);
      }
      return NextResponse.json({
        session_id: session.id,
        status: processedCount > 0 ? "processed" : "rejected",
        kind: "batch",
        rows: results,
      });
    }

    if (!engine.canonical) return jsonError(502, "Engine returned no canonical record");
    const athleteId = await processOne(
      engine.canonical,
      engine.computed,
      engine.badges,
      engine.quests
    );

    return NextResponse.json({
      session_id: session.id,
      status: "processed",
      kind: engine.kind,
      athlete_id: athleteId,
      computed: engine.computed ?? null,
      badges: engine.badges ?? [],
      quests: engine.quests ?? [],
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
