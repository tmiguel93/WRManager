import { prisma } from "@/persistence/prisma";

export async function getDriversDirectory() {
  return prisma.driver.findMany({
    orderBy: [{ overall: "desc" }, { reputation: "desc" }],
    include: {
      currentTeam: { select: { id: true, name: true, shortName: true } },
      currentCategory: { select: { id: true, code: true, name: true } },
      contracts: {
        where: { status: "ACTIVE" },
        take: 1,
        orderBy: { endDate: "asc" },
        select: {
          role: true,
          annualSalary: true,
          endDate: true,
        },
      },
      traits: {
        orderBy: { isPrimary: "desc" },
        include: {
          trait: {
            select: {
              code: true,
              name: true,
            },
          },
        },
      },
    },
  });
}

export async function getDriverDetail(driverId: string) {
  return prisma.driver.findUnique({
    where: { id: driverId },
    include: {
      currentTeam: {
        select: {
          id: true,
          name: true,
          shortName: true,
          countryCode: true,
          category: { select: { code: true, name: true } },
        },
      },
      currentCategory: {
        select: { id: true, code: true, name: true, discipline: true, region: true },
      },
      traits: {
        orderBy: { isPrimary: "desc" },
        include: {
          trait: { select: { code: true, name: true, description: true } },
        },
      },
      contracts: {
        orderBy: [{ status: "asc" }, { endDate: "desc" }],
        include: {
          team: {
            select: {
              id: true,
              name: true,
              shortName: true,
              category: { select: { code: true } },
            },
          },
        },
      },
    },
  });
}

export async function getStaffDirectory() {
  return prisma.staff.findMany({
    orderBy: [{ reputation: "desc" }, { salary: "desc" }],
    include: {
      currentTeam: { select: { id: true, name: true } },
      currentCategory: { select: { code: true, name: true } },
      contracts: {
        where: { status: "ACTIVE" },
        take: 1,
        orderBy: { endDate: "asc" },
        select: {
          annualSalary: true,
          endDate: true,
        },
      },
      traits: {
        include: {
          trait: { select: { code: true, name: true } },
        },
      },
    },
  });
}

export async function getStaffDetail(staffId: string) {
  return prisma.staff.findUnique({
    where: { id: staffId },
    include: {
      currentTeam: {
        select: {
          id: true,
          name: true,
          shortName: true,
          countryCode: true,
          category: { select: { code: true, name: true } },
        },
      },
      currentCategory: {
        select: { id: true, code: true, name: true, discipline: true, region: true },
      },
      traits: {
        include: {
          trait: { select: { code: true, name: true, description: true } },
        },
      },
      contracts: {
        orderBy: [{ status: "asc" }, { endDate: "desc" }],
        include: {
          team: {
            select: {
              id: true,
              name: true,
              shortName: true,
              category: { select: { code: true } },
            },
          },
        },
      },
    },
  });
}

export async function getTeamsDirectory() {
  return prisma.team.findMany({
    orderBy: [{ reputation: "desc" }, { budget: "desc" }],
    include: {
      category: { select: { code: true, name: true } },
      drivers: {
        orderBy: { overall: "desc" },
        select: {
          id: true,
          displayName: true,
          countryCode: true,
          imageUrl: true,
          overall: true,
          potential: true,
        },
      },
      staff: {
        orderBy: { reputation: "desc" },
        take: 2,
        select: {
          id: true,
          name: true,
          role: true,
          imageUrl: true,
          countryCode: true,
          reputation: true,
        },
      },
    },
  });
}

export async function getTeamDetail(teamId: string) {
  return prisma.team.findUnique({
    where: { id: teamId },
    include: {
      category: { select: { code: true, name: true, discipline: true } },
      drivers: {
        orderBy: [{ overall: "desc" }],
        include: {
          contracts: {
            where: { status: "ACTIVE" },
            take: 1,
            select: {
              role: true,
              annualSalary: true,
              endDate: true,
            },
          },
        },
      },
      staff: {
        orderBy: [{ reputation: "desc" }],
        include: {
          contracts: {
            where: { status: "ACTIVE" },
            take: 1,
            select: {
              annualSalary: true,
              endDate: true,
            },
          },
          traits: {
            include: {
              trait: { select: { name: true } },
            },
          },
        },
      },
      supplierContracts: {
        where: { status: "ACTIVE" },
        orderBy: { annualCost: "desc" },
        include: {
          supplier: {
            select: {
              id: true,
              name: true,
              type: true,
              countryCode: true,
              performance: true,
              reliability: true,
              efficiency: true,
              baseCost: true,
            },
          },
        },
      },
      sponsorContracts: {
        where: { status: "ACTIVE" },
        orderBy: { fixedValue: "desc" },
        include: {
          sponsor: {
            select: {
              id: true,
              name: true,
              countryCode: true,
              industry: true,
              confidence: true,
            },
          },
        },
      },
      facilities: {
        orderBy: [{ level: "desc" }],
        include: {
          facility: {
            select: {
              code: true,
              name: true,
              description: true,
            },
          },
        },
      },
      cars: {
        orderBy: [{ seasonYear: "desc" }],
        include: {
          specs: {
            orderBy: { key: "asc" },
          },
        },
      },
      teamHistories: {
        orderBy: { seasonYear: "desc" },
      },
    },
  });
}

export async function getScoutingBoard(categoryCode: string) {
  const [freeAgents, highPotential, roleGaps] = await Promise.all([
    prisma.driver.findMany({
      where: {
        currentTeamId: null,
        contracts: {
          none: {
            status: "ACTIVE",
          },
        },
      },
      orderBy: [{ potential: "desc" }, { overall: "desc" }],
      take: 24,
      include: {
        currentTeam: { select: { id: true, name: true } },
        currentCategory: { select: { code: true, name: true } },
        traits: {
          orderBy: { isPrimary: "desc" },
          include: { trait: { select: { code: true, name: true } } },
        },
      },
    }),
    prisma.driver.findMany({
      where: {
        currentTeamId: null,
        potential: { gte: 86 },
        contracts: {
          none: {
            status: "ACTIVE",
          },
        },
      },
      orderBy: [{ potential: "desc" }, { overall: "desc" }],
      take: 24,
      include: {
        currentTeam: { select: { id: true, name: true } },
        currentCategory: { select: { code: true } },
        traits: {
          orderBy: { isPrimary: "desc" },
          include: { trait: { select: { code: true, name: true } } },
        },
      },
    }),
    prisma.staff.findMany({
      where: {
        currentTeamId: null,
        contracts: {
          none: {
            status: "ACTIVE",
          },
        },
        OR: [{ currentCategory: { code: categoryCode } }, { currentCategoryId: null }],
      },
      orderBy: [{ reputation: "desc" }],
      take: 16,
      include: {
        currentCategory: { select: { code: true } },
        traits: {
          include: {
            trait: { select: { code: true, name: true } },
          },
        },
      },
    }),
  ]);

  return {
    freeAgents,
    highPotential,
    roleGaps,
  };
}
