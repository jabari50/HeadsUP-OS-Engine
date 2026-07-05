"use client";

import { useEffect, useState } from "react";

import { apiGet } from "@/lib/huosEngine";

interface RosterData {
  program: { name: string; head_coach: string | null; system: string | null; level: string | null };
  roster: Array<{
    athlete_id: string;
    athletes: { id: string; name: string; position: string | null; ovr: number | null; tier: string | null } | null;
  }>;
  gaps: Array<{ id: string; position: string | null; attribute_need: string | null; priority: string | null }>;
}

export default function RosterClient({ programId }: { programId: string }) {
  const [data, setData] = useState<RosterData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiGet<RosterData>(`/roster/${programId}`)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Load failed"));
  }, [programId]);

  if (error) return <p className="text-sm text-red-400">{error}</p>;
  if (!data) return <p className="text-sm text-slate-400">Loading roster…</p>;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="panel">
        <h2 className="mb-1 text-lg font-semibold">{data.program.name}</h2>
        <p className="mb-4 text-xs text-slate-400">
          {data.program.system ?? "—"} · {data.program.level ?? "—"} · Coach{" "}
          {data.program.head_coach ?? "—"}
        </p>
        <table className="w-full">
          <thead>
            <tr><th className="th">Athlete</th><th className="th">Pos</th><th className="th">OVR</th><th className="th">Tier</th></tr>
          </thead>
          <tbody>
            {data.roster.map((row) => (
              <tr key={row.athlete_id}>
                <td className="td">
                  <a className="text-courtside hover:underline" href={`/athletes/${row.athletes?.id}`}>
                    {row.athletes?.name ?? "—"}
                  </a>
                </td>
                <td className="td">{row.athletes?.position ?? "—"}</td>
                <td className="td">{row.athletes?.ovr ?? "—"}</td>
                <td className="td">{row.athletes?.tier ?? "Unscored"}</td>
              </tr>
            ))}
            {data.roster.length === 0 && (
              <tr><td className="td text-slate-500" colSpan={4}>No rostered athletes.</td></tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="panel">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gold">Roster Gaps</h2>
        <table className="w-full">
          <thead>
            <tr><th className="th">Position</th><th className="th">Need</th><th className="th">Priority</th></tr>
          </thead>
          <tbody>
            {data.gaps.map((gap) => (
              <tr key={gap.id}>
                <td className="td">{gap.position ?? "—"}</td>
                <td className="td">{gap.attribute_need ?? "—"}</td>
                <td className={`td font-semibold ${gap.priority === "HIGH" ? "text-red-400" : gap.priority === "MED" ? "text-gold" : ""}`}>
                  {gap.priority ?? "—"}
                </td>
              </tr>
            ))}
            {data.gaps.length === 0 && (
              <tr><td className="td text-slate-500" colSpan={3}>No open gaps.</td></tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
