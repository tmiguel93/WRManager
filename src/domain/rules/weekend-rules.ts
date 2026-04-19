import type { TrackType } from "@/domain/models/core";
import type { WeekendRuleSetRuntime, WeekendSessionTemplate, WeekendSessionType } from "@/features/weekend-rules/types";

interface RuleSetInput {
  id: string;
  code: string;
  name: string;
  categoryCode: string;
  categoryName: string;
  qualifyingFormat: string;
  hasSprint: boolean;
  hasFeature: boolean;
  hasStages: boolean;
  enduranceFlags: boolean;
  weatherSensitivity: number;
  parcFerme: boolean;
  safetyCarBehavior: string;
  sessionOrder: unknown;
  pointSystem: unknown;
  tireRules: unknown;
  fuelRules: unknown;
  requiredPitRules: unknown;
  manufacturerRules: unknown;
}

function safeStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string");
}

function safeRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

function safeOptionalRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

const tokenMeta: Record<
  string,
  { sessionType: WeekendSessionType; phase: WeekendSessionTemplate["phase"]; pointsEligible: boolean; durationMinutes: number }
> = {
  FP1: { sessionType: "PRACTICE", phase: "PRACTICE", pointsEligible: false, durationMinutes: 60 },
  FP2: { sessionType: "PRACTICE", phase: "PRACTICE", pointsEligible: false, durationMinutes: 60 },
  FP3: { sessionType: "PRACTICE", phase: "PRACTICE", pointsEligible: false, durationMinutes: 60 },
  PRACTICE: { sessionType: "PRACTICE", phase: "PRACTICE", pointsEligible: false, durationMinutes: 55 },
  PRACTICE_1: { sessionType: "PRACTICE", phase: "PRACTICE", pointsEligible: false, durationMinutes: 55 },
  PRACTICE_2: { sessionType: "PRACTICE", phase: "PRACTICE", pointsEligible: false, durationMinutes: 55 },
  WARMUP: { sessionType: "PRACTICE", phase: "PRACTICE", pointsEligible: false, durationMinutes: 30 },
  Q1: { sessionType: "QUALIFYING", phase: "QUALIFYING", pointsEligible: false, durationMinutes: 18 },
  Q2: { sessionType: "QUALIFYING", phase: "QUALIFYING", pointsEligible: false, durationMinutes: 15 },
  Q3: { sessionType: "QUALIFYING", phase: "QUALIFYING", pointsEligible: false, durationMinutes: 12 },
  QUALIFYING: { sessionType: "QUALIFYING", phase: "QUALIFYING", pointsEligible: false, durationMinutes: 35 },
  SPRINT: { sessionType: "SPRINT", phase: "RACE", pointsEligible: true, durationMinutes: 45 },
  FEATURE: { sessionType: "FEATURE", phase: "RACE", pointsEligible: true, durationMinutes: 65 },
  STAGE_1: { sessionType: "STAGE", phase: "RACE", pointsEligible: true, durationMinutes: 45 },
  STAGE_2: { sessionType: "STAGE", phase: "RACE", pointsEligible: true, durationMinutes: 45 },
  RACE_FINAL_STAGE: { sessionType: "RACE", phase: "RACE", pointsEligible: true, durationMinutes: 80 },
  RACE: { sessionType: "RACE", phase: "RACE", pointsEligible: true, durationMinutes: 95 },
  RACE_ENDURANCE: { sessionType: "RACE", phase: "RACE", pointsEligible: true, durationMinutes: 480 },
  HYPERPOLE: { sessionType: "HYPERPOLE", phase: "SPECIAL", pointsEligible: false, durationMinutes: 25 },
};

function toTitleCase(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((chunk) => chunk.slice(0, 1).toUpperCase() + chunk.slice(1))
    .join(" ");
}

function tokenLabel(token: string) {
  if (token === "Q1" || token === "Q2" || token === "Q3") return token;
  return toTitleCase(token);
}

function tokenDetails(token: string, trackType: TrackType) {
  if (token === "QUALIFYING" && (trackType === "OVAL_SHORT" || trackType === "OVAL_INTERMEDIATE" || trackType === "SUPERSPEEDWAY")) {
    return "Oval qualifying profile active";
  }
  if (token === "RACE_ENDURANCE") return "Long-run stint management enabled";
  if (token === "RACE_FINAL_STAGE") return "Playoff stage scoring enabled";
  if (token === "FEATURE") return "Reverse-grid and mandatory strategy windows";
  return null;
}

export function buildWeekendSessionTemplates(tokens: string[], trackType: TrackType): WeekendSessionTemplate[] {
  return tokens.map((token, index) => {
    const meta = tokenMeta[token] ?? {
      sessionType: "PRACTICE" as const,
      phase: "SPECIAL" as const,
      pointsEligible: false,
      durationMinutes: 45,
    };

    return {
      token,
      label: tokenLabel(token),
      orderIndex: index + 1,
      sessionType: meta.sessionType,
      phase: meta.phase,
      pointsEligible: meta.pointsEligible,
      durationMinutes: meta.durationMinutes,
      details: tokenDetails(token, trackType),
    };
  });
}

export function normalizeWeekendRuleSet(input: RuleSetInput, defaultTrackType: TrackType = "ROAD"): WeekendRuleSetRuntime {
  const sessionOrder = safeStringArray(input.sessionOrder);

  return {
    id: input.id,
    code: input.code,
    name: input.name,
    categoryCode: input.categoryCode,
    categoryName: input.categoryName,
    qualifyingFormat: input.qualifyingFormat,
    hasSprint: input.hasSprint,
    hasFeature: input.hasFeature,
    hasStages: input.hasStages,
    enduranceFlags: input.enduranceFlags,
    weatherSensitivity: input.weatherSensitivity,
    parcFerme: input.parcFerme,
    safetyCarBehavior: input.safetyCarBehavior,
    sessionOrder,
    pointSystem: safeRecord(input.pointSystem),
    tireRules: safeRecord(input.tireRules),
    fuelRules: safeRecord(input.fuelRules),
    requiredPitRules: safeOptionalRecord(input.requiredPitRules),
    manufacturerRules: safeOptionalRecord(input.manufacturerRules),
    defaultTrackSessions: buildWeekendSessionTemplates(sessionOrder, defaultTrackType),
  };
}

export function weatherVolatilityLabel(weatherSensitivity: number) {
  if (weatherSensitivity >= 82) return "High";
  if (weatherSensitivity >= 64) return "Medium";
  return "Low";
}

export function weekendComplexityScore(ruleSet: WeekendRuleSetRuntime) {
  let score = 38;
  score += Math.min(25, ruleSet.defaultTrackSessions.length * 5);
  if (ruleSet.hasSprint) score += 8;
  if (ruleSet.hasFeature) score += 8;
  if (ruleSet.hasStages) score += 10;
  if (ruleSet.enduranceFlags) score += 14;
  if (ruleSet.parcFerme) score += 5;
  score += Math.round(ruleSet.weatherSensitivity * 0.12);
  return Math.max(1, Math.min(99, score));
}

export function trackPreviewCandidatesForDiscipline(discipline: string): TrackType[] {
  switch (discipline) {
    case "STOCK_CAR":
      return ["OVAL_SHORT", "OVAL_INTERMEDIATE", "SUPERSPEEDWAY", "ROAD"];
    case "ENDURANCE":
      return ["ENDURANCE", "ROAD", "HIGH_SPEED"];
    case "OPEN_WHEEL":
      return ["ROAD", "STREET", "OVAL_INTERMEDIATE"];
    case "GT":
      return ["ENDURANCE", "ROAD", "MIXED"];
    case "FEEDER":
      return ["ROAD", "STREET"];
    default:
      return ["ROAD"];
  }
}
