"use client";

/* The Virtual GM — Add Player + Athlete DNA Invite modals */

import React from "react";
import { useRouter } from "next/navigation";
import { Modal } from "./ui";
import { useFlow } from "./flow";

export function AddPlayerModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: () => void;
}) {
  const [f, setF] = React.useState({
    name: "Devan Kirk",
    pos: "Combo Guard",
    height: "6'5\"",
    school: "Red Oak HS",
    stats: "12 PPG · 10 RPG · 4 APG",
    year: "2026",
  });
  const set =
    (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setF({ ...f, [k]: e.target.value });
  const fields: [keyof typeof f, string, boolean][] = [
    ["name", "Full name", false],
    ["pos", "Position", true],
    ["height", "Height", true],
    ["school", "School", true],
    ["year", "Class", true],
    ["stats", "Season stats", false],
  ];
  return (
    <Modal onClose={onClose}>
      <div style={{ padding: "calc(var(--u)*3)" }}>
        <div className="t-display" style={{ fontSize: 24, color: "var(--navy)" }}>
          Add Player
        </div>
        <p style={{ fontSize: 12, color: "var(--mid)", marginTop: 4 }}>
          Manual entry — or import from the GoPRO Talent Network later.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 14 }}>
          {fields.map(([k, label, half]) => (
            <label key={k} style={{ flex: half ? "1 1 45%" : "1 1 100%" }}>
              <span className="t-label" style={{ display: "block", marginBottom: 4 }}>
                {label}
              </span>
              <input className="field" value={f[k]} onChange={set(k)}></input>
            </label>
          ))}
        </div>
        <div
          style={{ display: "flex", gap: 10, marginTop: 18, justifyContent: "flex-end" }}
        >
          <button className="btn btn-ghost-dark" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={onAdd}>
            Add to Draft Board
          </button>
        </div>
      </div>
    </Modal>
  );
}

export function InviteModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { toast } = useFlow();
  return (
    <Modal onClose={onClose} dark>
      <div
        style={{
          padding: "calc(var(--u)*3.5)",
          color: "var(--white)",
          textAlign: "center",
        }}
      >
        <div className="t-label" style={{ color: "var(--teal)" }}>
          Athlete DNA Invite
        </div>
        <div className="t-display" style={{ fontSize: 26, margin: "10px 0 4px" }}>
          Devan Kirk · Red Oak HS
        </div>
        <p style={{ fontSize: 12.5, color: "var(--mid)", margin: "0 0 18px" }}>
          One-time code. Redeems into a 5-question intake — about 90 seconds.
        </p>
        <div
          className="t-mono"
          style={{
            fontSize: 28,
            letterSpacing: "0.18em",
            background: "var(--navy-deep)",
            border: "1px dashed var(--teal)",
            borderRadius: 8,
            padding: "16px 10px",
          }}
        >
          VGM-KIRK-26
        </div>
        <div
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "center",
            marginTop: 18,
            flexWrap: "wrap",
          }}
        >
          <button
            className="btn btn-ghost"
            onClick={() => toast("Code copied — text it to the family")}
          >
            Copy Code
          </button>
          <button className="btn btn-primary" onClick={() => router.push("/athlete")}>
            Open Athlete View →
          </button>
        </div>
      </div>
    </Modal>
  );
}
