/* Athlete Surface ("Free Agents" under HeadsUP OS) — teal-forward variant of
   the ecosystem v4 shell. Athletes see their OWN data only; they must never
   see operator valuations (Draft Board rank, Fit Scores, unlock state).
   Middleware routes by role first; this check is defense in depth. */

import { redirect } from "next/navigation";

import EcosystemTicker from "@/components/EcosystemTicker";
import { getAuth } from "@/lib/auth";
import { homeForRole, roleMayEnter } from "@/lib/surfaces";

export default async function AthleteLayout({ children }: { children: React.ReactNode }) {
  const auth = await getAuth();
  if (!auth) redirect("/auth/login");
  if (!roleMayEnter(auth.role, "athlete")) redirect(homeForRole(auth.role));

  return (
    <div className="mx-auto min-h-screen max-w-5xl px-4 pb-20 pt-6">
      <header className="mb-4 overflow-hidden rounded-2xl border border-edge2 bg-panel">
        <div className="stripe" />
        <div className="flex flex-wrap items-end justify-between gap-4 px-6 pb-4 pt-5">
          <div>
            <div className="font-display text-[10px] font-bold uppercase tracking-[3px] text-slate-500">
              HeadsUp OS · Neural Data Agency · HeadsUp MEDIA
            </div>
            <div className="mt-1 font-display text-3xl font-extrabold uppercase leading-none tracking-wide text-ink">
              Free <span className="text-hgreen">Agents</span>
            </div>
            <div className="mt-1 text-xs text-slate-400">
              Athlete Surface · We Scout From The Neck Up · Dallas, TX
            </div>
          </div>
          <div className="rounded-lg border border-edge px-3 py-2 text-right text-xs">
            <div className="text-slate-400">{auth.user.email}</div>
            <div className="mt-0.5 font-display font-bold uppercase tracking-wider text-hgreen">
              {auth.role || "No role assigned"}
            </div>
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="mt-8 flex items-center justify-between rounded-xl border border-edge bg-paper px-5 py-3 text-[11px] text-slate-500">
        <span className="font-display font-bold uppercase tracking-[1.5px]">
          HeadsUp OS · Neural Data Agency · HeadsUp MEDIA
        </span>
        <span>Digitizing 25 years of behavioral intelligence · Dallas, TX</span>
      </footer>

      <EcosystemTicker />
    </div>
  );
}
