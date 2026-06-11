"use client";

/* Screen 2 — Coach DNA Wizard, 10 steps + completion animation
   (Claude Design prototype: screens-onboarding.jsx → WizardScreen) */

import React from "react";
import { useRouter } from "next/navigation";
import { VGM_DATA, inchesLabel, type WizardStep } from "@/lib/vgm/data";
import {
  BarFill,
  RankList,
  Stepper,
  ToggleSwitch,
  Wordmark,
} from "@/components/vgm/ui";
import { useFlow } from "@/components/vgm/flow";

type Answers = Record<string, string | string[]>;

export default function WizardPage() {
  const router = useRouter();
  const { completeWizard, toast } = useFlow();
  const steps = VGM_DATA.wizardSteps;
  const [idx, setIdx] = React.useState(0);
  const [answers, setAnswers] = React.useState<Answers>({});
  const [rank, setRank] = React.useState<string[]>(
    () => steps.find((s) => s.type === "rank")!.options!.map((o) => o.label)
  );
  const [phys, setPhys] = React.useState<Record<string, number | boolean>>({
    pg: 69,
    wing: 75,
    big: 79,
    wingspan: true,
  });
  const [complete, setComplete] = React.useState(false);
  const step = steps[idx];

  const toggle = (s: WizardStep, label: string) => {
    if (s.type === "single") {
      setAnswers({ ...answers, [s.id]: label });
      return;
    }
    const cur = (answers[s.id] as string[]) || [];
    const has = cur.includes(label);
    let next = has ? cur.filter((x) => x !== label) : [...cur, label];
    if (s.max && next.length > s.max) next = next.slice(next.length - s.max);
    setAnswers({ ...answers, [s.id]: next });
  };

  const canContinue = () => {
    if (step.type === "rank" || step.type === "physical") return true;
    const a = answers[step.id];
    return step.type === "single" ? !!a : Array.isArray(a) && a.length > 0;
  };

  const next = () => {
    if (idx < steps.length - 1) setIdx(idx + 1);
    else setComplete(true);
  };

  const onDone = () => {
    completeWizard();
    toast("Coach DNA active (stated) — your board is now scored");
    router.push("/gm");
  };

  if (complete) return <WizardComplete onDone={onDone} />;

  return (
    <div
      className="court-tex"
      style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
    >
      <div style={{ padding: "calc(var(--u)*2.5) calc(var(--u)*3) 0" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <Wordmark light size={11} />
          <span style={{ fontSize: 12, color: "var(--mid)" }}>
            Step {idx + 1} of {steps.length}
          </span>
        </div>
        <BarFill pct={((idx + 1) / steps.length) * 100} height={5} />
      </div>

      <div
        key={idx}
        className="slide-in dark-scroll"
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "calc(var(--u)*4) calc(var(--u)*3)",
          maxWidth: 760,
          width: "100%",
          margin: "0 auto",
        }}
      >
        <h1
          className="t-head text-2xl md:text-[32px]"
          style={{ color: "var(--white)", margin: 0, textWrap: "pretty" }}
        >
          {step.title}
        </h1>
        {step.sub && (
          <p style={{ color: "var(--mid)", fontSize: 14, marginTop: 8 }}>{step.sub}</p>
        )}

        <div style={{ marginTop: 24 }}>
          {(step.type === "single" || step.type === "multi") && (
            <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 12 }}>
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
                    <div style={{ fontWeight: 600, fontSize: 15, paddingRight: 26 }}>
                      {o.label}
                    </div>
                    {o.desc && (
                      <div style={{ fontSize: 12, color: "var(--mid)", marginTop: 4 }}>
                        {o.desc}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {step.type === "rank" && <RankList items={rank} onChange={setRank} />}

          {step.type === "physical" && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 14,
                maxWidth: 420,
              }}
            >
              {step.fields!.map((fld) => (
                <div
                  key={fld.id}
                  className="card-dark"
                  style={{
                    padding: "14px 16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{fld.label}</span>
                  <Stepper
                    value={phys[fld.id] as number}
                    onChange={(v) =>
                      setPhys({ ...phys, [fld.id]: Math.max(60, Math.min(90, v)) })
                    }
                    format={inchesLabel}
                  />
                </div>
              ))}
              <div
                className="card-dark"
                style={{
                  padding: "14px 16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <span style={{ fontWeight: 600, fontSize: 14 }}>
                  {step.toggle!.label}
                </span>
                <ToggleSwitch
                  value={phys.wingspan as boolean}
                  onChange={(v) => setPhys({ ...phys, wingspan: v })}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "calc(var(--u)*2) calc(var(--u)*3) calc(var(--u)*3)",
          maxWidth: 760,
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
        <button className="btn btn-primary" disabled={!canContinue()} onClick={next}>
          {idx === steps.length - 1 ? "Build My Coach DNA" : "Continue →"}
        </button>
      </div>
    </div>
  );
}

function WizardComplete({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = React.useState(0); // 0 building, 1 check
  React.useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 2000);
    const t2 = setTimeout(onDone, 3400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div
      className="court-tex fade-in"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
        padding: 24,
        textAlign: "center",
      }}
    >
      <div style={{ position: "relative", width: 110, height: 110 }}>
        {phase === 0 ? (
          <svg
            width="110"
            height="110"
            style={{ animation: "vgmSpin 1.1s linear infinite" }}
            viewBox="0 0 110 110"
          >
            <circle
              cx="55"
              cy="55"
              r="48"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="7"
            ></circle>
            <circle
              cx="55"
              cy="55"
              r="48"
              fill="none"
              stroke="var(--teal)"
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray="90 212"
            ></circle>
          </svg>
        ) : (
          <div
            className="fade-in"
            style={{
              width: 110,
              height: 110,
              borderRadius: "50%",
              background: "var(--teal)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 50,
              color: "#06281e",
            }}
          >
            ✓
          </div>
        )}
      </div>
      <div className="t-display pill-pulse" style={{ fontSize: 30, color: "var(--white)" }}>
        {phase === 0 ? "Your Coach DNA is Building…" : "Coach DNA Ready"}
      </div>
      <p style={{ color: "var(--mid)", fontSize: 13, maxWidth: 380, margin: 0 }}>
        {phase === 0
          ? "Mapping your answers against 6 seasons of recruiting outcomes."
          : "Status: Stated — fingerprint enrichment unlocks at 15+ historical recruits."}
      </p>
    </div>
  );
}
