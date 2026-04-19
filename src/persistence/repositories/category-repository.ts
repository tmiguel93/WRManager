import { prisma } from "@/persistence/prisma";

export async function listCategories() {
  return prisma.category.findMany({
    orderBy: [{ tier: "asc" }, { name: "asc" }],
    include: {
      ruleSets: true,
    },
  });
}
