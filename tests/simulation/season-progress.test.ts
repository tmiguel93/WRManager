import { describe, expect, it } from "vitest";

import {
  deriveCareerPhaseFromSeason,
  resolveSeasonRoundAfterMainRace,
} from "@/domain/rules/season-progress";

describe("season progress transitions", () => {
  it("moves from pre-season to active after first completed race", () => {
    const resolved = resolveSeasonRoundAfterMainRace({
      currentRound: 1,
      completedRound: 1,
      totalRounds: 10,
    });

    expect(resolved.status).toBe("ACTIVE");
    expect(resolved.nextRound).toBe(2);
    expect(resolved.phase).toBe("ROUND_ACTIVE");
  });

  it("closes season on final round completion", () => {
    const resolved = resolveSeasonRoundAfterMainRace({
      currentRound: 10,
      completedRound: 10,
      totalRounds: 10,
    });

    expect(resolved.status).toBe("FINISHED");
    expect(resolved.nextRound).toBe(10);
    expect(resolved.phase).toBe("SEASON_END");
  });

  it("derives offseason from finished season", () => {
    const phase = deriveCareerPhaseFromSeason({
      seasonStatus: "FINISHED",
      currentRound: 10,
      totalRounds: 10,
    });

    expect(phase).toBe("OFFSEASON");
  });
});
