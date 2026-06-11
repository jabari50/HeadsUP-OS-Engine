"use client";

/* Screen 4/5 — Fit Score Card (full view) with dimension breakdown,
   comp player rail, GM rationale (Claude Design prototype:
   screens-match.jsx → FitScoreScreen) */

import React from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { VGM_DATA } from "@/lib/vgm/data";
import {
  AthleteDnaBadge,
  BarFill,
  CompRail,
  DimRow,
  DnaBadge,
  RecBadge,
  SectionHead,
} from "@/components/vgm/ui";
import { InviteModal } from "@/components/vgm/modals";
import { useFlow } from "@/components/vgm/flow";

function InsufficientSampleAlert() {
  const [open, setOpen] = React.useState(true);
  return (
    <div
      style={{
        background: "rgba(245,158,11,0.95)",
        color: "#2d2305",
        borderRadius: 8,
        padding: open ? "12px 16px" : "8px 16px",
        fontSize: 12.5,
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: "none",
          border: "none",
          padding: 0,
          fontWeight: 700,
          fontSize: 12.5,
          color: "#2d2305",
          display: "flex",
          alignItems: "center",
          gap: 8,
          width: "100%",
        }}
      >
        <span>⚠️ Coach DNA — Stated Only</span>
        <span style={{ marginLeft: "auto" }}>{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div style={{ marginTop: 6, lineHeight: 1.5 }}>
          Fingerprint enrichment requires 15+ historical recruits. Using wizard
          inputs — score may be less precise.
          <button
            className="btn btn-sm"
            style={{ marginLeft: 10, background: "#2d2305", color: "#fcd34d", border: "none" }}
          >
            View What&apos;s Missing
          </button>
        </div>
      )}
    </div>
  );
}

export default function FitScorePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const { st, unlock, toast } = useFlow();
  const [showInvite, setShowInvite] = React.useState(false);

  const p =
    VGM_DATA.players.find((x) => x.id === params.id) ?? VGM_DATA.players[0];
  const justUpgraded = search.get("upgraded") === "1";

  const isKirk = p.id === "kirk";
  const eightDim = isKirk && st.athleteDna;
  const fit = eightDim ? p.fit : p.fit5;
  const dims = VGM_DATA.dimMeta.filter(
    (m) => eightDim || VGM_DATA.baseDims.includes(m.id)
  );
  const lockedDims = VGM_DATA.dimMeta.filter(
    (m) => !eightDim && !VGM_DATA.baseDims.includes(m.id)
  );
  const unlocked = st.unlocked.includes(p.id);

  return (
    <div className="fade-in" style={{ maxWidth: 780, margin: "0 auto" }}>
      <button
        className="btn btn-ghost btn-sm"
        style={{ marginBottom: 14 }}
        onClick={() => router.push("/gm")}
      >
        ← Back
      </button>

      <div
        className="card-dark accent p-5 md:p-8"
        style={{ display: "flex", flexDirection: "column", gap: "calc(var(--u)*3)" }}
      >
        {/* athlete header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
            alignItems: "flex-start",
          }}
        >
          <div>
            <div className="t-display text-3xl md:text-[42px]" style={{ lineHeight: 1 }}>
              {p.name}
            </div>
            <div style={{ fontSize: 13, color: "var(--mid)", marginTop: 6 }}>
              {p.pos} · {p.height} · Class {p.classYear} · {p.school}
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", marginTop: 3 }}>
              Archetype: <strong>{p.archetype}</strong> · {p.stats}
            </div>
          </div>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <div style={{ textAlign: "center" }}>
              <div className="t-label">OVR</div>
              <div
                className="t-display"
                style={{ fontSize: 44, color: "var(--teal)", lineHeight: 1 }}
              >
                {p.ovr}
              </div>
              <span className="pill pill-teal-outline" style={{ fontSize: 10 }}>
                {p.tier} Tier
              </span>
            </div>
          </div>
        </div>

        {/* fit score */}
        <div>
          <SectionHead>Fit Score</SectionHead>
          {justUpgraded && (
            <div className="pill pill-teal" style={{ marginBottom: 10 }}>
              🔍 Athlete DNA redeemed — upgraded to 8 dimensions (+{p.fit - p.fit5})
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <BarFill pct={fit} height={14} />
            <span
              className="t-display"
              style={{ fontSize: 38, color: "var(--white)", whiteSpace: "nowrap" }}
            >
              {fit} <span style={{ fontSize: 20, color: "var(--mid)" }}>/ 100</span>
            </span>
          </div>
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              marginTop: 12,
              alignItems: "center",
            }}
          >
            <span
              className="t-mono"
              style={{
                fontSize: 10,
                padding: "3px 9px",
                borderRadius: 4,
                background: "var(--navy-deep)",
                color: "var(--teal)",
                border: "1px solid var(--line-dark)",
              }}
            >
              {eightDim ? "8-DIMENSION" : "5-DIMENSION"}
            </span>
            <DnaBadge status={st.dnaStatus} onClick={() => router.push("/wizard")} />
            <AthleteDnaBadge active={eightDim} />
            <RecBadge rec={p.rec} />
          </div>
        </div>

        {st.dnaStatus === "stated" && <InsufficientSampleAlert />}

        {/* dimension breakdown */}
        <div>
          <SectionHead>Dimension Breakdown</SectionHead>
          <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            {dims.map((m, i) => (
              <DimRow key={m.id} meta={m} value={p.dims[m.id]} delay={i * 70} />
            ))}
          </div>
          {lockedDims.length > 0 && (
            <div
              style={{
                marginTop: 14,
                border: "1px dashed rgba(255,255,255,0.25)",
                borderRadius: 8,
                padding: "14px 16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div style={{ fontSize: 12.5, color: "var(--mid)", lineHeight: 1.5 }}>
                <strong style={{ color: "rgba(255,255,255,0.85)" }}>
                  🔒 {lockedDims.length} dimensions locked
                </strong>
                <br />
                {lockedDims.map((m) => m.label).join(" · ")} unlock when{" "}
                {isKirk ? p.name.split(" ")[0] : "the athlete"} redeems an Athlete
                DNA invite.
              </div>
              {isKirk && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => setShowInvite(true)}
                >
                  Issue Invite Code
                </button>
              )}
            </div>
          )}
        </div>

        {/* comp players */}
        <div>
          <SectionHead>Comp Players</SectionHead>
          {isKirk || unlocked ? (
            <CompRail comps={VGM_DATA.comps} />
          ) : (
            <div
              style={{
                border: "1px dashed rgba(255,255,255,0.25)",
                borderRadius: 8,
                padding: "16px",
                fontSize: 12.5,
                color: "var(--mid)",
              }}
            >
              🔒 Comp history is part of Full Unlock — 1 credit.
            </div>
          )}
        </div>

        {/* rationale */}
        <div>
          <SectionHead>GM Rationale</SectionHead>
          <p
            style={{
              fontSize: 13.5,
              lineHeight: 1.65,
              color: "rgba(255,255,255,0.88)",
              margin: 0,
              textWrap: "pretty",
            }}
          >
            {p.rationale}
          </p>
        </div>

        {/* actions */}
        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            borderTop: "1px solid var(--line-dark)",
            paddingTop: "calc(var(--u)*2.5)",
          }}
        >
          <button className="btn btn-ghost" onClick={() => toast("Added to Monitor list")}>
            Monitor
          </button>
          <button
            className="btn btn-primary"
            disabled={unlocked}
            onClick={() => unlock(p.id)}
          >
            {unlocked ? "✓ Unlocked" : "Full Unlock — 1 credit"}
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => toast("Contact request sent to " + p.school)}
          >
            Contact Coach
          </button>
        </div>
      </div>

      {showInvite && <InviteModal onClose={() => setShowInvite(false)} />}
    </div>
  );
}
