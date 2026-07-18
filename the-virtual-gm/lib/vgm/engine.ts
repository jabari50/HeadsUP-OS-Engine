/* Server-only client for the HeadsUp OS Python engine (FastAPI / Render).
   The Python engine (ovr_engine.py via athlete_api.py) is the SOURCE OF TRUTH
   for OVR — self-intake scoring is delegated to it, never computed in TS at
   runtime. The TS port in ./ovr.ts is kept only for the intake form's field
   definitions and a parity test. Never import this from a client component;
   it reads HU_ENGINE_API_KEY. */

import { to99, getTier, TECHNICAL_FIELDS, NEURAL_FIELDS } from "./ovr";

const ENGINE_URL = process.env.HU_ENGINE_URL ?? "";
const ENGINE_API_KEY = process.env.HU_ENGINE_API_KEY ?? "";

export class EngineUnavailable extends Error {
  constructor(detail: string) {
    super(detail);
    this.name = "EngineUnavailable";
  }
}

export interface ScoreInput {
  name: string;
  position: string;
  school: string;
  classYear: string; // 4-digit
  classification?: string; // HS | JUCO | College | Pro
  technical10: number[]; // 7 skills, 1-10, in TECHNICAL_FIELDS order
  neural10: number[]; // 6 attributes, 1-10, in NEURAL_FIELDS order
  physical10: number; // 1-10
}

export interface EngineScore {
  ovr: number;
  tier: string;
  ovr_breakdown: {
    technical_avg: number;
    neural_avg: number;
    technical_contribution: number;
    neural_contribution: number;
    physical_contribution: number;
  };
}

/* The engine's contract (athlete_api.py): technical is 7×(1-10) and is
   converted to the 1-99 scale server-side; neural is 6×(1-99) and physical is
   (1-99), both used as-is. The intake form collects everything on 1-10, so we
   convert neural + physical 1-10 → 1-99 here before the call. */
export async function scoreIntake(input: ScoreInput): Promise<EngineScore> {
  if (!ENGINE_URL) {
    throw new EngineUnavailable(
      "HU_ENGINE_URL is not configured — cannot score intake."
    );
  }

  const technical = Object.fromEntries(
    TECHNICAL_FIELDS.map(([k], i) => [k, input.technical10[i]])
  );
  const neural = Object.fromEntries(
    NEURAL_FIELDS.map(([k], i) => [k, to99(input.neural10[i])])
  );

  const body = {
    name: input.name,
    position: input.position,
    school: input.school,
    class_year: input.classYear,
    classification: input.classification ?? "HS",
    physical_score: to99(input.physical10),
    technical,
    neural,
  };

  let res: Response;
  try {
    res = await fetch(`${ENGINE_URL}/api/v1/athletes/score`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ENGINE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    throw new EngineUnavailable("HU-OS engine is unreachable.");
  }

  if (!res.ok) {
    throw new EngineUnavailable(`HU-OS engine responded ${res.status}.`);
  }

  const data = (await res.json()) as Partial<EngineScore>;
  if (typeof data.ovr !== "number" || typeof data.tier !== "string") {
    throw new EngineUnavailable("HU-OS engine returned an unexpected payload.");
  }
  // Defensive: trust the engine's tier, but re-derive if absent.
  return {
    ovr: data.ovr,
    tier: data.tier || getTier(data.ovr),
    ovr_breakdown:
      data.ovr_breakdown ?? {
        technical_avg: 0,
        neural_avg: 0,
        technical_contribution: 0,
        neural_contribution: 0,
        physical_contribution: 0,
      },
  };
}
