import { prisma } from "@/persistence/prisma";
import { cookies } from "next/headers";
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
          select: { teams: true },
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

  const mappedCategories: CareerSetupCategory[] = categories.map((category) => ({
    id: category.id,
    code: category.code,
    name: category.name,
    discipline: category.discipline,
    tier: category.tier,
    region: category.region,
    fantasyModeAllowed: category.fantasyModeAllowed,
    teamsCount: category._count.teams,
  }));

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
  teamId: string | null;
  teamName: string;
  teamCountryCode: string | null;
  teamBudget: number;
  teamReputation: number;
  categoryId: string | null;
  categoryCode: string;
  managerProfileCode: string;
  cashBalance: number;
  currentDateIso: string;
}

export async function getActiveCareerContext(): Promise<ActiveCareerContext> {
  const cookieStore = await cookies();
  const cookieCareerId = cookieStore.get("wrm_active_career_id")?.value ?? null;

  const career = cookieCareerId
    ? await prisma.career.findUnique({
        where: { id: cookieCareerId },
        include: {
          selectedCategory: { select: { id: true, code: true } },
          selectedTeam: { select: { id: true, name: true, countryCode: true, budget: true, reputation: true } },
        },
      })
    : await prisma.career.findFirst({
        orderBy: { createdAt: "desc" },
        include: {
          selectedCategory: { select: { id: true, code: true } },
          selectedTeam: { select: { id: true, name: true, countryCode: true, budget: true, reputation: true } },
        },
      });

  if (!career || !career.selectedCategory) {
    return {
      careerId: null,
      careerName: "Prototype Sandbox",
      teamId: null,
      teamName: "Apex Quantum GP",
      teamCountryCode: "US",
      teamBudget: 95_000_000,
      teamReputation: 70,
      categoryId: null,
      categoryCode: "F1",
      managerProfileCode: "ESTRATEGISTA",
      cashBalance: 42_500_000,
      currentDateIso: "2026-03-08",
    };
  }

  const firstUpcomingEvent = await prisma.calendarEvent.findFirst({
    where: {
      categoryId: career.selectedCategory.id,
      season: {
        year: career.currentSeasonYear,
      },
    },
    orderBy: { startDate: "asc" },
    select: {
      startDate: true,
    },
  });

  const eventDate = firstUpcomingEvent?.startDate ?? new Date(Date.UTC(career.currentSeasonYear, 2, 8));
  const currentDateIso = eventDate.toISOString().slice(0, 10);

  return {
    careerId: career.id,
    careerName: career.name,
    teamId: career.selectedTeam?.id ?? null,
    teamName: career.selectedTeam?.name ?? "Independent Program",
    teamCountryCode: career.selectedTeam?.countryCode ?? null,
    teamBudget: career.selectedTeam?.budget ?? 0,
    teamReputation: career.selectedTeam?.reputation ?? career.reputation,
    categoryId: career.selectedCategory.id,
    categoryCode: career.selectedCategory.code,
    managerProfileCode: career.managerProfileCode,
    cashBalance: career.cashBalance,
    currentDateIso,
  };
}
