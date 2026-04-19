import { describe, expect, it } from "vitest";

import { calculatePerformanceScore } from "@/simulation/core/performance-score";

describe("calculatePerformanceScore", () => {
  it("returns stable output for a given seed", () => {
    const result = calculatePerformanceScore(
      {
        driverOverall: 86,
        driverConsistency: 82,
        teamPerformance: 80,
        carPerformance: 84,
        supplierPerformance: 79,
        morale: 74,
        setupConfidence: 71,
      },
      {
        trackType: "ROAD",
        weatherSeverity: 30,
        trafficDensity: 28,
        categoryModifier: 1.02,
        randomnessSeed: 1024,
      },
    );

    expect(result.baseScore).toBeGreaterThan(75);
    expect(result.adjustedScore).toBeGreaterThan(70);
    expect(result.reliabilityRisk).toBeGreaterThan(0);
  });

  it("increases reliability risk when supplier quality drops and weather rises", () => {
    const lowReliability = calculatePerformanceScore(
      {
        driverOverall: 82,
        driverConsistency: 75,
        teamPerformance: 79,
        carPerformance: 78,
        supplierPerformance: 52,
        morale: 70,
        setupConfidence: 66,
      },
      {
        trackType: "ENDURANCE",
        weatherSeverity: 84,
        trafficDensity: 55,
        categoryModifier: 1,
        randomnessSeed: 77,
      },
    );

    const highReliability = calculatePerformanceScore(
      {
        driverOverall: 82,
        driverConsistency: 75,
        teamPerformance: 79,
        carPerformance: 78,
        supplierPerformance: 88,
        morale: 70,
        setupConfidence: 66,
      },
      {
        trackType: "ENDURANCE",
        weatherSeverity: 24,
        trafficDensity: 55,
        categoryModifier: 1,
        randomnessSeed: 77,
      },
    );

    expect(lowReliability.reliabilityRisk).toBeGreaterThan(highReliability.reliabilityRisk);
  });
});
