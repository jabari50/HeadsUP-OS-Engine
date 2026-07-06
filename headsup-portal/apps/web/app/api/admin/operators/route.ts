/* /api/admin/operators — manual Operator License provisioning (REV-A G-C:
   pilot operators are provisioned by System_Admin, no Stripe self-serve).
   POST creates the auth user with app_metadata.role (server-controlled) and
   the operators license row; GET lists licenses with their login emails.
   Both are System_Admin-only; the service role is used only AFTER that check. */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireRole } from "@/lib/auth";
import { handleRouteError, jsonError } from "@/lib/routeUtils";
import { serviceClient } from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  email: z.string().email().max(254),
  org_name: z.string().min(1).max(120),
  role: z.enum(["College_Scout", "Coach", "NDA_Analyst"]),
  license_tier: z.enum(["Scout", "Coordinator", "GM", "White Label"]),
  seat_count: z.number().int().min(1).max(100).default(1),
  activation_credits: z.number().int().min(0).max(1000).default(0),
});

export async function POST(request: NextRequest) {
  try {
    await requireRole("System_Admin");

    const parsed = bodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return jsonError(400, "Invalid provisioning request");
    const { email, org_name, role, license_tier, seat_count, activation_credits } = parsed.data;

    const admin = serviceClient();

    /* Confirmed, passwordless — the operator signs in via magic link, same
       flow as the founder bootstrap. Role lives in app_metadata only. */
    const { data: created, error: userError } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      app_metadata: { role },
    });
    if (userError) {
      const already = /already|exists|registered/i.test(userError.message);
      return jsonError(already ? 409 : 502, already ? "A user with that email already exists" : "Auth user creation failed");
    }

    const { data: operator, error: opError } = await admin
      .from("operators")
      .insert({
        user_id: created.user.id,
        org_name,
        license_tier,
        seat_count,
        activation_credits,
      })
      .select()
      .single();
    if (opError) {
      console.error("[api/admin/operators] license insert failed", opError);
      return jsonError(500, "Auth user created but license insert failed — retry or fix manually");
    }

    return NextResponse.json({ operator, email }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function GET() {
  try {
    await requireRole("System_Admin");

    const admin = serviceClient();
    const { data: operators, error } = await admin
      .from("operators")
      .select("id, user_id, org_name, license_tier, seat_count, activation_credits")
      .order("org_name");
    if (error) return jsonError(500, "Could not load operator licenses");

    /* Pilot scale — resolve login emails in one page of users. */
    const { data: userData } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const emailById = new Map((userData?.users ?? []).map((u) => [u.id, u.email ?? ""]));

    return NextResponse.json({
      operators: (operators ?? []).map((op) => ({
        ...op,
        email: op.user_id ? (emailById.get(op.user_id) ?? "") : "",
      })),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
