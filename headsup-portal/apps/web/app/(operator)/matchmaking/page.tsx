import { redirect } from "next/navigation";

import MatchmakingClient from "@/components/MatchmakingClient";
import { getAuth, getOperator } from "@/lib/auth";
import { serviceClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

const MATCHMAKING_TIERS = ["GM", "Coordinator", "White Label"];

export default async function MatchmakingPage() {
  const auth = await getAuth();
  if (!auth) redirect("/auth/login");

  const operator = await getOperator(auth.user.id);
  const licensed =
    auth.role === "System_Admin" ||
    (operator?.license_tier && MATCHMAKING_TIERS.includes(operator.license_tier));
  if (!licensed) redirect("/dashboard");

  const db = serviceClient();
  const [{ data: athletes }, { data: programs }] = await Promise.all([
    db.from("athletes").select("id, name, position").order("created_at", { ascending: false }).limit(100),
    db.from("programs").select("id, name").order("name"),
  ]);

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Matchmaking</h1>
      <p className="mb-6 text-sm text-slate-400">
        Fit = style ×.30 + need ×.30 + level ×.25 + cultural ×.15 — weights locked in the engine.
      </p>
      <MatchmakingClient
        athletes={(athletes ?? []).map((a) => ({ id: a.id, label: `${a.name} (${a.position ?? "—"})` }))}
        programs={(programs ?? []).map((p) => ({ id: p.id, label: p.name }))}
      />
    </div>
  );
}
