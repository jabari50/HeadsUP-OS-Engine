"use client";

/* Demo flow state for the TABC prototype flow — Coach DNA status, athlete
   DNA redemption, credits, and unlocks. Persisted to sessionStorage so the
   state survives route navigation during a floor demo. */

import React from "react";
import type { DnaStatus } from "@/lib/vgm/data";
import { VGM_DATA } from "@/lib/vgm/data";

export interface FlowState {
  dnaStatus: DnaStatus;
  athleteDna: boolean;
  playerAdded: boolean;
  credits: number;
  unlocked: string[];
}

const INITIAL: FlowState = {
  dnaStatus: "pending",
  athleteDna: false,
  playerAdded: false,
  credits: VGM_DATA.coach.credits,
  unlocked: [],
};

interface FlowContextValue {
  st: FlowState;
  toast: (msg: string) => void;
  completeWizard: () => void;
  addPlayer: () => void;
  redeemAthleteDna: () => void;
  unlock: (id: string) => void;
  reset: () => void;
}

const FlowContext = React.createContext<FlowContextValue | null>(null);

const STORAGE_KEY = "vgm-demo-flow";

export function FlowProvider({ children }: { children: React.ReactNode }) {
  const [st, setSt] = React.useState<FlowState>(INITIAL);
  const [toastMsg, setToastMsg] = React.useState<string | null>(null);
  const toastTimer = React.useRef<ReturnType<typeof setTimeout>>();

  React.useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) setSt({ ...INITIAL, ...JSON.parse(raw) });
    } catch {}
  }, []);

  const update = (patch: Partial<FlowState>) =>
    setSt((s) => {
      const next = { ...s, ...patch };
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });

  const toast = (msg: string) => {
    setToastMsg(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(null), 2600);
  };

  const value: FlowContextValue = {
    st,
    toast,
    completeWizard: () => update({ dnaStatus: "stated" }),
    addPlayer: () => update({ playerAdded: true }),
    redeemAthleteDna: () => update({ athleteDna: true }),
    unlock: (id) => {
      if (st.unlocked.includes(id)) return;
      if (st.credits <= 0) {
        toast("Out of credits — upgrade your tier");
        return;
      }
      update({ unlocked: [...st.unlocked, id], credits: st.credits - 1 });
      toast("Full profile unlocked — 1 credit used");
    },
    reset: () => {
      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch {}
      setSt(INITIAL);
      toast("Demo reset");
    },
  };

  return (
    <FlowContext.Provider value={value}>
      {children}
      {toastMsg && <div className="vgm-toast">{toastMsg}</div>}
    </FlowContext.Provider>
  );
}

export function useFlow(): FlowContextValue {
  const ctx = React.useContext(FlowContext);
  if (!ctx) throw new Error("useFlow must be used inside FlowProvider");
  return ctx;
}
