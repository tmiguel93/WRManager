import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { supplementalDriverSeeds, supplementalStaffSeeds } from "../../prisma/seed-data/global-expansion";
import brandRegistry from "../../public/assets/brand-marks/brand-mark-registry.json";

describe("seed expansion and fallback brand marks", () => {
  it("adds a meaningful free-agent pool for entry categories", () => {
    const entryDriverPool = supplementalDriverSeeds.filter(
      (driver) =>
        driver.teamName === null &&
        [
          "FORMULA_VEE",
          "F4",
          "FORMULA_REGIONAL",
          "USF_JUNIORS",
          "GB3",
          "TURISMO_NACIONAL",
          "GT4_REGIONAL",
          "PROTOTYPE_CUP",
        ].includes(driver.categoryCode),
    );
    const entryStaffPool = supplementalStaffSeeds.filter((staff) => staff.teamName === null);

    expect(entryDriverPool.length).toBeGreaterThanOrEqual(20);
    expect(entryStaffPool.length).toBeGreaterThanOrEqual(20);
  });

  it("points registry entries at existing local SVG assets", () => {
    const registry = brandRegistry as {
      teams: Record<string, string>;
      suppliers: Record<string, string>;
      sponsors: Record<string, string>;
    };
    const allPaths = [
      ...Object.values(registry.teams),
      ...Object.values(registry.suppliers),
      ...Object.values(registry.sponsors),
    ];

    expect(allPaths.length).toBeGreaterThan(80);
    for (const assetPath of allPaths) {
      expect(assetPath.endsWith(".svg")).toBe(true);
      expect(existsSync(path.join(process.cwd(), "public", assetPath))).toBe(true);
    }
  });
});
