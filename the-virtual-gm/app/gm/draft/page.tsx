"use client";

/* Draft Board — live verified-athlete pool, filterable by OVR-tier
   recommendation. (Demo mock replaced with the real HU-OS pool.) */

import React from "react";
import { useRouter } from "next/navigation";
import type { Player } from "@/lib/vgm/data";
import { useLivePool } from "@/lib/vgm/live-pool";
import { PlayerCard } from "@/components/vgm/ui";
import { useFlow } from "@/components/vgm/flow";

const FILTERS = ["ALL", "PURSUE", "MONITOR", "EVALUATE", "PASS"] as const;

export default function DraftBoardPage() {
  const router = useRouter();
  const { st, unlock } = useFlow();
  const { players, loading, error } = useLivePool();
  const [filter, setFilter] = React.useState<(typeof FILTERS)[number]>("ALL");

  const rated = (players ?? []).filter((p) => p.rated);
  const awaiting = (players ?? []).length - rated.length;
  const pool = rated
    .filter((p) => filter === "ALL" || p.rec === filter)
    .sort((a, b) => b.ovr - a.ovr);

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
        <span style={{ fontSize: 12, color: "var(--mid)" }}>
          {players ? `${rated.length} rated · ${players.length} verified` : ""}
        </span>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: "calc(var(--u)*2)" }}>
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

      {loading && <p style={{ color: "var(--mid)" }}>Loading verified pool…</p>}
      {error && (
        <p style={{ color: "var(--amber)" }}>
          Couldn&apos;t load the pool. Your operator license may be inactive.
        </p>
      )}

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
      {!loading && !error && pool.length === 0 && (
        <p style={{ color: "var(--mid)" }}>No rated athletes match this filter.</p>
      )}
      {!loading && !error && awaiting > 0 && (
        <p style={{ color: "var(--mid)", fontSize: 12, marginTop: "calc(var(--u)*2)" }}>
          + {awaiting} verified {awaiting === 1 ? "athlete" : "athletes"} awaiting evaluation
          (no OVR / Neck Up score yet).
        </p>
      )}
    </div>
  );
}
