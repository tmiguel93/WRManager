import { describe, expect, it } from "vitest";

import {
  dedupeManifestDrivers,
  dedupeManifestStaff,
  dedupeManifestSuppliers,
  dedupeManifestTeams,
} from "@/persistence/importers/roster-manifest";

describe("roster manifest dedupe", () => {
  it("dedupes teams by category and canonical name", () => {
    const teams = dedupeManifestTeams([
      { categoryCode: "F3", name: "Campos Racing", countryCode: "ES" },
      { categoryCode: "F3", name: "  campos racing ", countryCode: "ES" },
      { categoryCode: "F2", name: "Campos Racing", countryCode: "ES" },
    ]);

    expect(teams).toHaveLength(2);
  });

  it("dedupes drivers by display name and birth date", () => {
    const drivers = dedupeManifestDrivers([
      {
        firstName: "Theo",
        lastName: "Pourchaire",
        displayName: "Theo Pourchaire",
        countryCode: "FR",
        birthDateIso: "2003-08-20",
        categoryCode: "F2",
        overall: 80,
        potential: 88,
        reputation: 73,
        marketValue: 10000000,
        salary: 2000000,
        morale: 75,
        personality: "Calm",
        primaryTraitCode: "TEAM_LEADER",
      },
      {
        firstName: "Theo",
        lastName: "Pourchaire",
        displayName: "  theo pourchaire ",
        countryCode: "FR",
        birthDateIso: "2003-08-20",
        categoryCode: "F2",
        overall: 80,
        potential: 88,
        reputation: 73,
        marketValue: 10000000,
        salary: 2000000,
        morale: 75,
        personality: "Calm",
        primaryTraitCode: "TEAM_LEADER",
      },
    ]);

    expect(drivers).toHaveLength(1);
  });

  it("dedupes staff by name and role", () => {
    const staff = dedupeManifestStaff([
      {
        name: "Pedro de la Rosa",
        role: "Driver Coach",
        countryCode: "ES",
        specialty: "Driver Development",
        categoryCode: "F4",
        reputation: 77,
        salary: 1300000,
        personality: "Calm",
      },
      {
        name: "Pedro de la Rosa",
        role: "Driver Coach",
        countryCode: "ES",
        specialty: "Driver Development",
        categoryCode: "F4",
        reputation: 77,
        salary: 1300000,
        personality: "Calm",
      },
    ]);

    expect(staff).toHaveLength(1);
  });

  it("dedupes suppliers by canonical name", () => {
    const suppliers = dedupeManifestSuppliers([
      {
        type: "TIRE",
        name: "Nexen Motorsport",
        countryCode: "KR",
        baseCost: 5000000,
        performance: 70,
        reliability: 76,
        efficiency: 72,
        drivability: 68,
        developmentCeiling: 78,
        maintenanceCost: 1500000,
        prestigeImpact: 55,
        sponsorSynergy: 52,
        categoryCodes: [],
      },
      {
        type: "TIRE",
        name: " nexen motorsport ",
        countryCode: "KR",
        baseCost: 5000000,
        performance: 70,
        reliability: 76,
        efficiency: 72,
        drivability: 68,
        developmentCeiling: 78,
        maintenanceCost: 1500000,
        prestigeImpact: 55,
        sponsorSynergy: 52,
        categoryCodes: [],
      },
    ]);

    expect(suppliers).toHaveLength(1);
  });
});
