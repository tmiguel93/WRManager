import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const backfillSource = readFileSync(
  path.resolve("scripts/backfill-championship-completeness.ts"),
  "utf8",
);

describe("championship backfill curated data guard", () => {
  it("does not generate generic names from first/last-name combinatorics", () => {
    expect(backfillSource).not.toContain("genericTeamPrefixes");
    expect(backfillSource).not.toContain("const firstNames");
    expect(backfillSource).not.toContain("const lastNames");
    expect(backfillSource).toContain("pickCuratedDriver");
    expect(backfillSource).toContain("pickCuratedStaff");
  });

  it("keeps prototype entry categories backed by a compatible engine supplier", () => {
    expect(backfillSource).toContain('category.code === "PROTOTYPE_CUP"');
    expect(backfillSource).toContain('"Cadillac"');
    expect(backfillSource).toContain('"Alpine"');
  });
});
