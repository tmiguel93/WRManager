import { prisma } from "@/persistence/prisma";

export async function getDashboardSnapshot() {
  const [teams, drivers, nextEvent, supplierContracts] = await Promise.all([
    prisma.team.findMany({
      take: 4,
      orderBy: { reputation: "desc" },
      select: {
        id: true,
        name: true,
        countryCode: true,
        reputation: true,
        budget: true,
        category: { select: { code: true, name: true } },
      },
    }),
    prisma.driver.findMany({
      take: 6,
      orderBy: { overall: "desc" },
      select: {
        id: true,
        displayName: true,
        countryCode: true,
        overall: true,
        potential: true,
        imageUrl: true,
        currentTeam: { select: { name: true } },
      },
    }),
    prisma.calendarEvent.findFirst({
      orderBy: { startDate: "asc" },
      where: {
        startDate: {
          gte: new Date("2026-03-01T00:00:00.000Z"),
        },
      },
      select: {
        round: true,
        name: true,
        circuitName: true,
        countryCode: true,
        startDate: true,
        category: { select: { code: true } },
      },
    }),
    prisma.supplierContract.findMany({
      take: 4,
      orderBy: { annualCost: "desc" },
      include: {
        supplier: { select: { name: true, type: true } },
        team: { select: { name: true } },
      },
    }),
  ]);

  return {
    teams,
    drivers,
    nextEvent,
    supplierContracts,
  };
}
