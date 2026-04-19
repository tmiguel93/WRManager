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
  return prisma.assetRegistry.findMany({
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
}
