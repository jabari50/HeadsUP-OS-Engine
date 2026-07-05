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

  if (auth.role === "Athlete") {
    const { data: me } = await serviceClient()
      .from("athletes")
      .select("id, name, ovr, tier, activation_state")
      .eq("user_id", auth.user.id)
      .maybeSingle();
    return (
      <div>
        <div className="sec-label">My PRO-File</div>
        <div className="panel max-w-md">
          {me ? (
            <>
              <div className="font-display text-lg font-bold uppercase">{me.name}</div>
              <div className="mt-2 text-sm text-slate-400">
                OVR <span className="stat text-hgreen">{me.ovr ?? "—"}</span>{" "}
                <span className="ml-2">{me.tier ?? "Unscored"}</span>
              </div>
              <div className="mt-2 text-xs text-slate-400">Status: {me.activation_state}</div>
              <a className="btn mt-4 inline-block" href={`/athletes/${me.id}`}>
                View full profile
              </a>
            </>
          ) : (
            <p className="text-sm text-slate-400">
              No profile yet — submit a Free Agent enrollment from the Intake tab.
            </p>
          )}
        </div>
      </div>
    );
  }

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
