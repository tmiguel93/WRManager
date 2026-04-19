import { describe, expect, it } from "vitest";

import {
  rankDriverStandings,
  rankManufacturerStandings,
  rankTeamStandings,
} from "@/domain/rules/championship-standings";

describe("rankDriverStandings", () => {
  it("orders by points, then wins, then podiums, then poles", () => {
    const ranked = rankDriverStandings([
      {
        driverId: "d1",
        name: "Driver A",
        countryCode: "US",
        points: 120,
        wins: 2,
        podiums: 5,
        poles: 3,
        teamName: "Alpha",
        imageUrl: null,
      },
      {
        driverId: "d2",
        name: "Driver B",
        countryCode: "GB",
        points: 120,
        wins: 3,
        podiums: 4,
        poles: 2,
        teamName: "Beta",
        imageUrl: null,
      },
      {
        driverId: "d3",
        name: "Driver C",
        countryCode: "IT",
        points: 110,
        wins: 4,
        podiums: 6,
        poles: 5,
        teamName: "Gamma",
        imageUrl: null,
      },
    ]);

    expect(ranked[0].driverId).toBe("d2");
    expect(ranked[1].driverId).toBe("d1");
    expect(ranked[2].driverId).toBe("d3");
    expect(ranked[0].position).toBe(1);
    expect(ranked[2].position).toBe(3);
  });
});

describe("rankTeamStandings", () => {
  it("uses points and wins as tie-breakers", () => {
    const ranked = rankTeamStandings([
      { teamId: "t1", name: "Team One", countryCode: "US", points: 210, wins: 6, podiums: 11 },
      { teamId: "t2", name: "Team Two", countryCode: "DE", points: 210, wins: 7, podiums: 9 },
      { teamId: "t3", name: "Team Three", countryCode: "FR", points: 184, wins: 4, podiums: 10 },
    ]);

    expect(ranked[0].teamId).toBe("t2");
    expect(ranked[1].teamId).toBe("t1");
    expect(ranked[2].teamId).toBe("t3");
  });
});

describe("rankManufacturerStandings", () => {
  it("orders manufacturers by points then wins", () => {
    const ranked = rankManufacturerStandings([
      { manufacturerName: "Maker A", points: 300, wins: 9 },
      { manufacturerName: "Maker B", points: 300, wins: 10 },
      { manufacturerName: "Maker C", points: 260, wins: 8 },
    ]);

    expect(ranked[0].manufacturerName).toBe("Maker B");
    expect(ranked[1].manufacturerName).toBe("Maker A");
    expect(ranked[2].manufacturerName).toBe("Maker C");
  });
});
