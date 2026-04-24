import { prisma } from "../src/persistence/prisma";

async function main() {
  const activeContracts = await prisma.sponsorContract.findMany({
    where: {
      status: "ACTIVE",
    },
    select: {
      id: true,
      teamId: true,
      sponsorId: true,
      activeKey: true,
    },
  });

  const seen = new Set<string>();
  for (const contract of activeContracts) {
    const key = `${contract.teamId}:${contract.sponsorId}`;
    if (seen.has(key)) {
      throw new Error(`Duplicate active sponsor contract detected for ${key}. Resolve duplicates before backfill.`);
    }
    seen.add(key);
  }

  let updates = 0;
  for (const contract of activeContracts) {
    if (contract.activeKey) continue;
    await prisma.sponsorContract.update({
      where: { id: contract.id },
      data: { activeKey: `${contract.teamId}:${contract.sponsorId}` },
    });
    updates += 1;
  }

  console.log(`Backfill complete. Updated contracts: ${updates}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
