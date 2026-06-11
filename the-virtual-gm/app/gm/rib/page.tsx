"use client";

/* Screen 7 — Roster Intelligence Brief, the GM morning report
   (Claude Design prototype: screens-match.jsx → RibScreen) */

import { useRouter } from "next/navigation";
import { VGM_DATA } from "@/lib/vgm/data";
import { DnaBadge, GapCard, SectionHead } from "@/components/vgm/ui";
import { useFlow } from "@/components/vgm/flow";

function Divider() {
  return (
    <div
      style={{
        borderTop: "2px solid rgba(0,200,150,0.35)",
        margin: "calc(var(--u)*2.5) 0",
      }}
    ></div>
  );
}

export default function RibPage() {
  const router = useRouter();
  const { st, toast } = useFlow();
  const portal = VGM_DATA.rib.portal.map(
    (id) => VGM_DATA.players.find((p) => p.id === id)!
  );

  return (
    <div className="fade-in" style={{ maxWidth: 720, margin: "0 auto" }}>
      <div className="card-dark accent p-5 md:p-8">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              className="t-display text-[26px] md:text-[34px]"
              style={{ lineHeight: 1.05 }}
            >
              Roster Intelligence Brief
            </div>
            <div style={{ fontSize: 12, color: "var(--mid)", marginTop: 6 }}>
              {VGM_DATA.rib.week} · {VGM_DATA.coach.school}
            </div>
          </div>
          <DnaBadge status={st.dnaStatus} onClick={() => router.push("/wizard")} />
        </div>

        <Divider />
        <SectionHead>Roster Gaps</SectionHead>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {VGM_DATA.gaps.map((g) => (
            <GapCard key={g.pos} gap={g} />
          ))}
        </div>

        <Divider />
        <SectionHead>Portal Watch — Matches Your Profile</SectionHead>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {portal.map((p) => (
            <button
              key={p.id}
              onClick={() => router.push(`/gm/fit/${p.id}`)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                background: "var(--navy-deep)",
                border: "1px solid var(--line-dark)",
                borderRadius: 8,
                padding: "12px 14px",
                color: "var(--white)",
                textAlign: "left",
                flexWrap: "wrap",
              }}
            >
              <span className="t-head" style={{ fontSize: 14, flex: "1 1 140px" }}>
                {p.name}
              </span>
              <span className="t-mono" style={{ fontSize: 12, color: "var(--teal)" }}>
                OVR {p.ovr}
              </span>
              <span className="t-mono" style={{ fontSize: 12, color: "var(--teal)" }}>
                Fit {p.fit5}
              </span>
              <span style={{ fontSize: 11.5, color: "var(--mid)" }}>{p.archetype}</span>
            </button>
          ))}
        </div>

        <Divider />
        <SectionHead>Competitor Moves</SectionHead>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {VGM_DATA.rib.competitor.map((c, i) => (
            <div
              key={i}
              style={{ fontSize: 13, lineHeight: 1.55, color: "rgba(255,255,255,0.88)" }}
            >
              <strong style={{ color: "var(--white)" }}>{c.who}</strong> {c.move} —{" "}
              <span style={{ color: "var(--amber)" }}>{c.impact}</span>
            </div>
          ))}
        </div>

        <Divider />
        <SectionHead>Top 3 Actions This Week</SectionHead>
        <ol
          style={{
            margin: 0,
            padding: 0,
            listStyle: "none",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {VGM_DATA.rib.actions.map((a, i) => (
            <li key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              <span
                className="t-display"
                style={{ color: "var(--teal)", fontSize: 24, lineHeight: 1.1 }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span
                style={{ fontSize: 13.5, lineHeight: 1.55, color: "rgba(255,255,255,0.9)" }}
              >
                {a}
              </span>
            </li>
          ))}
        </ol>

        <Divider />
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="btn btn-ghost btn-sm" onClick={() => window.print()}>
            Print / Save PDF
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => toast("Share link copied")}
          >
            Share Brief
          </button>
        </div>
      </div>
    </div>
  );
}
