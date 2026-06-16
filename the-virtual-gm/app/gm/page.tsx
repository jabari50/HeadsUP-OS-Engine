"use client";

/* Screen 3 — GM Dashboard ("classic" layout from the prototype:
   roster gaps + draft board preview left, RIB panel + operator card right;
   single-column feed on mobile) */

import React from "react";
import { useRouter } from "next/navigation";
import { VGM_DATA, type Player } from "@/lib/vgm/data";
import {
  DnaBadge,
  GapCard,
  OperatorCard,
  PlayerCard,
  SectionHead,
} from "@/components/vgm/ui";
import { AddPlayerModal } from "@/components/vgm/modals";
import { useFlow } from "@/components/vgm/flow";

function RibPanel({ onOpenRib }: { onOpenRib: () => void }) {
  return (
    <div className="card-dark accent" style={{ padding: "calc(var(--u)*2)" }}>
      <SectionHead
        right={
          <button className="btn btn-ghost btn-sm" onClick={onOpenRib}>
            Open RIB →
          </button>
        }
      >
        This Week&apos;s Brief
      </SectionHead>
      <ol
        style={{
          margin: 0,
          padding: 0,
          listStyle: "none",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {VGM_DATA.rib.actions.map((a, i) => (
          <li key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span
              className="t-display"
              style={{ color: "var(--teal)", fontSize: 18, lineHeight: 1.2 }}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <span
              style={{ fontSize: 12.5, color: "rgba(255,255,255,0.85)", lineHeight: 1.5 }}
            >
              {a}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function GmDashboardPage() {
  const router = useRouter();
  const { st, unlock, addPlayer, toast } = useFlow();
  const [showAdd, setShowAdd] = React.useState(false);

  const pool = VGM_DATA.players
    .filter((p) => p.id !== "kirk" || st.playerAdded)
    .sort((a, b) => b.fit - a.fit);
  const c = VGM_DATA.coach;

  const openPlayer = (p: Player, unlockIntent: boolean) => {
    if (unlockIntent && !st.unlocked.includes(p.id)) unlock(p.id);
    router.push(`/gm/fit/${p.id}`);
  };

  const draftPreview = (
    <div>
      <SectionHead
        right={
          <span style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>
              + Add Player
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => router.push("/gm/draft")}
            >
              Full Board →
            </button>
          </span>
        }
      >
        Draft Board — Top {Math.min(pool.length, 5)}
      </SectionHead>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: 12,
        }}
      >
        {pool.slice(0, 5).map((p) => (
          <PlayerCard
            key={p.id}
            p={p}
            dnaActive={st.dnaStatus}
            athleteDna={st.athleteDna}
            onOpen={openPlayer}
          />
        ))}
      </div>
    </div>
  );

  const gaps = (
    <div>
      <SectionHead>Roster Gaps</SectionHead>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 10,
        }}
      >
        {VGM_DATA.gaps.map((g) => (
          <GapCard key={g.pos} gap={g} />
        ))}
      </div>
    </div>
  );

  return (
    <div className="fade-in">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 10,
          marginBottom: "calc(var(--u)*2.5)",
        }}
      >
        <div>
          <div
            className="t-display text-2xl md:text-3xl"
            style={{ color: "var(--white)" }}
          >
            {c.name}
          </div>
          <div style={{ fontSize: 12, color: "var(--mid)" }}>
            {c.school} · Season {c.season}
          </div>
        </div>
        <div className="hidden md:block">
          <DnaBadge status={st.dnaStatus} onClick={() => router.push("/wizard")} />
        </div>
      </div>

      <div
        className="grid grid-cols-1 lg:grid-cols-[minmax(0,2.1fr)_minmax(260px,1fr)] items-start"
        style={{ gap: "calc(var(--u)*2.5)" }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "calc(var(--u)*3)" }}>
          {gaps}
          {draftPreview}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <RibPanel onOpenRib={() => router.push("/gm/rib")} />
          <OperatorCard credits={st.credits} />
        </div>
      </div>

      {showAdd && (
        <AddPlayerModal
          onClose={() => setShowAdd(false)}
          onAdd={() => {
            addPlayer();
            setShowAdd(false);
            toast("Devan Kirk added — matchmaking ran against your Coach DNA");
          }}
        />
      )}
    </div>
  );
}
