// ============================================================================
// app/admin/ingestion/page.tsx
// HU-OS v4.0.0 | System_Admin ingestion surface (session-gated mount)
// ----------------------------------------------------------------------------
// Client page: resolves the Supabase session, verifies the System_Admin role
// from app_metadata (display-gating only — every API route re-verifies
// server-side; the UI check is convenience, never the security boundary),
// then mounts IngestionCommandCenter with the access token.
// ============================================================================

"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import IngestionCommandCenter from "@/components/IngestionCommandCenter";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

type GateState =
  | { status: "loading" }
  | { status: "unauthenticated" }
  | { status: "forbidden" }
  | { status: "ready"; token: string };

export default function AdminIngestionPage() {
  const [gate, setGate] = useState<GateState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function resolveSession() {
      const { data, error } = await supabase.auth.getSession();
      if (cancelled) return;
      const session = data?.session;
      if (error || !session) {
        setGate({ status: "unauthenticated" });
        return;
      }
      const role = (session.user.app_metadata as Record<string, unknown>)?.role;
      if (role !== "System_Admin") {
        setGate({ status: "forbidden" });
        return;
      }
      setGate({ status: "ready", token: session.access_token });
    }

    resolveSession();

    // Keep the token fresh across refresh cycles
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      if (!session) {
        setGate({ status: "unauthenticated" });
        return;
      }
      const role = (session.user.app_metadata as Record<string, unknown>)?.role;
      setGate(
        role === "System_Admin"
          ? { status: "ready", token: session.access_token }
          : { status: "forbidden" },
      );
    });

    return () => {
      cancelled = true;
      sub?.subscription?.unsubscribe();
    };
  }, []);

  if (gate.status === "loading") {
    return <Shell msg="Resolving session…" />;
  }
  if (gate.status === "unauthenticated") {
    return <Shell msg="Sign in required. This surface is System_Admin only." />;
  }
  if (gate.status === "forbidden") {
    return (
      <Shell msg="Access denied. Ingestion Command Center requires the System_Admin role." />
    );
  }
  return <IngestionCommandCenter accessToken={gate.token} />;
}

function Shell({ msg }: { msg: string }) {
  return (
    <div
      style={{
        background: "#0a192f",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#8892b0",
        fontFamily: "'Montserrat', system-ui, sans-serif",
        fontSize: 14,
        letterSpacing: 0.5,
      }}
    >
      {msg}
    </div>
  );
}
