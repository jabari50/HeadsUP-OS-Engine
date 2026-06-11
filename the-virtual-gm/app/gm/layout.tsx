"use client";

/* Screen 3 shell — GM workspace: 240px navy sidebar on desktop,
   bottom tab bar on mobile (Claude Design prototype: app.jsx → VgmApp) */

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { OperatorCard, DnaBadge, Wordmark } from "@/components/vgm/ui";
import { useFlow } from "@/components/vgm/flow";

const VGM_TABS = [
  { id: "dashboard", href: "/gm", label: "Dashboard", short: "Dashboard", icon: "▦" },
  { id: "draft", href: "/gm/draft", label: "Draft Board", short: "Draft", icon: "≡" },
  { id: "match", href: "/gm/match", label: "Matchmaking", short: "Match", icon: "⇄" },
  { id: "roster", href: "/gm/roster", label: "My Roster", short: "Roster", icon: "▣" },
  { id: "rib", href: "/gm/rib", label: "RIB", short: "RIB", icon: "✦" },
];

export default function GmLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { st, reset } = useFlow();

  const isActive = (href: string) =>
    href === "/gm" ? pathname === "/gm" : pathname.startsWith(href);

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* desktop sidebar */}
      <aside
        className="hidden md:flex"
        style={{
          width: 240,
          flexShrink: 0,
          background: "var(--navy)",
          borderRight: "1px solid var(--line-dark)",
          flexDirection: "column",
          padding: "calc(var(--u)*2.5) calc(var(--u)*2)",
        }}
      >
        <div style={{ padding: "0 8px 22px" }}>
          <Wordmark light size={12} />
        </div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {VGM_TABS.map((t) => {
            const active = isActive(t.href);
            return (
              <Link
                key={t.id}
                href={t.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "11px 12px",
                  borderRadius: 6,
                  textAlign: "left",
                  fontSize: 13.5,
                  fontWeight: 600,
                  textDecoration: "none",
                  background: active ? "var(--teal-dim)" : "transparent",
                  color: active ? "var(--teal)" : "rgba(255,255,255,0.72)",
                  borderLeft: active
                    ? "3px solid var(--teal)"
                    : "3px solid transparent",
                }}
              >
                <span style={{ fontSize: 14, width: 16 }}>{t.icon}</span>
                {t.label}
              </Link>
            );
          })}
        </nav>
        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
          <OperatorCard credits={st.credits} />
          <button
            onClick={reset}
            style={{
              background: "none",
              border: "none",
              color: "rgba(255,255,255,0.3)",
              fontSize: 10.5,
              letterSpacing: "0.06em",
              textAlign: "left",
              padding: "0 8px",
            }}
          >
            ↺ Reset demo
          </button>
        </div>
      </aside>

      {/* main */}
      <main
        className="dark-scroll flex-1 overflow-y-auto p-4 pb-[86px] md:p-7 md:px-8 md:pb-7"
        style={{ background: "var(--navy-deep)" }}
      >
        {/* mobile header */}
        <div
          className="flex md:hidden"
          style={{
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 14,
            gap: 8,
          }}
        >
          <Wordmark light size={10} />
          <DnaBadge status={st.dnaStatus} onClick={() => router.push("/wizard")} />
        </div>
        {children}
      </main>

      {/* mobile bottom nav */}
      <nav
        className="flex md:hidden"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "var(--navy)",
          borderTop: "1px solid var(--line-dark)",
          zIndex: 500,
        }}
      >
        {VGM_TABS.map((t) => {
          const active = isActive(t.href);
          return (
            <Link
              key={t.id}
              href={t.href}
              style={{
                flex: 1,
                minHeight: 56,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 3,
                textDecoration: "none",
                color: active ? "var(--teal)" : "var(--mid)",
              }}
            >
              <span style={{ fontSize: 16 }}>{t.icon}</span>
              <span style={{ fontSize: 9.5, fontWeight: 600 }}>{t.short}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
