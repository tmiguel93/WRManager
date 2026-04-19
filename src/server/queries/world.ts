import { prisma } from "@/persistence/prisma";

export async function getCalendarView() {
  return prisma.calendarEvent.findMany({
    orderBy: [{ startDate: "asc" }],
    take: 16,
    select: {
      id: true,
      round: true,
      name: true,
      circuitName: true,
      countryCode: true,
      startDate: true,
      category: { select: { code: true } },
    },
  });
}

export async function getDriversView() {
  return prisma.driver.findMany({
    orderBy: [{ overall: "desc" }],
    take: 40,
    select: {
      id: true,
      displayName: true,
      countryCode: true,
      overall: true,
      potential: true,
      reputation: true,
      currentTeam: { select: { name: true } },
      currentCategory: { select: { code: true } },
    },
  });
}

export async function getTeamsView() {
  return prisma.team.findMany({
    orderBy: [{ reputation: "desc" }],
    include: {
      category: { select: { name: true, code: true } },
      drivers: {
        take: 2,
        orderBy: { overall: "desc" },
        select: { id: true, displayName: true, countryCode: true, overall: true, imageUrl: true },
      },
    },
  });
}

export async function getSuppliersView() {
  return prisma.supplier.findMany({
    orderBy: [{ prestigeImpact: "desc" }],
    include: {
      categories: { include: { category: { select: { code: true } } } },
    },
  });
}

export async function getNewsroomView() {
  return prisma.newsItem.findMany({
    orderBy: [{ publishedAt: "desc" }],
    take: 20,
    select: {
      id: true,
      title: true,
      body: true,
      categoryCode: true,
      importance: true,
      publishedAt: true,
    },
  });
}

export async function getAssetRegistryView() {
  const entries = await prisma.assetRegistry.findMany({
    orderBy: [{ createdAt: "desc" }],
    take: 24,
    select: {
      id: true,
      entityType: true,
      entityId: true,
      packSource: true,
      assetType: true,
      isPlaceholder: true,
      approved: true,
      createdAt: true,
    },
  });

  const groupedIds = {
    DRIVER: entries.filter((entry) => entry.entityType === "DRIVER").map((entry) => entry.entityId),
    TEAM: entries.filter((entry) => entry.entityType === "TEAM").map((entry) => entry.entityId),
    STAFF: entries.filter((entry) => entry.entityType === "STAFF").map((entry) => entry.entityId),
    SUPPLIER: entries.filter((entry) => entry.entityType === "SUPPLIER").map((entry) => entry.entityId),
    SPONSOR: entries.filter((entry) => entry.entityType === "SPONSOR").map((entry) => entry.entityId),
    CIRCUIT: entries.filter((entry) => entry.entityType === "CIRCUIT").map((entry) => entry.entityId),
  };

  const [drivers, teams, staff, suppliers, sponsors, circuits] = await Promise.all([
    groupedIds.DRIVER.length > 0
      ? prisma.driver.findMany({
          where: { id: { in: groupedIds.DRIVER } },
          select: { id: true, displayName: true },
        })
      : Promise.resolve([]),
    groupedIds.TEAM.length > 0
      ? prisma.team.findMany({
          where: { id: { in: groupedIds.TEAM } },
          select: { id: true, name: true },
        })
      : Promise.resolve([]),
    groupedIds.STAFF.length > 0
      ? prisma.staff.findMany({
          where: { id: { in: groupedIds.STAFF } },
          select: { id: true, name: true },
        })
      : Promise.resolve([]),
    groupedIds.SUPPLIER.length > 0
      ? prisma.supplier.findMany({
          where: { id: { in: groupedIds.SUPPLIER } },
          select: { id: true, name: true },
        })
      : Promise.resolve([]),
    groupedIds.SPONSOR.length > 0
      ? prisma.sponsor.findMany({
          where: { id: { in: groupedIds.SPONSOR } },
          select: { id: true, name: true },
        })
      : Promise.resolve([]),
    groupedIds.CIRCUIT.length > 0
      ? prisma.calendarEvent.findMany({
          where: { id: { in: groupedIds.CIRCUIT } },
          select: { id: true, name: true },
        })
      : Promise.resolve([]),
  ]);

  const nameById = new Map<string, string>();
  for (const row of drivers) nameById.set(row.id, row.displayName);
  for (const row of teams) nameById.set(row.id, row.name);
  for (const row of staff) nameById.set(row.id, row.name);
  for (const row of suppliers) nameById.set(row.id, row.name);
  for (const row of sponsors) nameById.set(row.id, row.name);
  for (const row of circuits) nameById.set(row.id, row.name);

  const entityLabel: Record<(typeof entries)[number]["entityType"], string> = {
    DRIVER: "Driver",
    TEAM: "Team",
    STAFF: "Staff",
    SUPPLIER: "Supplier",
    SPONSOR: "Sponsor",
    CIRCUIT: "Circuit",
  };

  const assetLabel: Record<(typeof entries)[number]["assetType"], string> = {
    DRIVER_PHOTO: "Driver Photo",
    TEAM_LOGO: "Team Logo",
    SUPPLIER_LOGO: "Supplier Logo",
    SPONSOR_BANNER: "Sponsor Banner",
    CIRCUIT_BANNER: "Circuit Banner",
    GENERIC: "Profile Asset",
  };

  return entries.map((entry) => ({
    id: entry.id,
    entityType: entityLabel[entry.entityType],
    entityName: nameById.get(entry.entityId) ?? "Unlinked Entity",
    packSource: entry.packSource,
    assetType: assetLabel[entry.assetType],
    isPlaceholder: entry.isPlaceholder,
    approved: entry.approved,
    createdAt: entry.createdAt,
  }));
}
