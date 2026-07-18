// Pure scoring/progression logic for the Talent Intelligence module.
// Ported 1:1 from the HeadsUp OS.dc.html design prototype so scores match
// what was reviewed in Claude Design.

export type Grade = "A+" | "A" | "A-" | "B+" | "B" | "B-" | "C+";

export interface PlayerStats {
  ppg: number | null;
  rpg: number | null;
  apg: number | null;
  fg: number | null;
  tp: number | null;
}

export interface PlayerQA {
  commentary?: string;
  coachGets?: string;
  comp?: string;
  interests?: string;
  hidden?: string;
  support?: string;
  challenge?: string;
  advice?: string;
  pivot?: string;
  lookingFor?: string;
}

export interface Player {
  id: string;
  name: string;
  src: string;
  class: number | null;
  pos: string;
  posFull?: string;
  height: string | null;
  hin: number | null;
  weight: number | null;
  gpa: number | null;
  school?: string;
  aau?: string;
  social?: string;
  statsRaw?: string;
  stats: PlayerStats | null;
  accolades?: string;
  nil: boolean;
  injuries?: string;
  pathways?: string;
  major?: string;
  qa: PlayerQA | null;
  traits: Partial<Record<string, Grade>> | null;
  skills: Partial<Record<string, Grade>> | null;
  neckUp: number | null;
  neckDown: number | null;
  evaluated: boolean;
  evalNotes?: string;
  intakeDate?: string;
}

export interface Alumnus {
  name: string;
  hs: string;
  college: string;
  team: string;
  height: string | null;
  hin: number | null;
  pos: string | null;
  level: "NBA" | "G League" | "NCAA D1";
}

export const LPTS: Record<Grade, number> = {
  "A+": 98, A: 95, "A-": 91, "B+": 87, B: 83, "B-": 79, "C+": 74,
};
export const LETTERS: Grade[] = ["A+", "A", "A-", "B+", "B", "B-", "C+"];
export const TRAITS = [
  "Coachability", "Grit", "Leadership", "Emotional Regulation", "Academic Discipline",
];
export const SKILLS = ["Shooting", "Ball Handling", "Defense", "Motor"];

export function gcolor(l: string | null | undefined): string {
  if (!l) return "#71705f";
  if (l[0] === "A") return "#2fbf8f";
  if (l === "B+") return "#5aa0e8";
  if (l === "B") return "#c9c7bb";
  if (l === "B-") return "#d99a3d";
  return "#e0713f";
}

export function scolor(n: number): string {
  return n >= 90 ? "#2fbf8f" : n >= 84 ? "#5aa0e8" : n >= 78 ? "#c9c7bb" : "#d99a3d";
}

// XP levels: [threshold, name, color], highest first.
export const XPL: [number, string, string][] = [
  [1250, "GoPRO", "#2fbf8f"],
  [1000, "Elite", "#5aa0e8"],
  [700, "Riser", "#9a92f0"],
  [400, "Prospect", "#d99a3d"],
  [0, "Rookie", "#8a897f"],
];

export function xp(p: Player): number {
  const qaCount = p.qa ? Object.values(p.qa).filter(Boolean).length : 0;
  let x = 100;
  if (p.stats && p.stats.ppg != null) x += 150;
  if (p.gpa != null) x += p.gpa >= 3.5 ? 150 : 100;
  x += Math.min(qaCount, 6) * 40;
  if (p.evaluated) x += 300;
  if (p.accolades) x += 100;
  if (p.nil) x += 50;
  return x;
}

export function xpLevel(x: number): { name: string; color: string } {
  for (const [t, name, color] of XPL) if (x >= t) return { name, color };
  return { name: "Rookie", color: "#8a897f" };
}

export interface Milestone {
  label: string;
  pts: number;
  done: boolean;
  partial?: boolean;
}

export function xpMilestones(p: Player): Milestone[] {
  const qaCount = p.qa ? Object.values(p.qa).filter(Boolean).length : 0;
  return [
    { label: "Intake complete — in the network", pts: 100, done: true },
    { label: "Season stats on file", pts: 150, done: !!(p.stats && p.stats.ppg != null) },
    {
      label: "Verified GPA" + (p.gpa != null && p.gpa >= 3.5 ? " (3.5+ bonus)" : ""),
      pts: p.gpa != null && p.gpa >= 3.5 ? 150 : 100,
      done: p.gpa != null,
    },
    {
      label: "Neck Up story — " + qaCount + "/6+ answers",
      pts: Math.min(qaCount, 6) * 40 || 240,
      done: qaCount >= 4,
      partial: qaCount > 0 && qaCount < 4,
    },
    { label: "Neck Up evaluation graded", pts: 300, done: !!p.evaluated },
    { label: "Accolades documented", pts: 100, done: !!p.accolades },
    { label: "NIL profile activated", pts: 50, done: !!p.nil },
    { label: "Combine — athletic testing", pts: 200, done: false },
  ];
}

export interface IntakeForm {
  name: string; classYr: string; pos: string; height: string; weight: string;
  gpa: string; school: string; aau: string; social: string;
  ppg: string; rpg: string; apg: string; fg: string; tp: string;
  accolades: string; injuries: string;
  commentary: string; comp: string; support: string; challenge: string;
  hidden: string; pivot: string; major: string; pathways: string;
  nil: boolean;
}

export const EMPTY_INTAKE: IntakeForm = {
  name: "", classYr: "", pos: "", height: "", weight: "", gpa: "", school: "",
  aau: "", social: "", ppg: "", rpg: "", apg: "", fg: "", tp: "",
  accolades: "", injuries: "", commentary: "", comp: "", support: "",
  challenge: "", hidden: "", pivot: "", major: "", pathways: "", nil: true,
};

// Provisional Neck Down score from self-reported stats + height.
export function computeND(ob: IntakeForm): number {
  let nd = 70;
  const ppg = parseFloat(ob.ppg), rpg = parseFloat(ob.rpg), apg = parseFloat(ob.apg);
  if (ppg) nd += Math.min(14, ppg * 0.7);
  if (rpg) nd += Math.min(6, rpg * 0.6);
  if (apg) nd += Math.min(5, apg * 0.9);
  const hm = String(ob.height).replace(/[’‘`´]/g, "'").match(/(\d)\s*'\s*(\d{1,2})/);
  if (hm) nd += (+hm[1] * 12 + +hm[2] - 72) * 0.6;
  return Math.max(58, Math.min(97, Math.round(nd)));
}

export function intakeToPlayer(ob: IntakeForm): Player {
  const nd = computeND(ob);
  const id = "intake_" + Date.now().toString(36);
  return {
    id,
    name: ob.name.trim(),
    src: "New Intake",
    class: parseInt(ob.classYr) || null,
    pos: (ob.pos || "—").slice(0, 10).toUpperCase(),
    posFull: ob.pos,
    height: ob.height || "—",
    hin: null,
    weight: parseInt(ob.weight) || null,
    gpa: parseFloat(ob.gpa) || null,
    school: ob.school, aau: ob.aau, social: ob.social,
    statsRaw: [ob.ppg && ob.ppg + "ppg", ob.rpg && ob.rpg + "rpg", ob.apg && ob.apg + "apg"]
      .filter(Boolean).join(" "),
    stats: {
      ppg: parseFloat(ob.ppg) || null, rpg: parseFloat(ob.rpg) || null,
      apg: parseFloat(ob.apg) || null, fg: parseFloat(ob.fg) || null,
      tp: parseFloat(ob.tp) || null,
    },
    accolades: ob.accolades, nil: ob.nil, injuries: ob.injuries,
    major: ob.major, pathways: ob.pathways,
    qa: {
      commentary: ob.commentary, comp: ob.comp, support: ob.support,
      challenge: ob.challenge, hidden: ob.hidden, pivot: ob.pivot,
      coachGets: "", interests: "", advice: "", lookingFor: "",
    },
    traits: null, skills: null, neckUp: null, neckDown: nd,
    evaluated: false,
    intakeDate: new Date().toISOString().slice(0, 10),
  };
}

// Neck Up = mean letter-grade points across filled traits.
export function neckUpFrom(traits: Partial<Record<string, Grade>>): number | null {
  const filled = TRAITS.filter((t) => traits[t]);
  if (!filled.length) return null;
  return Math.round(filled.reduce((a, t) => a + LPTS[traits[t] as Grade], 0) / filled.length);
}
