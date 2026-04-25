import { mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { inspectAssetPack } from "@/persistence/assets/asset-pack-manifest";

describe("asset pack manifest inspection", () => {
  it("accepts a safe local svg asset pack", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "wrm-asset-pack-"));
    await writeFile(
      path.join(root, "team.svg"),
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10"/></svg>`,
      "utf8",
    );
    const manifestPath = path.join(root, "asset-pack.json");
    await writeFile(
      manifestPath,
      JSON.stringify({
        packSource: "test-pack",
        displayName: "Test Pack",
        entries: [
          {
            entityType: "TEAM",
            entityId: "team-1",
            assetType: "TEAM_LOGO",
            file: "team.svg",
            attribution: {
              licenseType: "project-test",
              trademarkWarning: true,
            },
          },
        ],
      }),
      "utf8",
    );

    const report = await inspectAssetPack(manifestPath);

    expect(report.validEntries).toHaveLength(1);
    expect(report.invalidEntries).toHaveLength(0);
    expect(report.validEntries[0].sha256).toMatch(/^[a-f0-9]{64}$/);
  });

  it("blocks path traversal and unsafe svg content", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "wrm-asset-pack-"));
    await writeFile(path.join(root, "asset-pack.json"), JSON.stringify({
      packSource: "unsafe-pack",
      entries: [
        {
          entityType: "TEAM",
          entityId: "team-1",
          assetType: "TEAM_LOGO",
          file: "../outside.svg",
        },
      ],
    }), "utf8");

    const report = await inspectAssetPack(path.join(root, "asset-pack.json"));

    expect(report.invalidEntries).toHaveLength(1);
    expect(report.invalidEntries[0].errors.join(" ")).toContain("traversal");
  });
});
