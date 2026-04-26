import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { evaluateChampionshipCompleteness } from "../src/domain/rules/championship-completeness";

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./prisma/dev.db" });
const prisma = new PrismaClient({ adapter });

async function main() {
  const categories = await prisma.category.findMany({
    orderBy: [{ tier: "asc" }, { code: "asc" }],
    include: {
      seasons: {
        where: { year: 2026 },
        include: {
          events: { select: { circuitName: true } },
        },
      },
    },
  });

  const rows = [];
  for (const category of categories) {
    const currentSeason = category.seasons[0];
    const [teams, drivers, staff, linkedDrivers, linkedStaff, prospects] = await Promise.all([
      prisma.team.count({ where: { categoryId: category.id } }),
      prisma.driver.count({ where: { currentCategoryId: category.id } }),
      prisma.staff.count({ where: { currentCategoryId: category.id } }),
      prisma.driver.count({ where: { currentCategoryId: category.id, currentTeamId: { not: null } } }),
      prisma.staff.count({ where: { currentCategoryId: category.id, currentTeamId: { not: null } } }),
      prisma.driver.count({
        where: {
          currentCategoryId: category.id,
          birthDate: { gte: new Date(Date.UTC(2003, 0, 1)) },
          potential: { gte: 76 },
        },
      }),
    ]);

    const events = currentSeason?.events ?? [];
    const result = evaluateChampionshipCompleteness({
      tier: category.tier,
      teams,
      drivers,
      staff,
      linkedDrivers,
      linkedStaff,
      rounds: events.length,
      circuits: new Set(events.map((event) => canonicalKey(event.circuitName))).size,
      prospects,
    });

    rows.push({
      code: category.code,
      tier: category.tier,
      teams,
      drivers,
      staff,
      prospects,
      rounds: events.length,
      circuits: new Set(events.map((event) => canonicalKey(event.circuitName))).size,
      status: result.status,
      issues: result.issues.join("; ") || "ok",
    });
  }

  console.table(rows);
  const blocked = rows.filter((row) => row.status !== "complete");
  if (blocked.length > 0) {
    process.exitCode = 1;
  }
}

function canonicalKey(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
