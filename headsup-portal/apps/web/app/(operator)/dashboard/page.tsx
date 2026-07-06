/* Role-scoped dashboard — ecosystem v4 mega-stat treatment.
   Counts only; no athlete fields beyond what the caller's role could read. */

import { redirect } from "next/navigation";

import { getAuth, getOperator } from "@/lib/auth";
import { serviceClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

async function count(table: string, filter?: (q: any) => any): Promise<number> {
  let query = serviceClient().from(table).select("id", { count: "exact", head: true });
  if (filter) query = filter(query);
  const { count: value } = await query;
  return value ?? 0;
}

function Mega({ value, label, color }: { value: number | string; label: string; color: string }) {
  return (
    <div className="panel text-center">
      <div className={`stat ${color}`}>{value}</div>
      <div className="mt-1 text-[10px] uppercase tracking-[1px] text-slate-500">{label}</div>
    </div>
  );
}

export default async function DashboardPage() {
  const auth = await getAuth();
  if (!auth) redirect("/auth/login");
  // Athletes never reach this page — middleware routes them to /me, where
  // the Athlete Surface renders their PRO-File without operator fields.

  const operator = await getOperator(auth.user.id);
  const isAdmin = auth.role === "System_Admin";

  const [athletes, verified, processed, rejected, matches, hs, college] = await Promise.all([
    count("athletes"),
    count("athletes", (q) => q.eq("sovereign_verified", true)),
    count("intake_sessions", (q) => q.eq("status", "processed")),
    count("intake_sessions", (q) => q.eq("status", "rejected")),
    count("matches"),
    count("athletes", (q) => q.eq("classification", "HS")),
    count("athletes", (q) => q.eq("classification", "College")),
  ]);

  return (
    <div>
      <div className="sec-label">Master Pipeline</div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Mega value={athletes} label="Pipeline Athletes" color="text-hpink" />
        <Mega value={hs} label="High School" color="text-hgreen" />
        <Mega value={college} label="College / JUCO" color="text-hblue" />
        <Mega value={verified} label="Sovereign Verified" color="text-hpurple" />
      </div>

      <div className="sec-label">Decision Layer</div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Mega value={matches} label="Fit Matches" color="text-hamber" />
        {operator && (
          <Mega
            value={operator.activation_credits}
            label={`Credits · ${operator.license_tier ?? "unlicensed"}`}
            color="text-horange"
          />
        )}
        {isAdmin && <Mega value={processed} label="Sessions Processed" color="text-hgreen" />}
        {isAdmin && <Mega value={rejected} label="Sessions Rejected" color="text-horange" />}
      </div>
    </div>
  );
}
