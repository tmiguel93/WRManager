import { SessionType } from "@prisma/client";

import { getActiveCareerContext } from "@/server/queries/career";
import { prisma } from "@/persistence/prisma";
import type { QualifyingCenterView, WeekendCategoryOption, PracticeCenterView } from "@/features/weekend-sessions/types";
import type { TrackType } from "@/domain/models/core";

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((acc, value) => acc + value, 0) / values.length;
}

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

async function resolveWeekendContext(requestedCategoryCode?: string) {
  const active = await getActiveCareerContext();
  const seasonYear = Number.parseInt(active.currentDateIso.slice(0, 4), 10);
  const now = new Date(`${active.currentDateIso}T00:00:00.000Z`);

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
                ruleSet: {
                  select: {
                    sessionOrder: true,
                  },
                },
              },
            },
          },
        },
      },
    })) ??
    (await prisma.season.findFirst({
      where: { categoryId: selected.id },
      orderBy: [{ year: "desc" }],
      include: {
        events: {
          orderBy: [{ round: "asc" }],
          include: {
            raceWeekends: {
              include: {
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
                ruleSet: {
                  select: {
                    sessionOrder: true,
                  },
                },
              },
            },
          },
        },
      },
    }));

  const nextEvent =
    season?.events.find((event) => event.startDate >= now) ??
    season?.events[0] ??
    null;
  const weekend = nextEvent?.raceWeekends[0] ?? null;

  return {
    active,
    seasonYear: season?.year ?? seasonYear,
    categories: categories as WeekendCategoryOption[],
    selected: selected as WeekendCategoryOption,
    nextEvent,
    weekend,
  };
}

export async function getPracticeCenterView(requestedCategoryCode?: string): Promise<PracticeCenterView | null> {
  const context = await resolveWeekendContext(requestedCategoryCode);
  if (!context) return null;

  const teamDrivers = context.active.teamId
    ? await prisma.driver.findMany({
        where: {
          currentTeamId: context.active.teamId,
        },
        orderBy: [{ overall: "desc" }],
        select: {
          id: true,
          displayName: true,
          countryCode: true,
          overall: true,
          imageUrl: true,
        },
      })
    : [];

  const practiceSessions = (context.weekend?.sessions ?? []).filter((session) => session.sessionType === SessionType.PRACTICE);

  const learningRows = practiceSessions
    .map((session) => session.teamStates[0] ?? null)
    .filter((state): state is NonNullable<typeof state> => Boolean(state));

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
    practiceSessions: practiceSessions.map((session) => ({
      id: session.id,
      tokenLabel: tokenLabelFromOrder(context.weekend?.ruleSet.sessionOrder, session.orderIndex),
      orderIndex: session.orderIndex,
      completed: session.completed,
      weatherState: session.weatherState,
      setupConfidence: session.teamStates[0]?.setupConfidence ?? null,
      trackKnowledge: session.teamStates[0]?.trackKnowledge ?? null,
      paceDelta: session.teamStates[0]?.practiceDelta ?? null,
    })),
    teamLearning:
      learningRows.length > 0
        ? {
            averageSetupConfidence: Math.round(average(learningRows.map((row) => row.setupConfidence))),
            averageTrackKnowledge: Math.round(average(learningRows.map((row) => row.trackKnowledge))),
            averagePaceDelta: Number(average(learningRows.map((row) => row.practiceDelta)).toFixed(1)),
            completedSessions: learningRows.length,
          }
        : null,
    teamDrivers: teamDrivers.map((driver) => ({
      id: driver.id,
      name: driver.displayName,
      countryCode: driver.countryCode,
      overall: driver.overall,
      imageUrl: driver.imageUrl ?? null,
    })),
  };
}

export async function getQualifyingCenterView(requestedCategoryCode?: string): Promise<QualifyingCenterView | null> {
  const context = await resolveWeekendContext(requestedCategoryCode);
  if (!context) return null;

  const qualifyingSessions = (context.weekend?.sessions ?? []).filter(
    (session) => session.sessionType === SessionType.QUALIFYING || session.sessionType === SessionType.HYPERPOLE,
  );
  const targetSession =
    qualifyingSessions.find((session) => !session.completed) ??
    qualifyingSessions[qualifyingSessions.length - 1] ??
    null;

  const leaderboardRows = targetSession
    ? await prisma.qualifyingResult.findMany({
        where: { sessionId: targetSession.id },
        orderBy: [{ position: "asc" }],
        include: {
          driver: {
            select: {
              id: true,
              displayName: true,
              countryCode: true,
              imageUrl: true,
              currentTeamId: true,
              currentTeam: { select: { name: true } },
            },
          },
        },
      })
    : [];

  const learningRows = context.weekend
    ? await prisma.sessionTeamState.findMany({
        where: {
          teamId: context.active.teamId ?? "no-team",
          session: {
            raceWeekendId: context.weekend.id,
            sessionType: SessionType.PRACTICE,
          },
        },
      })
    : [];

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
    targetSession: targetSession
      ? {
          id: targetSession.id,
          label: tokenLabelFromOrder(context.weekend?.ruleSet.sessionOrder, targetSession.orderIndex),
          orderIndex: targetSession.orderIndex,
          completed: targetSession.completed,
          weatherState: targetSession.weatherState,
        }
      : null,
    qualifyingSessions: qualifyingSessions.map((session) => ({
      id: session.id,
      label: tokenLabelFromOrder(context.weekend?.ruleSet.sessionOrder, session.orderIndex),
      orderIndex: session.orderIndex,
      completed: session.completed,
      weatherState: session.weatherState,
    })),
    leaderboard: leaderboardRows.map((row) => ({
      position: row.position,
      driverId: row.driver.id,
      name: row.driver.displayName,
      countryCode: row.driver.countryCode,
      teamId: row.driver.currentTeamId,
      teamName: row.driver.currentTeam?.name ?? "Independent",
      bestLapMs: row.bestLapMs,
      gapMs: row.gapMs ?? 0,
      tyreCompound: row.tyreCompound,
      isManagedTeam: Boolean(context.active.teamId && row.driver.currentTeamId === context.active.teamId),
      imageUrl: row.driver.imageUrl ?? null,
    })),
    teamLearning:
      learningRows.length > 0
        ? {
            setupConfidence: Math.round(average(learningRows.map((row) => row.setupConfidence))),
            trackKnowledge: Math.round(average(learningRows.map((row) => row.trackKnowledge))),
          }
        : null,
  };
}
