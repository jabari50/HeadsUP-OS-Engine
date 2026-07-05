"use client";

/* Scout manual entry + Free Agent self-enroll. Everything posts to /api —
   the browser never computes, never scores, never talks to the engine. */

import { useState } from "react";

import { apiPost } from "@/lib/huosEngine";

const TECHNICAL = [
  "ball_handling", "shooting", "finishing", "passing", "defense", "rebounding", "athleticism",
] as const;
const NEURAL = [
  "composure", "coachability", "iq", "resilience", "leadership", "drive",
] as const;
const POSITIONS = ["PG", "SG", "SF", "PF", "C"];
const CLASSIFICATIONS = ["HS", "JUCO", "College", "Pro"];

interface IntakeResult {
  status: string;
  computed?: { ovr: number; tier: string } | null;
  badges?: Array<{ badge_id: string; name: string }>;
  errors?: unknown[];
}

export default function IntakeForm({ canScore }: { canScore: boolean }) {
  const [source, setSource] = useState(canScore ? "scout_manual" : "free_agents");
  const [identity, setIdentity] = useState({
    name: "", position: "PG", classification: "HS", school: "", class_year: "",
  });
  const [heightFt, setHeightFt] = useState(6);
  const [heightIn, setHeightIn] = useState(2);
  const [physical, setPhysical] = useState(75);
  const [technical, setTechnical] = useState<Record<string, number>>(
    Object.fromEntries(TECHNICAL.map((k) => [k, 5]))
  );
  const [neural, setNeural] = useState<Record<string, number>>(
    Object.fromEntries(NEURAL.map((k) => [k, 50]))
  );
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<IntakeResult | null>(null);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const base = {
        name: identity.name,
        position: identity.position,
        classification: identity.classification,
        school: identity.school || null,
        class_year: identity.class_year || null,
      };
      const payload =
        source === "free_agents"
          ? { ...base, height_ft: heightFt, height_in: heightIn }
          : {
              ...base,
              height_ft: heightFt,
              height_in: heightIn,
              height_inches: heightFt * 12 + heightIn,
              physical_score: physical,
              technical,
              neural,
            };
      const data = await apiPost<IntakeResult>("/intake", { source, payload });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Intake failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="max-w-3xl space-y-4">
      {canScore && (
        <div className="panel flex gap-4">
          {["scout_manual", "free_agents"].map((s) => (
            <label key={s} className="flex items-center gap-2 text-sm">
              <input type="radio" checked={source === s} onChange={() => setSource(s)} />
              {s === "scout_manual" ? "Scout manual (scored)" : "Free agent (provisional)"}
            </label>
          ))}
        </div>
      )}

      <div className="panel grid grid-cols-2 gap-3 md:grid-cols-3">
        <input className="input col-span-2" placeholder="Full name" required
          value={identity.name}
          onChange={(e) => setIdentity({ ...identity, name: e.target.value })} />
        <select className="input" value={identity.position}
          onChange={(e) => setIdentity({ ...identity, position: e.target.value })}>
          {POSITIONS.map((p) => <option key={p}>{p}</option>)}
        </select>
        <select className="input" value={identity.classification}
          onChange={(e) => setIdentity({ ...identity, classification: e.target.value })}>
          {CLASSIFICATIONS.map((c) => <option key={c}>{c}</option>)}
        </select>
        <input className="input" placeholder="School"
          value={identity.school}
          onChange={(e) => setIdentity({ ...identity, school: e.target.value })} />
        <input className="input" placeholder="Class year (e.g. 2027)" pattern="\d{4}"
          value={identity.class_year}
          onChange={(e) => setIdentity({ ...identity, class_year: e.target.value })} />
        <label className="text-sm text-slate-400">
          Height
          <div className="flex gap-2">
            <input className="input" type="number" min={4} max={8} value={heightFt}
              onChange={(e) => setHeightFt(Number(e.target.value))} /> ft
            <input className="input" type="number" min={0} max={11} value={heightIn}
              onChange={(e) => setHeightIn(Number(e.target.value))} /> in
          </div>
        </label>
      </div>

      {source === "scout_manual" && (
        <>
          <div className="panel">
            <h3 className="mb-2 text-sm font-semibold text-gold">Technical (1–10)</h3>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {TECHNICAL.map((skill) => (
                <label key={skill} className="text-xs text-slate-400">
                  {skill.replace("_", " ")}
                  <input className="input" type="number" min={1} max={10} step={0.5}
                    value={technical[skill]}
                    onChange={(e) => setTechnical({ ...technical, [skill]: Number(e.target.value) })} />
                </label>
              ))}
            </div>
          </div>
          <div className="panel">
            <h3 className="mb-2 text-sm font-semibold text-gold">Neural (1–99)</h3>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {NEURAL.map((attr) => (
                <label key={attr} className="text-xs text-slate-400">
                  {attr}
                  <input className="input" type="number" min={1} max={99}
                    value={neural[attr]}
                    onChange={(e) => setNeural({ ...neural, [attr]: Number(e.target.value) })} />
                </label>
              ))}
            </div>
            <label className="mt-3 block text-xs text-slate-400">
              Physical score (1–99)
              <input className="input md:w-40" type="number" min={1} max={99} value={physical}
                onChange={(e) => setPhysical(Number(e.target.value))} />
            </label>
          </div>
        </>
      )}

      <button className="btn" disabled={busy}>{busy ? "Processing…" : "Submit intake"}</button>
      {error && <p className="text-sm text-red-400">{error}</p>}
      {result && (
        <div className="panel text-sm">
          <div className="font-semibold text-gold">Session {result.status}</div>
          {result.computed && (
            <div className="mt-1">
              OVR <span className="stat">{result.computed.ovr}</span>{" "}
              <span className="ml-2">{result.computed.tier}</span>
            </div>
          )}
          {result.badges && result.badges.length > 0 && (
            <div className="mt-1 text-slate-400">
              Badges: {result.badges.map((b) => b.name).join(", ")}
            </div>
          )}
          {!result.computed && (
            <p className="mt-1 text-slate-400">
              Provisional profile created — unscored until a verified source scores it.
            </p>
          )}
        </div>
      )}
    </form>
  );
}
