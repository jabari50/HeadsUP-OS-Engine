/* POST /api/council — persist an LLM Council session to the audit trail.
   The multi-model consensus pipeline itself runs through the llm-council
   workflow; this route records its ratified output (System_Admin only). */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireRole } from "@/lib/auth";
import { handleRouteError, jsonError } from "@/lib/routeUtils";
import { serviceClient } from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  topic: z.string().min(1).max(300),
  prompt: z.string().min(1).max(20000),
  consensus: z.string().min(1).max(50000),
  confidence: z.enum(["HIGH", "MODERATE", "LOW"]),
  top_model: z.string().max(100).optional(),
  rankings: z.unknown().optional(),
});

export async function POST(request: NextRequest) {
  try {
    await requireRole("System_Admin");

    const parsed = bodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return jsonError(400, "Invalid council session payload");

    const { data, error } = await serviceClient()
      .from("council_sessions")
      .insert({
        topic: parsed.data.topic,
        prompt: parsed.data.prompt,
        consensus: parsed.data.consensus,
        confidence: parsed.data.confidence,
        top_model: parsed.data.top_model ?? null,
        rankings: parsed.data.rankings ?? null,
      })
      .select("id")
      .single();
    if (error) return jsonError(500, `Council write failed: ${error.message}`);

    return NextResponse.json({ session_id: data.id });
  } catch (error) {
    return handleRouteError(error);
  }
}
