/* VGM decision layer: deterministic fit SUBSCORES (0-100).
   The locked weighted combination (.30/.30/.25/.15) lives in the engine —
   this module only derives the four inputs. These derivations are v1
   heuristics pending calibration [NEEDS INPUT]; they are deterministic and
   documented so recalibration is a table edit, not a rewrite. */

import type { AthleteRow, ProgramRow, RosterGapRow } from "@/types/database.types";

/* System × position affinity (0-100). */
const STYLE_MATRIX: Record<string, Record<string, number>> = {
  "Pace-and-Space": { PG: 90, SG: 90, SF: 80, PF: 65, C: 50 },
  Positionless: { PG: 80, SG: 80, SF: 90, PF: 90, C: 70 },
  Traditional: { PG: 85, SG: 75, SF: 75, PF: 85, C: 90 },
};

/* Classification × program level alignment (0-100). */
const LEVEL_MATRIX: Record<string, Record<string, number>> = {
  HS: { HS: 90, JUCO: 70, College: 40, Pro: 10 },
  JUCO: { HS: 40, JUCO: 90, College: 75, Pro: 25 },
  College: { HS: 20, JUCO: 60, College: 90, Pro: 55 },
  Pro: { HS: 5, JUCO: 20, College: 50, Pro: 90 },
};

export interface FitSubscores {
  style_fit: number;
  need_fit: number;
  level_fit: number;
  cultural_fit: number;
}

export function deriveSubscores(
  athlete: AthleteRow,
  program: ProgramRow,
  gaps: RosterGapRow[]
): FitSubscores {
  const styleFit =
    (program.system && athlete.position && STYLE_MATRIX[program.system]?.[athlete.position]) || 50;

  const positionGap = gaps.find((gap) => gap.position === athlete.position);
  const needFit =
    positionGap?.priority === "HIGH" ? 95 : positionGap?.priority === "MED" ? 70 : 35;

  const levelFit =
    (athlete.classification &&
      program.level &&
      LEVEL_MATRIX[athlete.classification]?.[program.level]) ||
    50;

  /* Cultural fit from the character-facing neural attributes when they exist.
     Unscored athletes get a neutral 50 — never a fabricated signal. */
  const cultural = [athlete.neural_coachability, athlete.neural_leadership, athlete.neural_composure]
    .filter((value): value is number => typeof value === "number");
  const culturalFit =
    cultural.length > 0
      ? Math.round((cultural.reduce((sum, value) => sum + value, 0) / cultural.length / 99) * 100)
      : 50;

  return {
    style_fit: styleFit,
    need_fit: needFit,
    level_fit: levelFit,
    cultural_fit: culturalFit,
  };
}
