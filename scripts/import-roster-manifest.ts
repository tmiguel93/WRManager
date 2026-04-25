import { importRosterManifest } from "../src/persistence/importers/roster-manifest";

async function main() {
  const manifestPath = process.argv[2];
  if (!manifestPath) {
    throw new Error("Usage: npm run data:import-roster -- <path/to/roster-manifest.json> [--dry-run]");
  }

  const dryRun = process.argv.includes("--dry-run");
  const result = await importRosterManifest(manifestPath, { dryRun });

  console.log(`Roster import ${dryRun ? "(dry-run)" : ""} finished.`);
  console.log(
    JSON.stringify(
      {
        created: result.created,
        updated: result.updated,
        skipped: result.skipped,
        conflicts: result.conflicts,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
