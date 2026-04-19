import { describe, expect, it } from "vitest";

import { computeStartingBudget } from "@/domain/rules/starting-budget";

describe("computeStartingBudget", () => {
  it("applies mode base budgets", () => {
    expect(
      computeStartingBudget({
        mode: "TEAM_PRINCIPAL",
        managerProfileCode: "ESTRATEGISTA",
      }),
    ).toBeGreaterThanOrEqual(40_000_000);

    expect(
      computeStartingBudget({
        mode: "MY_TEAM",
        managerProfileCode: "ENGENHEIRO",
      }),
    ).toBeGreaterThanOrEqual(75_000_000);
  });

  it("applies manager budget delta and respects min threshold", () => {
    const negotiator = computeStartingBudget({
      mode: "GLOBAL",
      managerProfileCode: "NEGOCIADOR",
    });

    const strategist = computeStartingBudget({
      mode: "GLOBAL",
      managerProfileCode: "ESTRATEGISTA",
    });

    expect(negotiator).toBeGreaterThan(strategist);
    expect(
      computeStartingBudget({
        mode: "MY_TEAM",
        managerProfileCode: "MOTIVADOR",
        requestedBudget: 10_000_000,
      }),
    ).toBe(20_000_000);
  });
});
