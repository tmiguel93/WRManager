import { buildCategoryGate, buildBoardObjectives, moneyGateForTier, opportunityStatus, scoreCareerOpportunity, sponsorFitScore, teamChemistryTone } from "@/domain/rules/career-intelligence";
import type {
  AcademyProspect,
  AchievementTrack,
  CareerIntelligenceView,
  CareerOpportunity,
  ChemistrySignal,
  MediaSignal,
} from "@/features/career-intelligence/types";
import { prisma } from "@/persistence/prisma";
import { getActiveCareerContext } from "@/server/queries/career";

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((acc, value) => acc + value, 0) / values.length;
}

function calculateAgeAt(birthDate: Date, currentDate: Date) {
  const years = currentDate.getUTCFullYear() - birthDate.getUTCFullYear();
  const hadBirthday =
    currentDate.getUTCMonth() > birthDate.getUTCMonth() ||
    (currentDate.getUTCMonth() === birthDate.getUTCMonth() && currentDate.getUTCDate() >= birthDate.getUTCDate());
  return hadBirthday ? years : years - 1;
}

function buildAchievementTracks(params: {
  reputation: number;
  cashBalance: number;
  currentTier: number;
  founded: boolean;
  activeContracts: number;
  wins: number;
  podiums: number;
}): AchievementTrack[] {
  return [
    {
      id: "founded-program",
      titleKey: "careerRoad.achievementFounded",
      progressPercent: params.founded ? 100 : 0,
      isComplete: params.founded,
      detailKey: "careerRoad.achievementFoundedDetail",
      persistedStatus: null,
    },
    {
      id: "stable-payroll",
      titleKey: "careerRoad.achievementPayroll",
      progressPercent: Math.min(100, params.activeContracts * 20),
      isComplete: params.activeContracts >= 5,
      detailKey: "careerRoad.achievementPayrollDetail",
      persistedStatus: null,
    },
    {
      id: "reputation-climb",
      titleKey: "careerRoad.achievementReputation",
      progressPercent: Math.min(100, Math.round((params.reputation / 80) * 100)),
      isComplete: params.reputation >= 80,
      detailKey: "careerRoad.achievementReputationDetail",
      persistedStatus: null,
    },
    {
      id: "financial-runway",
      titleKey: "careerRoad.achievementRunway",
      progressPercent: Math.min(100, Math.round((params.cashBalance / moneyGateForTier(Math.max(2, params.currentTier))) * 100)),
      isComplete: params.cashBalance >= moneyGateForTier(Math.max(2, params.currentTier)),
      detailKey: "careerRoad.achievementRunwayDetail",
      persistedStatus: null,
    },
    {
      id: "sporting-results",
      titleKey: "careerRoad.achievementResults",
      progressPercent: Math.min(100, params.wins * 32 + params.podiums * 12),
      isComplete: params.wins > 0 || params.podiums >= 3,
      detailKey: "careerRoad.achievementResultsDetail",
      persistedStatus: null,
    },
    {
      id: "elite-path",
      titleKey: "careerRoad.achievementElitePath",
      progressPercent: Math.min(100, params.currentTier * 25),
      isComplete: params.currentTier >= 4,
      detailKey: "careerRoad.achievementElitePathDetail",
      persistedStatus: null,
    },
  ];
}

export async function getCareerIntelligenceView(): Promise<CareerIntelligenceView> {
  const activeCareer = await getActiveCareerContext();
  const currentDate = new Date(`${activeCareer.currentDateIso}T00:00:00.000Z`);

  const [categories, activeTeam, teams, prospects, news, rumors, persistedObjectives, persistedOpportunities, persistedMilestones, watchlist] = await Promise.all([
    prisma.category.findMany({
      orderBy: [{ tier: "asc" }, { name: "asc" }],
      include: { _count: { select: { teams: true } } },
    }),
    activeCareer.teamId
      ? prisma.team.findUnique({
          where: { id: activeCareer.teamId },
          include: {
            category: true,
            drivers: {
              select: {
                id: true,
                displayName: true,
                morale: true,
                overall: true,
                potential: true,
              },
            },
            staff: {
              select: {
                id: true,
                name: true,
                role: true,
                reputation: true,
              },
            },
            cars: {
              orderBy: { seasonYear: "desc" },
              take: 1,
              select: { basePerformance: true, reliability: true },
            },
            facilities: {
              include: { facility: { select: { maxLevel: true } } },
            },
            sponsorContracts: {
              where: { status: "ACTIVE" },
              select: { id: true, fixedValue: true, confidence: true },
            },
            driverContracts: {
              where: { status: "ACTIVE" },
              select: { id: true },
            },
            staffContracts: {
              where: { status: "ACTIVE" },
              select: { id: true },
            },
            teamHistories: {
              orderBy: { seasonYear: "desc" },
              take: 3,
              select: { wins: true, podiums: true, points: true },
            },
          },
        })
      : null,
    prisma.team.findMany({
      orderBy: [{ category: { tier: "asc" } }, { reputation: "desc" }],
      take: 80,
      include: {
        category: { select: { code: true, name: true, tier: true } },
      },
    }),
    prisma.driver.findMany({
      where: {
        potential: { gte: 78 },
        birthDate: { gte: new Date(Date.UTC(currentDate.getUTCFullYear() - 24, currentDate.getUTCMonth(), currentDate.getUTCDate())) },
      },
      orderBy: [{ potential: "desc" }, { overall: "desc" }],
      take: 18,
      include: {
        currentCategory: { select: { code: true, tier: true } },
        currentTeam: { select: { name: true } },
      },
    }),
    prisma.newsItem.findMany({
      orderBy: [{ importance: "desc" }, { publishedAt: "desc" }],
      take: 8,
    }),
    prisma.rumor.findMany({
      orderBy: [{ credibility: "desc" }, { createdAt: "desc" }],
      take: 8,
    }),
    activeCareer.careerId
      ? prisma.careerObjective.findMany({
          where: { careerId: activeCareer.careerId },
        })
      : [],
    activeCareer.careerId
      ? prisma.careerOpportunity.findMany({
          where: { careerId: activeCareer.careerId },
        })
      : [],
    activeCareer.careerId
      ? prisma.careerMilestone.findMany({
          where: { careerId: activeCareer.careerId },
        })
      : [],
    activeCareer.careerId
      ? prisma.careerAcademyWatchlist.findMany({
          where: { careerId: activeCareer.careerId },
        })
      : [],
  ]);

  const objectiveByKey = new Map(persistedObjectives.map((objective) => [objective.key, objective]));
  const opportunityByTeamCategory = new Map(
    persistedOpportunities.map((opportunity) => [`${opportunity.teamId}:${opportunity.categoryId}`, opportunity]),
  );
  const milestoneByKey = new Map(persistedMilestones.map((milestone) => [milestone.key, milestone]));
  const watchlistByDriverId = new Map(watchlist.map((entry) => [entry.driverId, entry]));

  const activeCategory = categories.find((category) => category.code === activeCareer.categoryCode);
  const currentTier = activeCategory?.tier ?? activeTeam?.category.tier ?? 1;
  const staffQuality = Math.round(average(activeTeam?.staff.map((member) => member.reputation) ?? []) || 52);
  const facilityStrength =
    average(
      activeTeam?.facilities.map((facility) => (facility.level / Math.max(1, facility.facility.maxLevel)) * 100) ?? [],
    ) || 48;
  const carPerformance = activeTeam?.cars[0]
    ? activeTeam.cars[0].basePerformance * 0.72 + activeTeam.cars[0].reliability * 0.28
    : 54;
  const driverQuality = average(activeTeam?.drivers.map((driver) => driver.overall) ?? []) || 55;
  const performanceScore = Math.round(carPerformance * 0.42 + driverQuality * 0.32 + facilityStrength * 0.26);
  const reputation = Math.max(activeCareer.teamReputation, activeCareer.teamReputation || 45);

  const roadToTop = categories.map((category) =>
    buildCategoryGate({
      code: category.code,
      name: category.name,
      discipline: category.discipline,
      tier: category.tier,
      region: category.region,
      teamsCount: category._count.teams,
      activeCategoryCode: activeCareer.categoryCode,
      activeTier: currentTier,
      reputation,
      cashBalance: activeCareer.cashBalance,
      staffQuality,
      performanceScore,
    }),
  );

  const nextGate = roadToTop
    .filter((gate) => gate.tier > currentTier)
    .sort((a, b) => b.progressPercent - a.progressPercent)[0];

  const opportunities: CareerOpportunity[] = teams
    .filter((team) => team.id !== activeCareer.teamId)
    .filter((team) => team.category.tier <= currentTier + 1)
    .map((team) => {
      const invitationScore = scoreCareerOpportunity({
        categoryTier: team.category.tier,
        activeTier: currentTier,
        teamReputation: team.reputation,
        careerReputation: reputation,
        teamBudget: team.budget,
        cashBalance: activeCareer.cashBalance,
      });
      return {
        id: team.id,
        teamId: team.id,
        categoryId: team.categoryId,
        teamName: team.name,
        categoryCode: team.category.code,
        categoryName: team.category.name,
        tier: team.category.tier,
        countryCode: team.countryCode,
        reputation: team.reputation,
        budget: team.budget,
        invitationScore,
        status: opportunityStatus(invitationScore),
        reasonKey:
          team.category.tier > currentTier
            ? "careerRoad.opportunityReasonPromotion"
            : "careerRoad.opportunityReasonLateral",
        persistedStatus:
          (opportunityByTeamCategory.get(`${team.id}:${team.categoryId}`)?.status as "WATCHLIST" | "ACCEPTED" | "DECLINED" | undefined) ??
          null,
      };
    })
    .sort((a, b) => b.invitationScore - a.invitationScore)
    .slice(0, 6);

  const academyProspects: AcademyProspect[] = prospects
    .filter((driver) => (driver.currentCategory?.tier ?? currentTier) <= currentTier + 1)
    .map((driver) => {
      const age = calculateAgeAt(driver.birthDate, currentDate);
      const fitScore = Math.round(
        Math.min(100, driver.potential * 0.58 + driver.overall * 0.24 + Math.max(0, 24 - age) * 1.8),
      );
      return {
        id: driver.id,
        name: driver.displayName,
        countryCode: driver.countryCode,
        age,
        categoryCode: driver.currentCategory?.code ?? "FA",
        teamName: driver.currentTeam?.name ?? null,
        overall: driver.overall,
        potential: driver.potential,
        fitScore,
        imageUrl: driver.imageUrl,
        watchlistStatus:
          (watchlistByDriverId.get(driver.id)?.status as "WATCHLIST" | "ARCHIVED" | undefined) ?? null,
      };
    })
    .sort((a, b) => b.fitScore - a.fitScore)
    .slice(0, 8);

  const sponsorFit = sponsorFitScore({
    cashBalance: activeCareer.cashBalance,
    teamReputation: reputation,
    categoryTier: currentTier,
    activeSponsorCount: activeTeam?.sponsorContracts.length ?? 0,
  });
  const moraleSignal = Math.round(average(activeTeam?.drivers.map((driver) => driver.morale) ?? []) || 66);
  const staffSignal = staffQuality;
  const performanceSignal = performanceScore;

  const chemistry: ChemistrySignal[] = [
    {
      id: "driver-room",
      labelKey: "careerRoad.chemistryDrivers",
      value: moraleSignal,
      tone: teamChemistryTone(moraleSignal),
      detailKey: "careerRoad.chemistryDriversDetail",
    },
    {
      id: "pit-wall",
      labelKey: "careerRoad.chemistryPitWall",
      value: staffSignal,
      tone: teamChemistryTone(staffSignal),
      detailKey: "careerRoad.chemistryPitWallDetail",
    },
    {
      id: "commercial-fit",
      labelKey: "careerRoad.chemistryCommercial",
      value: sponsorFit,
      tone: teamChemistryTone(sponsorFit),
      detailKey: "careerRoad.chemistryCommercialDetail",
    },
    {
      id: "package-belief",
      labelKey: "careerRoad.chemistryPackage",
      value: performanceSignal,
      tone: teamChemistryTone(performanceSignal),
      detailKey: "careerRoad.chemistryPackageDetail",
    },
  ];

  const activeContracts = (activeTeam?.driverContracts.length ?? 0) + (activeTeam?.staffContracts.length ?? 0);
  const wins = activeTeam?.teamHistories.reduce((acc, item) => acc + item.wins, 0) ?? 0;
  const podiums = activeTeam?.teamHistories.reduce((acc, item) => acc + item.podiums, 0) ?? 0;
  const achievements = buildAchievementTracks({
    reputation,
    cashBalance: activeCareer.cashBalance,
    currentTier,
    founded: Boolean(activeCareer.foundationSummary || activeCareer.careerId),
    activeContracts,
    wins,
    podiums,
  });
  const mergedAchievements = achievements.map((achievement) => {
    const persisted = milestoneByKey.get(achievement.id);
    return {
      ...achievement,
      persistedStatus: (persisted?.status as "IN_PROGRESS" | "ACHIEVED" | undefined) ?? null,
    };
  });

  const mediaSignals: MediaSignal[] = [
    ...news.map((item) => ({
      id: item.id,
      headline: item.title,
      categoryCode: item.categoryCode,
      score: item.importance,
      type: "NEWS" as const,
    })),
    ...rumors.map((item) => ({
      id: item.id,
      headline: item.headline,
      categoryCode: item.categoryCode,
      score: item.credibility,
      type: "RUMOR" as const,
    })),
  ]
    .filter((item) => item.categoryCode === activeCareer.categoryCode || item.score >= 72)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  const boardObjectives = buildBoardObjectives({
    cashBalance: activeCareer.cashBalance,
    tierBaselineCash: moneyGateForTier(currentTier),
    staffQuality,
    performanceScore,
    nextGatePercent: nextGate?.progressPercent ?? 100,
    prospectCount: academyProspects.length,
  });
  const mergedBoardObjectives = boardObjectives.map((objective) => {
    const persisted = objectiveByKey.get(objective.id);
    return {
      ...objective,
      persistedStatus: (persisted?.status as "ACTIVE" | "COMPLETED" | undefined) ?? null,
      pinned: persisted?.pinned ?? false,
    };
  });

  return {
    activeCareer: {
      careerName: activeCareer.careerName,
      teamName: activeCareer.teamName,
      categoryCode: activeCareer.categoryCode,
      reputation,
      cashBalance: activeCareer.cashBalance,
      seasonPhase: activeCareer.seasonPhase,
    },
    summary: {
      currentTier,
      nextTier: nextGate?.tier ?? null,
      staffQuality,
      performanceScore,
      unlockedCategories: roadToTop.filter((gate) => gate.status === "UNLOCKED").length,
      totalCategories: roadToTop.length,
      strongestGatePercent: nextGate?.progressPercent ?? 100,
    },
    roadToTop,
    opportunities,
    boardObjectives: mergedBoardObjectives,
    academyProspects,
    chemistry,
    achievements: mergedAchievements,
    mediaSignals,
  };
}
