"use client";

/* The Virtual GM — standalone front-office prototype.
   Runs entirely on the bundled seed snapshot (real pipeline athletes) with
   zero env/DB dependencies, so it demos anywhere. The standalone tier shows
   scouting-directory data; "HeadsUP OS Intelligence" is the upgrade layer
   (OVR, recommendation, Neck Up 8). Upgrade is SIMULATED here — no billing.
   All OS-tier values are labeled DEMO (see prototype-pool.ts). */

import { useEffect, useMemo, useState } from "react";

import {
  SEED_POOL,
  demoIntel,
  type DemoRec,
  type SeedAthlete,
} from "@/lib/vgm/prototype-pool";

const NAVY = "#112240";
const TEAL = "#00c896";
const GOLD = "#f0b429";

const REC_COLOR: Record<DemoRec, string> = {
  PURSUE: TEAL,
  MONITOR: GOLD,
  EVALUATE: "#7aa7ff",
  PASS: "#8b9bb4",
};

const fmtH = (h: number | null) => (h == null ? "—" : `${Math.floor(h / 12)}'${h % 12}"`);

interface PoolRow extends SeedAthlete {
  key: string;
}

const POOL: PoolRow[] = SEED_POOL.map((a, i) => ({ ...a, key: `${i}-${a.name}` }));

export default function PrototypePage() {
  const [osTier, setOsTier] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [board, setBoard] = useState<string[]>([]);
  const [selected, setSelected] = useState<PoolRow | null>(null);
  const [q, setQ] = useState("");
  const [pos, setPos] = useState("ALL");
  const [level, setLevel] = useState("ALL");

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("vgm-proto") ?? "{}");
      if (Array.isArray(saved.board)) setBoard(saved.board);
      if (saved.osTier === true) setOsTier(true);
    } catch {}
  }, []);
  useEffect(() => {
    localStorage.setItem("vgm-proto", JSON.stringify({ board, osTier }));
  }, [board, osTier]);

  const filtered = useMemo(
    () =>
      POOL.filter(
        (a) =>
          (pos === "ALL" || a.pos === pos) &&
          (level === "ALL" || a.level === level) &&
          (!q || `${a.name} ${a.school ?? ""}`.toLowerCase().includes(q.toLowerCase()))
      ),
    [q, pos, level]
  );

  const boardRows = board
    .map((k) => POOL.find((a) => a.key === k))
    .filter((a): a is PoolRow => Boolean(a));

  const toggleBoard = (key: string) =>
    setBoard((b) => (b.includes(key) ? b.filter((k) => k !== key) : [...b, key]));
  const move = (i: number, d: number) =>
    setBoard((b) => {
      const next = [...b];
      const j = i + d;
      if (j < 0 || j >= next.length) return b;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  return (
    <div className="min-h-screen" style={{ background: "#0b1730", color: "#e8eef7" }}>
      {/* Masthead */}
      <header style={{ background: NAVY }} className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[3px] text-white/50">
              The Virtual GM · Standalone Front Office
            </div>
            <div className="text-2xl font-extrabold uppercase tracking-wide">
              Virtual <span style={{ color: TEAL }}>GM</span>
              <span className="ml-3 rounded border border-white/20 px-2 py-0.5 align-middle text-[10px] font-bold tracking-[2px] text-white/60">
                PROTOTYPE
              </span>
            </div>
            <div className="mt-0.5 text-[11px] text-white/50">
              We Scout From The Neck Up · {POOL.length} live pipeline athletes
            </div>
          </div>
          <div className="flex items-center gap-3">
            {osTier ? (
              <span
                className="rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-[1.5px]"
                style={{ background: TEAL, color: NAVY }}
              >
                HeadsUP OS Intelligence · Demo
              </span>
            ) : (
              <button
                onClick={() => setShowUpgrade(true)}
                className="rounded-full px-4 py-2 text-[11px] font-bold uppercase tracking-[1.5px] transition hover:brightness-110"
                style={{ background: GOLD, color: NAVY }}
              >
                ⚡ Upgrade to OS Intelligence
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-5 px-5 py-6 lg:grid-cols-[1fr_300px]">
        <section>
          {/* Filters */}
          <div className="mb-4 flex flex-wrap gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name or school…"
              className="w-56 rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-white/30 focus:border-white/40"
            />
            {["ALL", "PG", "SG", "SF", "PF", "C"].map((p) => (
              <button
                key={p}
                onClick={() => setPos(p)}
                className="rounded-md border px-3 py-2 text-[11px] font-bold uppercase tracking-wider transition"
                style={
                  pos === p
                    ? { background: TEAL, color: NAVY, borderColor: TEAL }
                    : { borderColor: "rgba(255,255,255,.15)", color: "rgba(255,255,255,.6)" }
                }
              >
                {p}
              </button>
            ))}
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="rounded-md border border-white/15 bg-[#112240] px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-white/70"
            >
              <option value="ALL">All Levels</option>
              <option value="HS">High School</option>
              <option value="College">College / JUCO</option>
            </select>
          </div>

          {/* Pool table */}
          <div className="overflow-hidden rounded-xl border border-white/10">
            <table className="w-full text-left text-sm">
              <thead style={{ background: NAVY }}>
                <tr className="text-[10px] uppercase tracking-[1.5px] text-white/50">
                  <th className="px-3 py-2.5">Athlete</th>
                  <th className="px-2 py-2.5">Pos</th>
                  <th className="px-2 py-2.5">Class</th>
                  <th className="px-2 py-2.5">Ht / Wt</th>
                  <th className="px-2 py-2.5 text-center">
                    OVR <span style={{ color: GOLD }}>{osTier ? "· demo" : "🔒"}</span>
                  </th>
                  <th className="px-2 py-2.5 text-center">
                    Rec {osTier ? "" : "🔒"}
                  </th>
                  <th className="px-2 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => {
                  const intel = demoIntel(a.name);
                  const onBoard = board.includes(a.key);
                  return (
                    <tr
                      key={a.key}
                      className="cursor-pointer border-t border-white/5 transition hover:bg-white/5"
                      onClick={() => setSelected(a)}
                    >
                      <td className="px-3 py-2">
                        <div className="font-bold">{a.name}</div>
                        <div className="text-[11px] text-white/40">{a.school ?? "School pending"}</div>
                      </td>
                      <td className="px-2 py-2 text-white/70">{a.pos ?? "—"}</td>
                      <td className="px-2 py-2 text-white/70">{a.cls ?? "—"}</td>
                      <td className="px-2 py-2 text-white/70">
                        {fmtH(a.h)} {a.w ? `· ${a.w}` : ""}
                      </td>
                      <td className="px-2 py-2 text-center">
                        {osTier ? (
                          <span className="font-extrabold" style={{ color: TEAL }}>
                            {intel.ovr}
                          </span>
                        ) : (
                          <span className="select-none text-white/25 blur-[3px]">88</span>
                        )}
                      </td>
                      <td className="px-2 py-2 text-center">
                        {osTier ? (
                          <span
                            className="rounded px-1.5 py-0.5 text-[10px] font-bold"
                            style={{ color: REC_COLOR[intel.rec], border: `1px solid ${REC_COLOR[intel.rec]}` }}
                          >
                            {intel.rec}
                          </span>
                        ) : (
                          <span className="select-none text-[10px] text-white/25 blur-[3px]">PURSUE</span>
                        )}
                      </td>
                      <td className="px-2 py-2 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleBoard(a.key);
                          }}
                          className="rounded border px-2 py-1 text-[10px] font-bold uppercase tracking-wider transition"
                          style={
                            onBoard
                              ? { borderColor: GOLD, color: GOLD }
                              : { borderColor: "rgba(255,255,255,.2)", color: "rgba(255,255,255,.6)" }
                          }
                        >
                          {onBoard ? "On Board ✓" : "+ Board"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center text-white/40">
                      No athletes match those filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[11px] text-white/35">
            Pool: real HeadsUP pipeline athletes (SportsInfluencer + GoPRO intake).{" "}
            {osTier &&
              "OVR / Rec / Neck Up values are illustrative DEMO output — real scores come only from the HU-OS engine."}
          </p>
        </section>

        {/* Draft board */}
        <aside className="h-fit rounded-xl border border-white/10 p-4" style={{ background: NAVY }}>
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[2px] text-white/50">
              My Draft Board
            </span>
            <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: TEAL, color: NAVY }}>
              {boardRows.length}
            </span>
          </div>
          {boardRows.length === 0 ? (
            <p className="text-xs text-white/40">
              Add athletes from the pool to build your board. Ranks persist on this device.
            </p>
          ) : (
            <ol className="space-y-2">
              {boardRows.map((a, i) => (
                <li key={a.key} className="flex items-center gap-2 rounded-lg bg-white/5 px-2 py-1.5">
                  <span className="w-5 text-center text-xs font-extrabold" style={{ color: GOLD }}>
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-bold">{a.name}</div>
                    <div className="text-[10px] text-white/40">
                      {a.pos ?? "—"} · {a.cls ?? "—"}
                      {osTier && (
                        <span style={{ color: TEAL }}> · OVR {demoIntel(a.name).ovr} (demo)</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <button onClick={() => move(i, -1)} className="text-[10px] text-white/40 hover:text-white">▲</button>
                    <button onClick={() => move(i, 1)} className="text-[10px] text-white/40 hover:text-white">▼</button>
                  </div>
                  <button onClick={() => toggleBoard(a.key)} className="text-white/30 hover:text-red-400">✕</button>
                </li>
              ))}
            </ol>
          )}
        </aside>
      </main>

      {/* Athlete detail drawer */}
      {selected && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 p-4 sm:items-center"
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-white/15 p-6"
            style={{ background: NAVY }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xl font-extrabold uppercase">{selected.name}</div>
                <div className="mt-1 text-xs text-white/50">
                  {[selected.pos, selected.school, selected.cls, selected.level].filter(Boolean).join(" · ")}
                </div>
                <div className="mt-1 text-xs text-white/50">
                  {fmtH(selected.h)} {selected.w ? `· ${selected.w} lb` : ""}
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="text-white/40 hover:text-white">✕</button>
            </div>

            <div className="mt-5">
              <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[2px] text-white/50">
                Neck Up Intelligence
                {osTier && (
                  <span className="rounded px-1.5 py-0.5" style={{ background: GOLD, color: NAVY }}>
                    DEMO
                  </span>
                )}
              </div>
              {osTier ? (
                <div className="space-y-1.5">
                  {demoIntel(selected.name).neckUp.map((row) => (
                    <div key={row.label} className="flex items-center gap-2">
                      <span className="w-28 shrink-0 text-[10px] uppercase tracking-wider text-white/50">
                        {row.label}
                      </span>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${row.value * 10}%`, background: TEAL }}
                        />
                      </div>
                      <span className="w-8 text-right text-xs font-bold">{row.value.toFixed(1)}</span>
                    </div>
                  ))}
                  <p className="pt-2 text-[10px] text-white/35">
                    Illustrative demo values — verified scores are one-way HU-OS engine output.
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-white/20 p-5 text-center">
                  <p className="text-sm text-white/60">
                    OVR, recommendation, and the Neck Up 8 live in the HeadsUP OS
                    Intelligence layer.
                  </p>
                  <button
                    onClick={() => {
                      setSelected(null);
                      setShowUpgrade(true);
                    }}
                    className="mt-3 rounded-full px-4 py-2 text-[11px] font-bold uppercase tracking-[1.5px]"
                    style={{ background: GOLD, color: NAVY }}
                  >
                    ⚡ Unlock with OS Intelligence
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upgrade modal */}
      {showUpgrade && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setShowUpgrade(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-white/15 p-6"
            style={{ background: NAVY }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-[10px] font-bold uppercase tracking-[3px]" style={{ color: GOLD }}>
              Upgrade
            </div>
            <h2 className="mt-1 text-xl font-extrabold uppercase">
              HeadsUP <span style={{ color: TEAL }}>OS</span> Intelligence
            </h2>
            <p className="mt-2 text-sm text-white/60">
              Verified engine output layered onto your standalone front office:
              OVR, board recommendations, and the Neck Up 8 behavioral profile.
              Data flows one way — HU-OS → your board. Never fabricated, never
              editable.
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              {[
                ["Scout", "$99/mo · OS scores on your board"],
                ["Coordinator", "$249/mo · + Neck Up profiles & comps"],
                ["GM", "$499/mo · + matchmaking & activation unlocks"],
              ].map(([tier, desc]) => (
                <li key={tier} className="flex justify-between rounded-lg border border-white/10 px-3 py-2">
                  <span className="font-bold">{tier}</span>
                  <span className="text-white/50">{desc}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[10px] text-white/35">
              Illustrative pilot pricing. Founding Operator licenses are provisioned
              directly by HeadsUP — checkout coming with Stripe activation.
            </p>
            <button
              onClick={() => {
                setOsTier(true);
                setShowUpgrade(false);
              }}
              className="mt-4 w-full rounded-full py-2.5 text-sm font-bold uppercase tracking-[1.5px]"
              style={{ background: GOLD, color: NAVY }}
            >
              Simulate Upgrade (Demo)
            </button>
            <button
              onClick={() => setShowUpgrade(false)}
              className="mt-2 w-full py-1 text-xs text-white/40 hover:text-white"
            >
              Not now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
