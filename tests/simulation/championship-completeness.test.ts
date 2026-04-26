import { describe, expect, it } from "vitest";
import {
  evaluateChampionshipCompleteness,
  getChampionshipCompletenessThresholds,
} from "@/domain/rules/championship-completeness";

describe("championship completeness validation", () => {
  it("blocks categories with prototype-sized grids", () => {
    const result = evaluateChampionshipCompleteness({
      tier: 4,
      teams: 2,
      drivers: 4,
      staff: 2,
      circuits: 3,
      rounds: 3,
      prospects: 0,
    });

    expect(result.status).toBe("blocked");
    expect(result.issues).toContain("teams: 2/10");
    expect(result.issues).toContain("rounds: 3/12");
  });

  it("marks categories complete only when every roster and calendar minimum is met", () => {
    const thresholds = getChampionshipCompletenessThresholds(2);
    const result = evaluateChampionshipCompleteness({
      tier: 2,
      teams: thresholds.minTeams,
      drivers: thresholds.minDrivers,
      staff: thresholds.minStaff,
      circuits: thresholds.minCircuits,
      rounds: thresholds.minRounds,
      prospects: thresholds.minProspects,
      linkedDrivers: thresholds.minDrivers,
      linkedStaff: thresholds.minStaff,
    });

    expect(result.status).toBe("complete");
    expect(result.issues).toEqual([]);
  });

  it("keeps academy population as a required readiness signal", () => {
    const thresholds = getChampionshipCompletenessThresholds(1);
    const result = evaluateChampionshipCompleteness({
      tier: 1,
      teams: thresholds.minTeams,
      drivers: thresholds.minDrivers,
      staff: thresholds.minStaff,
      circuits: thresholds.minCircuits,
      rounds: thresholds.minRounds,
      prospects: 0,
    });

    expect(result.status).toBe("partial");
    expect(result.issues).toContain("academy prospects: 0/8");
  });
});
