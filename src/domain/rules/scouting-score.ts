interface ScoutingScoreInput {
  overall: number;
  potential: number;
  reputation: number;
  morale: number;
  age: number;
  traitCodes: string[];
  targetCategoryCode: string;
  currentCategoryCode?: string | null;
}

const TRAIT_BOOST: Record<string, number> = {
  QUALI_BEAST: 3.2,
  TIRE_WHISPERER: 2.8,
  RAIN_MASTER: 2.6,
  OVAL_SPECIALIST: 2.9,
  ENDURANCE_BRAIN: 3.1,
  AGGRESSIVE_CLOSER: 2.3,
  CALM_UNDER_PRESSURE: 2.7,
  TEAM_LEADER: 2.4,
  TECHNICAL_GENIUS: 2.8,
  SPONSOR_MAGNET: 2.1,
};

export function calculateScoutingScore(input: ScoutingScoreInput) {
  const growthWindow = Math.max(0, 35 - input.age);
  const ageFactor = growthWindow * 0.45;
  const headroom = Math.max(0, input.potential - input.overall) * 0.7;
  const traitFactor = input.traitCodes.reduce((total, code) => total + (TRAIT_BOOST[code] ?? 0), 0);
  const categoryFit =
    !input.currentCategoryCode || input.currentCategoryCode === input.targetCategoryCode ? 3.5 : 0.5;

  const raw =
    input.overall * 0.48 +
    input.potential * 0.33 +
    input.reputation * 0.08 +
    input.morale * 0.06 +
    headroom +
    ageFactor +
    traitFactor +
    categoryFit;

  return Math.max(0, Math.min(100, Math.round(raw / 1.35)));
}
