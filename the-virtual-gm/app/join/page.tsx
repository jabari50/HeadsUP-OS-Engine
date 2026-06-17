"use client";

import React from "react";
import { useFormState, useFormStatus } from "react-dom";
import { submitIntake, type IntakeState } from "./actions";
import { TECHNICAL_FIELDS, NEURAL_FIELDS, POSITIONS } from "@/lib/vgm/ovr";

function Slider({ name, label }: { name: string; label: string }) {
  const [v, setV] = React.useState(5);
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: "rgba(255,255,255,0.85)" }}>
        <span>{label}</span>
        <span className="t-mono" style={{ color: "var(--teal)" }}>{v}</span>
      </span>
      <input
        type="range" name={name} min={1} max={10} step={1} value={v}
        onChange={(e) => setV(Number(e.target.value))}
        style={{ accentColor: "var(--teal)", width: "100%" }}
      />
    </label>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}
      className="btn btn-primary" style={{ width: "100%", fontSize: 15, padding: "14px 26px" }}>
      {pending ? "Scoring…" : "Get My HU-OS Score →"}
    </button>
  );
}

export default function JoinPage() {
  const [state, formAction] = useFormState<IntakeState, FormData>(submitIntake, null);

  return (
    <main className="court-tex" style={{ minHeight: "100vh", padding: "calc(var(--u)*4) 16px" }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <div className="t-label" style={{ color: "var(--teal)" }}>HeadsUP OS · Athlete Intake</div>
        <h1 className="t-display" style={{ fontSize: 40, color: "var(--white)", margin: "6px 0" }}>
          Get Scouted From The Neck Up
        </h1>
        <p style={{ color: "var(--mid)", fontSize: 14, marginBottom: "calc(var(--u)*3)" }}>
          Self-assess in 2 minutes. We compute your HU-OS OVR and publish a shareable
          recruiting profile instantly. (Self-reported — a verified evaluation comes later.)
        </p>

        <form action={formAction} className="card-dark" style={{ padding: "calc(var(--u)*3)", display: "flex", flexDirection: "column", gap: "calc(var(--u)*2.5)" }}>
          {/* honeypot — hidden from humans; bots fill it and get rejected */}
          <input
            type="text"
            name="company"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
          />

          {/* bio */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <input className="field-dark" name="full_name" placeholder="Full name" required />
            <input className="field-dark" name="email" type="email" placeholder="Email" required />
            <select className="field-dark" name="position" required defaultValue="">
              <option value="" disabled>Position</option>
              {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <input className="field-dark" name="grad_year" type="number" placeholder="Grad year (e.g. 2026)" required />
            <input className="field-dark" name="school" placeholder="School" required />
            <input className="field-dark" name="height" placeholder={`Height (e.g. 6'3")`} />
            <input className="field-dark" name="gpa" placeholder="GPA (optional)" />
          </div>

          <div>
            <div className="t-label" style={{ marginBottom: 10 }}>Technical Skills (1–10)</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 20px" }}>
              {TECHNICAL_FIELDS.map(([k, label]) => (
                <Slider key={k} name={`t_${k}`} label={label} />
              ))}
            </div>
          </div>

          <div>
            <div className="t-label" style={{ marginBottom: 10 }}>Mental / Neural (1–10)</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 20px" }}>
              {NEURAL_FIELDS.map(([k, label]) => (
                <Slider key={k} name={`n_${k}`} label={label} />
              ))}
            </div>
          </div>

          <div>
            <div className="t-label" style={{ marginBottom: 10 }}>Physical / Athletic Output (1–10)</div>
            <Slider name="physical" label="Overall physical / athleticism" />
          </div>

          {state && !state.ok && (
            <p className="t-mono" style={{ fontSize: 12, color: "var(--amber)" }}>{state.message}</p>
          )}

          <SubmitButton />
          <p style={{ fontSize: 11, color: "var(--mid)", textAlign: "center", margin: 0 }}>
            By joining you agree to a public recruiting profile. You can request removal anytime.
          </p>
        </form>
      </div>
    </main>
  );
}
