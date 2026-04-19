import { describe, expect, it } from "vitest";

import {
  calculatePracticeLearning,
  calculateQualifyingLapScore,
  lapScoreToMilliseconds,
} from "@/domain/rules/weekend-session-sim";

describe("calculatePracticeLearning", () => {
  it("improves gains when setup focus matches track profile", () => {
    const aligned = calculatePracticeLearning({
      trackType: "HIGH_SPEED",
      weatherSensitivity: 64,
      aeroBalanceFocus: 48,
      weatherFocus: 5,
      runPlan: "BALANCED",
      driverFeedback: 84,
      staffSetup: 81,
      baseSetupConfidence: 52,
      baseTrackKnowledge: 45,
    });

    const misaligned = calculatePracticeLearning({
      trackType: "HIGH_SPEED",
      weatherSensitivity: 64,
      aeroBalanceFocus: -45,
      weatherFocus: 70,
      runPlan: "BALANCED",
      driverFeedback: 84,
      staffSetup: 81,
      baseSetupConfidence: 52,
      baseTrackKnowledge: 45,
    });

    expect(aligned.setupGain).toBeGreaterThan(misaligned.setupGain);
    expect(aligned.paceDelta).toBeGreaterThan(misaligned.paceDelta);
  });
});

describe("calculateQualifyingLapScore", () => {
  it("rewards detailed high-risk runs with higher pace and higher error risk", () => {
    const quick = calculateQualifyingLapScore({
      trackType: "ROAD",
      mode: "QUICK",
      driverOverall: 88,
      qualifyingSkill: 90,
      emotionalControl: 82,
      carPerformance: 86,
      setupConfidence: 72,
      trackKnowledge: 70,
      riskLevel: 56,
      releaseTiming: "MID",
      tyreCompound: "SOFT",
      weatherSensitivity: 50,
    });

    const detailed = calculateQualifyingLapScore({
      trackType: "ROAD",
      mode: "DETAILED",
      driverOverall: 88,
      qualifyingSkill: 90,
      emotionalControl: 82,
      carPerformance: 86,
      setupConfidence: 72,
      trackKnowledge: 70,
      riskLevel: 84,
      releaseTiming: "LATE",
      tyreCompound: "SOFT",
      weatherSensitivity: 50,
    });

    expect(detailed.lapScore).toBeGreaterThan(quick.lapScore);
    expect(detailed.errorRisk).toBeGreaterThan(quick.errorRisk);
  });
});

describe("lapScoreToMilliseconds", () => {
  it("returns faster lap for higher score on same track", () => {
    const slower = lapScoreToMilliseconds({
      trackType: "ROAD",
      lapScore: 74,
      errorRisk: 12,
      seed: "same-seed",
    });
    const faster = lapScoreToMilliseconds({
      trackType: "ROAD",
      lapScore: 89,
      errorRisk: 12,
      seed: "same-seed",
    });

    expect(faster).toBeLessThan(slower);
  });
});
