/* Athlete Surface home — the athlete's OWN PRO-File: exposure profile,
   Neural Audit, OVR, quests, badges. Reads go through the session client so
   RLS (athlete_read_own + own-quests/badges policies) is the enforcement,
   not this page. Operator valuations — draft rank, fit scores, unlock cost,
   activation/exclusivity state — must never render here (REV-A §4.2). */

import { redirect } from "next/navigation";

import { getAuth, sessionClient } from "@/lib/auth";
import type { AthleteRow } from "@/types/database.types";

export const dynamic = "force-dynamic";

interface QuestRow {
  id: string;
  title: string | null;
  target_attribute: string | null;
  progress_pct: number | null;
  status: string;
  deadline: string | null;
}

interface BadgeRow {
  id: string;
  name: string | null;
  category: string | null;
}

const TIER_PATHWAY: Record<string, string> = {
  Elite: "High-major trajectory — national exposure priority.",
  Impact: "Mid/high-major rotation piece — targeted program outreach.",
  Contributor: "Program-fit driven — depth and system value.",
  Developing: "Development arc — quest completion moves the needle.",
  Prospect: "Foundation phase — build the verified data trail.",
};

function fmtHeight(totalIn: number | null): string {
  if (totalIn == null) return "—";
  return `${Math.floor(totalIn / 12)}'${Math.round(totalIn % 12)}"`;
}

function Mega({ value, label, color }: { value: number | string; label: string; color: string }) {
  return (
    <div className="panel text-center">
      <div className={`stat ${color}`}>{value}</div>
      <div className="mt-1 text-[10px] uppercase tracking-[1px] text-slate-500">{label}</div>
    </div>
  );
}

function ScoreBar({ label, value }: { label: string; value: number | null }) {
  const pct = value == null ? 0 : Math.max(0, Math.min(100, value));
  return (
    <div className="flex items-center gap-3">
      <div className="w-28 shrink-0 text-[10px] uppercase tracking-[1px] text-slate-500">
        {label}
      </div>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-paper">
        <div className="h-full rounded-full bg-hgreen" style={{ width: `${pct}%` }} />
      </div>
      <div className="w-10 shrink-0 text-right font-display text-xs font-bold text-ink">
        {value ?? "—"}
      </div>
    </div>
  );
}

export default async function AthleteHomePage() {
  const auth = await getAuth();
  if (!auth) redirect("/auth/login");

  const supabase = sessionClient();
  const { data: me } = (await supabase
    .from("athletes")
    .select(
      "id, name, position, school, class_year, classification, height_in, weight_lb, wingspan_in, physical_score, tech_ball_handling, tech_shooting, tech_finishing, tech_passing, tech_defense, tech_rebounding, tech_athleticism, neural_composure, neural_coachability, neural_iq, neural_resilience, neural_leadership, neural_drive, ovr, tier, sovereign_verified"
    )
    .eq("user_id", auth.user.id)
    .maybeSingle()) as { data: Omit<AthleteRow, "user_id" | "external_id" | "scout_id" | "activation_state" | "created_at" | "updated_at"> | null };

  if (!me) {
    return (
      <section className="panel max-w-md">
        <div className="sec-label">My PRO-File</div>
        <p className="text-sm text-slate-400">
          No athlete profile is linked to this account yet. Complete a Free
          Agent enrollment and your PRO-File will appear here once processed.
        </p>
      </section>
    );
  }

  const [{ data: quests }, { data: badges }] = await Promise.all([
    supabase
      .from("quests")
      .select("id, title, target_attribute, progress_pct, status, deadline")
      .eq("athlete_id", me.id)
      .order("status", { ascending: true }) as unknown as Promise<{ data: QuestRow[] | null }>,
    supabase
      .from("badges")
      .select("id, name, category")
      .eq("athlete_id", me.id) as unknown as Promise<{ data: BadgeRow[] | null }>,
  ]);

  const technical: [string, number | null][] = [
    ["Ball Handling", me.tech_ball_handling],
    ["Shooting", me.tech_shooting],
    ["Finishing", me.tech_finishing],
    ["Passing", me.tech_passing],
    ["Defense", me.tech_defense],
    ["Rebounding", me.tech_rebounding],
    ["Athleticism", me.tech_athleticism],
  ];
  const neural: [string, number | null][] = [
    ["Composure", me.neural_composure],
    ["Coachability", me.neural_coachability],
    ["Basketball IQ", me.neural_iq],
    ["Resilience", me.neural_resilience],
    ["Leadership", me.neural_leadership],
    ["Drive", me.neural_drive],
  ];

  return (
    <div>
      <div className="sec-label">My PRO-File</div>
      <div className="panel flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="font-display text-2xl font-extrabold uppercase tracking-wide text-ink">
            {me.name}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            {[me.position, me.school, me.class_year, me.classification]
              .filter(Boolean)
              .join(" · ") || "Profile details pending"}
          </div>
        </div>
        {me.sovereign_verified && (
          <span className="rounded-full border border-hgreen px-3 py-1 font-display text-[10px] font-bold uppercase tracking-[1.5px] text-hgreen">
            Sovereign Verified
          </span>
        )}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Mega value={me.ovr ?? "—"} label="OVR" color="text-hgreen" />
        <Mega value={me.tier ?? "Unscored"} label="Tier" color="text-hblue" />
        <Mega value={me.physical_score ?? "—"} label="Physical" color="text-hamber" />
        <Mega value={fmtHeight(me.height_in)} label={`Height · ${me.weight_lb ?? "—"} lb`} color="text-hpurple" />
      </div>

      {me.tier && (
        <div className="mt-3 panel text-sm text-slate-400">
          <span className="font-display text-[10px] font-bold uppercase tracking-[1.5px] text-slate-500">
            Career Pathway ·{" "}
          </span>
          {TIER_PATHWAY[me.tier]}
        </div>
      )}

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <section className="panel">
          <div className="sec-label">Technical</div>
          <div className="space-y-2">
            {technical.map(([label, value]) => (
              <ScoreBar key={label} label={label} value={value} />
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="sec-label">Neural Audit</div>
          <div className="space-y-2">
            {neural.map(([label, value]) => (
              <ScoreBar key={label} label={label} value={value} />
            ))}
          </div>
        </section>
      </div>

      <section className="mt-4 panel">
        <div className="sec-label">Active Quests</div>
        {quests?.length ? (
          <ul className="space-y-3">
            {quests.map((q) => (
              <li key={q.id} className="flex flex-wrap items-center gap-3">
                <div className="min-w-40 flex-1">
                  <div className="font-display text-xs font-bold uppercase tracking-[1px] text-ink">
                    {q.title ?? q.target_attribute ?? "Quest"}
                  </div>
                  <div className="text-[10px] uppercase tracking-[1px] text-slate-500">
                    {q.status}
                    {q.deadline ? ` · due ${new Date(q.deadline).toLocaleDateString()}` : ""}
                  </div>
                </div>
                <div className="h-2 w-40 overflow-hidden rounded-full bg-paper">
                  <div
                    className="h-full rounded-full bg-hblue"
                    style={{ width: `${q.progress_pct ?? 0}%` }}
                  />
                </div>
                <div className="w-10 text-right font-display text-xs font-bold text-ink">
                  {Math.round(q.progress_pct ?? 0)}%
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-400">
            No quests assigned yet — quests unlock as your Neural Audit is scored.
          </p>
        )}
      </section>

      <section className="mt-4 panel">
        <div className="sec-label">Badges</div>
        {badges?.length ? (
          <div className="flex flex-wrap gap-2">
            {badges.map((b) => (
              <span
                key={b.id}
                className="rounded-full border border-edge px-3 py-1 font-display text-[10px] font-bold uppercase tracking-[1.5px] text-slate-400"
              >
                {b.name ?? b.category ?? "Badge"}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">No badges earned yet.</p>
        )}
      </section>
    </div>
  );
}
