"use client";

/* Draft Board (full) — filterable by recommendation
   (Claude Design prototype: screens-dashboard.jsx → DraftBoardScreen) */

import React from "react";
import { useRouter } from "next/navigation";
import { VGM_DATA, type Player } from "@/lib/vgm/data";
import { PlayerCard } from "@/components/vgm/ui";
import { AddPlayerModal } from "@/components/vgm/modals";
import { useFlow } from "@/components/vgm/flow";

const FILTERS = ["ALL", "PURSUE", "MONITOR", "EVALUATE", "PASS"] as const;

export default function DraftBoardPage() {
  const router = useRouter();
  const { st, unlock, addPlayer, toast } = useFlow();
  const [filter, setFilter] = React.useState<(typeof FILTERS)[number]>("ALL");
  const [showAdd, setShowAdd] = React.useState(false);

  const pool = VGM_DATA.players
    .filter((p) => p.id !== "kirk" || st.playerAdded)
    .filter((p) => filter === "ALL" || p.rec === filter)
    .sort((a, b) => b.fit - a.fit);

  const openPlayer = (p: Player, unlockIntent: boolean) => {
    if (unlockIntent && !st.unlocked.includes(p.id)) unlock(p.id);
    router.push(`/gm/fit/${p.id}`);
  };

  return (
    <div className="fade-in">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 10,
          marginBottom: "calc(var(--u)*2)",
        }}
      >
        <div className="t-display text-2xl md:text-3xl" style={{ color: "var(--white)" }}>
          Draft Board
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>
          + Add Player
        </button>
      </div>
      <div
        style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: "calc(var(--u)*2)" }}
      >
        {FILTERS.map((f) => (
          <button
            key={f}
            className={"pill " + (filter === f ? "pill-teal" : "pill-gray")}
            style={{ cursor: "pointer", border: "none" }}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>
      <div
        className="grid grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(320px,1fr))]"
        style={{ gap: 12 }}
      >
        {pool.map((p) => (
          <PlayerCard
            key={p.id}
            p={p}
            dnaActive={st.dnaStatus}
            athleteDna={st.athleteDna}
            onOpen={openPlayer}
          />
        ))}
      </div>
      {pool.length === 0 && (
        <p style={{ color: "var(--mid)" }}>No players match this filter.</p>
      )}

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
