import { SessionType } from "@prisma/client";

import type { TrackType } from "@/domain/models/core";
import { prisma } from "@/persistence/prisma";
import { getActiveCareerContext } from "@/server/queries/career";
import type {
  RaceControlCenterView,
  RaceControlCategoryOption,
  RaceGridRow,
  RaceLeaderboardRow,
  RaceSessionSummary,
} from "@/features/race-control/types";
import { formatRaceTime } from "@/domain/rules/race-control-sim";

const raceSessionTypes = new Set<SessionType>([
  SessionType.SPRINT,
  SessionType.FEATURE,
  SessionType.STAGE,
  SessionType.RACE,
]);

function tokenLabelFromOrder(sessionOrder: unknown, orderIndex: number) {
  if (!Array.isArray(sessionOrder)) {
    return `Session ${orderIndex}`;
  }

  const token = sessionOrder[orderIndex - 1];
  if (typeof token !== "string") {
    return `Session ${orderIndex}`;
  }

  if (token === "Q1" || token === "Q2" || token === "Q3") return token;
  return token
    .toLowerCase()
    .split("_")
    .map((chunk) => chunk.slice(0, 1).toUpperCase() + chunk.slice(1))
    .join(" ");
}

function readStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string");
}

function safeRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

async function resolveWeekendContext(requestedCategoryCode?: string) {
  const active = await getActiveCareerContext();
  const seasonYear = Number.parseInt(active.currentDateIso.slice(0, 4), 10);

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

  if (!selected) {
    return null;
  }

  const season =
    (await prisma.season.findFirst({
      where: {
        categoryId: selected.id,
        year: seasonYear,
      },
      include: {
        events: {
          orderBy: [{ round: "asc" }],
          include: {
            raceWeekends: {
              include: {
                ruleSet: {
                  select: {
                    sessionOrder: true,
                    weatherSensitivity: true,
                  },
                },
                sessions: {
                  orderBy: [{ orderIndex: "asc" }],
                  include: {
                    teamStates: active.teamId
                      ? {
                          where: {
                            teamId: active.teamId,
                          },
                        }
                      : false,
                  },
                },
              },
            },
          },
        },
      },
    })) ??
    (await prisma.season.findFirst({
      where: {
        categoryId: selected.id,
      },
      orderBy: [{ year: "desc" }],
      include: {
        events: {
          orderBy: [{ round: "asc" }],
          include: {
            raceWeekends: {
              include: {
                ruleSet: {
                  select: {
                    sessionOrder: true,
                    weatherSensitivity: true,
                  },
                },
                sessions: {
                  orderBy: [{ orderIndex: "asc" }],
                  include: {
                    teamStates: active.teamId
                      ? {
                          where: {
                            teamId: active.teamId,
                          },
                        }
                      : false,
                  },
                },
              },
            },
          },
        },
      },
    }));

  const nextEvent =
    season?.status === "PRESEASON"
      ? season.events[0] ?? null
      : season?.status === "ACTIVE"
        ? season.events.find((event) => event.round >= season.currentRound) ??
          season.events[season.events.length - 1] ??
          null
        : season?.events[season.events.length - 1] ?? null;
  const weekend = nextEvent?.raceWeekends[0] ?? null;

  return {
    active,
    seasonYear: season?.year ?? seasonYear,
    categories: categories as RaceControlCategoryOption[],
    selected: selected as RaceControlCategoryOption,
    nextEvent,
    weekend,
  };
}

function buildSummary(rows: RaceLeaderboardRow[]): RaceSessionSummary | null {
  if (rows.length === 0) return null;

  const winner = rows[0];
  const managedRows = rows.filter((row) => row.isManagedTeam);
  const managedBestPosition = managedRows.length > 0 ? Math.min(...managedRows.map((row) => row.position)) : null;
  const managedPoints = managedRows.reduce((acc, row) => acc + row.points, 0);
  const dnfs = rows.filter((row) => row.status === "DNF").length;

  return {
    winnerName: winner.driverName,
    winnerTeamName: winner.teamName,
    winnerTimeMs: winner.totalTimeMs,
    managedBestPosition,
    managedPoints,
    dnfs,
  };
}

export async function getRaceControlCenterView(
  requestedCategoryCode?: string,
): Promise<RaceControlCenterView | null> {
  const context = await resolveWeekendContext(requestedCategoryCode);
  if (!context) return null;

  const raceSessions = (context.weekend?.sessions ?? []).filter((session) =>
    raceSessionTypes.has(session.sessionType),
  );
  const targetSession =
    raceSessions.find((session) => !session.completed) ?? raceSessions[raceSessions.length - 1] ?? null;

  const latestCompletedQualifying = (context.weekend?.sessions ?? [])
    .filter((session) =>
      (session.sessionType === SessionType.QUALIFYING || session.sessionType === SessionType.HYPERPOLE) &&
      session.completed,
    )
    .sort((a, b) => b.orderIndex - a.orderIndex)[0];

  const [drivers, qualifyingRows, raceRows] = await Promise.all([
    context.nextEvent
      ? prisma.driver.findMany({
          where: {
            currentCategoryId: context.nextEvent.categoryId,
            currentTeamId: { not: null },
          },
          include: {
            currentTeam: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: [{ overall: "desc" }],
        })
      : Promise.resolve([]),
    latestCompletedQualifying
      ? prisma.qualifyingResult.findMany({
          where: {
            sessionId: latestCompletedQualifying.id,
          },
          orderBy: [{ position: "asc" }],
          select: {
            driverId: true,
            position: true,
          },
        })
      : Promise.resolve([]),
    targetSession
      ? prisma.raceResult.findMany({
          where: {
            sessionId: targetSession.id,
          },
          orderBy: [{ position: "asc" }],
          include: {
            driver: {
              select: {
                id: true,
                displayName: true,
                countryCode: true,
                imageUrl: true,
                currentTeamId: true,
                currentTeam: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        })
      : Promise.resolve([]),
  ]);

  const gridSeed = [...drivers].sort((a, b) => b.overall - a.overall);
  const gridOrder: string[] = [];

  for (const row of qualifyingRows) {
    if (!gridOrder.includes(row.driverId)) {
      gridOrder.push(row.driverId);
    }
  }
  for (const driver of gridSeed) {
    if (!gridOrder.includes(driver.id)) {
      gridOrder.push(driver.id);
    }
  }

  const startPositionByDriver = new Map<string, number>();
  gridOrder.forEach((driverId, index) => {
    startPositionByDriver.set(driverId, index + 1);
  });

  const startingGrid: RaceGridRow[] = gridOrder
    .map((driverId) => drivers.find((driver) => driver.id === driverId) ?? null)
    .filter((driver): driver is NonNullable<typeof driver> => Boolean(driver))
    .map((driver) => ({
      driverId: driver.id,
      driverName: driver.displayName,
      teamId: driver.currentTeamId,
      teamName: driver.currentTeam?.name ?? "Independent",
      countryCode: driver.countryCode,
      imageUrl: driver.imageUrl ?? null,
      startPosition: startPositionByDriver.get(driver.id) ?? 0,
      isManagedTeam: Boolean(context.active.teamId && driver.currentTeamId === context.active.teamId),
    }))
    .slice(0, 30);

  const leaderTime = raceRows[0]?.totalTimeMs ?? null;

  const leaderboard: RaceLeaderboardRow[] = raceRows.map((row) => ({
    position: row.position,
    driverId: row.driver.id,
    driverName: row.driver.displayName,
    teamId: row.driver.currentTeamId,
    teamName: row.driver.currentTeam?.name ?? "Independent",
    countryCode: row.driver.countryCode,
    imageUrl: row.driver.imageUrl ?? null,
    status: row.status,
    points: row.points,
    totalTimeMs: row.totalTimeMs,
    gapMs: row.totalTimeMs !== null && leaderTime !== null ? row.totalTimeMs - leaderTime : null,
    pitStops: row.pitStops,
    lapsCompleted: row.lapsCompleted,
    incidents: readStringArray(row.incidents),
    isManagedTeam: Boolean(context.active.teamId && row.driver.currentTeamId === context.active.teamId),
  }));

  const managedState = targetSession?.teamStates[0] ?? null;
  const notes = safeRecord(managedState?.notes);
  const notesFeed = readStringArray(notes?.eventFeed);

  const derivedFeed =
    leaderboard.length > 0
      ? [
          `Result ready: ${leaderboard[0].driverName} won ${targetSession ? tokenLabelFromOrder(context.weekend?.ruleSet.sessionOrder, targetSession.orderIndex) : "the race"}.`,
          leaderboard[0].totalTimeMs ? `Winning time: ${formatRaceTime(leaderboard[0].totalTimeMs)}.` : "Winning time unavailable.",
          ...leaderboard.flatMap((row) => row.incidents).slice(0, 4),
        ]
      : [];

  const eventFeed = notesFeed.length > 0 ? notesFeed : derivedFeed;

  return {
    categories: context.categories,
    selectedCategory: context.selected,
    seasonYear: context.seasonYear,
    event: context.nextEvent
      ? {
          id: context.nextEvent.id,
          round: context.nextEvent.round,
          name: context.nextEvent.name,
          circuitName: context.nextEvent.circuitName,
          countryCode: context.nextEvent.countryCode,
          trackType: context.nextEvent.trackType as TrackType,
          startDateIso: context.nextEvent.startDate.toISOString().slice(0, 10),
          hasWeekend: Boolean(context.weekend),
        }
      : null,
    raceWeekendId: context.weekend?.id ?? null,
    weatherSensitivity: context.weekend?.ruleSet.weatherSensitivity ?? 70,
    raceSessions: raceSessions.map((session) => ({
      id: session.id,
      orderIndex: session.orderIndex,
      label: tokenLabelFromOrder(context.weekend?.ruleSet.sessionOrder, session.orderIndex),
      sessionType: session.sessionType,
      completed: session.completed,
      weatherState: "RACE_DYNAMIC",
    })),
    targetSession: targetSession
      ? {
          id: targetSession.id,
          orderIndex: targetSession.orderIndex,
          label: tokenLabelFromOrder(context.weekend?.ruleSet.sessionOrder, targetSession.orderIndex),
          sessionType: targetSession.sessionType,
          completed: targetSession.completed,
          weatherState: "RACE_DYNAMIC",
        }
      : null,
    startingGrid,
    leaderboard,
    eventFeed,
    summary: buildSummary(leaderboard),
  };
}

