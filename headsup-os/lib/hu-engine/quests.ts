// TypeScript port of quest_engine.py — keep quest seeding in lockstep with the Python engine.

import { SCALE_MAX, nextTierTarget } from "./ovr";
import type { PlayerData } from "./badges";

const ATTRIBUTE_QUEST_BOOST = 10.0;

const QUEST_LABELS: Record<string, string> = {
  ball_handling: "Tighten the Handle",
  shooting: "Stretch the Floor",
  finishing: "Finish Through Contact",
  passing: "See the Floor",
  defense: "Guard Your Yard",
  rebounding: "Own the Glass",
  athleticism: "Build the Engine",
  composure: "Stay Ice Cold",
  coachability: "Stay Coachable",
  iq: "Sharpen the Mind",
  resilience: "Bounce Back Stronger",
  leadership: "Raise Your Voice",
  drive: "Bring It Every Day",
};

export interface Quest {
  quest_id: string;
  title: string;
  description: string;
  target_attribute: string;
  target_value: number;
  current_value: number;
  status: "active" | "completed" | "failed";
  deadline: string | null;
  reward_badge_id: string | null;
  progress_pct: number;
}

const round1 = (n: number): number => Math.round(n * 10) / 10;

function newQuest(
  title: string,
  description: string,
  targetAttribute: string,
  targetValue: number,
  currentValue: number,
): Quest {
  const progress = round1(Math.min(100, (currentValue / targetValue) * 100));
  return {
    quest_id: crypto.randomUUID(),
    title,
    description,
    target_attribute: targetAttribute,
    target_value: targetValue,
    current_value: currentValue,
    status: currentValue >= targetValue ? "completed" : "active",
    deadline: null,
    reward_badge_id: null,
    progress_pct: progress,
  };
}

export function seedStarterQuests(playerData: PlayerData): Quest[] {
  const quests: Quest[] = [];

  const converted = Object.entries(playerData.technical).filter(([k]) =>
    k.endsWith("_converted"),
  );
  if (converted.length > 0) {
    const [weakestKey, current] = converted.reduce((min, cur) => (cur[1] < min[1] ? cur : min));
    const skill = weakestKey.replace("_converted", "");
    const target = Math.min(SCALE_MAX, current + ATTRIBUTE_QUEST_BOOST);
    quests.push(
      newQuest(
        QUEST_LABELS[skill] ?? `Develop ${skill}`,
        `Raise ${skill.replace(/_/g, " ")} from ${Math.round(current)} to ${Math.round(target)}.`,
        `technical.${weakestKey}`,
        target,
        current,
      ),
    );
  }

  const neuralEntries = Object.entries(playerData.neural);
  if (neuralEntries.length > 0) {
    const [weakestAttr, current] = neuralEntries.reduce((min, cur) =>
      cur[1] < min[1] ? cur : min,
    );
    const target = Math.min(SCALE_MAX, current + ATTRIBUTE_QUEST_BOOST);
    quests.push(
      newQuest(
        QUEST_LABELS[weakestAttr] ?? `Develop ${weakestAttr}`,
        `Raise ${weakestAttr.replace(/_/g, " ")} from ${Math.round(current)} to ${Math.round(target)}.`,
        `neural.${weakestAttr}`,
        target,
        current,
      ),
    );
  }

  const next = nextTierTarget(playerData.ovr);
  if (next) {
    quests.push(
      newQuest(
        `Reach ${next.tier} Tier`,
        `Push overall rating from ${playerData.ovr} to ${next.threshold.toFixed(1)}.`,
        "ovr",
        next.threshold,
        playerData.ovr,
      ),
    );
  }

  return quests;
}
