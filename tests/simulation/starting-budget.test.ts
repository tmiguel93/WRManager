import { describe, expect, it } from "vitest";

import { computeStartingBudget } from "@/domain/rules/starting-budget";

describe("computeStartingBudget", () => {
  it("scales budget by category tier", () => {
    const tierOne = computeStartingBudget({
      mode: "TEAM_PRINCIPAL",
      managerProfileCode: "ESTRATEGISTA",
      categoryTier: 1,
    });
    const tierFour = computeStartingBudget({
      mode: "TEAM_PRINCIPAL",
      managerProfileCode: "ESTRATEGISTA",
      categoryTier: 4,
    });

    expect(tierFour).toBeGreaterThan(tierOne);
  });

  it("keeps my-team requested budget inside realistic envelope", () => {
    const budget = computeStartingBudget({
      mode: "MY_TEAM",
      managerProfileCode: "ENGENHEIRO",
      categoryTier: 1,
      requestedBudget: 20_000_000,
    });

    expect(budget).toBeLessThan(20_000_000);
    expect(budget).toBeGreaterThan(3_000_000);
  });

  it("applies manager delta and existing-team multiplier", () => {
    expect(
      computeStartingBudget({
        mode: "TEAM_PRINCIPAL",
        managerProfileCode: "ESTRATEGISTA",
        categoryTier: 2,
      }),
    ).toBeGreaterThan(8_000_000);

    const negotiator = computeStartingBudget({
      mode: "GLOBAL",
      managerProfileCode: "NEGOCIADOR",
      categoryTier: 3,
    });

    const strategist = computeStartingBudget({
      mode: "GLOBAL",
      managerProfileCode: "ESTRATEGISTA",
      categoryTier: 3,
    });

    expect(negotiator).toBeGreaterThan(strategist);

    const existingTeam = computeStartingBudget({
      mode: "TEAM_PRINCIPAL",
      managerProfileCode: "ESTRATEGISTA",
      categoryTier: 3,
      teamReputation: 88,
      isExistingTeam: true,
    });
    const createdTeam = computeStartingBudget({
      mode: "TEAM_PRINCIPAL",
      managerProfileCode: "ESTRATEGISTA",
      categoryTier: 3,
      teamReputation: 60,
      isExistingTeam: false,
    });

    expect(existingTeam).toBeGreaterThan(createdTeam);
  });
});
