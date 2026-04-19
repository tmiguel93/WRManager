import { describe, expect, it } from "vitest";

import { evaluateMyTeamLineupRequirements } from "@/domain/rules/onboarding";

describe("my team onboarding requirements", () => {
  it("requires at least two drivers and core staff leaders", () => {
    const result = evaluateMyTeamLineupRequirements({
      activeDriverCount: 1,
      staffRoles: ["Sporting Director"],
      minimumDrivers: 2,
    });

    expect(result.minimumReady).toBe(false);
    expect(result.missingRequirements).toContain("DRIVERS_2");
    expect(result.missingRequirements).toContain("TECHNICAL_LEADERSHIP");
  });

  it("passes when minimum lineup is complete", () => {
    const result = evaluateMyTeamLineupRequirements({
      activeDriverCount: 2,
      staffRoles: ["Technical Director", "Head of Strategy"],
      minimumDrivers: 2,
    });

    expect(result.minimumReady).toBe(true);
    expect(result.missingRequirements).toHaveLength(0);
  });
});
