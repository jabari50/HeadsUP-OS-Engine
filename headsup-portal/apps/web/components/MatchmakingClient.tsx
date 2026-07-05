"use client";

import { useState } from "react";

import { apiPost } from "@/lib/huosEngine";

interface Option {
  id: string;
  label: string;
}

interface MatchResult {
  fit_score: number;
  recommendation: "Pursue" | "Monitor" | "Pass";
  subscores: Record<string, number>;
}

const REC_COLOR: Record<string, string> = {
  Pursue: "text-green-400",
  Monitor: "text-gold",
  Pass: "text-red-400",
};

export default function MatchmakingClient({
  athletes,
  programs,
}: {
  athletes: Option[];
  programs: Option[];
}) {
  const [athleteId, setAthleteId] = useState(athletes[0]?.id ?? "");
  const [programId, setProgramId] = useState(programs[0]?.id ?? "");
  const [result, setResult] = useState<MatchResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function run() {
    setBusy(true);
    setError("");
    try {
      setResult(
        await apiPost<MatchResult>("/matchmaking", {
          athlete_id: athleteId,
          program_id: programId,
        })
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Matchmaking failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-xl space-y-4">
      <div className="panel space-y-3">
        <label className="block text-xs text-slate-400">
          Athlete
          <select className="input" value={athleteId} onChange={(e) => setAthleteId(e.target.value)}>
            {athletes.map((option) => (
              <option key={option.id} value={option.id}>{option.label}</option>
            ))}
          </select>
        </label>
        <label className="block text-xs text-slate-400">
          Program
          <select className="input" value={programId} onChange={(e) => setProgramId(e.target.value)}>
            {programs.map((option) => (
              <option key={option.id} value={option.id}>{option.label}</option>
            ))}
          </select>
        </label>
        <button className="btn" onClick={run} disabled={busy || !athleteId || !programId}>
          {busy ? "Computing…" : "Compute Fit Score"}
        </button>
        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>

      {result && (
        <div className="panel">
          <div className="flex items-baseline gap-4">
            <span className="stat">{result.fit_score}</span>
            <span className={`text-lg font-bold ${REC_COLOR[result.recommendation]}`}>
              {result.recommendation}
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-400">
            <div>Style fit: {result.subscores.style_fit}</div>
            <div>Need fit: {result.subscores.need_fit}</div>
            <div>Level fit: {result.subscores.level_fit}</div>
            <div>Cultural fit: {result.subscores.cultural_fit}</div>
          </div>
        </div>
      )}
    </div>
  );
}
