import type { TrackType, WeekendRuleSetDefinition } from "@/domain/models/core";
import { buildWeekendSessionTemplates } from "@/domain/rules/weekend-rules";

export const weekendRuleSetRegistry: Record<string, WeekendRuleSetDefinition> = {
  RULESET_F1_2026: {
    code: "RULESET_F1_2026",
    name: "Formula 1 2026",
    qualiFormat: "Q1-Q2-Q3",
    hasSprint: true,
    hasFeature: false,
    hasStages: false,
    endurance: false,
    weatherSensitivity: 88,
    sessions: ["FP1", "FP2", "FP3", "Q1", "Q2", "Q3", "RACE"],
    parcFerme: true,
    safetyCarBehavior: "SAFETY_CAR_FULL",
  },
  RULESET_F2_2026: {
    code: "RULESET_F2_2026",
    name: "Formula 2 2026",
    qualiFormat: "Single session",
    hasSprint: true,
    hasFeature: true,
    hasStages: false,
    endurance: false,
    weatherSensitivity: 76,
    sessions: ["PRACTICE", "QUALIFYING", "SPRINT", "FEATURE"],
    parcFerme: true,
    safetyCarBehavior: "SAFETY_CAR_AND_VSC",
  },
  RULESET_INDY_2026: {
    code: "RULESET_INDY_2026",
    name: "INDYCAR 2026",
    qualiFormat: "Track-dependent rounds",
    hasSprint: false,
    hasFeature: false,
    hasStages: false,
    endurance: false,
    weatherSensitivity: 72,
    sessions: ["PRACTICE_1", "PRACTICE_2", "QUALIFYING", "WARMUP", "RACE"],
    parcFerme: false,
    safetyCarBehavior: "FULL_COURSE_YELLOW",
  },
  RULESET_CUP_2026: {
    code: "RULESET_CUP_2026",
    name: "NASCAR Cup 2026",
    qualiFormat: "Single lap",
    hasSprint: false,
    hasFeature: false,
    hasStages: true,
    endurance: false,
    weatherSensitivity: 34,
    sessions: ["PRACTICE", "QUALIFYING", "STAGE_1", "STAGE_2", "RACE_FINAL_STAGE"],
    parcFerme: false,
    safetyCarBehavior: "CAUTION_AND_RESTARTS",
  },
  RULESET_XFINITY_2026: {
    code: "RULESET_XFINITY_2026",
    name: "NASCAR Xfinity 2026",
    qualiFormat: "Single lap",
    hasSprint: false,
    hasFeature: false,
    hasStages: true,
    endurance: false,
    weatherSensitivity: 30,
    sessions: ["PRACTICE", "QUALIFYING", "STAGE_1", "STAGE_2", "RACE_FINAL_STAGE"],
    parcFerme: false,
    safetyCarBehavior: "CAUTION_AND_RESTARTS",
  },
  RULESET_TRUCK_2026: {
    code: "RULESET_TRUCK_2026",
    name: "NASCAR Truck 2026",
    qualiFormat: "Single lap",
    hasSprint: false,
    hasFeature: false,
    hasStages: true,
    endurance: false,
    weatherSensitivity: 28,
    sessions: ["PRACTICE", "QUALIFYING", "STAGE_1", "STAGE_2", "RACE_FINAL_STAGE"],
    parcFerme: false,
    safetyCarBehavior: "CAUTION_AND_RESTARTS",
  },
  RULESET_WEC_2026: {
    code: "RULESET_WEC_2026",
    name: "WEC Hypercar 2026",
    qualiFormat: "Qualifying + Hyperpole",
    hasSprint: false,
    hasFeature: false,
    hasStages: false,
    endurance: true,
    weatherSensitivity: 90,
    sessions: ["FP1", "FP2", "FP3", "QUALIFYING", "HYPERPOLE", "RACE_ENDURANCE"],
    parcFerme: false,
    safetyCarBehavior: "FULL_COURSE_YELLOW_AND_SLOW_ZONE",
  },
  RULESET_GT3_2026: {
    code: "RULESET_GT3_2026",
    name: "LMGT3 2026",
    qualiFormat: "Standard + Hyperpole",
    hasSprint: false,
    hasFeature: false,
    hasStages: false,
    endurance: true,
    weatherSensitivity: 84,
    sessions: ["PRACTICE", "QUALIFYING", "HYPERPOLE", "RACE_ENDURANCE"],
    parcFerme: false,
    safetyCarBehavior: "FULL_COURSE_YELLOW",
  },
};

export function getRuleSetByCode(code: string) {
  return weekendRuleSetRegistry[code] ?? null;
}

export function getRuleSetSessionPreview(code: string, trackType: TrackType) {
  const ruleSet = getRuleSetByCode(code);
  if (!ruleSet) return [];
  return buildWeekendSessionTemplates(ruleSet.sessions, trackType);
}
