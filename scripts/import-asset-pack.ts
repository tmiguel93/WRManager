import { importAssetPack } from "../src/persistence/assets/asset-pack";
import { inspectAssetPack } from "../src/persistence/assets/asset-pack-manifest";

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const manifestPath = args.find((arg) => !arg.startsWith("--"));
  if (!manifestPath) {
    throw new Error("Usage: npm run assets:import -- [--dry-run] <path/to/asset-pack.json>");
  }

  if (dryRun) {
    const report = await inspectAssetPack(manifestPath);
    console.log(`Asset pack: ${report.pack.displayName ?? report.pack.packSource}`);
    console.log(`Entries: ${report.entries.length}`);
    console.log(`Valid: ${report.validEntries.length}`);
    console.log(`Invalid: ${report.invalidEntries.length}`);
    for (const entry of report.invalidEntries) {
      console.log(`- #${entry.index + 1} ${entry.sourcePath}: ${entry.errors.join("; ")}`);
    }
    for (const entry of report.entries.filter((item) => item.warnings.length > 0).slice(0, 20)) {
      console.log(`~ #${entry.index + 1} ${entry.sourcePath}: ${entry.warnings.join("; ")}`);
    }
    if (report.invalidEntries.length > 0) process.exitCode = 1;
    return;
  }

  const result = await importAssetPack(manifestPath);
  console.log(`Imported ${result.imported} assets from ${manifestPath}`);
  console.log(`Inspected ${result.inspected} entries; skipped ${result.skipped}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
