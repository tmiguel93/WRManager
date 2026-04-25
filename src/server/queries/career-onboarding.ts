import { ContractStatus } from "@prisma/client";

import { evaluateMyTeamLineupRequirements, hasOperationalOnboardingMarket } from "@/domain/rules/onboarding";
import { prisma } from "@/persistence/prisma";

export async function getMyTeamOnboardingView(careerId: string) {
  const career = await prisma.career.findUnique({
    where: { id: careerId },
    include: {
      selectedCategory: {
        select: {
          id: true,
          code: true,
          name: true,
          tier: true,
        },
      },
      selectedTeam: {
        select: {
          id: true,
          name: true,
          shortName: true,
          countryCode: true,
          primaryColor: true,
          secondaryColor: true,
          accentColor: true,
          logoUrl: true,
          budget: true,
          reputation: true,
        },
      },
    },
  });

  if (!career || !career.selectedCategory || !career.selectedTeam) {
    return null;
  }

  const [driverContracts, staffContracts, localFreeDrivers, localFreeStaff] = await Promise.all([
    prisma.driverContract.findMany({
      where: {
        teamId: career.selectedTeam.id,
        status: ContractStatus.ACTIVE,
      },
      include: {
        driver: {
          select: {
            id: true,
            displayName: true,
            countryCode: true,
            imageUrl: true,
            overall: true,
            potential: true,
            morale: true,
          },
        },
      },
      orderBy: [{ annualSalary: "desc" }],
    }),
    prisma.staffContract.findMany({
      where: {
        teamId: career.selectedTeam.id,
        status: ContractStatus.ACTIVE,
      },
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            countryCode: true,
            imageUrl: true,
            reputation: true,
            specialty: true,
          },
        },
      },
      orderBy: [{ annualSalary: "desc" }],
    }),
    prisma.driver.findMany({
      where: {
        currentTeamId: null,
        OR: [{ currentCategoryId: career.selectedCategory.id }, { currentCategoryId: null }],
        contracts: {
          none: {
            status: ContractStatus.ACTIVE,
          },
        },
      },
      include: {
        currentCategory: {
          select: {
            code: true,
          },
        },
        traits: {
          orderBy: { isPrimary: "desc" },
          take: 1,
          include: {
            trait: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: [{ potential: "desc" }, { overall: "desc" }],
      take: 40,
    }),
    prisma.staff.findMany({
      where: {
        currentTeamId: null,
        OR: [{ currentCategoryId: career.selectedCategory.id }, { currentCategoryId: null }],
        contracts: {
          none: {
            status: ContractStatus.ACTIVE,
          },
        },
      },
      include: {
        currentCategory: {
          select: {
            code: true,
          },
        },
        traits: {
          take: 1,
          include: {
            trait: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: [{ reputation: "desc" }, { salary: "asc" }],
      take: 40,
    }),
  ]);

  const localMarketHasOperationalMinimum = hasOperationalOnboardingMarket({
    driverCandidates: localFreeDrivers.length,
    staffCandidates: localFreeStaff.length,
    minimumDrivers: 2,
    minimumStaff: 2,
  });

  const [freeDrivers, freeStaff] = localMarketHasOperationalMinimum
    ? [localFreeDrivers, localFreeStaff]
    : await Promise.all([
        prisma.driver.findMany({
          where: {
            currentTeamId: null,
            contracts: {
              none: {
                status: ContractStatus.ACTIVE,
              },
            },
          },
          include: {
            currentCategory: {
              select: {
                code: true,
              },
            },
            traits: {
              orderBy: { isPrimary: "desc" },
              take: 1,
              include: {
                trait: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: [{ potential: "desc" }, { overall: "desc" }],
          take: 40,
        }),
        prisma.staff.findMany({
          where: {
            currentTeamId: null,
            contracts: {
              none: {
                status: ContractStatus.ACTIVE,
              },
            },
          },
          include: {
            currentCategory: {
              select: {
                code: true,
              },
            },
            traits: {
              take: 1,
              include: {
                trait: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: [{ reputation: "desc" }, { salary: "asc" }],
          take: 40,
        }),
      ]);

  const activeDriverCount = driverContracts.length;
  const lineupCheck = evaluateMyTeamLineupRequirements({
    activeDriverCount,
    staffRoles: staffContracts.map((row) => row.role),
    minimumDrivers: 2,
  });

  const payroll = [...driverContracts, ...staffContracts].reduce((acc, item) => acc + item.annualSalary, 0);

  return {
    career: {
      id: career.id,
      mode: career.mode,
      onboardingComplete: career.onboardingComplete,
      managerProfileCode: career.managerProfileCode,
      cashBalance: career.cashBalance,
      foundationSummary: career.foundationSummary,
    },
    category: career.selectedCategory,
    team: career.selectedTeam,
    lineup: {
      drivers: driverContracts,
      staff: staffContracts,
      activeDriverCount,
      activeStaffCount: staffContracts.length,
      coreRolesMissing: lineupCheck.missingRequirements,
      minimumReady: lineupCheck.minimumReady,
      payroll,
    },
    market: {
      drivers: freeDrivers,
      staff: freeStaff,
    },
  };
}
