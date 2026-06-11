"use client";

/* The Virtual GM — shared components (ported from the Claude Design
   prototype: vgm/components.jsx) */

import React from "react";
import type {
  CompPlayer,
  DimMeta,
  DnaStatus,
  Player,
  Priority,
  Recommendation,
  RosterGap,
} from "@/lib/vgm/data";
import { VGM_DATA } from "@/lib/vgm/data";

export function Wordmark({
  light = false,
  size = 14,
}: {
  light?: boolean;
  size?: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: 6,
        fontFamily: "var(--f-head)",
        fontSize: size,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ fontWeight: 600, color: "var(--teal)" }}>HeadsUP</span>
      <span
        style={{
          fontWeight: 300,
          color: light ? "rgba(255,255,255,0.85)" : "var(--dark)",
        }}
      >
        Media
      </span>
    </div>
  );
}

export function VgmLockup({ size = 56 }: { size?: number }) {
  return (
    <div style={{ lineHeight: 1 }}>
      <div className="t-display" style={{ fontSize: size, color: "var(--white)" }}>
        The Virtual <span style={{ color: "var(--teal)" }}>GM</span>
      </div>
    </div>
  );
}

/* ── Coach DNA status badge ── */
export function DnaBadge({
  status,
  onClick,
}: {
  status: DnaStatus;
  onClick?: () => void;
}) {
  if (status === "active")
    return <span className="pill pill-teal">🧠 Coach DNA: Active</span>;
  if (status === "stated")
    return <span className="pill pill-teal-outline">🧠 Coach DNA: Stated</span>;
  if (status === "building")
    return (
      <span className="pill pill-teal-outline pill-pulse">
        🔄 Coach DNA: Building…
      </span>
    );
  return (
    <button
      className="pill pill-gray"
      onClick={onClick}
      style={{
        border: "1px solid rgba(136,146,164,0.35)",
        background: "rgba(136,146,164,0.18)",
      }}
    >
      Coach DNA: Setup Required →
    </button>
  );
}

export function AthleteDnaBadge({ active }: { active: boolean }) {
  return active ? (
    <span className="pill pill-teal-outline">🔍 Athlete DNA: Active</span>
  ) : (
    <span className="pill pill-gray">🔍 Athlete DNA: Pending</span>
  );
}

export function RecBadge({ rec }: { rec: Recommendation }) {
  const emoji = rec === "PURSUE" ? "✅ " : "";
  return (
    <span className={"rec-badge rec-" + rec}>
      {emoji}
      {rec}
    </span>
  );
}

export function PriTag({ pri }: { pri: Priority }) {
  const c = { HIGH: "var(--red)", MED: "var(--amber)", LOW: "var(--mid)" }[pri];
  return (
    <span
      className="t-mono"
      style={{ fontSize: 10, fontWeight: 700, color: c, letterSpacing: "0.08em" }}
    >
      [{pri} PRIORITY]
    </span>
  );
}

/* ── animated bar ── */
export function BarFill({
  pct,
  color,
  onLight,
  height = 8,
  delay = 0,
}: {
  pct: number;
  color?: string;
  onLight?: boolean;
  height?: number;
  delay?: number;
}) {
  const [w, setW] = React.useState(0);
  React.useEffect(() => {
    const t = setTimeout(() => setW(pct), 60 + delay);
    return () => clearTimeout(t);
  }, [pct, delay]);
  return (
    <div className={"bar-track" + (onLight ? " on-light" : "")} style={{ height }}>
      <div
        className="bar-fill"
        style={{ width: w + "%", background: color || "var(--teal)" }}
      ></div>
    </div>
  );
}

export function DimRow({
  meta,
  value,
  onLight,
  delay,
}: {
  meta: DimMeta;
  value: number;
  onLight?: boolean;
  delay?: number;
}) {
  const src = meta.src;
  const icon = src === "coach" ? "🧠 " : src === "athlete" ? "🔍 " : "";
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(120px, 168px) 1fr 64px",
        alignItems: "center",
        gap: 12,
      }}
    >
      <span
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: src
            ? "var(--teal)"
            : onLight
              ? "var(--dark)"
              : "rgba(255,255,255,0.85)",
        }}
      >
        {icon}
        {meta.label}
      </span>
      <BarFill pct={value * 10} onLight={onLight} delay={delay} />
      <span
        className="t-mono"
        style={{
          fontSize: 12,
          textAlign: "right",
          color: onLight ? "var(--mid)" : "rgba(255,255,255,0.6)",
        }}
      >
        {value.toFixed(1)} / 10
      </span>
    </div>
  );
}

/* ── OVR ring (animated circular progress) ── */
export function OvrRing({
  value,
  size = 140,
  label = "OVR",
  animate = true,
}: {
  value: number;
  size?: number;
  label?: string;
  animate?: boolean;
}) {
  const [v, setV] = React.useState(animate ? 0 : value);
  React.useEffect(() => {
    if (!animate) {
      setV(value);
      return;
    }
    let raf: number;
    let start: number | undefined;
    const dur = 800;
    const tick = (ts: number) => {
      if (!start) start = ts;
      const k = Math.min(1, (ts - start) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      setV(Math.round(value * e));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, animate]);
  const r = (size - 12) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="8"
        ></circle>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--teal)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * v) / 99}
        ></circle>
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          className="t-display"
          style={{ fontSize: size * 0.34, color: "var(--white)", lineHeight: 1 }}
        >
          {v}
        </span>
        <span className="t-label" style={{ color: "var(--teal)" }}>
          {label}
        </span>
      </div>
    </div>
  );
}

/* ── roster gap card ── */
export function GapCard({ gap }: { gap: RosterGap }) {
  const border = { HIGH: "var(--red)", MED: "var(--amber)", LOW: "var(--mid)" }[
    gap.pri
  ];
  return (
    <div
      className="card-dark"
      style={{
        borderLeft: "4px solid " + border,
        padding: "calc(var(--u)*1.5) calc(var(--u)*2)",
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <PriTag pri={gap.pri} />
      <div
        style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}
      >
        <span className="t-head" style={{ fontSize: 16, color: "var(--white)" }}>
          {gap.pos}
        </span>
        <span style={{ color: "var(--mid)", fontSize: 12 }}>→ {gap.need}</span>
      </div>
    </div>
  );
}

/* ── draft board player card ── */
export function PlayerCard({
  p,
  dnaActive,
  athleteDna,
  onOpen,
  compact,
}: {
  p: Player;
  dnaActive: DnaStatus;
  athleteDna: boolean;
  onOpen: (p: Player, unlockIntent: boolean) => void;
  compact?: boolean;
}) {
  const fit = athleteDna && p.id === "kirk" ? p.fit : p.fit5;
  const dimCount = athleteDna && p.id === "kirk" ? "8-DIM" : "5-DIM";
  return (
    <div
      className="card-dark accent card-hover"
      style={{
        padding: "calc(var(--u)*2)",
        display: "flex",
        flexDirection: "column",
        gap: "calc(var(--u)*1.25)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 10,
        }}
      >
        <div>
          <div className="t-display" style={{ fontSize: 21, color: "var(--white)" }}>
            {p.name}
          </div>
          <div style={{ fontSize: 12, color: "var(--mid)", marginTop: 2 }}>
            {p.pos} · Class {p.classYear} · {p.school}
          </div>
          <div
            style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 2 }}
          >
            Archetype: <strong>{p.archetype}</strong>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="t-label">OVR</div>
          <div
            className="t-display"
            style={{ fontSize: 34, color: "var(--teal)", lineHeight: 1 }}
          >
            {p.ovr}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span className="t-label" style={{ color: "rgba(255,255,255,0.6)" }}>
          Fit
        </span>
        <BarFill pct={fit} />
        <span className="t-mono" style={{ fontSize: 13, color: "var(--white)" }}>
          {fit}/100
        </span>
        <RecBadge rec={p.rec} />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span
          className="t-mono"
          style={{
            fontSize: 10,
            padding: "2px 8px",
            borderRadius: 4,
            background: "var(--navy-deep)",
            color: "var(--teal)",
            border: "1px solid var(--line-dark)",
          }}
        >
          {dimCount}
        </span>
        <span style={{ fontSize: 11, color: "var(--mid)" }}>
          {dnaActive === "pending"
            ? "Coach DNA pending"
            : "Coach DNA " + (dnaActive === "active" ? "Active" : "Stated")}
        </span>
      </div>

      {!compact && (
        <div
          style={{
            fontSize: 12,
            color: "rgba(255,255,255,0.75)",
            borderTop: "1px solid var(--line-dark)",
            paddingTop: "calc(var(--u)*1.25)",
          }}
        >
          Comp: {p.compShort}
        </div>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => onOpen(p, false)}>
          Preview Profile
        </button>
        <button className="btn btn-primary btn-sm" onClick={() => onOpen(p, true)}>
          Full Unlock — 1 cr
        </button>
      </div>
    </div>
  );
}

/* ── comp player card + rail ── */
export function SimDots({ pct }: { pct: number }) {
  const n = Math.round(pct / 10);
  return (
    <span className="sim-dots">
      {Array.from({ length: 10 }).map((_, i) => (
        <i key={i} className={i < n ? "on" : ""}></i>
      ))}
    </span>
  );
}

export function CompCard({ c }: { c: CompPlayer }) {
  return (
    <div
      className="card-light"
      style={{
        width: 230,
        padding: "calc(var(--u)*2)",
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <span className="t-label">Comp Player</span>
      <div>
        <div className="t-head" style={{ fontSize: 15, color: "var(--dark)" }}>
          {c.name} · Class {c.classYear}
        </div>
        <div style={{ fontSize: 12, color: "var(--mid)" }}>
          {c.pos} · {c.archetype}
        </div>
      </div>
      <div style={{ fontSize: 12, color: "var(--dark)", lineHeight: 1.45 }}>
        <span className="t-label" style={{ display: "block", marginBottom: 2 }}>
          Outcome
        </span>
        {c.outcome}
        <br />
        <span style={{ color: "var(--mid)" }}>{c.detail}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--mid)" }}>
          Similarity
        </span>
        <SimDots pct={c.sim} />
        <span className="t-mono" style={{ fontSize: 12, color: "var(--dark)" }}>
          {c.sim}%
        </span>
      </div>
    </div>
  );
}

export function CompRail({ comps }: { comps: CompPlayer[] }) {
  return (
    <div className="comp-rail dark-scroll">
      {comps.map((c) => (
        <CompCard key={c.name} c={c} />
      ))}
    </div>
  );
}

/* ── small inputs ── */
export function Stepper({
  value,
  onChange,
  format,
}: {
  value: number;
  onChange: (v: number) => void;
  format: (v: number) => string;
}) {
  const bs: React.CSSProperties = {
    width: 34,
    height: 34,
    borderRadius: 4,
    border: "1px solid var(--line-dark)",
    background: "var(--navy-deep)",
    color: "var(--white)",
    fontSize: 17,
    fontWeight: 700,
  };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <button style={bs} onClick={() => onChange(value - 1)}>
        −
      </button>
      <span
        className="t-mono"
        style={{ fontSize: 17, color: "var(--white)", minWidth: 52, textAlign: "center" }}
      >
        {format(value)}
      </span>
      <button style={bs} onClick={() => onChange(value + 1)}>
        +
      </button>
    </div>
  );
}

export function ToggleSwitch({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      aria-checked={!!value}
      role="switch"
      style={{
        position: "relative",
        width: 44,
        height: 24,
        borderRadius: 99,
        border: "none",
        background: value ? "var(--teal)" : "rgba(136,146,164,0.4)",
        transition: "background 150ms",
      }}
    >
      <i
        style={{
          position: "absolute",
          top: 3,
          left: value ? 23 : 3,
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: "#fff",
          transition: "left 150ms",
        }}
      ></i>
    </button>
  );
}

/* ── drag-to-rank list ── */
export function RankList({
  items,
  onChange,
}: {
  items: string[];
  onChange: (items: string[]) => void;
}) {
  const dragIdx = React.useRef<number | null>(null);
  const move = (from: number | null, to: number) => {
    if (from === null || to < 0 || to >= items.length || from === to) return;
    const next = items.slice();
    const [x] = next.splice(from, 1);
    next.splice(to, 0, x);
    onChange(next);
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {items.map((label, i) => (
        <div
          key={label}
          draggable
          onDragStart={() => {
            dragIdx.current = i;
          }}
          onDragOver={(e) => {
            e.preventDefault();
          }}
          onDrop={() => {
            move(dragIdx.current, i);
            dragIdx.current = null;
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 14px",
            background: "var(--white)",
            borderRadius: 8,
            border: "1px solid var(--line-light)",
            cursor: "grab",
            userSelect: "none",
          }}
        >
          <span
            className="t-display"
            style={{
              width: 26,
              height: 26,
              borderRadius: "50%",
              background: "var(--teal)",
              color: "#06281e",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
            }}
          >
            {i + 1}
          </span>
          <span style={{ flex: 1, fontWeight: 600, fontSize: 14, color: "var(--dark)" }}>
            {label}
          </span>
          <span style={{ display: "flex", gap: 4 }}>
            <button
              className="btn btn-ghost-dark btn-sm"
              style={{ padding: "2px 8px" }}
              onClick={() => move(i, i - 1)}
            >
              ↑
            </button>
            <button
              className="btn btn-ghost-dark btn-sm"
              style={{ padding: "2px 8px" }}
              onClick={() => move(i, i + 1)}
            >
              ↓
            </button>
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── modal ── */
export function Modal({
  onClose,
  children,
  dark,
}: {
  onClose: () => void;
  children: React.ReactNode;
  dark?: boolean;
}) {
  return (
    <div className="modal-veil" onClick={onClose}>
      <div
        className={"modal-box" + (dark ? " card-dark" : "")}
        style={dark ? { background: "var(--navy)" } : {}}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

/* ── section heading ── */
export function SectionHead({
  children,
  right,
  onLight,
}: {
  children: React.ReactNode;
  right?: React.ReactNode;
  onLight?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        marginBottom: "calc(var(--u)*1.5)",
      }}
    >
      <h2
        className="t-head"
        style={{
          fontSize: 15,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          color: onLight ? "var(--navy)" : "var(--white)",
          margin: 0,
        }}
      >
        {children}
      </h2>
      {right}
    </div>
  );
}

/* ── operator status card (sidebar) ── */
export function OperatorCard({ credits }: { credits: number }) {
  const c = VGM_DATA.coach;
  return (
    <div
      className="card-dark"
      style={{
        padding: "calc(var(--u)*2)",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <span className="t-label" style={{ color: "rgba(255,255,255,0.5)" }}>
        Operator Status
      </span>
      <span className="pill pill-teal-outline" style={{ alignSelf: "flex-start" }}>
        {c.tier}
      </span>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <span className="t-display" style={{ fontSize: 26, color: "var(--white)" }}>
          {credits}
        </span>
        <span style={{ fontSize: 11, color: "var(--mid)" }}>
          unlock credits remaining
        </span>
      </div>
    </div>
  );
}
