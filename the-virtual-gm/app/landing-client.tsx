"use client";

/* Screen 1 — Landing / Sign-Up entry (Claude Design prototype:
   screens-onboarding.jsx → LandingScreen) */

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { VgmLockup, Wordmark } from "@/components/vgm/ui";

const HOW_IT_WORKS: [string, string, string][] = [
  [
    "01",
    "Build your Coach DNA",
    "A 10-step intake captures how you actually coach, recruit, and win.",
  ],
  [
    "02",
    "Match against real athletes",
    "Every prospect gets a Fit Score across up to 8 dimensions — yours, not generic.",
  ],
  [
    "03",
    "Recruit like a front office",
    "Draft board, comp players, and a weekly Roster Intelligence Brief.",
  ],
];

export function LandingScreen() {
  const router = useRouter();
  const [how, setHow] = React.useState(false);
  const onStart = () => router.push("/signup");

  return (
    <div
      className="court-tex fade-in dark-scroll"
      style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "calc(var(--u)*2.5) calc(var(--u)*3)",
        }}
      >
        <Wordmark light size={14} />
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Link
            href="/login"
            style={{
              fontSize: 11,
              color: "var(--mid)",
              textDecoration: "none",
              letterSpacing: "0.04em",
            }}
          >
            Operator Login
          </Link>
          <button className="btn btn-ghost btn-sm" onClick={onStart}>
            Coach Log In
          </button>
        </div>
      </header>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "calc(var(--u)*4) calc(var(--u)*3)",
          gap: "calc(var(--u)*2.5)",
        }}
      >
        <span className="pill pill-teal-outline">HeadsUp OS</span>
        <div className="hidden sm:block">
          <VgmLockup size={96} />
        </div>
        <div className="sm:hidden">
          <VgmLockup size={56} />
        </div>
        <p
          style={{
            color: "var(--teal)",
            fontWeight: 500,
            fontSize: 18,
            maxWidth: 520,
            margin: 0,
            textWrap: "pretty",
          }}
        >
          Your AI-powered front office. Built for coaches who recruit to win.
        </p>
        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            justifyContent: "center",
            marginTop: 8,
          }}
        >
          <button
            className="btn btn-primary"
            style={{ fontSize: 15, padding: "14px 26px" }}
            onClick={onStart}
          >
            Start Free — No Card Required
          </button>
          <button
            className="btn btn-ghost"
            style={{ fontSize: 15, padding: "14px 26px" }}
            onClick={() => setHow(!how)}
          >
            See How It Works
          </button>
        </div>
        <Link
          href="/join"
          style={{
            color: "var(--teal)",
            fontSize: 13,
            textDecoration: "underline",
            textUnderlineOffset: 3,
          }}
        >
          Are you an athlete? Get scouted →
        </Link>
      </div>

      {how && (
        <div
          className="fade-in grid grid-cols-1 md:grid-cols-3"
          style={{
            gap: 14,
            padding: "0 calc(var(--u)*3) calc(var(--u)*4)",
            maxWidth: 980,
            margin: "0 auto",
            width: "100%",
          }}
        >
          {HOW_IT_WORKS.map(([n, t, d]) => (
            <div
              key={n}
              className="card-dark accent"
              style={{ padding: "calc(var(--u)*2.5)" }}
            >
              <div className="t-display" style={{ fontSize: 30, color: "var(--teal)" }}>
                {n}
              </div>
              <div className="t-head" style={{ fontSize: 16, margin: "6px 0" }}>
                {t}
              </div>
              <div style={{ fontSize: 13, color: "var(--mid)", lineHeight: 1.5 }}>
                {d}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
