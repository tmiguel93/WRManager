import { importChampionshipManifest } from "../src/persistence/importers/championship-manifest";

async function main() {
  const manifestPath = process.argv[2];
  if (!manifestPath) {
    throw new Error("Usage: npm run data:import-championship -- <path/to/championship-manifest.json> [--dry-run]");
  }

  const dryRun = process.argv.includes("--dry-run");
  const result = await importChampionshipManifest(manifestPath, { dryRun });

  console.log(`Championship import ${dryRun ? "(dry-run)" : ""} finished.`);
  console.log(
    JSON.stringify(
      {
        roster: {
          created: result.roster.created,
          updated: result.roster.updated,
          skipped: result.roster.skipped,
        },
        created: result.created,
        updated: result.updated,
        skipped: result.skipped,
        duplicates: result.duplicates,
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
