import { prisma } from "../src/persistence/prisma";

async function main() {
  const categories = await prisma.category.findMany({
    select: {
      code: true,
      name: true,
      tier: true,
      _count: {
        select: {
          teams: true,
          drivers: true,
          staff: true,
        },
      },
    },
    orderBy: [{ tier: "asc" }, { code: "asc" }],
  });

  const rows = categories.map((category) => ({
    code: category.code,
    tier: category.tier,
    teams: category._count.teams,
    drivers: category._count.drivers,
    staff: category._count.staff,
    status:
      category._count.drivers >= 4 && category._count.staff >= 2
        ? "OK"
        : category._count.drivers >= 2
          ? "WARN"
          : "GAP",
  }));

  console.table(rows);

  const gaps = rows.filter((row) => row.status !== "OK");
  if (gaps.length > 0) {
    console.log(`Coverage warnings: ${gaps.length}`);
  } else {
    console.log("Coverage complete for all categories.");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
