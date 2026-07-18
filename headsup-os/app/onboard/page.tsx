"use client";

import Link from "next/link";
import { useState } from "react";
import type { AthleteProfile } from "@/lib/engine";

const POSITIONS = ["PG", "SG", "SF", "PF", "C"];
const CLASSIFICATIONS = ["HS", "JUCO", "College", "Pro"];

const TECHNICAL_SKILLS: { key: string; label: string }[] = [
  { key: "ball_handling", label: "Ball Handling" },
  { key: "shooting", label: "Shooting" },
  { key: "finishing", label: "Finishing" },
  { key: "passing", label: "Passing" },
  { key: "defense", label: "Defense" },
  { key: "rebounding", label: "Rebounding" },
  { key: "athleticism", label: "Athleticism" },
];

const NEURAL_ATTRIBUTES: { key: string; label: string; hint: string }[] = [
  { key: "composure", label: "Composure", hint: "Behavior under pressure" },
  { key: "coachability", label: "Coachability", hint: "Response to coaching" },
  { key: "iq", label: "IQ", hint: "Pattern recognition" },
  { key: "resilience", label: "Resilience", hint: "Recovery from adversity" },
  { key: "leadership", label: "Leadership", hint: "Influence on teammates" },
  { key: "drive", label: "Drive", hint: "Effort consistency" },
];

const TIER_STYLES: Record<string, string> = {
  Elite: "bg-amber-400/15 text-amber-300 border-amber-400/40",
  Impact: "bg-emerald-400/15 text-emerald-300 border-emerald-400/40",
  Contributor: "bg-sky-400/15 text-sky-300 border-sky-400/40",
  Developing: "bg-violet-400/15 text-violet-300 border-violet-400/40",
  Prospect: "bg-zinc-400/15 text-zinc-300 border-zinc-400/40",
};

function ovrColor(ovr: number): string {
  if (ovr >= 85) return "text-amber-300";
  if (ovr >= 70) return "text-emerald-300";
  if (ovr >= 55) return "text-sky-300";
  return "text-zinc-300";
}

export default function OnboardPage() {
  const [name, setName] = useState("");
  const [school, setSchool] = useState("");
  const [classYear, setClassYear] = useState("2027");
  const [position, setPosition] = useState("PG");
  const [classification, setClassification] = useState("HS");
  const [physical, setPhysical] = useState(60);
  const [technical, setTechnical] = useState<Record<string, number>>(
    Object.fromEntries(TECHNICAL_SKILLS.map((s) => [s.key, 5])),
  );
  const [neural, setNeural] = useState<Record<string, number>>(
    Object.fromEntries(NEURAL_ATTRIBUTES.map((a) => [a.key, 60])),
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<AthleteProfile | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/athletes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          position,
          school,
          class_year: classYear,
          classification,
          physical_score: physical,
          technical,
          neural,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        const detail =
          typeof body.detail === "string" ? body.detail : "Intake rejected — check the form values.";
        setError(detail);
        return;
      }
      setProfile(body as AthleteProfile);
    } catch {
      setError("Could not reach the onboarding API.");
    } finally {
      setSubmitting(false);
    }
  }

  function resetForNext() {
    setProfile(null);
    setName("");
    setSchool("");
    setTechnical(Object.fromEntries(TECHNICAL_SKILLS.map((s) => [s.key, 5])));
    setNeural(Object.fromEntries(NEURAL_ATTRIBUTES.map((a) => [a.key, 60])));
    setPhysical(60);
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      <header className="border-b border-zinc-800 px-8 py-5 flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold tracking-widest text-zinc-500 uppercase">
            We Scout From The Neck Up.
          </span>
          <h1 className="text-xl font-bold tracking-tight text-white mt-0.5">
            Live Athlete Onboarding
          </h1>
        </div>
        <nav className="flex items-center gap-4 text-xs text-zinc-400">
          <Link href="/" className="hover:text-white transition-colors">Command Center</Link>
          <Link href="/roster" className="hover:text-white transition-colors">Roster</Link>
        </nav>
      </header>

      <main className="px-8 py-10 max-w-5xl mx-auto">
        {profile ? (
          <ProfileReveal profile={profile} onNext={resetForNext} />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-10">
            <section>
              <SectionTitle step="01" title="Identity" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Labeled label="Full Name">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    minLength={2}
                    placeholder="Athlete name"
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm focus:border-zinc-400 focus:outline-none"
                  />
                </Labeled>
                <Labeled label="School / Program">
                  <input
                    value={school}
                    onChange={(e) => setSchool(e.target.value)}
                    required
                    minLength={2}
                    placeholder="School or program"
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm focus:border-zinc-400 focus:outline-none"
                  />
                </Labeled>
                <Labeled label="Class Year">
                  <input
                    value={classYear}
                    onChange={(e) => setClassYear(e.target.value)}
                    required
                    pattern="\d{4}"
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm focus:border-zinc-400 focus:outline-none"
                  />
                </Labeled>
                <div className="grid grid-cols-2 gap-4">
                  <Labeled label="Position">
                    <select
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm focus:border-zinc-400 focus:outline-none"
                    >
                      {POSITIONS.map((p) => <option key={p}>{p}</option>)}
                    </select>
                  </Labeled>
                  <Labeled label="Level">
                    <select
                      value={classification}
                      onChange={(e) => setClassification(e.target.value)}
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm focus:border-zinc-400 focus:outline-none"
                    >
                      {CLASSIFICATIONS.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </Labeled>
                </div>
              </div>
            </section>

            <section>
              <SectionTitle step="02" title="Technical Profile" subtitle="Seven skills, scored 1–10 by the evaluating scout" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                {TECHNICAL_SKILLS.map((s) => (
                  <Slider
                    key={s.key}
                    label={s.label}
                    min={1}
                    max={10}
                    step={0.5}
                    value={technical[s.key]}
                    onChange={(v) => setTechnical((t) => ({ ...t, [s.key]: v }))}
                  />
                ))}
              </div>
            </section>

            <section>
              <SectionTitle step="03" title="Neural Audit" subtitle="Six behavioral attributes, scored 1–99" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                {NEURAL_ATTRIBUTES.map((a) => (
                  <Slider
                    key={a.key}
                    label={a.label}
                    hint={a.hint}
                    min={1}
                    max={99}
                    step={1}
                    value={neural[a.key]}
                    onChange={(v) => setNeural((n) => ({ ...n, [a.key]: v }))}
                  />
                ))}
              </div>
            </section>

            <section>
              <SectionTitle step="04" title="Physical Assessment" subtitle="Composite physical score, 1–99" />
              <div className="max-w-md">
                <Slider label="Physical" min={1} max={99} step={1} value={physical} onChange={setPhysical} />
              </div>
            </section>

            {error && (
              <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-200 disabled:opacity-50"
            >
              {submitting ? "Running HU-OS Engine…" : "Onboard Athlete →"}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}

function SectionTitle({ step, title, subtitle }: { step: string; title: string; subtitle?: string }) {
  return (
    <div className="mb-5">
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-xs text-zinc-600">{step}</span>
        <h2 className="text-sm font-semibold tracking-wide text-white uppercase">{title}</h2>
      </div>
      {subtitle && <p className="text-xs text-zinc-500 mt-1 ml-8">{subtitle}</p>}
    </div>
  );
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-zinc-400">{label}</span>
      {children}
    </label>
  );
}

function Slider({
  label, hint, min, max, step, value, onChange,
}: {
  label: string;
  hint?: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-xs font-medium text-zinc-300">
          {label}
          {hint && <span className="ml-2 text-zinc-600">{hint}</span>}
        </span>
        <span className="font-mono text-sm text-white">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-emerald-400"
        aria-label={label}
      />
    </div>
  );
}

function ProfileReveal({ profile, onNext }: { profile: AthleteProfile; onNext: () => void }) {
  const tierStyle = TIER_STYLES[profile.tier] ?? TIER_STYLES.Prospect;
  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="text-xs font-semibold tracking-widest text-zinc-500 uppercase">
              Profile Generated
            </p>
            <h2 className="mt-1 text-3xl font-bold text-white">{profile.name}</h2>
            <p className="mt-1 text-sm text-zinc-400">
              {profile.position} · {profile.school} · Class of {profile.class_year} · {profile.classification}
            </p>
            <span className={`mt-3 inline-block rounded-full border px-3 py-1 text-xs font-semibold ${tierStyle}`}>
              {profile.tier} Tier
            </span>
          </div>
          <div className="text-right">
            <div className={`text-6xl font-bold tabular-nums ${ovrColor(profile.ovr)}`}>
              {profile.ovr}
            </div>
            <div className="text-xs font-semibold tracking-widest text-zinc-500 uppercase">OVR</div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Contribution label="Technical (45%)" avg={profile.ovr_breakdown.technical_avg} pts={profile.ovr_breakdown.technical_contribution} />
          <Contribution label="Neural (35%)" avg={profile.ovr_breakdown.neural_avg} pts={profile.ovr_breakdown.neural_contribution} />
          <Contribution label="Physical (20%)" avg={profile.physical_score} pts={profile.ovr_breakdown.physical_contribution} />
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8">
        <h3 className="text-sm font-semibold tracking-wide text-white uppercase">
          Badges Earned · {profile.badges.length}
        </h3>
        {profile.badges.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">
            No badges yet — the starter quests below map the path to the first ones.
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {profile.badges.map((b) => (
              <div key={b.badge_id} className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                <div className="text-2xl">{b.icon}</div>
                <div className="mt-2 text-sm font-semibold text-white">{b.name}</div>
                <div className="mt-0.5 text-xs text-zinc-500">{b.description}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8">
        <h3 className="text-sm font-semibold tracking-wide text-white uppercase">
          Starter Quest Arc
        </h3>
        <div className="mt-4 space-y-4">
          {profile.quests.map((q) => (
            <div key={q.quest_id}>
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-medium text-white">{q.title}</span>
                <span className="font-mono text-xs text-zinc-400">{q.progress_pct}%</span>
              </div>
              <p className="mt-0.5 text-xs text-zinc-500">{q.description}</p>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full bg-emerald-400"
                  style={{ width: `${q.progress_pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onNext}
          className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-200"
        >
          Onboard Next Athlete
        </button>
        <Link
          href="/roster"
          className="rounded-lg border border-zinc-700 px-6 py-3 text-sm font-semibold text-zinc-200 transition-colors hover:border-zinc-500"
        >
          View Roster →
        </Link>
      </div>
    </div>
  );
}

function Contribution({ label, avg, pts }: { label: string; avg: number; pts: number }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
      <div className="text-xs text-zinc-500">{label}</div>
      <div className="mt-1 text-xl font-semibold tabular-nums text-white">{avg}</div>
      <div className="text-xs text-zinc-500">+{pts} OVR points</div>
    </div>
  );
}
