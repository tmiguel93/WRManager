import { describe, expect, it } from "vitest";

import {
  buildBoardObjectives,
  buildCategoryGate,
  opportunityStatus,
  scoreCareerOpportunity,
  sponsorFitScore,
  teamChemistryTone,
} from "@/domain/rules/career-intelligence";

describe("career intelligence rules", () => {
  it("keeps the active category unlocked even when requirements are still developing", () => {
    const gate = buildCategoryGate({
      code: "F4",
      name: "Formula 4",
      discipline: "FEEDER",
      tier: 1,
      region: "Global",
      teamsCount: 8,
      activeCategoryCode: "F4",
      activeTier: 1,
      reputation: 20,
      cashBalance: 500_000,
      staffQuality: 35,
      performanceScore: 40,
    });

    expect(gate.status).toBe("UNLOCKED");
    expect(gate.missing).toEqual([]);
  });

  it("locks distant elite categories until the career climbs the ladder", () => {
    const gate = buildCategoryGate({
      code: "F1",
      name: "Formula 1",
      discipline: "OPEN_WHEEL",
      tier: 4,
      region: "Global",
      teamsCount: 10,
      activeCategoryCode: "F4",
      activeTier: 1,
      reputation: 52,
      cashBalance: 12_000_000,
      staffQuality: 62,
      performanceScore: 64,
    });

    expect(gate.status).toBe("LOCKED");
    expect(gate.missing).toContain("careerRoad.missingTierPath");
  });

  it("scores nearby opportunities higher than unrealistic jumps", () => {
    const nearby = scoreCareerOpportunity({
      categoryTier: 2,
      activeTier: 1,
      teamReputation: 58,
      careerReputation: 56,
      teamBudget: 12_000_000,
      cashBalance: 11_000_000,
    });
    const stretch = scoreCareerOpportunity({
      categoryTier: 4,
      activeTier: 1,
      teamReputation: 88,
      careerReputation: 56,
      teamBudget: 120_000_000,
      cashBalance: 11_000_000,
    });

    expect(nearby).toBeGreaterThan(stretch);
    expect(opportunityStatus(nearby)).not.toBe("LONG_TERM");
  });

  it("builds objective pressure from finance, staff, performance and academy coverage", () => {
    const objectives = buildBoardObjectives({
      cashBalance: 1_000_000,
      tierBaselineCash: 4_000_000,
      staffQuality: 54,
      performanceScore: 61,
      nextGatePercent: 70,
      prospectCount: 0,
    });

    expect(objectives).toHaveLength(5);
    expect(objectives.some((objective) => objective.priority === "HIGH")).toBe(true);
  });

  it("turns commercial and chemistry scores into readable bands", () => {
    const fit = sponsorFitScore({
      cashBalance: 1_000_000,
      teamReputation: 64,
      categoryTier: 2,
      activeSponsorCount: 1,
    });

    expect(fit).toBeGreaterThan(50);
    expect(teamChemistryTone(82)).toBe("POSITIVE");
    expect(teamChemistryTone(45)).toBe("WARNING");
  });
});
