/* Authenticated command-center shell — ecosystem v4 editorial layout:
   masthead card with gradient stripe, horizontal nav, ticker overlay.
   Role gating for individual surfaces happens per-page and per-route. */

import Link from "next/link";
import { redirect } from "next/navigation";

import EcosystemTicker from "@/components/EcosystemTicker";
import { getAuth } from "@/lib/auth";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/intake", label: "Intake" },
  { href: "/draft-board", label: "Draft Board" },
  { href: "/matchmaking", label: "Matchmaking" },
];

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const auth = await getAuth();
  if (!auth) redirect("/auth/login");

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
              Command <span className="text-hgreen">Center</span>
            </div>
            <div className="mt-1 text-xs text-slate-400">
              We Scout From The Neck Up · Dallas, TX
            </div>
          </div>
          <div className="rounded-lg border border-edge px-3 py-2 text-right text-xs">
            <div className="text-slate-400">{auth.user.email}</div>
            <div className="mt-0.5 font-display font-bold uppercase tracking-wider text-hblue">
              {auth.role || "No role assigned"}
            </div>
          </div>
        </div>
        <nav className="flex gap-1 border-t border-edge px-4 py-2">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-1.5 font-display text-xs font-bold uppercase tracking-[1.5px] text-slate-400 hover:bg-paper hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>
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
