import { importAssetPack } from "../src/persistence/assets/asset-pack";

async function main() {
  const manifestPath = process.argv[2];
  if (!manifestPath) {
    throw new Error("Usage: npm run assets:import -- <path/to/asset-pack.json>");
  }

  const result = await importAssetPack(manifestPath);
  console.log(`Imported ${result.imported} assets from ${manifestPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
