import { describe, expect, it } from "vitest";

import {
  calculateRacePerformanceScore,
  pointsForPosition,
  resolveRacePointsTable,
  simulateRaceOutcome,
} from "@/domain/rules/race-control-sim";

describe("calculateRacePerformanceScore", () => {
  it("gives more pace and less reliability in attack strategy", () => {
    const conserve = calculateRacePerformanceScore({
      trackType: "ROAD",
      weatherSensitivity: 72,
      raceDistanceMinutes: 90,
      driverOverall: 88,
      raceCraft: 90,
      consistency: 86,
      overtaking: 84,
      defense: 82,
      emotionalControl: 83,
      wetSkill: 79,
      trackAdaptation: 85,
      technicalFeedback: 80,
      tireManagement: 81,
      fuelSaving: 79,
      strategyIq: 84,
      trafficAdaptation: 83,
      carPerformance: 87,
      carReliability: 84,
      setupConfidence: 73,
      trackKnowledge: 71,
      staffStrategy: 82,
      staffPit: 80,
      supplierPerformance: 85,
      supplierReliability: 84,
      decisionProfile: {
        paceMode: "CONSERVE",
        pitPlan: "BALANCED",
        fuelMode: "SAVE",
        tyreMode: "SAVE",
        teamOrders: "HOLD",
        weatherReaction: "SAFE",
      },
    });

    const attack = calculateRacePerformanceScore({
      trackType: "ROAD",
      weatherSensitivity: 72,
      raceDistanceMinutes: 90,
      driverOverall: 88,
      raceCraft: 90,
      consistency: 86,
      overtaking: 84,
      defense: 82,
      emotionalControl: 83,
      wetSkill: 79,
      trackAdaptation: 85,
      technicalFeedback: 80,
      tireManagement: 81,
      fuelSaving: 79,
      strategyIq: 84,
      trafficAdaptation: 83,
      carPerformance: 87,
      carReliability: 84,
      setupConfidence: 73,
      trackKnowledge: 71,
      staffStrategy: 82,
      staffPit: 80,
      supplierPerformance: 85,
      supplierReliability: 84,
      decisionProfile: {
        paceMode: "ATTACK",
        pitPlan: "UNDERCUT",
        fuelMode: "PUSH",
        tyreMode: "PUSH",
        teamOrders: "FREE_FIGHT",
        weatherReaction: "AGGRESSIVE",
      },
    });

    expect(attack.paceScore).toBeGreaterThan(conserve.paceScore);
    expect(attack.reliabilityScore).toBeLessThan(conserve.reliabilityScore);
  });
});

describe("simulateRaceOutcome", () => {
  it("keeps pole run faster than back-row run with same pace profile", () => {
    const pole = simulateRaceOutcome({
      trackType: "ROAD",
      raceDistanceMinutes: 90,
      startPosition: 1,
      fieldSize: 22,
      weatherSensitivity: 65,
      safetyCarProfile: "SAFETY_CAR_FULL",
      paceScore: 86,
      reliabilityScore: 84,
      raceCraftScore: 84,
      expectedPitStops: 2,
      pitStopTimeMs: 21_500,
      decisionProfile: {
        paceMode: "NEUTRAL",
        pitPlan: "BALANCED",
        fuelMode: "NORMAL",
        tyreMode: "NORMAL",
        teamOrders: "FREE_FIGHT",
        weatherReaction: "REACTIVE",
      },
      seed: "safe-seed",
    });

    const backRow = simulateRaceOutcome({
      trackType: "ROAD",
      raceDistanceMinutes: 90,
      startPosition: 20,
      fieldSize: 22,
      weatherSensitivity: 65,
      safetyCarProfile: "SAFETY_CAR_FULL",
      paceScore: 86,
      reliabilityScore: 84,
      raceCraftScore: 84,
      expectedPitStops: 2,
      pitStopTimeMs: 21_500,
      decisionProfile: {
        paceMode: "NEUTRAL",
        pitPlan: "BALANCED",
        fuelMode: "NORMAL",
        tyreMode: "NORMAL",
        teamOrders: "FREE_FIGHT",
        weatherReaction: "REACTIVE",
      },
      seed: "safe-seed",
    });

    expect(pole.status).toBe("FINISHED");
    expect(backRow.status).toBe("FINISHED");
    expect((pole.totalTimeMs ?? 0)).toBeLessThan(backRow.totalTimeMs ?? Number.MAX_SAFE_INTEGER);
  });
});

describe("resolveRacePointsTable", () => {
  it("uses stage top10 mapping when provided", () => {
    const table = resolveRacePointsTable(
      {
        stageTop10: [10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
      },
      "STAGE",
    );

    expect(pointsForPosition(table, 1)).toBe(10);
    expect(pointsForPosition(table, 5)).toBe(6);
    expect(pointsForPosition(table, 11)).toBe(0);
  });
});

