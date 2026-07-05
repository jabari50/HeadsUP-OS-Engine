/* Ecosystem stats ticker — fixed overlay along the bottom of the command
   center. Stats come from lib/ecosystem.ts (the v4 intelligence brief).
   Pure CSS marquee; pauses on hover; respects prefers-reduced-motion. */

import { ECOSYSTEM_STATS, TICKER_TEXT_COLOR } from "@/lib/ecosystem";

function TickerRun() {
  return (
    <>
      {ECOSYSTEM_STATS.map((stat) => (
        <span key={stat.label} className="ticker-item">
          <span className={`ticker-value ${TICKER_TEXT_COLOR[stat.color]}`}>{stat.value}</span>
          <span className="ticker-label">{stat.label}</span>
          <span className="ticker-dot">·</span>
        </span>
      ))}
    </>
  );
}

export default function EcosystemTicker() {
  return (
    <div className="ticker-shell" aria-label="SportsInfluencer ecosystem statistics">
      <div className="stripe" />
      <div className="ticker-viewport">
        {/* content duplicated once for a seamless -50% loop */}
        <div className="ticker-track">
          <TickerRun />
          <TickerRun />
        </div>
      </div>
    </div>
  );
}
