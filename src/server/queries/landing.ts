import { prisma } from "@/persistence/prisma";

export async function getLandingSnapshot() {
  const [categoryCount, teamCount, driverCount, supplierCount, sponsorCount] = await Promise.all([
    prisma.category.count(),
    prisma.team.count(),
    prisma.driver.count(),
    prisma.supplier.count(),
    prisma.sponsor.count(),
  ]);

  return {
    categoryCount,
    teamCount,
    driverCount,
    supplierCount,
    sponsorCount,
  };
}
