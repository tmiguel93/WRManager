import { prisma } from "@/persistence/prisma";
import { cookies } from "next/headers";
import { evaluateChampionshipCompleteness } from "@/domain/rules/championship-completeness";
import { deriveCareerPhaseFromSeason } from "@/domain/rules/season-progress";
import type {
  CareerSetupCategory,
  CareerSetupSupplier,
  CareerSetupTeam,
} from "@/features/career/types";

export async function getCareerSetupData() {
  const [categories, teams, suppliers] = await Promise.all([
    prisma.category.findMany({
      orderBy: [{ tier: "asc" }, { name: "asc" }],
      include: {
        _count: {
          select: { teams: true, drivers: true, staff: true },
        },
        seasons: {
          where: { year: 2026 },
          include: {
            events: {
              select: { circuitName: true },
            },
          },
        },
      },
    }),
    prisma.team.findMany({
      orderBy: [{ reputation: "desc" }],
      include: {
        category: {
          select: {
            code: true,
          },
        },
      },
    }),
    prisma.supplier.findMany({
      where: {
        type: "ENGINE",
      },
      include: {
        categories: {
          select: {
            categoryId: true,
          },
        },
      },
      orderBy: [{ performance: "desc" }],
    }),
  ]);

  const categoryReadinessEntries = await Promise.all(
    categories.map(async (category) => {
      const seasonEvents = category.seasons[0]?.events ?? [];
      const [linkedDrivers, linkedStaff, prospects] = await Promise.all([
        prisma.driver.count({
          where: { currentCategoryId: category.id, currentTeam: { categoryId: category.id } },
        }),
        prisma.staff.count({
          where: { currentCategoryId: category.id, currentTeam: { categoryId: category.id } },
        }),
        prisma.driver.count({
          where: {
            currentCategoryId: category.id,
            birthDate: { gte: new Date(Date.UTC(2003, 0, 1)) },
            potential: { gte: 76 },
          },
        }),
      ]);

      const completeness = evaluateChampionshipCompleteness({
        tier: category.tier,
        teams: category._count.teams,
        drivers: category._count.drivers,
        staff: category._count.staff,
        rounds: seasonEvents.length,
        circuits: new Set(seasonEvents.map((event) => event.circuitName.toLowerCase())).size,
        prospects,
        linkedDrivers,
        linkedStaff,
      });
      const engineSupplierCount = suppliers.filter((supplier) =>
        supplier.categories.some((link) => link.categoryId === category.id),
      ).length;
      const issues = [...completeness.issues];
      if (engineSupplierCount === 0) {
        issues.push("engine suppliers: 0/1");
      }

      return [
        category.id,
        {
          status: engineSupplierCount > 0 ? completeness.status : "blocked",
          issues,
          engineSupplierCount,
        },
      ] as const;
    }),
  );
  const categoryReadiness = new Map(categoryReadinessEntries);

  const mappedCategories: CareerSetupCategory[] = categories.map((category) => {
    const readiness = categoryReadiness.get(category.id);
    const readinessIssues = readiness?.issues ?? [];
    const readinessStatus = readiness?.status ?? "blocked";
    const progressionLocked = category.tier > 2;
    const contentLocked = readinessStatus !== "complete";

    return {
      id: category.id,
      code: category.code,
      name: category.name,
      discipline: category.discipline,
      tier: category.tier,
      region: category.region,
      fantasyModeAllowed: category.fantasyModeAllowed,
      teamsCount: category._count.teams,
      readinessStatus,
      readinessIssues,
      isStartEligible: !progressionLocked && !contentLocked,
      lockReason: progressionLocked
        ? "Progress in lower tiers to unlock elite categories."
        : contentLocked
          ? readiness?.engineSupplierCount === 0
            ? "No compatible engine supplier is available for this series yet."
            : "Championship content is being completed before career start."
          : null,
    };
  });

  const mappedTeams: CareerSetupTeam[] = teams.map((team) => ({
    id: team.id,
    categoryId: team.categoryId,
    categoryCode: team.category.code,
    name: team.name,
    shortName: team.shortName,
    countryCode: team.countryCode,
    budget: team.budget,
    reputation: team.reputation,
    primaryColor: team.primaryColor,
    secondaryColor: team.secondaryColor,
    accentColor: team.accentColor,
    logoUrl: team.logoUrl,
  }));

  const mappedSuppliers: CareerSetupSupplier[] = suppliers.map((supplier) => ({
    id: supplier.id,
    type: supplier.type,
    name: supplier.name,
    countryCode: supplier.countryCode,
    baseCost: supplier.baseCost,
    performance: supplier.performance,
    reliability: supplier.reliability,
    compatibleCategoryIds: supplier.categories.map((link) => link.categoryId),
  }));

  return {
    categories: mappedCategories,
    teams: mappedTeams,
    suppliers: mappedSuppliers,
  };
}

export async function listCareerSaves() {
  return prisma.career.findMany({
    orderBy: [{ createdAt: "desc" }],
    take: 12,
    include: {
      selectedCategory: {
        select: { name: true, code: true },
      },
      selectedTeam: {
        select: { name: true, countryCode: true },
      },
      profile: {
        select: { displayName: true },
      },
    },
  });
}

export async function getCareerById(careerId: string) {
  return prisma.career.findUnique({
    where: { id: careerId },
    include: {
      selectedCategory: {
        select: { id: true, code: true, name: true },
      },
      selectedTeam: {
        select: { id: true, name: true, countryCode: true },
      },
    },
  });
}

export async function getLatestCareer() {
  return prisma.career.findFirst({
    orderBy: { createdAt: "desc" },
    include: {
      selectedCategory: {
        select: { id: true, code: true, name: true },
      },
      selectedTeam: {
        select: { id: true, name: true, countryCode: true },
      },
    },
  });
}

export interface ActiveCareerContext {
  careerId: string | null;
  careerName: string;
  mode: "TEAM_PRINCIPAL" | "MY_TEAM" | "GLOBAL";
  onboardingComplete: boolean;
  foundationSummary: unknown | null;
  teamId: string | null;
  teamName: string;
  teamLogoUrl: string | null;
  teamCountryCode: string | null;
  teamBudget: number;
  teamReputation: number;
  teamPrimaryColor: string;
  teamSecondaryColor: string;
  teamAccentColor: string;
  teamIsCustom: boolean;
  categoryId: string | null;
  categoryCode: string;
  managerProfileCode: string;
  cashBalance: number;
  currentDateIso: string;
  seasonPhase: "PRESEASON" | "ROUND_ACTIVE" | "MID_SEASON" | "SEASON_END" | "OFFSEASON";
}

export async function getActiveCareerContext(): Promise<ActiveCareerContext> {
  const cookieStore = await cookies();
  const cookieCareerId = cookieStore.get("wrm_active_career_id")?.value ?? null;

  const career = cookieCareerId
    ? await prisma.career.findUnique({
        where: { id: cookieCareerId },
        include: {
          selectedCategory: { select: { id: true, code: true } },
          selectedTeam: {
            select: {
              id: true,
              name: true,
              countryCode: true,
              budget: true,
              reputation: true,
              primaryColor: true,
              secondaryColor: true,
              accentColor: true,
              logoUrl: true,
              isCustom: true,
            },
          },
        },
      })
    : await prisma.career.findFirst({
        orderBy: { createdAt: "desc" },
        include: {
          selectedCategory: { select: { id: true, code: true } },
          selectedTeam: {
            select: {
              id: true,
              name: true,
              countryCode: true,
              budget: true,
              reputation: true,
              primaryColor: true,
              secondaryColor: true,
              accentColor: true,
              logoUrl: true,
              isCustom: true,
            },
          },
        },
      });

  if (!career || !career.selectedCategory) {
    return {
      careerId: null,
      careerName: "Prototype Sandbox",
      mode: "TEAM_PRINCIPAL",
      onboardingComplete: true,
      foundationSummary: null,
      teamId: null,
      teamName: "Apex Quantum GP",
      teamLogoUrl: null,
      teamCountryCode: "US",
      teamBudget: 95_000_000,
      teamReputation: 70,
      teamPrimaryColor: "#0ea5e9",
      teamSecondaryColor: "#facc15",
      teamAccentColor: "#22d3ee",
      teamIsCustom: false,
      categoryId: null,
      categoryCode: "F1",
      managerProfileCode: "ESTRATEGISTA",
      cashBalance: 42_500_000,
      currentDateIso: "2026-03-08",
      seasonPhase: "PRESEASON",
    };
  }

  const firstUpcomingEvent = await prisma.calendarEvent.findFirst({
    where: { categoryId: career.selectedCategory.id },
    orderBy: [{ startDate: "asc" }],
    select: { startDate: true },
  });

  const season = await prisma.season.findFirst({
    where: {
      categoryId: career.selectedCategory.id,
      year: career.currentSeasonYear,
    },
    include: {
      events: {
        orderBy: [{ round: "asc" }],
        select: {
          round: true,
          startDate: true,
          endDate: true,
        },
      },
    },
  });

  let currentDate = firstUpcomingEvent?.startDate ?? new Date(Date.UTC(career.currentSeasonYear, 2, 8));
  let seasonPhase = career.seasonPhase;

  if (season && season.events.length > 0) {
    const firstEvent = season.events[0];
    const targetEvent =
      season.events.find((event) => event.round >= season.currentRound) ??
      season.events[season.events.length - 1];

    if (season.status === "PRESEASON") {
      currentDate = firstEvent.startDate;
    } else if (season.status === "ACTIVE") {
      currentDate = targetEvent.startDate;
    } else {
      currentDate = new Date(targetEvent.endDate.getTime() + 1000 * 60 * 60 * 24 * 5);
    }

    seasonPhase = deriveCareerPhaseFromSeason({
      seasonStatus: season.status,
      currentRound: season.currentRound,
      totalRounds: season.events.length,
    });

    if (seasonPhase !== career.seasonPhase) {
      await prisma.career.update({
        where: { id: career.id },
        data: { seasonPhase },
      });
    }
  }

  const currentDateIso = currentDate.toISOString().slice(0, 10);

  return {
    careerId: career.id,
    careerName: career.name,
    mode: career.mode,
    onboardingComplete: career.onboardingComplete,
    foundationSummary: career.foundationSummary,
    teamId: career.selectedTeam?.id ?? null,
    teamName: career.selectedTeam?.name ?? "Independent Program",
    teamLogoUrl: career.selectedTeam?.logoUrl ?? null,
    teamCountryCode: career.selectedTeam?.countryCode ?? null,
    teamBudget: career.selectedTeam?.budget ?? 0,
    teamReputation: career.selectedTeam?.reputation ?? career.reputation,
    teamPrimaryColor: career.selectedTeam?.primaryColor ?? "#0ea5e9",
    teamSecondaryColor: career.selectedTeam?.secondaryColor ?? "#facc15",
    teamAccentColor: career.selectedTeam?.accentColor ?? career.selectedTeam?.secondaryColor ?? "#22d3ee",
    teamIsCustom: career.selectedTeam?.isCustom ?? false,
    categoryId: career.selectedCategory.id,
    categoryCode: career.selectedCategory.code,
    managerProfileCode: career.managerProfileCode,
    cashBalance: career.cashBalance,
    currentDateIso,
    seasonPhase,
  };
}
