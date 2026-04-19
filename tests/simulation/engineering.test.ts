import { describe, expect, it } from "vitest";

import {
  applyProjectDeltaToCar,
  calculateDevelopmentProposal,
  calculateSupplierPerformancePackage,
  getProjectTemplateByCode,
} from "@/domain/rules/engineering";

describe("calculateSupplierPerformancePackage", () => {
  it("returns stronger package delta for stronger suppliers", () => {
    const strong = calculateSupplierPerformancePackage([
      {
        type: "ENGINE",
        performance: 92,
        reliability: 88,
        efficiency: 91,
        drivability: 90,
        developmentCeiling: 93,
      },
      {
        type: "TIRE",
        performance: 89,
        reliability: 87,
        efficiency: 84,
        drivability: 0,
        developmentCeiling: 88,
      },
    ]);

    const weak = calculateSupplierPerformancePackage([
      {
        type: "ENGINE",
        performance: 74,
        reliability: 70,
        efficiency: 71,
        drivability: 69,
        developmentCeiling: 73,
      },
      {
        type: "TIRE",
        performance: 71,
        reliability: 69,
        efficiency: 68,
        drivability: 0,
        developmentCeiling: 70,
      },
    ]);

    expect(strong.compositeScore).toBeGreaterThan(weak.compositeScore);
    expect(strong.performanceDelta).toBeGreaterThan(weak.performanceDelta);
    expect(strong.developmentSupport).toBeGreaterThan(weak.developmentSupport);
  });
});

describe("calculateDevelopmentProposal", () => {
  it("gives engineer profile lower cost and lower duration than visionary", () => {
    const template = getProjectTemplateByCode("UNDERFLOOR_LOAD");
    if (!template) {
      throw new Error("Template UNDERFLOOR_LOAD not found in test.");
    }

    const engineer = calculateDevelopmentProposal({
      template,
      managerProfileCode: "ENGENHEIRO",
      supplierDevelopmentSupport: 7,
      facilityDevelopmentPaceBonus: 6,
    });
    const visionary = calculateDevelopmentProposal({
      template,
      managerProfileCode: "VISIONARIO",
      supplierDevelopmentSupport: 7,
      facilityDevelopmentPaceBonus: 6,
    });

    expect(engineer.cost).toBeLessThan(visionary.cost);
    expect(engineer.durationWeeks).toBeLessThanOrEqual(visionary.durationWeeks);
    expect(visionary.expectedDelta).toBeGreaterThanOrEqual(engineer.expectedDelta);
  });
});

describe("applyProjectDeltaToCar", () => {
  it("reduces weight and improves base performance on weight reduction project", () => {
    const next = applyProjectDeltaToCar({
      car: {
        basePerformance: 80,
        reliability: 79,
        weight: 742,
        downforce: 76,
        drag: 63,
      },
      area: "WEIGHT_REDUCTION",
      realizedDelta: 4,
    });

    expect(next.weight).toBeLessThan(742);
    expect(next.basePerformance).toBeGreaterThanOrEqual(80);
  });
});
