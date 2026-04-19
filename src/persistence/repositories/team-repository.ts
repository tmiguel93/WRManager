import { prisma } from "@/persistence/prisma";

export async function listTeamsByCategory(categoryCode: string) {
  return prisma.team.findMany({
    where: {
      category: {
        code: categoryCode,
      },
    },
    include: {
      category: true,
      drivers: {
        orderBy: { overall: "desc" },
        take: 2,
      },
      supplierContracts: {
        include: {
          supplier: true,
        },
      },
      sponsorContracts: {
        include: {
          sponsor: true,
        },
      },
    },
  });
}
