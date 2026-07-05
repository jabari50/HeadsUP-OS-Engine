/* Public ecosystem brief — the shareable v4 intelligence asset as a live
   page. Aggregate ecosystem stats only (lib/ecosystem.ts); zero athlete
   data, zero auth, nothing role-gated. */

import EcosystemTicker from "@/components/EcosystemTicker";
import { ECOSYSTEM_STATS, TICKER_TEXT_COLOR } from "@/lib/ecosystem";

export const metadata = {
  title: "The SportsInfluencer Ecosystem — HeadsUP MEDIA",
  description:
    "Social reach, network magnitude, circuit integration & industry authority · Dallas, TX",
};

const MEGA = ECOSYSTEM_STATS.slice(0, 4);
const NETWORK = ECOSYSTEM_STATS.slice(4, 10);
const MOAT = ECOSYSTEM_STATS.slice(10, 14);
const SOCIAL = ECOSYSTEM_STATS.slice(14);

function StatCard({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div className="panel text-center">
      <div className={`stat ${TICKER_TEXT_COLOR[color as keyof typeof TICKER_TEXT_COLOR]}`}>
        {value}
      </div>
      <div className="mt-1 text-[10px] uppercase tracking-[1px] text-slate-500">{label}</div>
    </div>
  );
}

export default function EcosystemPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 pb-20 pt-8">
      <header className="overflow-hidden rounded-2xl border border-edge2 bg-panel">
        <div className="stripe" />
        <div className="px-7 pb-5 pt-6">
          <div className="font-display text-[11px] font-bold uppercase tracking-[3px] text-slate-500">
            HeadsUp OS · Neural Data Agency · HeadsUp MEDIA · The Heads Up! Foundation
          </div>
          <h1 className="mt-2 font-display text-4xl font-extrabold uppercase leading-none text-ink">
            The SportsInfluencer <span className="text-hgreen">Ecosystem</span>
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Full intelligence brief — social reach, network magnitude, circuit integration &amp;
            industry authority · Dallas, TX
          </p>
        </div>
        <div className="grid grid-cols-2 border-t border-edge md:grid-cols-4">
          {MEGA.map((stat) => (
            <div key={stat.label} className="border-r border-edge p-5 text-center last:border-r-0">
              <div className={`stat ${TICKER_TEXT_COLOR[stat.color]}`}>{stat.value}</div>
              <div className="mt-1 text-[10px] uppercase tracking-[1px] text-slate-500">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </header>

      <div className="sec-label">Network by Level</div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {NETWORK.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="sec-label">Social Footprint</div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {SOCIAL.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="sec-label">The Uncloneable Moat</div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {MOAT.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

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
