import { describe, expect, it } from "vitest";

import { calculateScoutingScore } from "@/domain/rules/scouting-score";

describe("calculateScoutingScore", () => {
  it("rewards elite young driver profile", () => {
    const score = calculateScoutingScore({
      overall: 88,
      potential: 96,
      reputation: 82,
      morale: 80,
      age: 20,
      traitCodes: ["QUALI_BEAST", "CALM_UNDER_PRESSURE"],
      targetCategoryCode: "F1",
      currentCategoryCode: "F2",
    });

    expect(score).toBeGreaterThanOrEqual(75);
  });

  it("penalizes low ceiling veteran profile", () => {
    const score = calculateScoutingScore({
      overall: 74,
      potential: 75,
      reputation: 70,
      morale: 65,
      age: 37,
      traitCodes: [],
      targetCategoryCode: "F1",
      currentCategoryCode: "NASCAR_TRUCK",
    });

    expect(score).toBeLessThan(65);
  });
});
