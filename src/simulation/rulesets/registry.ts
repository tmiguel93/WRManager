import type { WeekendRuleSetDefinition } from "@/domain/models/core";

export const weekendRuleSetRegistry: Record<string, WeekendRuleSetDefinition> = {
  RULESET_F1_2026: {
    code: "RULESET_F1_2026",
    name: "Formula 1 2026",
    qualiFormat: "Q1-Q2-Q3",
    hasSprint: true,
    hasStages: false,
    endurance: false,
    weatherSensitivity: 88,
    sessions: ["FP1", "FP2", "FP3", "Q1", "Q2", "Q3", "Race"],
  },
  RULESET_INDY_2026: {
    code: "RULESET_INDY_2026",
    name: "INDYCAR 2026",
    qualiFormat: "Track format",
    hasSprint: false,
    hasStages: false,
    endurance: false,
    weatherSensitivity: 72,
    sessions: ["Practice 1", "Practice 2", "Qualifying", "Warmup", "Race"],
  },
  RULESET_CUP_2026: {
    code: "RULESET_CUP_2026",
    name: "NASCAR Cup 2026",
    qualiFormat: "Single lap",
    hasSprint: false,
    hasStages: true,
    endurance: false,
    weatherSensitivity: 34,
    sessions: ["Practice", "Qualifying", "Stage 1", "Stage 2", "Final Stage"],
  },
  RULESET_WEC_2026: {
    code: "RULESET_WEC_2026",
    name: "WEC Hypercar 2026",
    qualiFormat: "Qualifying + Hyperpole",
    hasSprint: false,
    hasStages: false,
    endurance: true,
    weatherSensitivity: 90,
    sessions: ["FP1", "FP2", "FP3", "Qualifying", "Hyperpole", "Endurance Race"],
  },
};

export function getRuleSetByCode(code: string) {
  return weekendRuleSetRegistry[code];
}
