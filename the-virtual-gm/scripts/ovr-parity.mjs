/* OVR parity check: the TS port (lib/vgm/ovr.ts) vs the Python engine of record
   (ovr_engine.py via /api/v1/athletes/score). Proves the runtime scorer and the
   documented formula agree across the full input space, so "Python is source of
   truth" doesn't silently diverge from what the UI/tests assume.

   Run with the engine up:
     HU_ENGINE_API_KEY=demo-local-key uvicorn hu_os_engine:app --port 8000
     node the-virtual-gm/scripts/ovr-parity.mjs
*/

import {
  calculateOvr,
  to99,
  TECHNICAL_FIELDS,
  NEURAL_FIELDS,
} from "../lib/vgm/ovr.ts";

const ENGINE_URL = process.env.HU_ENGINE_URL ?? "http://127.0.0.1:8000";
const KEY = process.env.HU_ENGINE_API_KEY ?? "demo-local-key";
const N = 400;

const rint = (lo, hi) => Math.floor(Math.random() * (hi - lo + 1)) + lo;

async function scorePython(tech10, neu10, phys10) {
  const technical = Object.fromEntries(
    TECHNICAL_FIELDS.map(([k], i) => [k, tech10[i]])
  );
  const neural = Object.fromEntries(
    NEURAL_FIELDS.map(([k], i) => [k, to99(neu10[i])])
  );
  const res = await fetch(`${ENGINE_URL}/api/v1/athletes/score`, {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Parity Test",
      position: "PG",
      school: "Parity HS",
      class_year: "2026",
      classification: "HS",
      physical_score: to99(phys10),
      technical,
      neural,
    }),
  });
  if (!res.ok) throw new Error(`engine ${res.status}: ${await res.text()}`);
  return res.json();
}

/* The runtime stores the Python value exclusively, so the meaningful contract
   is: the documented TS formula agrees with the Python engine within
   floating-point rounding (≤ 0.1) AND classifies into the identical tier.
   Bit-exact equality is not asserted — Python round() and JS Math.round()
   differ on .x5 boundaries, which is cosmetic and never crosses a tier. */
const TOL = 0.1;
let pass = 0;
let exact = 0;
const fails = [];
// Include the boundary cases explicitly, then random fuzz.
const cases = [
  { t: Array(7).fill(1), n: Array(6).fill(1), p: 1 },
  { t: Array(7).fill(10), n: Array(6).fill(10), p: 10 },
  { t: Array(7).fill(5), n: Array(6).fill(5), p: 5 },
];
for (let i = cases.length; i < N; i++) {
  cases.push({
    t: Array.from({ length: 7 }, () => rint(1, 10)),
    n: Array.from({ length: 6 }, () => rint(1, 10)),
    p: rint(1, 10),
  });
}

for (const c of cases) {
  const ts = calculateOvr(c.t, c.n, c.p);
  const py = await scorePython(c.t, c.n, c.p);
  // Compare in tenths to avoid float error in the tolerance check itself.
  const within =
    Math.round(Math.abs(ts.ovr - py.ovr) * 10) <= TOL * 10 && ts.tier === py.tier;
  if (within) {
    pass++;
    if (ts.ovr === py.ovr) exact++;
  } else {
    fails.push({ input: c, ts: { ovr: ts.ovr, tier: ts.tier }, py: { ovr: py.ovr, tier: py.tier } });
  }
}

console.log(
  `Parity: ${pass}/${cases.length} within ${TOL} + identical tier ` +
    `(${exact}/${cases.length} bit-exact OVR).`
);
if (fails.length) {
  console.log("FAILURES (Δ>0.1 or tier mismatch — first 5):");
  for (const f of fails.slice(0, 5)) console.log(JSON.stringify(f));
  process.exit(1);
}
console.log("PASS — TS port and Python engine of record agree within rounding; tiers identical.");
