import { describe, expect, it } from "vitest";

import {
  buildRegulationWatch,
  buildTransferRumorCandidates,
  driverHeatIndex,
  manufacturerHeatIndex,
} from "@/domain/rules/world-hub";

describe("buildTransferRumorCandidates", () => {
  it("prioritizes expiring high-performance deals", () => {
    const referenceDate = new Date("2026-04-01T00:00:00.000Z");

    const rumors = buildTransferRumorCandidates(
      [
        {
          driverId: "d1",
          driverName: "A Driver",
          categoryCode: "F1",
          overall: 92,
          potential: 94,
          reputation: 90,
          marketValue: 48_000_000,
          seasonPoints: 62,
          currentTeamId: "t1",
          currentTeamName: "Current Team",
          currentTeamReputation: 72,
          contractEndDate: new Date("2026-06-01T00:00:00.000Z"),
          destinationTeams: [
            { teamId: "t2", teamName: "Top Team", reputation: 88 },
            { teamId: "t3", teamName: "Elite Team", reputation: 91 },
          ],
        },
        {
          driverId: "d2",
          driverName: "B Driver",
          categoryCode: "F1",
          overall: 84,
          potential: 86,
          reputation: 78,
          marketValue: 22_000_000,
          seasonPoints: 10,
          currentTeamId: "t4",
          currentTeamName: "Stable Team",
          currentTeamReputation: 79,
          contractEndDate: new Date("2028-06-01T00:00:00.000Z"),
          destinationTeams: [
            { teamId: "t5", teamName: "Upper Midfield", reputation: 80 },
            { teamId: "t6", teamName: "Front Team", reputation: 87 },
          ],
        },
      ],
      referenceDate,
      10,
    );

    expect(rumors.length).toBeGreaterThan(0);
    expect(rumors[0]?.driverId).toBe("d1");
    expect(rumors[0]?.credibility).toBeGreaterThanOrEqual(70);
  });
});

describe("buildRegulationWatch", () => {
  it("gives higher impact to complex endurance-stage sensitive rule packs", () => {
    const watch = buildRegulationWatch([
      {
        ruleSetId: "r1",
        categoryCode: "WEC",
        ruleSetName: "Endurance Prime",
        hasSprint: false,
        hasStages: false,
        enduranceFlags: true,
        weatherSensitivity: 92,
        parcFerme: false,
        qualifyingFormat: "Hyperpole",
        safetyCarBehavior: "FULL_COURSE_YELLOW",
      },
      {
        ruleSetId: "r2",
        categoryCode: "F2",
        ruleSetName: "Feeder Standard",
        hasSprint: true,
        hasStages: false,
        enduranceFlags: false,
        weatherSensitivity: 60,
        parcFerme: true,
        qualifyingFormat: "Single session",
        safetyCarBehavior: "SAFETY_CAR",
      },
    ]);

    expect(watch.length).toBe(2);
    expect(watch[0].impactScore).toBeGreaterThanOrEqual(watch[1].impactScore);
  });
});

describe("heat indexes", () => {
  it("increases with stronger competitive signals", () => {
    const lowDriverHeat = driverHeatIndex({
      points: 10,
      wins: 0,
      podiums: 1,
      poles: 0,
      overall: 78,
      reputation: 72,
    });
    const highDriverHeat = driverHeatIndex({
      points: 95,
      wins: 4,
      podiums: 7,
      poles: 3,
      overall: 92,
      reputation: 90,
    });

    const lowMakerHeat = manufacturerHeatIndex({
      points: 30,
      wins: 0,
      weatherSensitivity: 78,
    });
    const highMakerHeat = manufacturerHeatIndex({
      points: 120,
      wins: 5,
      weatherSensitivity: 66,
    });

    expect(highDriverHeat).toBeGreaterThan(lowDriverHeat);
    expect(highMakerHeat).toBeGreaterThan(lowMakerHeat);
  });
});
