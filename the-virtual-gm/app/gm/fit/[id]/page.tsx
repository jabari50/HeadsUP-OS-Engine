"use client";

/* Player Detail — live verified athlete: real OVR + Neck Up attribute profile.
   The relational Fit Score vs Coach DNA is matchmaking IP (not yet wired), so it
   is shown as "pending Coach DNA", not fabricated. */

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useLivePlayer } from "@/lib/vgm/live-pool";
import { BarFill, DnaBadge, RecBadge, SectionHead } from "@/components/vgm/ui";
import { useFlow } from "@/components/vgm/flow";

export default function PlayerDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { st, toast } = useFlow();
  const { player: p, loading, error } = useLivePlayer(params.id);

  const back = (
    <button className="btn btn-ghost btn-sm" style={{ marginBottom: 14 }} onClick={() => router.push("/gm/draft")}>
      ← Back to Draft Board
    </button>
  );

  if (loading) {
    return <div className="fade-in" style={{ maxWidth: 780, margin: "0 auto" }}>{back}<p style={{ color: "var(--mid)" }}>Loading athlete…</p></div>;
  }
  if (error || !p) {
    return (
      <div className="fade-in" style={{ maxWidth: 780, margin: "0 auto" }}>
        {back}
        <p style={{ color: "var(--mid)" }}>Athlete not found in your verified pool.</p>
      </div>
    );
  }

  const tags = p.compShort && p.compShort !== "—" ? p.compShort.split(" · ") : [];

  return (
    <div className="fade-in" style={{ maxWidth: 780, margin: "0 auto" }}>
      {back}

      <div className="card-dark accent p-5 md:p-8" style={{ display: "flex", flexDirection: "column", gap: "calc(var(--u)*3)" }}>
        {/* header */}
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
          <div>
            <div className="t-display text-3xl md:text-[42px]" style={{ lineHeight: 1 }}>
              {p.name}
            </div>
            <div style={{ fontSize: 13, color: "var(--mid)", marginTop: 6 }}>
              {[p.pos, p.classYear !== "—" ? `Class ${p.classYear}` : null, p.school]
                .filter(Boolean)
                .join(" · ")}
              {p.gpa ? ` · GPA ${p.gpa}` : ""}
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", marginTop: 3 }}>
              Market Read: <strong>{p.archetype}</strong>
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div className="t-label">OVR</div>
            <div className="t-display" style={{ fontSize: 44, color: "var(--teal)", lineHeight: 1 }}>
              {p.ovr}
            </div>
            <span className="pill pill-teal-outline" style={{ fontSize: 10 }}>
              {p.tier} confidence
            </span>
          </div>
        </div>

        {/* fit (OVR baseline) */}
        <div>
          <SectionHead>Fit Score</SectionHead>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <BarFill pct={p.fit} height={14} />
            <span className="t-display" style={{ fontSize: 38, color: "var(--white)", whiteSpace: "nowrap" }}>
              {p.fit} <span style={{ fontSize: 20, color: "var(--mid)" }}>/ 100</span>
            </span>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12, alignItems: "center" }}>
            <RecBadge rec={p.rec} />
            <DnaBadge status={st.dnaStatus} onClick={() => router.push("/wizard")} />
            <span style={{ fontSize: 11.5, color: "var(--mid)" }}>
              Showing Overall — program-specific Fit unlocks when Coach DNA is set.
            </span>
          </div>
        </div>

        {/* neck up attribute profile (real) */}
        <div>
          <SectionHead>Neck Up Profile</SectionHead>
          <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            {p.neckUp.map((row, i) => (
              <div
                key={row.label}
                style={{ display: "grid", gridTemplateColumns: "minmax(120px, 168px) 1fr 64px", alignItems: "center", gap: 12 }}
              >
                <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>
                  {row.label}
                </span>
                <BarFill pct={row.value * 10} delay={i * 60} />
                <span className="t-mono" style={{ fontSize: 12, textAlign: "right", color: "rgba(255,255,255,0.6)" }}>
                  {row.value.toFixed(1)} / 10
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* tags */}
        {tags.length > 0 && (
          <div>
            <SectionHead>Scouting Tags</SectionHead>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {tags.map((t) => (
                <span key={t} className="pill pill-gray">{t}</span>
              ))}
            </div>
          </div>
        )}

        {/* actions */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", borderTop: "1px solid var(--line-dark)", paddingTop: "calc(var(--u)*2.5)" }}>
          <button className="btn btn-ghost" onClick={() => toast("Added to Monitor list")}>
            Monitor
          </button>
          <button className="btn btn-primary" onClick={() => toast("Contact request sent to " + p.school)}>
            Contact Coach
          </button>
        </div>
      </div>
    </div>
  );
}
