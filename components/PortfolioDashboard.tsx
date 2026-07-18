"use client";

import { headsUpPortfolio, globalMetrics, type PortfolioAthlete } from "@/lib/portfolio-data";

function formatValuation(val: number): string {
  if (val >= 1_000_000_000) return `$${(val / 1_000_000_000).toFixed(2)}B`;
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
  return `$${val}`;
}

function ScoreBar({ value, color }: { value: number; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      <div
        style={{
          flex: 1,
          height: 6,
          background: "#1f2937",
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${value}%`,
            height: "100%",
            background: color,
            borderRadius: 3,
            transition: "width 0.4s ease",
          }}
        />
      </div>
      <span style={{ fontSize: "0.75rem", color: "#94a3b8", minWidth: 28, textAlign: "right" }}>
        {value}
      </span>
    </div>
  );
}

function ClassificationBadge({ label }: { label: string }) {
  const isNBA = label === "NBA";
  return (
    <span
      style={{
        fontSize: "0.625rem",
        fontWeight: 700,
        letterSpacing: "0.08em",
        padding: "2px 7px",
        borderRadius: 4,
        background: isNBA ? "rgba(124,58,237,0.18)" : "rgba(52,211,153,0.12)",
        color: isNBA ? "#a78bfa" : "#34d399",
        border: `1px solid ${isNBA ? "rgba(124,58,237,0.35)" : "rgba(52,211,153,0.25)"}`,
        textTransform: "uppercase" as const,
      }}
    >
      {label}
    </span>
  );
}

function StatusBadge({ status }: { status: PortfolioAthlete["status"] }) {
  const verified = status === "Verified Asset";
  return (
    <span
      style={{
        fontSize: "0.625rem",
        fontWeight: 700,
        letterSpacing: "0.07em",
        padding: "2px 8px",
        borderRadius: 4,
        background: verified ? "rgba(22,163,74,0.15)" : "rgba(249,115,22,0.12)",
        color: verified ? "#4ade80" : "#fb923c",
        border: `1px solid ${verified ? "rgba(22,163,74,0.3)" : "rgba(249,115,22,0.25)"}`,
        textTransform: "uppercase" as const,
        whiteSpace: "nowrap" as const,
      }}
    >
      {verified ? "✓ Verified" : "⟳ Pipeline"}
    </span>
  );
}

function AthleteRow({ athlete, index }: { athlete: PortfolioAthlete; index: number }) {
  const behavioralColor =
    athlete.behavioralScore >= 95
      ? "#4ade80"
      : athlete.behavioralScore >= 90
      ? "#7c3aed"
      : "#f97316";

  const vistaColor =
    athlete.vistaPathToYes === 100
      ? "#4ade80"
      : athlete.vistaPathToYes >= 70
      ? "#7c3aed"
      : athlete.vistaPathToYes >= 40
      ? "#f97316"
      : "#ef4444";

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1.8fr 1.2fr 0.9fr 1.1fr 1.4fr 1.4fr 0.9fr",
        alignItems: "center",
        gap: "1rem",
        padding: "1rem 1.25rem",
        background: index % 2 === 0 ? "#111827" : "#0f1621",
        borderBottom: "1px solid #1a2235",
        transition: "background 0.15s ease",
      }}
    >
      {/* Athlete */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" as const }}>
          <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "#f8fafc", letterSpacing: "-0.01em" }}>
            {athlete.name}
          </span>
          <ClassificationBadge label={athlete.classification} />
        </div>
        <span style={{ fontSize: "0.7rem", color: "#475569" }}>{athlete.highSchool}</span>
      </div>

      {/* Organization */}
      <div style={{ fontSize: "0.8rem", color: "#94a3b8", fontWeight: 500 }}>
        {athlete.organization}
      </div>

      {/* Valuation */}
      <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "#f8fafc", letterSpacing: "-0.02em" }}>
        {formatValuation(athlete.valuation)}
      </div>

      {/* Contract Type */}
      <div style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 500 }}>
        {athlete.contractType}
      </div>

      {/* Behavioral Score */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
        <span style={{ fontSize: "0.65rem", color: "#475569", letterSpacing: "0.06em", textTransform: "uppercase" as const }}>
          Behavioral
        </span>
        <ScoreBar value={athlete.behavioralScore} color={behavioralColor} />
      </div>

      {/* Vista Path to Yes */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
        <span style={{ fontSize: "0.65rem", color: "#475569", letterSpacing: "0.06em", textTransform: "uppercase" as const }}>
          Vista Path
        </span>
        <ScoreBar value={athlete.vistaPathToYes} color={vistaColor} />
      </div>

      {/* Status */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <StatusBadge status={athlete.status} />
      </div>
    </div>
  );
}

export default function PortfolioDashboard() {
  const nba = headsUpPortfolio.filter((a) => a.classification === "NBA");
  const nil = headsUpPortfolio.filter((a) => a.classification === "NIL/Collegiate");

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a0a",
        color: "#f8fafc",
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
        padding: "2rem 1.5rem",
      }}
    >
      {/* Header */}
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span
            style={{
              fontSize: "0.65rem",
              fontWeight: 700,
              letterSpacing: "0.12em",
              color: "#7c3aed",
              textTransform: "uppercase" as const,
              background: "rgba(124,58,237,0.12)",
              padding: "3px 10px",
              borderRadius: 4,
              border: "1px solid rgba(124,58,237,0.3)",
            }}
          >
            HeadsUP MEDIA & Scouting
          </span>
        </div>
        <h1
          style={{
            fontSize: "1.75rem",
            fontWeight: 900,
            letterSpacing: "-0.03em",
            color: "#f8fafc",
            margin: "0 0 0.25rem",
          }}
        >
          Portfolio Intelligence
        </h1>
        <p style={{ fontSize: "0.825rem", color: "#475569", margin: "0 0 2rem" }}>
          DFW Athlete Asset Registry · Vista Bank Integration Ready
        </p>

        {/* Global Metrics */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "1rem",
            marginBottom: "2rem",
          }}
        >
          {[
            {
              label: "Total Portfolio Value",
              value: formatValuation(globalMetrics.totalPortfolioValue),
              color: "#7c3aed",
            },
            {
              label: "Active NIL Liquidity",
              value: formatValuation(globalMetrics.activeNILLiquidity),
              color: "#34d399",
            },
            {
              label: "Verified Assets",
              value: globalMetrics.verifiedAssets.toString(),
              color: "#4ade80",
            },
            {
              label: "Vista Onboarding Rate",
              value: globalMetrics.vistaOnboardingRate,
              color: "#f97316",
            },
          ].map((metric) => (
            <div
              key={metric.label}
              style={{
                background: "#111827",
                border: "1px solid #1f2937",
                borderRadius: "0.5rem",
                padding: "1.25rem 1.5rem",
              }}
            >
              <div
                style={{
                  fontSize: "0.65rem",
                  color: "#475569",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase" as const,
                  marginBottom: "0.5rem",
                }}
              >
                {metric.label}
              </div>
              <div
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 900,
                  letterSpacing: "-0.03em",
                  color: metric.color,
                }}
              >
                {metric.value}
              </div>
            </div>
          ))}
        </div>

        {/* Summary stats */}
        <div
          style={{
            display: "flex",
            gap: "1.5rem",
            marginBottom: "1.5rem",
            fontSize: "0.75rem",
            color: "#475569",
          }}
        >
          <span>
            <span style={{ color: "#a78bfa", fontWeight: 700 }}>{nba.length}</span> NBA Assets
          </span>
          <span style={{ color: "#1f2937" }}>·</span>
          <span>
            <span style={{ color: "#34d399", fontWeight: 700 }}>{nil.length}</span> NIL/Collegiate
          </span>
          <span style={{ color: "#1f2937" }}>·</span>
          <span>
            <span style={{ color: "#4ade80", fontWeight: 700 }}>
              {headsUpPortfolio.filter((a) => a.vistaPathToYes === 100).length}
            </span>{" "}
            Vista Complete
          </span>
        </div>

        {/* Table */}
        <div
          style={{
            background: "#111827",
            border: "1px solid #1f2937",
            borderRadius: "0.625rem",
            overflow: "hidden",
          }}
        >
          {/* Table Header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.8fr 1.2fr 0.9fr 1.1fr 1.4fr 1.4fr 0.9fr",
              gap: "1rem",
              padding: "0.75rem 1.25rem",
              background: "#0d1520",
              borderBottom: "1px solid #1f2937",
            }}
          >
            {["Athlete", "Organization", "Valuation", "Contract", "Behavioral Score", "Vista Path to Yes", "Status"].map(
              (col) => (
                <span
                  key={col}
                  style={{
                    fontSize: "0.6rem",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    color: "#475569",
                    textTransform: "uppercase" as const,
                    ...(col === "Status" ? { textAlign: "right" as const } : {}),
                  }}
                >
                  {col}
                </span>
              )
            )}
          </div>

          {/* NBA Section */}
          <div
            style={{
              padding: "0.5rem 1.25rem 0.25rem",
              background: "rgba(124,58,237,0.06)",
              borderBottom: "1px solid #1a2235",
            }}
          >
            <span style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em", color: "#7c3aed", textTransform: "uppercase" as const }}>
              NBA
            </span>
          </div>
          {nba.map((athlete, i) => (
            <AthleteRow key={athlete.id} athlete={athlete} index={i} />
          ))}

          {/* NIL/Collegiate Section */}
          <div
            style={{
              padding: "0.5rem 1.25rem 0.25rem",
              background: "rgba(52,211,153,0.05)",
              borderBottom: "1px solid #1a2235",
              borderTop: "1px solid #1f2937",
            }}
          >
            <span style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em", color: "#34d399", textTransform: "uppercase" as const }}>
              NIL / Collegiate
            </span>
          </div>
          {nil.map((athlete, i) => (
            <AthleteRow key={athlete.id} athlete={athlete} index={i} />
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: "1.5rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "0.65rem",
            color: "#334155",
          }}
        >
          <span>HU-OS · Portfolio Intelligence v1.0</span>
          <span>Vista Bank Integration · {headsUpPortfolio.length} Athletes Tracked</span>
        </div>
      </div>
    </div>
  );
}
