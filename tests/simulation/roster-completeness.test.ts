import { describe, expect, it } from "vitest";

import { evaluateRosterCompleteness } from "@/domain/rules/roster-completeness";

describe("roster completeness validation", () => {
  it("blocks categories with tiny grids and no staff depth", () => {
    const result = evaluateRosterCompleteness({
      tier: 3,
      teams: 2,
      drivers: 4,
      staff: 2,
      prospects: 0,
      linkedDrivers: 4,
      linkedStaff: 2,
      activeDriverContracts: 4,
      activeStaffContracts: 2,
      teamsWithDriverGaps: 0,
      teamsWithStaffGaps: 2,
    });

    expect(result.status).toBe("blocked");
    expect(result.issues).toContain("teams: 2/10");
    expect(result.issues).toContain("staff: 2/32");
  });

  it("keeps team-level driver and staff gaps visible even when totals are high", () => {
    const result = evaluateRosterCompleteness({
      tier: 1,
      teams: 8,
      drivers: 18,
      staff: 25,
      prospects: 8,
      linkedDrivers: 18,
      linkedStaff: 25,
      activeDriverContracts: 18,
      activeStaffContracts: 25,
      teamsWithDriverGaps: 1,
      teamsWithStaffGaps: 1,
    });

    expect(result.status).toBe("partial");
    expect(result.issues).toContain("teams below 2 drivers: 1");
    expect(result.issues).toContain("teams below 2 staff: 1");
  });

  it("passes complete rosters with linked drivers, staff and academy prospects", () => {
    const result = evaluateRosterCompleteness({
      tier: 2,
      teams: 10,
      drivers: 24,
      staff: 34,
      prospects: 8,
      linkedDrivers: 24,
      linkedStaff: 34,
      activeDriverContracts: 24,
      activeStaffContracts: 34,
      teamsWithDriverGaps: 0,
      teamsWithStaffGaps: 0,
    });

    expect(result.status).toBe("complete");
    expect(result.issues).toEqual([]);
  });

  it("blocks rosters that only have visual links but no active contracts", () => {
    const result = evaluateRosterCompleteness({
      tier: 2,
      teams: 10,
      drivers: 24,
      staff: 34,
      prospects: 8,
      linkedDrivers: 24,
      linkedStaff: 34,
      activeDriverContracts: 4,
      activeStaffContracts: 3,
      teamsWithDriverGaps: 0,
      teamsWithStaffGaps: 0,
    });

    expect(result.status).toBe("blocked");
    expect(result.issues).toContain("active driver contracts: 4/20");
    expect(result.issues).toContain("active staff contracts: 3/30");
  });
});
