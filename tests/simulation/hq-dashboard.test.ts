import { describe, expect, it } from "vitest";

import {
  calculateCompetitiveIndex,
  calculateDevelopmentPace,
  calculateMonthlyBurnRate,
  generateHqAlerts,
} from "@/domain/rules/hq-dashboard";

describe("hq dashboard rules", () => {
  it("computes competitive index in bounded range", () => {
    const index = calculateCompetitiveIndex({
      teamReputation: 84,
      averageDriverOverall: 82,
      carPerformance: 80,
      supplierStrength: 78,
      facilityStrength: 75,
    });

    expect(index).toBeGreaterThanOrEqual(1);
    expect(index).toBeLessThanOrEqual(99);
  });

  it("computes monthly burn with sponsor offset", () => {
    const burn = calculateMonthlyBurnRate({
      annualDriverSalaries: 18_000_000,
      annualStaffSalaries: 7_000_000,
      annualSupplierCost: 16_000_000,
      annualOperatingCost: 9_000_000,
      annualSponsorIncome: 15_000_000,
    });

    expect(burn).toBe(2_916_667);
  });

  it("generates high-risk alerts for pressured operations", () => {
    const alerts = generateHqAlerts({
      cashBalance: 14_000_000,
      monthlyBurnRate: 5_200_000,
      morale: 58,
      daysUntilNextEvent: 3,
      supplierContractsEndingSoon: 2,
    });

    expect(alerts.some((alert) => alert.severity === "HIGH")).toBe(true);
    expect(alerts.length).toBeGreaterThan(2);
  });

  it("calculates development pace from index/facilities/staff", () => {
    const pace = calculateDevelopmentPace({
      competitiveIndex: 79,
      averageFacilityLevel: 3.2,
      averageStaffReputation: 74,
    });

    expect(pace).toBeGreaterThan(60);
  });
});
