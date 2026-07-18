// ui.jsx — shared visual components for The Virtual GM
const { useState } = React;

// ---- Circular OVR badge: navy fill, teal stroke, Oswald number ----
function OvrBadge({ ovr, size = 52, stroke = "var(--teal)", label = "OVR" }) {
  const fs = Math.round(size * 0.42);
  const lbl = Math.round(size * 0.16);
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: "var(--navy-800)", border: `2px solid ${stroke}`,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      flex: "0 0 auto", boxShadow: "inset 0 0 12px rgba(0,0,0,0.35)",
    }}>
      <span className="stat" style={{ fontSize: fs, color: "var(--teal)", lineHeight: 1 }}>{ovr}</span>
      <span className="mono-cap" style={{ fontSize: lbl, color: "var(--gray)", letterSpacing: "0.12em", marginTop: size*0.02 }}>{label}</span>
    </div>
  );
}

// ---- Tier badge (on-court role) ----
function TierBadge({ tier, small }) {
  const t = window.VGM.TIERS[tier];
  if (!t) return null;
  const solid = tier === "Starter" || tier === "Rotation" || tier === "Bench";
  return (
    <span className="mono-cap" style={{
      fontSize: small ? 10 : 11,
      padding: small ? "3px 8px" : "4px 11px",
      borderRadius: 4,
      letterSpacing: "0.12em",
      color: solid ? t.text : t.color,
      background: solid ? t.color : "transparent",
      border: solid ? "none" : `1px solid ${t.color}`,
      whiteSpace: "nowrap",
      display: "inline-block",
    }}>{t.label}</span>
  );
}

// ---- Eligibility status pill (UIL No Pass, No Play) ----
function EligibilityPill({ status, small, useShort }) {
  const a = window.VGM.ELIGIBILITY[status];
  if (!a) return null;
  return (
    <span className="mono-cap" style={{
      fontSize: small ? 9.5 : 10.5,
      padding: small ? "3px 8px" : "4px 10px",
      borderRadius: 999,
      letterSpacing: "0.1em",
      color: a.color, background: a.bg, border: `1px solid ${a.line}`,
      display: "inline-flex", alignItems: "center", gap: 6, whiteSpace: "nowrap",
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: a.color }}></span>
      {useShort ? a.short : a.label}
    </span>
  );
}

// ---- Circular GPA badge ----
function GpaBadge({ gpa, size = 52 }) {
  const color = gpa >= 3.0 ? "var(--teal)" : gpa >= 2.0 ? "var(--gold)" : "#FF6B5E";
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: "var(--navy-800)", border: `2px solid ${color}`,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      flex: "0 0 auto", boxShadow: "inset 0 0 12px rgba(0,0,0,0.35)",
    }}>
      <span className="stat" style={{ fontSize: Math.round(size * 0.36), color, lineHeight: 1 }}>{gpa.toFixed(1)}</span>
      <span className="mono-cap" style={{ fontSize: Math.round(size * 0.15), color: "var(--gray)", letterSpacing: "0.1em", marginTop: 1 }}>GPA</span>
    </div>
  );
}

// ---- Priority badge (HIGH/MED/LOW) ----
function PriorityBadge({ level }) {
  const map = {
    HIGH: { c: "var(--teal)",  b: "var(--teal-dim)", l: "var(--teal-line)" },
    MED:  { c: "var(--gold)",  b: "rgba(245,197,24,0.12)", l: "rgba(245,197,24,0.4)" },
    LOW:  { c: "var(--gray)",  b: "rgba(138,143,153,0.12)", l: "var(--gray-dim)" },
  };
  const m = map[level] || map.LOW;
  return (
    <span className="mono-cap" style={{
      fontSize: 10, padding: "3px 9px", borderRadius: 4, letterSpacing: "0.14em",
      color: m.c, background: m.b, border: `1px solid ${m.l}`,
    }}>{level}</span>
  );
}

// ---- Horizontal fit / score bar ----
function FitBar({ value, max = 100, height = 7, showVal = true, color = "var(--teal)", labelLeft }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%" }}>
      {labelLeft && <span className="mono-cap" style={{ fontSize: 9.5, color: "var(--gray)", width: 52, flex: "0 0 auto" }}>{labelLeft}</span>}
      <div style={{ flex: 1, height, background: "rgba(255,255,255,0.07)", borderRadius: 999, overflow: "hidden" }}>
        <div style={{ width: pct + "%", height: "100%", background: color, borderRadius: 999, animation: "barGrow 0.7s cubic-bezier(.2,.7,.2,1)" }}></div>
      </div>
      {showVal && <span className="stat" style={{ fontSize: 13, color: "var(--white)", width: 30, textAlign: "right", flex: "0 0 auto" }}>{value}</span>}
    </div>
  );
}

// ---- Panel (elevated navy card) ----
function Panel({ children, style, pad, accent, ...rest }) {
  return (
    <div {...rest} style={{
      background: "var(--navy-800)",
      border: "1px solid var(--hair)",
      borderRadius: 12,
      padding: pad != null ? pad : "var(--card-pad)",
      borderTop: accent ? "2px solid var(--teal)" : undefined,
      ...style,
    }}>{children}</div>
  );
}

// ---- Section eyebrow / header ----
function Eyebrow({ children, color = "var(--teal)", style }) {
  return <div className="mono-cap" style={{ fontSize: 11, letterSpacing: "0.18em", color, ...style }}>{children}</div>;
}

// ---- Grading-period status pill ----
function GradingPeriodPill({ period, week, nextCheck }) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 9,
      padding: "7px 14px", borderRadius: 999,
      background: "var(--teal-dim)", border: "1px solid var(--teal-line)",
    }}>
      <span style={{ position: "relative", width: 8, height: 8 }}>
        <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "var(--teal)" }}></span>
        <span style={{ position: "absolute", inset: -3, borderRadius: "50%", border: "1px solid var(--teal)", animation: "ping 1.8s ease-out infinite" }}></span>
      </span>
      <span className="mono-cap" style={{ fontSize: 11, color: "var(--teal)" }}>{period} · {week}</span>
      {nextCheck && <span style={{ fontSize: 11, color: "var(--gray)", fontWeight: 500 }}>· check {nextCheck}</span>}
    </div>
  );
}

// ---- GM recommendation pill (PURSUE / MONITOR / PASS) ----
function RecPill({ rec }) {
  const map = {
    PURSUE:  { c: "#0C1830", bg: "var(--teal)",  bd: "var(--teal)" },
    MONITOR: { c: "var(--gold)", bg: "rgba(245,197,24,0.12)", bd: "rgba(245,197,24,0.5)" },
    PASS:    { c: "var(--gray)", bg: "rgba(138,143,153,0.1)", bd: "var(--gray-dim)" },
  };
  const m = map[rec] || map.MONITOR;
  return (
    <span className="mono-cap" style={{
      fontSize: 12, padding: "7px 16px", borderRadius: 6, letterSpacing: "0.14em",
      color: m.c, background: m.bg, border: `1px solid ${m.bd}`,
    }}>{rec}</span>
  );
}

// ---- Player avatar placeholder (striped) ----
function Avatar({ name, size = 56, square }) {
  const initials = name.split(" ").map(w => w[0]).slice(0, 2).join("");
  return (
    <div style={{
      width: size, height: size, flex: "0 0 auto",
      borderRadius: square ? 10 : "50%",
      background: "repeating-linear-gradient(135deg, var(--navy-700) 0 7px, var(--navy-750) 7px 14px)",
      border: "1px solid var(--hair-2)",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "rgba(255,255,255,0.55)", fontFamily: "'Oswald',sans-serif", fontWeight: 600,
      fontSize: size * 0.34, letterSpacing: "0.02em",
    }}>{initials}</div>
  );
}

const pingStyle = document.createElement("style");
pingStyle.textContent = "@keyframes ping { 0%{transform:scale(1);opacity:.8} 70%,100%{transform:scale(2.1);opacity:0} }";
document.head.appendChild(pingStyle);

Object.assign(window, { OvrBadge, GpaBadge, TierBadge, EligibilityPill, PriorityBadge, FitBar, Panel, Eyebrow, GradingPeriodPill, RecPill, Avatar });
