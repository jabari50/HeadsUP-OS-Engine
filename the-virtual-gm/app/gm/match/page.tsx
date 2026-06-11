"use client";

/* Matchmaking tab (Claude Design prototype: screens-dashboard.jsx →
   MatchTabScreen) */

import React from "react";
import { useRouter } from "next/navigation";
import { VGM_DATA } from "@/lib/vgm/data";
import { BarFill, RecBadge } from "@/components/vgm/ui";
import { AddPlayerModal, InviteModal } from "@/components/vgm/modals";
import { useFlow } from "@/components/vgm/flow";

export default function MatchPage() {
  const router = useRouter();
  const { st, addPlayer, toast } = useFlow();
  const [showAdd, setShowAdd] = React.useState(false);
  const [showInvite, setShowInvite] = React.useState(false);
  const kirk = VGM_DATA.players.find((p) => p.id === "kirk")!;

  return (
    <div className="fade-in" style={{ maxWidth: 720 }}>
      <div
        className="t-display text-2xl md:text-3xl"
        style={{ color: "var(--white)", marginBottom: 6 }}
      >
        Matchmaking
      </div>
      <p style={{ color: "var(--mid)", fontSize: 13, marginTop: 0 }}>
        Score any athlete against your program.{" "}
        {st.athleteDna
          ? "8 dimensions active."
          : "5 dimensions now — 8 when the athlete redeems their DNA invite."}
      </p>
      {st.playerAdded ? (
        <div
          className="card-dark accent"
          style={{
            padding: "calc(var(--u)*2.5)",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <div>
              <div className="t-display" style={{ fontSize: 22 }}>
                {kirk.name} × {VGM_DATA.coach.school}
              </div>
              <div style={{ fontSize: 12, color: "var(--mid)" }}>
                {kirk.pos} · {kirk.archetype}
              </div>
            </div>
            <RecBadge rec={kirk.rec} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <BarFill pct={st.athleteDna ? kirk.fit : kirk.fit5} />
            <span className="t-display" style={{ fontSize: 26, color: "var(--teal)" }}>
              {st.athleteDna ? kirk.fit : kirk.fit5}
            </span>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              className="btn btn-primary"
              onClick={() => router.push("/gm/fit/kirk")}
            >
              Open Fit Score Card →
            </button>
            {!st.athleteDna && (
              <button className="btn btn-ghost" onClick={() => setShowInvite(true)}>
                Issue Athlete DNA Invite
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="card-dark" style={{ padding: "calc(var(--u)*3)", textAlign: "center" }}>
          <p style={{ color: "var(--mid)", fontSize: 13 }}>
            No matchmaking runs yet. Add a player to your board to run your first
            match.
          </p>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
            + Add Player
          </button>
        </div>
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
      {showInvite && <InviteModal onClose={() => setShowInvite(false)} />}
    </div>
  );
}
