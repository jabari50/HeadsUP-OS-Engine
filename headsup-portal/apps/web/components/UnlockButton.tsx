"use client";

import { useState } from "react";

import { apiPost } from "@/lib/huosEngine";

export default function UnlockButton({ athleteId }: { athleteId: string }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function unlock(state: string) {
    setBusy(true);
    setMessage("");
    try {
      const result = await apiPost<{ credits_remaining: number }>("/activation/unlock", {
        athlete_id: athleteId,
        state,
      });
      setMessage(`Unlocked — ${result.credits_remaining} credits left. Refresh to view.`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unlock failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="panel">
      <h3 className="mb-2 text-sm font-semibold text-gold">Activation Lock</h3>
      <div className="flex gap-2">
        <button className="btn" disabled={busy} onClick={() => unlock("Preview Unlocked")}>
          Preview (1 credit)
        </button>
        <button className="btn" disabled={busy} onClick={() => unlock("Full Unlocked")}>
          Full (1 credit)
        </button>
      </div>
      {message && <p className="mt-2 text-xs text-slate-400">{message}</p>}
    </div>
  );
}
