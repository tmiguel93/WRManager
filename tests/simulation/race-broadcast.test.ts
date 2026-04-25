import { describe, expect, it } from "vitest";

import {
  buildRaceBroadcastScenario,
  snapshotRaceBroadcast,
  type RaceBroadcastInput,
} from "@/domain/rules/race-broadcast";

function sampleInput(): RaceBroadcastInput {
  return {
    sessionLabel: "Feature Race",
    trackType: "ROAD",
    weatherSensitivity: 68,
    feed: [
      "Track evolution improving in sector 2.",
      "Managed team calls for an early stop.",
      "Safety-car risk window reduced.",
    ],
    participants: [
      {
        id: "d1",
        name: "Driver One",
        countryCode: "GB",
        teamId: "t1",
        teamName: "Alpha Team",
        teamLogoUrl: null,
        teamPrimaryColor: "#2563eb",
        teamSecondaryColor: "#f8fafc",
        teamAccentColor: null,
        imageUrl: null,
        startPosition: 1,
        finalPosition: 1,
        status: "FINISHED",
        finalTimeMs: 5_360_000,
        pitStops: 2,
        incidents: [],
        isManagedTeam: true,
      },
      {
        id: "d2",
        name: "Driver Two",
        countryCode: "BR",
        teamId: "t2",
        teamName: "Beta Team",
        teamLogoUrl: null,
        teamPrimaryColor: "#dc2626",
        teamSecondaryColor: "#111827",
        teamAccentColor: "#facc15",
        imageUrl: null,
        startPosition: 3,
        finalPosition: 2,
        status: "FINISHED",
        finalTimeMs: 5_365_500,
        pitStops: 2,
        incidents: ["Minor lock-up in turn 4."],
        isManagedTeam: false,
      },
      {
        id: "d3",
        name: "Driver Three",
        countryCode: "ES",
        teamId: "t3",
        teamName: "Gamma Team",
        teamLogoUrl: null,
        teamPrimaryColor: "#16a34a",
        teamSecondaryColor: "#0f172a",
        teamAccentColor: null,
        imageUrl: null,
        startPosition: 2,
        finalPosition: 3,
        status: "DNF",
        finalTimeMs: null,
        pitStops: 1,
        incidents: ["Mechanical issue forced retirement."],
        isManagedTeam: false,
      },
    ],
  };
}

describe("buildRaceBroadcastScenario", () => {
  it("creates deterministic duration and sorted events", () => {
    const scenarioA = buildRaceBroadcastScenario(sampleInput());
    const scenarioB = buildRaceBroadcastScenario(sampleInput());

    expect(scenarioA.durationMs).toBe(scenarioB.durationMs);
    expect(scenarioA.totalLaps).toBeGreaterThan(10);
    expect(scenarioA.events[0]?.title).toBe("Green Flag");
    expect(scenarioA.events[scenarioA.events.length - 1]?.title).toBe("Chequered Flag");
    expect(scenarioA.events.map((event) => event.timeMs)).toEqual(
      [...scenarioA.events.map((event) => event.timeMs)].sort((a, b) => a - b),
    );
  });
});

describe("snapshotRaceBroadcast", () => {
  it("returns a full field snapshot with ordered positions", () => {
    const scenario = buildRaceBroadcastScenario(sampleInput());
    const mid = snapshotRaceBroadcast(scenario, Math.round(scenario.durationMs * 0.5));

    expect(mid.rows).toHaveLength(3);
    expect(mid.rows[0]?.position).toBe(1);
    expect(mid.rows[1]?.position).toBe(2);
    expect(mid.rows[2]?.position).toBe(3);
    expect(mid.rows.every((row) => row.lap >= 1 && row.lap <= scenario.totalLaps)).toBe(true);
    expect(mid.rows.every((row) => row.tyrePct >= 1 && row.tyrePct <= 100)).toBe(true);
    expect(mid.rows.every((row) => row.fuelPct >= 1 && row.fuelPct <= 100)).toBe(true);
  });

  it("reaches final state at race end", () => {
    const scenario = buildRaceBroadcastScenario(sampleInput());
    const end = snapshotRaceBroadcast(scenario, scenario.durationMs);

    expect(end.rows[0]?.status).toBe("FINISHED");
    expect(end.rows.some((row) => row.status === "DNF")).toBe(true);
    expect(end.rows[0]?.gapMs).toBe(0);
    expect(end.progress).toBe(1);
  });
});
