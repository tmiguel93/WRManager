import { describe, expect, it } from "vitest";

import {
  buildWeekendSessionTemplates,
  normalizeWeekendRuleSet,
  weekendComplexityScore,
} from "@/domain/rules/weekend-rules";

describe("buildWeekendSessionTemplates", () => {
  it("supports F2 sprint/feature format", () => {
    const sessions = buildWeekendSessionTemplates(
      ["PRACTICE", "QUALIFYING", "SPRINT", "FEATURE"],
      "ROAD",
    );

    expect(sessions.map((session) => session.sessionType)).toEqual([
      "PRACTICE",
      "QUALIFYING",
      "SPRINT",
      "FEATURE",
    ]);
    expect(sessions[2].pointsEligible).toBe(true);
    expect(sessions[3].pointsEligible).toBe(true);
  });

  it("maps NASCAR stages and final stage race", () => {
    const sessions = buildWeekendSessionTemplates(
      ["PRACTICE", "QUALIFYING", "STAGE_1", "STAGE_2", "RACE_FINAL_STAGE"],
      "OVAL_INTERMEDIATE",
    );

    expect(sessions[2].sessionType).toBe("STAGE");
    expect(sessions[3].sessionType).toBe("STAGE");
    expect(sessions[4].sessionType).toBe("RACE");
    expect(sessions[4].details).toContain("Playoff");
  });
});

describe("normalizeWeekendRuleSet", () => {
  it("normalizes json payloads and computes default sessions", () => {
    const runtime = normalizeWeekendRuleSet({
      id: "rs-1",
      code: "RULESET_WEC_2026",
      name: "WEC Hypercar 2026",
      categoryCode: "WEC_HYPERCAR",
      categoryName: "FIA WEC Hypercar",
      qualifyingFormat: "Qualifying + Hyperpole",
      hasSprint: false,
      hasFeature: false,
      hasStages: false,
      enduranceFlags: true,
      weatherSensitivity: 90,
      parcFerme: false,
      safetyCarBehavior: "FULL_COURSE_YELLOW_AND_SLOW_ZONE",
      sessionOrder: ["FP1", "FP2", "FP3", "QUALIFYING", "HYPERPOLE", "RACE_ENDURANCE"],
      pointSystem: { race: [38, 27, 23] },
      tireRules: { compounds: ["MEDIUM", "HARD", "WET"] },
      fuelRules: { refuelAllowed: true },
      requiredPitRules: { minDriverRotation: 2 },
      manufacturerRules: { approvedManufacturers: ["Ferrari", "Toyota"] },
    });

    expect(runtime.sessionOrder.length).toBe(6);
    expect(runtime.defaultTrackSessions[5].sessionType).toBe("RACE");
    expect(runtime.requiredPitRules?.minDriverRotation).toBe(2);
  });
});

describe("weekendComplexityScore", () => {
  it("gives higher score to endurance/stage rich formats", () => {
    const simple = normalizeWeekendRuleSet({
      id: "simple",
      code: "SIMPLE",
      name: "Simple",
      categoryCode: "F2",
      categoryName: "Formula 2",
      qualifyingFormat: "Single",
      hasSprint: false,
      hasFeature: false,
      hasStages: false,
      enduranceFlags: false,
      weatherSensitivity: 55,
      parcFerme: false,
      safetyCarBehavior: "STANDARD",
      sessionOrder: ["PRACTICE", "QUALIFYING", "RACE"],
      pointSystem: {},
      tireRules: {},
      fuelRules: {},
      requiredPitRules: null,
      manufacturerRules: null,
    });

    const complex = normalizeWeekendRuleSet({
      id: "complex",
      code: "COMPLEX",
      name: "Complex",
      categoryCode: "WEC_HYPERCAR",
      categoryName: "WEC",
      qualifyingFormat: "Qualifying + Hyperpole",
      hasSprint: true,
      hasFeature: true,
      hasStages: true,
      enduranceFlags: true,
      weatherSensitivity: 90,
      parcFerme: true,
      safetyCarBehavior: "ADVANCED",
      sessionOrder: ["FP1", "FP2", "FP3", "QUALIFYING", "SPRINT", "FEATURE", "HYPERPOLE", "RACE_ENDURANCE"],
      pointSystem: {},
      tireRules: {},
      fuelRules: {},
      requiredPitRules: {},
      manufacturerRules: {},
    });

    expect(weekendComplexityScore(complex)).toBeGreaterThan(weekendComplexityScore(simple));
  });
});
