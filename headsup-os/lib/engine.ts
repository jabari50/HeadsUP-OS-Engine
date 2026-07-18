// Server-only module: holds engine credentials. Never import from client components
// (type-only imports are fine).

import { calculateOvr } from "./hu-engine/ovr";
import { evaluateBadges, type PlayerData } from "./hu-engine/badges";
import { seedStarterQuests } from "./hu-engine/quests";

const ENGINE_URL = process.env.HU_ENGINE_URL ?? "";
const ENGINE_API_KEY = process.env.HU_ENGINE_API_KEY ?? "";
const SUPABASE_URL = process.env.SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ?? "";
const DEMO_WRITE_KEY = process.env.HU_DEMO_WRITE_KEY ?? "";

// proxy = local Python engine; native = serverless TS engine + Supabase (Vercel)
const ENGINE_MODE =
  process.env.HU_ENGINE_MODE ?? (ENGINE_URL ? "proxy" : "native");

const POSITIONS = ["PG", "SG", "SF", "PF", "C"];
const CLASSIFICATIONS = ["HS", "JUCO", "College", "Pro"];
const TECHNICAL_KEYS = [
  "ball_handling", "shooting", "finishing", "passing", "defense", "rebounding", "athleticism",
];
const NEURAL_KEYS = [
  "composure", "coachability", "iq", "resilience", "leadership", "drive",
];

export interface AthleteSummary {
  player_id: string;
  name: string;
  position: string;
  school: string;
  class_year: string;
  ovr: number;
  tier: string;
  created_at: string;
}

export interface AthleteProfile extends AthleteSummary {
  classification: string;
  scout_id: string | null;
  updated_at: string;
  physical_score: number;
  technical: Record<string, number>;
  neural: Record<string, number>;
  ovr_breakdown: {
    technical_avg: number;
    neural_avg: number;
    technical_contribution: number;
    neural_contribution: number;
    physical_contribution: number;
  };
  badges: {
    badge_id: string;
    name: string;
    category: string;
    description: string;
    icon: string;
  }[];
  quests: {
    quest_id: string;
    title: string;
    description: string;
    target_attribute: string;
    target_value: number;
    current_value: number;
    status: string;
    progress_pct: number;
  }[];
}

export class EngineError extends Error {
  status: number;
  constructor(status: number, detail: string) {
    super(detail);
    this.status = status;
  }
}

const UNREACHABLE = new EngineError(
  502,
  "HU-OS Engine unreachable. Start it with: uvicorn hu_os_engine:app --port 8000",
);

// ── Intake validation (mirrors the Pydantic bounds in athlete_api.py) ────────

export interface AthleteIntake {
  name: string;
  position: string;
  school: string;
  class_year: string;
  classification: string;
  physical_score: number;
  technical: Record<string, number>;
  neural: Record<string, number>;
  scout_id?: string | null;
}

function isBoundedNumber(v: unknown, min: number, max: number): v is number {
  return typeof v === "number" && Number.isFinite(v) && v >= min && v <= max;
}

export function validateIntake(raw: unknown): AthleteIntake {
  if (typeof raw !== "object" || raw === null) {
    throw new EngineError(422, "Request body must be a JSON object.");
  }
  const r = raw as Record<string, unknown>;

  if (typeof r.name !== "string" || r.name.trim().length < 2 || r.name.length > 120) {
    throw new EngineError(422, "name must be 2-120 characters.");
  }
  if (typeof r.position !== "string" || !POSITIONS.includes(r.position)) {
    throw new EngineError(422, `position must be one of ${POSITIONS.join(", ")}`);
  }
  if (typeof r.school !== "string" || r.school.trim().length < 2 || r.school.length > 160) {
    throw new EngineError(422, "school must be 2-160 characters.");
  }
  if (typeof r.class_year !== "string" || !/^\d{4}$/.test(r.class_year.trim())) {
    throw new EngineError(422, "class_year must be a 4-digit year.");
  }
  const classification = typeof r.classification === "string" ? r.classification : "HS";
  if (!CLASSIFICATIONS.includes(classification)) {
    throw new EngineError(422, `classification must be one of ${CLASSIFICATIONS.join(", ")}`);
  }
  if (!isBoundedNumber(r.physical_score, 1, 99)) {
    throw new EngineError(422, "physical_score must be between 1 and 99.");
  }

  const technical = r.technical as Record<string, unknown> | undefined;
  const neural = r.neural as Record<string, unknown> | undefined;
  const tech: Record<string, number> = {};
  const neu: Record<string, number> = {};
  for (const key of TECHNICAL_KEYS) {
    const v = technical?.[key];
    if (!isBoundedNumber(v, 1, 10)) {
      throw new EngineError(422, `technical.${key} must be between 1 and 10.`);
    }
    tech[key] = v;
  }
  for (const key of NEURAL_KEYS) {
    const v = neural?.[key];
    if (!isBoundedNumber(v, 1, 99)) {
      throw new EngineError(422, `neural.${key} must be between 1 and 99.`);
    }
    neu[key] = v;
  }

  return {
    name: r.name.trim(),
    position: r.position,
    school: r.school.trim(),
    class_year: r.class_year.trim(),
    classification,
    physical_score: r.physical_score,
    technical: tech,
    neural: neu,
    scout_id: typeof r.scout_id === "string" ? r.scout_id.slice(0, 120) : null,
  };
}

// ── Proxy mode: local Python engine ──────────────────────────────────────────

async function engineFetch(path: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(`${ENGINE_URL}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${ENGINE_API_KEY}`,
        "Content-Type": "application/json",
        ...init?.headers,
      },
      cache: "no-store",
    });
  } catch {
    throw UNREACHABLE;
  }
}

async function engineJson<T>(res: Response): Promise<T> {
  const body = await res.json();
  if (!res.ok) {
    const detail = typeof body?.detail === "string" ? body.detail : `Engine responded ${res.status}.`;
    throw new EngineError(res.status, detail);
  }
  return body as T;
}

// ── Native mode: TS engine + Supabase persistence ────────────────────────────

const SUMMARY_COLUMNS = "player_id,name,position,school,class_year,ovr,tier,created_at";

async function supabaseFetch(path: string, init?: RequestInit): Promise<Response> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new EngineError(500, "Supabase storage is not configured.");
  }
  try {
    return await fetch(`${SUPABASE_URL}${path}`, {
      ...init,
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
        ...init?.headers,
      },
      cache: "no-store",
    });
  } catch {
    throw new EngineError(502, "Athlete store unreachable.");
  }
}

function buildProfile(intake: AthleteIntake): AthleteProfile {
  const ovrResult = calculateOvr(intake.technical, intake.neural, intake.physical_score);

  const technicalWithConverted: Record<string, number> = { ...intake.technical };
  for (const [k, v] of Object.entries(ovrResult.technical_converted)) {
    technicalWithConverted[`${k}_converted`] = v;
  }

  const playerData: PlayerData = {
    ovr: ovrResult.ovr,
    technical: technicalWithConverted,
    neural: intake.neural,
  };

  const now = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  return {
    player_id: crypto.randomUUID(),
    name: intake.name,
    position: intake.position,
    school: intake.school,
    class_year: intake.class_year,
    classification: intake.classification,
    scout_id: intake.scout_id ?? null,
    created_at: now,
    updated_at: now,
    physical_score: intake.physical_score,
    technical: technicalWithConverted,
    neural: intake.neural,
    ovr: ovrResult.ovr,
    tier: ovrResult.tier,
    ovr_breakdown: {
      technical_avg: ovrResult.technical_avg,
      neural_avg: ovrResult.neural_avg,
      ...ovrResult.breakdown,
    },
    badges: evaluateBadges(playerData),
    quests: seedStarterQuests(playerData),
  };
}

// ── Public API (mode-agnostic) ────────────────────────────────────────────────

export async function onboardAthlete(rawIntake: unknown): Promise<AthleteProfile> {
  if (ENGINE_MODE === "proxy") {
    const res = await engineFetch("/api/v1/athletes", {
      method: "POST",
      body: JSON.stringify(rawIntake),
    });
    return engineJson<AthleteProfile>(res);
  }

  const intake = validateIntake(rawIntake);
  const profile = buildProfile(intake);
  const res = await supabaseFetch("/rest/v1/rpc/hu_os_demo_onboard", {
    method: "POST",
    body: JSON.stringify({ p_profile: profile, p_write_key: DEMO_WRITE_KEY }),
  });
  if (!res.ok) {
    throw new EngineError(res.status === 403 ? 500 : res.status, "Athlete store rejected the write.");
  }
  return profile;
}

export async function listAthletes(): Promise<AthleteSummary[]> {
  if (ENGINE_MODE === "proxy") {
    const res = await engineFetch("/api/v1/athletes");
    return engineJson<AthleteSummary[]>(res);
  }

  const res = await supabaseFetch(
    `/rest/v1/hu_os_demo_athletes?select=${SUMMARY_COLUMNS}&order=created_at.desc`,
  );
  if (!res.ok) throw new EngineError(res.status, "Could not load the roster.");
  return (await res.json()) as AthleteSummary[];
}

export async function getAthlete(playerId: string): Promise<AthleteProfile> {
  if (!/^[0-9a-f-]{36}$/i.test(playerId)) {
    throw new EngineError(400, "Invalid athlete id.");
  }

  if (ENGINE_MODE === "proxy") {
    const res = await engineFetch(`/api/v1/athletes/${playerId}`);
    return engineJson<AthleteProfile>(res);
  }

  const res = await supabaseFetch(
    `/rest/v1/hu_os_demo_athletes?select=profile&player_id=eq.${playerId}`,
  );
  if (!res.ok) throw new EngineError(res.status, "Could not load the athlete.");
  const rows = (await res.json()) as { profile: AthleteProfile }[];
  if (rows.length === 0) throw new EngineError(404, "Athlete not found.");
  return rows[0].profile;
}
