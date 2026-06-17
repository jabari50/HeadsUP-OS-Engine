"use client";

import React from "react";
import Link from "next/link";
import { verifyAthlete, rejectAthlete } from "./actions";

export interface PendingAthlete {
  id: string;
  full_name: string | null;
  position: string | null;
  school: string | null;
  graduation_year: number | null;
  ovr: number | string | null;
  market_position: string | null;
  profile_slug: string | null;
  email: string | null;
}

export function ReviewRow({ a }: { a: PendingAthlete }) {
  const [pending, start] = React.useTransition();
  const ovr = a.ovr != null ? Math.round(Number(a.ovr)) : "—";

  return (
    <div
      className="card-dark"
      style={{
        padding: "calc(var(--u)*2)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 14,
        flexWrap: "wrap",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16, minWidth: 0 }}>
        <div style={{ textAlign: "center", minWidth: 48 }}>
          <div className="t-display" style={{ fontSize: 26, color: "var(--teal)", lineHeight: 1 }}>
            {ovr}
          </div>
          <div className="t-label" style={{ fontSize: 9 }}>OVR</div>
        </div>
        <div style={{ minWidth: 0 }}>
          <div className="t-head" style={{ fontSize: 16, color: "var(--white)" }}>
            {a.full_name ?? "Athlete"}
          </div>
          <div style={{ fontSize: 12, color: "var(--mid)" }}>
            {[a.position, a.graduation_year ? `Class ${a.graduation_year}` : null, a.school]
              .filter(Boolean)
              .join(" · ")}
          </div>
          <div style={{ fontSize: 11.5, color: "var(--mid)" }}>
            {a.market_position ? `${a.market_position} · ` : ""}
            {a.email ?? "no email"}
            {a.profile_slug ? (
              <>
                {" · "}
                <Link href={`/profile/${a.profile_slug}`} style={{ color: "var(--teal)" }} target="_blank">
                  view profile ↗
                </Link>
              </>
            ) : null}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          className="btn btn-primary btn-sm"
          disabled={pending}
          onClick={() => start(() => verifyAthlete(a.id))}
        >
          {pending ? "…" : "Verify → Board"}
        </button>
        <button
          className="btn btn-ghost btn-sm"
          disabled={pending}
          onClick={() => start(() => rejectAthlete(a.id))}
        >
          Reject
        </button>
      </div>
    </div>
  );
}
