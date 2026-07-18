// TypeScript port of badge_engine.py — keep badge definitions in lockstep with the Python engine.

export interface BadgeCriteria {
  field?: string;
  fields?: string[];
  operator: ">=" | "all_>=";
  value: number;
}

export interface BadgeDefinition {
  badge_id: string;
  name: string;
  category: "performance" | "character" | "milestone" | "quest";
  description: string;
  criteria: BadgeCriteria;
  icon: string;
}

export interface EarnedBadge extends BadgeDefinition {
  awarded_at: string;
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    badge_id: "sniper",
    name: "Sniper",
    category: "performance",
    description: "Shooting score of 85 or higher",
    criteria: { field: "technical.shooting_converted", operator: ">=", value: 85 },
    icon: "🎯",
  },
  {
    badge_id: "handle_artist",
    name: "Handle Artist",
    category: "performance",
    description: "Ball handling score of 85 or higher",
    criteria: { field: "technical.ball_handling_converted", operator: ">=", value: 85 },
    icon: "🪄",
  },
  {
    badge_id: "rim_pressure",
    name: "Rim Pressure",
    category: "performance",
    description: "Finishing score of 85 or higher",
    criteria: { field: "technical.finishing_converted", operator: ">=", value: 85 },
    icon: "💥",
  },
  {
    badge_id: "lockdown",
    name: "Lockdown",
    category: "performance",
    description: "Defense score of 85 or higher",
    criteria: { field: "technical.defense_converted", operator: ">=", value: 85 },
    icon: "🔒",
  },
  {
    badge_id: "glass_cleaner",
    name: "Glass Cleaner",
    category: "performance",
    description: "Rebounding score of 85 or higher",
    criteria: { field: "technical.rebounding_converted", operator: ">=", value: 85 },
    icon: "🧹",
  },
  {
    badge_id: "dimer",
    name: "Dimer",
    category: "performance",
    description: "Passing score of 85 or higher",
    criteria: { field: "technical.passing_converted", operator: ">=", value: 85 },
    icon: "🎁",
  },
  {
    badge_id: "iron_mind",
    name: "Iron Mind",
    category: "character",
    description: "Composure rating of 90 or higher",
    criteria: { field: "neural.composure", operator: ">=", value: 90 },
    icon: "🧠",
  },
  {
    badge_id: "sponge",
    name: "Sponge",
    category: "character",
    description: "Coachability rating of 90 or higher",
    criteria: { field: "neural.coachability", operator: ">=", value: 90 },
    icon: "🧽",
  },
  {
    badge_id: "bounce_back",
    name: "Bounce Back",
    category: "character",
    description: "Resilience rating of 90 or higher",
    criteria: { field: "neural.resilience", operator: ">=", value: 90 },
    icon: "🔁",
  },
  {
    badge_id: "motor",
    name: "Motor",
    category: "character",
    description: "Drive rating of 90 or higher",
    criteria: { field: "neural.drive", operator: ">=", value: 90 },
    icon: "⚙️",
  },
  {
    badge_id: "floor_general",
    name: "Floor General",
    category: "performance",
    description: "IQ + Leadership both above 80",
    criteria: { fields: ["neural.iq", "neural.leadership"], operator: "all_>=", value: 80 },
    icon: "⚡",
  },
  {
    badge_id: "two_way",
    name: "Two-Way Threat",
    category: "performance",
    description: "Shooting + Defense both at 80 or higher",
    criteria: {
      fields: ["technical.shooting_converted", "technical.defense_converted"],
      operator: "all_>=",
      value: 80,
    },
    icon: "🗡️",
  },
  {
    badge_id: "franchise",
    name: "Franchise",
    category: "milestone",
    description: "Overall rating in the Elite tier (85+)",
    criteria: { field: "ovr", operator: ">=", value: 85 },
    icon: "🏆",
  },
];

export type PlayerData = {
  ovr: number;
  technical: Record<string, number>;
  neural: Record<string, number>;
};

export function getNested(data: PlayerData, dottedPath: string): number | null {
  let node: unknown = data;
  for (const key of dottedPath.split(".")) {
    if (typeof node !== "object" || node === null || !(key in node)) return null;
    node = (node as Record<string, unknown>)[key];
  }
  return typeof node === "number" ? node : null;
}

export function checkCriteria(playerData: PlayerData, criteria: BadgeCriteria): boolean {
  if (criteria.operator === ">=" && criteria.field) {
    const value = getNested(playerData, criteria.field);
    return value !== null && value >= criteria.value;
  }
  if (criteria.operator === "all_>=" && criteria.fields) {
    return criteria.fields.every((f) => {
      const value = getNested(playerData, f);
      return value !== null && value >= criteria.value;
    });
  }
  return false;
}

export function evaluateBadges(playerData: PlayerData): EarnedBadge[] {
  const now = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  return BADGE_DEFINITIONS.filter((def) => checkCriteria(playerData, def.criteria)).map(
    (def) => ({ ...def, awarded_at: now }),
  );
}
