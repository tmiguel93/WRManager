import { describe, expect, it } from "vitest";

import {
  buildRosterManifestFromChampionship,
  parseChampionshipManifest,
} from "@/persistence/importers/championship-manifest";

const source = {
  label: "Official championship entry list",
  url: "https://example.com/entry-list",
  confidence: 91,
  lastVerifiedAt: "2026-04-26T00:00:00.000Z",
};

describe("championship manifest v2", () => {
  it("dedupes roster, circuit and calendar rows using canonical keys", () => {
    const manifest = parseChampionshipManifest({
      version: 2,
      defaultSourceId: "official",
      sources: { official: source },
      teams: [
        { categoryCode: "F4", name: "Campos Racing", countryCode: "ES" },
        { categoryCode: "F4", name: "  campos racing ", countryCode: "ES" },
        { categoryCode: "F3", name: "Campos Racing", countryCode: "ES" },
      ],
      drivers: [
        driverRow("Luca", "Rossi", "Luca Rossi"),
        driverRow("Luca", "Rossi", " luca rossi "),
      ],
      staff: [
        staffRow("Maria Silva", "Race Engineer"),
        staffRow(" Maria Silva ", "Race Engineer"),
      ],
      suppliers: [],
      circuits: [
        { name: "Interlagos", countryCode: "BR", trackType: "ROAD" },
        { name: " interlagos ", countryCode: "BR", trackType: "ROAD" },
      ],
      calendarEvents: [
        eventRow(1, "F4", "Interlagos Sprint"),
        eventRow(1, "F4", "Interlagos Sprint Duplicate"),
        eventRow(1, "F3", "Interlagos F3"),
      ],
    });

    expect(manifest.teams).toHaveLength(2);
    expect(manifest.drivers).toHaveLength(1);
    expect(manifest.staff).toHaveLength(1);
    expect(manifest.circuits).toHaveLength(1);
    expect(manifest.calendarEvents).toHaveLength(2);
  });

  it("resolves source ids into v1-compatible roster rows", () => {
    const manifest = parseChampionshipManifest({
      version: 2,
      defaultSourceId: "official",
      sources: {
        official: source,
        wiki: {
          label: "Wikipedia support table",
          url: "https://example.com/wiki",
          confidence: 72,
          lastVerifiedAt: "2026-04-20T00:00:00.000Z",
        },
      },
      teams: [{ categoryCode: "F4", name: "Campos Racing", countryCode: "ES", sourceId: "wiki" }],
      drivers: [driverRow("Luca", "Rossi", "Luca Rossi")],
      staff: [],
      suppliers: [],
      circuits: [],
      calendarEvents: [],
    });

    const roster = buildRosterManifestFromChampionship(manifest);

    expect(roster.version).toBe(1);
    expect(roster.source.label).toBe("Official championship entry list");
    expect(roster.teams[0].source.label).toBe("Wikipedia support table");
    expect(roster.drivers[0].source.label).toBe("Official championship entry list");
  });

  it("fails fast when an entity references an undeclared source", () => {
    const manifest = parseChampionshipManifest({
      version: 2,
      defaultSourceId: "official",
      sources: { official: source },
      teams: [{ categoryCode: "F4", name: "Campos Racing", countryCode: "ES", sourceId: "missing" }],
      drivers: [],
      staff: [],
      suppliers: [],
      circuits: [],
      calendarEvents: [],
    });

    expect(() => buildRosterManifestFromChampionship(manifest)).toThrow(/source "missing"/);
  });
});

function driverRow(firstName: string, lastName: string, displayName: string) {
  return {
    firstName,
    lastName,
    displayName,
    countryCode: "IT",
    birthDateIso: "2007-02-10",
    categoryCode: "F4",
    overall: 62,
    potential: 84,
    reputation: 50,
    marketValue: 600_000,
    salary: 120_000,
    morale: 72,
    personality: "Ambitious",
    primaryTraitCode: "calm-under-pressure",
  };
}

function staffRow(name: string, role: string) {
  return {
    name,
    role,
    countryCode: "BR",
    specialty: "Setup correlation",
    categoryCode: "F4",
    reputation: 68,
    salary: 220_000,
    personality: "Methodical",
  };
}

function eventRow(round: number, categoryCode: string, name: string) {
  return {
    categoryCode,
    seasonYear: 2026,
    round,
    name,
    circuitName: "Interlagos",
    countryCode: "BR",
    startDateIso: "2026-03-05",
    endDateIso: "2026-03-07",
    trackType: "ROAD",
  };
}
