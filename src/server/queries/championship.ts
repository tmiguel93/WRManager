import { prisma } from "@/persistence/prisma";
import type {
  ChampionshipCalendarView,
  ChampionshipCategoryOption,
  ChampionshipStandingsView,
} from "@/features/championship/types";
import { getActiveCareerContext } from "@/server/queries/career";
import {
  rankDriverStandings,
  rankManufacturerStandings,
  rankTeamStandings,
} from "@/domain/rules/championship-standings";

function daysBetween(start: Date, end: Date) {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.ceil((end.getTime() - start.getTime()) / msPerDay);
}

async function getCategoryContext(requestedCategoryCode?: string) {
  const active = await getActiveCareerContext();
  const referenceDate = new Date(`${active.currentDateIso}T00:00:00.000Z`);
  const activeSeasonYear = referenceDate.getUTCFullYear();

  const categories = await prisma.category.findMany({
    orderBy: [{ tier: "asc" }, { name: "asc" }],
    select: {
      id: true,
      code: true,
      name: true,
      discipline: true,
      tier: true,
    },
  });

  const selected =
    categories.find((category) => category.code === requestedCategoryCode) ??
    categories.find((category) => category.code === active.categoryCode) ??
    categories[0] ??
    null;

  return {
    active,
    referenceDate,
    activeSeasonYear,
    categories: categories as ChampionshipCategoryOption[],
    selected,
  };
}

async function buildFallbackDriverStandings(categoryId: string) {
  const drivers = await prisma.driver.findMany({
    where: { currentCategoryId: categoryId },
    orderBy: [{ overall: "desc" }, { reputation: "desc" }],
    select: {
      id: true,
      displayName: true,
      countryCode: true,
      imageUrl: true,
      currentTeam: { select: { name: true } },
      overall: true,
    },
    take: 24,
  });

  return rankDriverStandings(
    drivers.map((driver) => ({
      driverId: driver.id,
      name: driver.displayName,
      countryCode: driver.countryCode,
      points: Math.max(0, Math.round((driver.overall - 70) * 1.8)),
      wins: 0,
      podiums: 0,
      poles: 0,
      teamName: driver.currentTeam?.name ?? "Free Agent",
      imageUrl: driver.imageUrl ?? null,
    })),
  );
}

async function buildFallbackTeamStandings(categoryId: string, managedTeamId: string | null) {
  const teams = await prisma.team.findMany({
    where: { categoryId },
    orderBy: [{ reputation: "desc" }, { budget: "desc" }],
    select: {
      id: true,
      name: true,
      countryCode: true,
      logoUrl: true,
      primaryColor: true,
      secondaryColor: true,
      accentColor: true,
      reputation: true,
    },
  });

  return rankTeamStandings(
      teams.map((team) => ({
        teamId: team.id,
        name: team.name,
        countryCode: team.countryCode,
        logoUrl: team.logoUrl,
        primaryColor: team.primaryColor,
        secondaryColor: team.secondaryColor,
        accentColor: team.accentColor,
        points: Math.max(0, Math.round((team.reputation - 55) * 3.1)),
        wins: 0,
        podiums: 0,
        isManagedTeam: Boolean(managedTeamId && team.id === managedTeamId),
      })),
  );
}

async function buildFallbackManufacturerStandings(categoryId: string) {
  const teams = await prisma.team.findMany({
    where: { categoryId },
    select: {
      id: true,
      manufacturerName: true,
      name: true,
      reputation: true,
      supplierContracts: {
        where: { status: "ACTIVE", supplier: { type: "ENGINE" } },
        take: 1,
        include: {
          supplier: { select: { name: true } },
        },
      },
    },
  });

  const byManufacturer = new Map<string, { manufacturerName: string; points: number; wins: number }>();

  for (const team of teams) {
    const manufacturerName =
      team.manufacturerName ??
      team.supplierContracts[0]?.supplier.name ??
      team.name;

    const current = byManufacturer.get(manufacturerName) ?? {
      manufacturerName,
      points: 0,
      wins: 0,
    };
    current.points += Math.max(0, Math.round((team.reputation - 55) * 3.1));
    byManufacturer.set(manufacturerName, current);
  }

  return rankManufacturerStandings(Array.from(byManufacturer.values()));
}

export async function getChampionshipCalendarView(
  requestedCategoryCode?: string,
): Promise<ChampionshipCalendarView | null> {
  const context = await getCategoryContext(requestedCategoryCode);
  if (!context.selected) return null;

  const selectedSeason =
    (await prisma.season.findFirst({
      where: {
        categoryId: context.selected.id,
        year: context.activeSeasonYear,
      },
      include: {
        events: {
          orderBy: [{ round: "asc" }],
        },
      },
    })) ??
    (await prisma.season.findFirst({
      where: { categoryId: context.selected.id },
      orderBy: [{ year: "desc" }],
      include: {
        events: {
          orderBy: [{ round: "asc" }],
        },
      },
    }));

  if (!selectedSeason) return null;

  const allCategoriesCurrentSeasons = await prisma.category.findMany({
    orderBy: [{ tier: "asc" }, { name: "asc" }],
    select: {
      code: true,
      name: true,
      seasons: {
        where: { year: context.activeSeasonYear },
        take: 1,
        include: {
          events: {
            orderBy: [{ round: "asc" }],
          },
        },
      },
    },
  });

  return {
    selectedCategory: context.selected,
    categories: context.categories,
    seasonYear: selectedSeason.year,
    seasonStatus: selectedSeason.status,
    currentRound: selectedSeason.currentRound,
    totalRounds: selectedSeason.events.length,
    events: selectedSeason.events.map((event) => ({
      id: event.id,
      round: event.round,
      name: event.name,
      circuitName: event.circuitName,
      countryCode: event.countryCode,
      trackType: event.trackType,
      startDateIso: event.startDate.toISOString().slice(0, 10),
      endDateIso: event.endDate.toISOString().slice(0, 10),
      daysUntil: daysBetween(context.referenceDate, event.startDate),
      weatherProfile: event.weatherProfile,
    })),
    globalOverview: allCategoriesCurrentSeasons.map((category) => {
      const season = category.seasons[0] ?? null;
      const nextEvent =
        season?.events.find((event) => event.startDate >= context.referenceDate) ??
        season?.events[0] ??
        null;

      return {
        categoryCode: category.code,
        categoryName: category.name,
        status: season?.status ?? "N/A",
        currentRound: season?.currentRound ?? 0,
        totalRounds: season?.events.length ?? 0,
        nextEvent: nextEvent
          ? {
              name: nextEvent.name,
              startDateIso: nextEvent.startDate.toISOString().slice(0, 10),
              countryCode: nextEvent.countryCode,
            }
          : null,
      };
    }),
  };
}

export async function getChampionshipStandingsView(
  requestedCategoryCode?: string,
): Promise<ChampionshipStandingsView | null> {
  const context = await getCategoryContext(requestedCategoryCode);
  if (!context.selected) return null;

  const currentSeason =
    (await prisma.season.findFirst({
      where: {
        categoryId: context.selected.id,
        year: context.activeSeasonYear,
      },
    })) ??
    (await prisma.season.findFirst({
      where: { categoryId: context.selected.id },
      orderBy: [{ year: "desc" }],
    }));

  if (!currentSeason) return null;

  const [driverRowsRaw, teamRowsRaw, manufacturerRowsRaw] = await Promise.all([
    prisma.standingsDriver.findMany({
      where: { seasonId: currentSeason.id, categoryId: context.selected.id },
      include: {
        driver: {
          select: {
            id: true,
            displayName: true,
            countryCode: true,
            imageUrl: true,
            currentTeam: { select: { name: true } },
          },
        },
      },
    }),
    prisma.standingsTeam.findMany({
      where: { seasonId: currentSeason.id, categoryId: context.selected.id },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            countryCode: true,
            logoUrl: true,
            primaryColor: true,
            secondaryColor: true,
            accentColor: true,
          },
        },
      },
    }),
    prisma.standingsManufacturer.findMany({
      where: { seasonId: currentSeason.id, categoryId: context.selected.id },
    }),
  ]);

  const drivers =
    driverRowsRaw.length > 0
      ? rankDriverStandings(
          driverRowsRaw.map((row) => ({
            driverId: row.driver.id,
            name: row.driver.displayName,
            countryCode: row.driver.countryCode,
            points: row.points,
            wins: row.wins,
            podiums: row.podiums,
            poles: row.poles,
            teamName: row.driver.currentTeam?.name ?? "Independent",
            imageUrl: row.driver.imageUrl ?? null,
          })),
        )
      : await buildFallbackDriverStandings(context.selected.id);

  const teams =
    teamRowsRaw.length > 0
      ? rankTeamStandings(
          teamRowsRaw.map((row) => ({
            teamId: row.team.id,
            name: row.team.name,
            countryCode: row.team.countryCode,
            logoUrl: row.team.logoUrl,
            primaryColor: row.team.primaryColor,
            secondaryColor: row.team.secondaryColor,
            accentColor: row.team.accentColor,
            points: row.points,
            wins: row.wins,
            podiums: row.podiums,
            isManagedTeam: Boolean(context.active.teamId && row.team.id === context.active.teamId),
          })),
        )
      : await buildFallbackTeamStandings(context.selected.id, context.active.teamId);

  const manufacturers =
    manufacturerRowsRaw.length > 0
      ? rankManufacturerStandings(
          manufacturerRowsRaw.map((row) => ({
            manufacturerName: row.manufacturerName,
            points: row.points,
            wins: row.wins,
          })),
        )
      : await buildFallbackManufacturerStandings(context.selected.id);

  const previousSeason = await prisma.season.findFirst({
    where: {
      categoryId: context.selected.id,
      year: currentSeason.year - 1,
    },
  });

  const history = previousSeason
    ? await (async () => {
        const [historyDrivers, historyTeams, historyManufacturers] = await Promise.all([
          prisma.standingsDriver.findMany({
            where: { seasonId: previousSeason.id, categoryId: context.selected.id },
            include: {
              driver: {
                select: {
                  id: true,
                  displayName: true,
                  countryCode: true,
                  imageUrl: true,
                  currentTeam: { select: { name: true } },
                },
              },
            },
          }),
          prisma.standingsTeam.findMany({
            where: { seasonId: previousSeason.id, categoryId: context.selected.id },
            include: {
              team: {
                select: {
                  id: true,
                  name: true,
                  countryCode: true,
                  logoUrl: true,
                  primaryColor: true,
                  secondaryColor: true,
                  accentColor: true,
                },
              },
            },
          }),
          prisma.standingsManufacturer.findMany({
            where: { seasonId: previousSeason.id, categoryId: context.selected.id },
          }),
        ]);

        const rankedDrivers = rankDriverStandings(
          historyDrivers.map((row) => ({
            driverId: row.driver.id,
            name: row.driver.displayName,
            countryCode: row.driver.countryCode,
            points: row.points,
            wins: row.wins,
            podiums: row.podiums,
            poles: row.poles,
            teamName: row.driver.currentTeam?.name ?? "Independent",
            imageUrl: row.driver.imageUrl ?? null,
          })),
        );
          const rankedTeams = rankTeamStandings(
            historyTeams.map((row) => ({
              teamId: row.team.id,
              name: row.team.name,
              countryCode: row.team.countryCode,
              logoUrl: row.team.logoUrl,
              primaryColor: row.team.primaryColor,
              secondaryColor: row.team.secondaryColor,
              accentColor: row.team.accentColor,
              points: row.points,
              wins: row.wins,
              podiums: row.podiums,
              isManagedTeam: Boolean(context.active.teamId && row.team.id === context.active.teamId),
            })),
          );
        const rankedManufacturers = rankManufacturerStandings(
          historyManufacturers.map((row) => ({
            manufacturerName: row.manufacturerName,
            points: row.points,
            wins: row.wins,
          })),
        );

        return {
          seasonYear: previousSeason.year,
          status: previousSeason.status,
          topDriver: rankedDrivers[0] ?? null,
          topTeam: rankedTeams[0] ?? null,
          topManufacturer: rankedManufacturers[0] ?? null,
        };
      })()
    : null;

  return {
    selectedCategory: context.selected,
    categories: context.categories,
    managedTeamId: context.active.teamId,
    seasonYear: currentSeason.year,
    seasonStatus: currentSeason.status,
    drivers: drivers.slice(0, 24),
    teams: teams.slice(0, 20),
    manufacturers: manufacturers.slice(0, 20),
    history,
  };
}
