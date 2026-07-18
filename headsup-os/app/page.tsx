import Link from "next/link";
import { PIPELINES } from "@/lib/pipelines";

const statusLabel: Record<string, string> = {
  active: "LIVE",
  building: "BUILDING",
};

const statusDot: Record<string, string> = {
  active: "bg-[#00c896]",
  building: "bg-[#febc2e]",
};

const oswald = { fontFamily: "var(--font-oswald)" };
const mono = { fontFamily: "var(--font-jbmono)" };

// Terminal grid backdrop for the hero panel.
const gridBg = {
  backgroundColor: "#0c1116",
  backgroundImage:
    "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
  backgroundSize: "26px 26px",
};

export default function CommandCenter() {
  return (
    <div className="min-h-screen bg-[#0a1018] text-[#eaf2ff] font-sans">
      <header className="flex items-center justify-between border-b border-[#1c2a3a] px-8 py-4">
        <div className="flex items-baseline gap-3">
          <span style={oswald} className="text-xl font-semibold tracking-wide text-white">
            HEADSUP <span className="text-[#00c896]">OS</span>
          </span>
          <span style={mono} className="text-[11px] text-[#5b738c]">
            v4.1.0
          </span>
        </div>
        <nav className="flex items-center gap-5 text-xs text-[#7e94ad]">
          <Link href="/roster" className="hover:text-white transition-colors">Roster</Link>
          <Link href="/draft-board" className="hover:text-white transition-colors">Draft Board</Link>
          <span style={mono} className="flex items-center gap-2 text-[#00c896]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#00c896] inline-block animate-pulse" />
            ENGINE ONLINE
          </span>
        </nav>
      </header>

      <main className="px-8 py-10 max-w-6xl mx-auto">
        <section
          style={gridBg}
          className="relative overflow-hidden rounded-2xl border border-[#1c2a3a] p-8 sm:p-10"
        >
          <div style={mono} className="text-[11px] text-[#5dcaa5] mb-3">
            hu-os // sovereign asset platform v4.1.0
          </div>
          <h1
            style={oswald}
            className="text-5xl sm:text-6xl font-semibold leading-none tracking-wide text-[#eaf2ff]"
          >
            HEADSUP <span className="text-[#00c896]">OS</span>
          </h1>
          <div style={mono} className="mt-3 text-[11px] uppercase tracking-[0.22em] text-[#7e94ad]">
            We scout from the neck up
          </div>
          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-[#b9c8db]">
            The behavioral intelligence operating system for athletes. We scout from the
            neck up — turning highlight tape into verified human truth across evaluation,
            development, and the front office. Built on 25 years of intelligence and
            longitudinal data. Zero hallucination by design.
          </p>
          <div
            style={mono}
            className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 text-[12px] text-[#7e94ad]"
          >
            <span><span className="text-[#00c896]">▸</span> intake</span>
            <span><span className="text-[#00c896]">▸</span> neural_audit</span>
            <span><span className="text-[#00c896]">▸</span> virtual_gm</span>
            <Link
              href="/onboard"
              style={mono}
              className="inline-flex items-center gap-2 rounded-lg border border-[#0f6e56] bg-[#0c211b] px-4 py-2 text-[13px] text-[#5dcaa5] transition-colors hover:border-[#00c896] hover:bg-[#0f2a22]"
            >
              ▸ run intake ↵
            </Link>
          </div>
        </section>

        <div style={mono} className="mt-10 mb-4 text-[11px] uppercase tracking-[0.2em] text-[#5b738c]">
          {"// select a pipeline to enter its workspace"}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {PIPELINES.map((p) => (
            <Link
              key={p.id}
              href={`/${p.slug}`}
              className="group relative rounded-xl border border-[#1c2a3a] bg-[#0e1620] p-5 transition-all hover:border-[#0f6e56] hover:bg-[#11202e]"
            >
              <div className="flex items-center justify-between">
                <span style={mono} className="text-[13px] text-[#00c896]">
                  {String(p.id).padStart(2, "0")}
                </span>
                <span style={mono} className="flex items-center gap-1.5 text-[10px] tracking-wider text-[#7e94ad]">
                  <span className={`h-1.5 w-1.5 rounded-full ${statusDot[p.status]}`} />
                  {statusLabel[p.status]}
                </span>
              </div>

              <h2 style={oswald} className="mt-3 text-[17px] font-medium tracking-wide text-white">
                {p.name}
              </h2>
              <p className="mt-1 text-[12px] leading-relaxed text-[#7e94ad]">
                {p.description}
              </p>

              <span className="absolute right-4 bottom-4 text-[#2a3a4d] transition-colors group-hover:text-[#00c896]">
                →
              </span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
