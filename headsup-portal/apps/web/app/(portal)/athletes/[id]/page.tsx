/* Athlete PRO-File — every field on this page passed through shapeAthlete
   (role + Activation Lock). Quests/badges render for self and admin only. */

import { notFound, redirect } from "next/navigation";

import UnlockButton from "@/components/UnlockButton";
import { resolveActivation, shapeAthlete } from "@/lib/activation";
import { getAuth, getOperator } from "@/lib/auth";
import { serviceClient } from "@/lib/supabaseServer";
import type { AthleteRow } from "@/types/database.types";

export const dynamic = "force-dynamic";

const UNLOCK_TIERS = ["GM", "White Label"];

function Row({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="flex justify-between border-t border-edge py-1.5 text-sm">
      <span className="text-slate-400">{label}</span>
      <span>{value === null || value === undefined ? "—" : String(value)}</span>
    </div>
  );
}

export default async function AthletePage({ params }: { params: { id: string } }) {
  const auth = await getAuth();
  if (!auth) redirect("/auth/login");
  if (auth.role === "NDA_Analyst") redirect("/dashboard");

  const db = serviceClient();
  const { data } = await db.from("athletes").select("*").eq("id", params.id).maybeSingle();
  if (!data) notFound();
  const athlete = data as AthleteRow;

  const isSelf = athlete.user_id === auth.user.id;
  if (auth.role === "College_Scout" && !athlete.sovereign_verified && !isSelf) notFound();
  if (auth.role === "Athlete" && !isSelf) redirect("/dashboard");

  const operator = await getOperator(auth.user.id);
  const activation = await resolveActivation(athlete.id, operator?.id ?? null);
  const shaped = shapeAthlete(athlete, auth.role, activation, isSelf);

  const showDevelopment = isSelf || auth.role === "System_Admin";
  const canUnlock =
    !isSelf &&
    auth.role !== "College_Scout" &&
    operator?.license_tier != null &&
    UNLOCK_TIERS.includes(operator.license_tier) &&
    activation !== "Full Unlocked" &&
    activation !== "Exclusive Lock";

  const [badges, quests] = showDevelopment
    ? await Promise.all([
        db.from("badges").select("badge_id, name, category").eq("athlete_id", athlete.id),
        db.from("quests").select("title, progress_pct, status").eq("athlete_id", athlete.id),
      ])
    : [null, null];

  const technicalKeys = Object.keys(shaped).filter((key) => key.startsWith("tech_"));
  const neuralKeys = Object.keys(shaped).filter((key) => key.startsWith("neural_"));

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex items-baseline gap-4">
        <h1 className="text-2xl font-bold">{String(shaped.name ?? "")}</h1>
        <span className="text-sm text-slate-400">
          {String(shaped.position ?? "—")} · {String(shaped.school ?? "—")} · {String(shaped.class_year ?? "—")}
        </span>
        <span className="ml-auto rounded border border-edge px-2 py-1 text-xs text-courtside">
          {activation}
        </span>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="panel">
          <div className="mb-2 flex items-baseline gap-3">
            <span className="stat">{shaped.ovr == null ? "—" : String(shaped.ovr)}</span>
            <span className="text-sm">{shaped.tier == null ? "Unscored" : String(shaped.tier)}</span>
          </div>
          <Row label="Height (in)" value={shaped.height_in} />
          <Row label="Weight (lb)" value={shaped.weight_lb} />
          <Row label="Wingspan (in)" value={shaped.wingspan_in} />
          {"physical_score" in shaped && <Row label="Physical" value={shaped.physical_score} />}
        </div>

        {technicalKeys.length > 0 && (
          <div className="panel">
            <h3 className="mb-2 text-sm font-semibold text-gold">Technical (1–10)</h3>
            {technicalKeys.map((key) => (
              <Row key={key} label={key.replace("tech_", "").replace("_", " ")} value={shaped[key]} />
            ))}
          </div>
        )}

        {neuralKeys.length > 0 && (
          <div className="panel">
            <h3 className="mb-2 text-sm font-semibold text-gold">Neural (1–99)</h3>
            {neuralKeys.map((key) => (
              <Row key={key} label={key.replace("neural_", "")} value={shaped[key]} />
            ))}
          </div>
        )}

        {canUnlock && <UnlockButton athleteId={athlete.id} />}

        {showDevelopment && badges && (
          <div className="panel">
            <h3 className="mb-2 text-sm font-semibold text-gold">Badges</h3>
            {(badges.data ?? []).length === 0 && <p className="text-sm text-slate-500">None yet.</p>}
            {(badges.data ?? []).map((badge) => (
              <div key={badge.badge_id} className="border-t border-edge py-1.5 text-sm">
                {badge.name} <span className="text-xs text-slate-500">({badge.category})</span>
              </div>
            ))}
          </div>
        )}

        {showDevelopment && quests && (
          <div className="panel">
            <h3 className="mb-2 text-sm font-semibold text-gold">Quest Arc</h3>
            {(quests.data ?? []).map((quest, index) => (
              <div key={index} className="border-t border-edge py-1.5 text-sm">
                <div className="flex justify-between">
                  <span>{quest.title}</span>
                  <span className="text-xs text-slate-400">{quest.status}</span>
                </div>
                <div className="mt-1 h-1.5 rounded bg-edge">
                  <div
                    className="h-1.5 rounded bg-gold"
                    style={{ width: `${Math.min(100, quest.progress_pct ?? 0)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
