import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

import { evaluateRosterCompleteness } from "../src/domain/rules/roster-completeness";

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./prisma/dev.db" });
const prisma = new PrismaClient({ adapter });

async function main() {
  const categories = await prisma.category.findMany({
    orderBy: [{ tier: "asc" }, { code: "asc" }],
    include: {
      teams: {
        select: {
          id: true,
          _count: {
            select: {
              drivers: true,
              staff: true,
            },
          },
        },
      },
    },
  });

  const rows = [];

  for (const category of categories) {
    const [drivers, staff, linkedDrivers, linkedStaff, activeDriverContracts, activeStaffContracts, prospects] =
      await Promise.all([
      prisma.driver.count({ where: { currentCategoryId: category.id } }),
      prisma.staff.count({ where: { currentCategoryId: category.id } }),
      prisma.driver.count({ where: { currentCategoryId: category.id, currentTeam: { categoryId: category.id } } }),
      prisma.staff.count({ where: { currentCategoryId: category.id, currentTeam: { categoryId: category.id } } }),
      prisma.driverContract.count({
        where: {
          status: "ACTIVE",
          team: { categoryId: category.id },
          driver: { currentCategoryId: category.id },
        },
      }),
      prisma.staffContract.count({
        where: {
          status: "ACTIVE",
          team: { categoryId: category.id },
          staff: { currentCategoryId: category.id },
        },
      }),
      prisma.driver.count({
        where: {
          currentCategoryId: category.id,
          birthDate: { gte: new Date(Date.UTC(2003, 0, 1)) },
          potential: { gte: 76 },
        },
      }),
    ]);

    const result = evaluateRosterCompleteness({
      tier: category.tier,
      teams: category.teams.length,
      drivers,
      staff,
      prospects,
      linkedDrivers,
      linkedStaff,
      activeDriverContracts,
      activeStaffContracts,
      teamsWithDriverGaps: category.teams.filter((team) => team._count.drivers < 2).length,
      teamsWithStaffGaps: category.teams.filter((team) => team._count.staff < 2).length,
    });

    rows.push({
      code: category.code,
      tier: category.tier,
      teams: category.teams.length,
      drivers,
      linkedDrivers,
      staff,
      linkedStaff,
      driverContracts: activeDriverContracts,
      staffContracts: activeStaffContracts,
      prospects,
      driverGaps: category.teams.filter((team) => team._count.drivers < 2).length,
      staffGaps: category.teams.filter((team) => team._count.staff < 2).length,
      status: result.status,
      issues: result.issues.join("; ") || "ok",
    });
  }

  console.table(rows);
  if (rows.some((row) => row.status !== "complete")) {
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
