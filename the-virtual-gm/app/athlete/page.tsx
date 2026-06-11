"use client";

/* Screen 6 — Athlete DNA Onboarding + Profile Active completion
   (Claude Design prototype: screens-match.jsx → AthleteIntakeScreen,
   AthleteDoneScreen) */

import React from "react";
import { useRouter } from "next/navigation";
import { VGM_DATA, type WizardStep } from "@/lib/vgm/data";
import { OvrRing, RankList, Wordmark } from "@/components/vgm/ui";
import { useFlow } from "@/components/vgm/flow";

const ATHLETE_BG =
  "radial-gradient(900px 480px at 100% 0%, rgba(0,200,150,0.28), transparent 60%), var(--navy-deep)";

type Answers = Record<string, string | string[]>;

export default function AthletePage() {
  const router = useRouter();
  const { redeemAthleteDna } = useFlow();
  const [done, setDone] = React.useState(false);

  if (done)
    return (
      <AthleteDoneScreen
        onReturn={() => {
          redeemAthleteDna();
          router.push("/gm/fit/kirk?upgraded=1");
        }}
      />
    );
  return <AthleteIntakeScreen onDone={() => setDone(true)} />;
}

function AthleteIntakeScreen({ onDone }: { onDone: () => void }) {
  const steps = VGM_DATA.athleteSteps;
  const [idx, setIdx] = React.useState(0);
  const [answers, setAnswers] = React.useState<Answers>({});
  const [rank, setRank] = React.useState<string[]>(
    () => steps.find((s) => s.type === "rank")!.options!.map((o) => o.label)
  );
  const [form, setForm] = React.useState<Record<string, string>>(() => {
    const out: Record<string, string> = {};
    steps[0].fields!.forEach((f) => {
      out[f.id] = String(f.value);
    });
    return out;
  });
  const step = steps[idx];

  const toggle = (s: WizardStep, label: string) => {
    if (s.type === "single") {
      setAnswers({ ...answers, [s.id]: label });
      return;
    }
    const cur = (answers[s.id] as string[]) || [];
    setAnswers({
      ...answers,
      [s.id]: cur.includes(label)
        ? cur.filter((x) => x !== label)
        : [...cur, label],
    });
  };
  const canContinue = () => {
    if (step.type === "rank" || step.type === "form") return true;
    const a = answers[step.id];
    return step.type === "single" ? !!a : Array.isArray(a) && a.length > 0;
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: ATHLETE_BG,
      }}
    >
      <div
        style={{
          padding: "calc(var(--u)*3) calc(var(--u)*3) 0",
          maxWidth: 640,
          width: "100%",
          margin: "0 auto",
        }}
      >
        <Wordmark light size={11} />
        <div
          className="t-display text-3xl md:text-[40px]"
          style={{ color: "var(--white)", marginTop: 16 }}
        >
          Your HeadsUP <span style={{ color: "var(--teal)" }}>Profile</span>
        </div>
        <p style={{ color: "var(--mid)", fontSize: 13, marginTop: 4 }}>
          5 quick questions. Then your profile starts working for you.
        </p>
        <div style={{ display: "flex", gap: 6, margin: "14px 0" }}>
          {steps.map((s, i) => (
            <span
              key={s.id}
              style={{
                height: 5,
                flex: 1,
                borderRadius: 99,
                background: i <= idx ? "var(--teal)" : "rgba(255,255,255,0.12)",
                transition: "background 200ms",
              }}
            ></span>
          ))}
        </div>
      </div>

      <div
        key={idx}
        className="slide-in dark-scroll"
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "calc(var(--u)*1.5) calc(var(--u)*3)",
          maxWidth: 640,
          width: "100%",
          margin: "0 auto",
        }}
      >
        <h2
          className="t-head text-xl md:text-2xl"
          style={{ color: "var(--white)", margin: "0 0 4px" }}
        >
          {step.title}
        </h2>
        {step.sub && (
          <p style={{ color: "var(--mid)", fontSize: 13, marginTop: 4 }}>{step.sub}</p>
        )}

        <div style={{ marginTop: 16 }}>
          {step.type === "form" && (
            <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 12 }}>
              {step.fields!.map((fld) => (
                <label key={fld.id}>
                  <span
                    className="t-label"
                    style={{
                      display: "block",
                      marginBottom: 5,
                      color: "rgba(255,255,255,0.55)",
                    }}
                  >
                    {fld.label}
                  </span>
                  <input
                    className="field-dark"
                    value={form[fld.id]}
                    onChange={(e) => setForm({ ...form, [fld.id]: e.target.value })}
                  ></input>
                </label>
              ))}
            </div>
          )}
          {(step.type === "single" || step.type === "multi") && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
              {step.options!.map((o) => {
                const a = answers[step.id];
                const sel =
                  step.type === "single"
                    ? a === o.label
                    : ((a as string[]) || []).includes(o.label);
                return (
                  <button
                    key={o.label}
                    className={"opt-card" + (sel ? " selected" : "")}
                    onClick={() => toggle(step, o.label)}
                  >
                    {sel && <span className="opt-check">✓</span>}
                    <div style={{ fontWeight: 600, fontSize: 14, paddingRight: 26 }}>
                      {o.label}
                    </div>
                    {o.desc && (
                      <div style={{ fontSize: 12, color: "var(--mid)", marginTop: 3 }}>
                        {o.desc}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
          {step.type === "rank" && <RankList items={rank} onChange={setRank} />}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "calc(var(--u)*2) calc(var(--u)*3) calc(var(--u)*3)",
          maxWidth: 640,
          width: "100%",
          margin: "0 auto",
        }}
      >
        <button
          className="btn btn-ghost"
          disabled={idx === 0}
          onClick={() => setIdx(idx - 1)}
        >
          ← Back
        </button>
        <button
          className="btn btn-primary"
          disabled={!canContinue()}
          onClick={() => (idx < steps.length - 1 ? setIdx(idx + 1) : onDone())}
        >
          {idx === steps.length - 1 ? "Activate My Profile" : "Continue →"}
        </button>
      </div>
    </div>
  );
}

function AthleteDoneScreen({ onReturn }: { onReturn: () => void }) {
  return (
    <div
      className="fade-in"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
        padding: 24,
        textAlign: "center",
        background: ATHLETE_BG,
      }}
    >
      <OvrRing value={74} size={190} />
      <div
        className="t-display text-2xl md:text-[34px]"
        style={{ color: "var(--white)" }}
      >
        Your HeadsUP Profile is <span style={{ color: "var(--teal)" }}>Active</span>
      </div>
      <p
        style={{
          color: "var(--mid)",
          fontSize: 13,
          maxWidth: 380,
          margin: 0,
          lineHeight: 1.6,
        }}
      >
        Devan Kirk · Combo Guard · Class of 2026
        <br />
        Your Athlete DNA is now feeding matchmaking for programs recruiting your
        profile.
      </p>
      <button className="btn btn-primary" onClick={onReturn}>
        Return to Coach View →
      </button>
    </div>
  );
}
