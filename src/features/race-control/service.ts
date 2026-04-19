import "server-only";

import { ContractStatus, SessionType } from "@prisma/client";
import { z } from "zod";

import {
  calculateRacePerformanceScore,
  defaultRaceDistanceMinutes,
  pointsForPosition,
  resolveRacePointsTable,
  sessionKindFromToken,
  simulateRaceOutcome,
  stableUnitSeed,
  type RaceDecisionProfile,
} from "@/domain/rules/race-control-sim";
import type { TrackType } from "@/domain/models/core";
import { resolveSeasonRoundAfterMainRace } from "@/domain/rules/season-progress";
import { prisma } from "@/persistence/prisma";
import type { RaceSimulationResult } from "@/features/race-control/types";

const raceSimulationSchema = z.object({
  sessionId: z.string().min(1),
  teamId: z.string().min(1),
  paceMode: z.enum(["ATTACK", "NEUTRAL", "CONSERVE"]),
  pitPlan: z.enum(["UNDERCUT", "BALANCED", "OVERCUT"]),
  fuelMode: z.enum(["PUSH", "NORMAL", "SAVE"]),
  tyreMode: z.enum(["PUSH", "NORMAL", "SAVE"]),
  teamOrders: z.enum(["HOLD", "FREE_FIGHT"]),
  weatherReaction: z.enum(["SAFE", "REACTIVE", "AGGRESSIVE"]),
});

type RaceSimulationInput = z.input<typeof raceSimulationSchema>;

const raceSessionTypes = new Set<SessionType>([
  SessionType.SPRINT,
  SessionType.FEATURE,
  SessionType.STAGE,
  SessionType.RACE,
]);
const qualifyingSessionTypes = new Set<SessionType>([
  SessionType.QUALIFYING,
  SessionType.HYPERPOLE,
]);

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function readNumberAttribute(attributes: unknown, key: string, fallback: number) {
  if (!attributes || typeof attributes !== "object" || Array.isArray(attributes)) {
    return fallback;
  }
  const value = (attributes as Record<string, unknown>)[key];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function average(values: number[], fallback = 0) {
  if (values.length === 0) return fallback;
  return values.reduce((acc, value) => acc + value, 0) / values.length;
}

function tokenLabelFromOrder(sessionOrder: unknown, orderIndex: number) {
  if (!Array.isArray(sessionOrder)) return `Session ${orderIndex}`;
  const token = sessionOrder[orderIndex - 1];
  if (typeof token !== "string") return `Session ${orderIndex}`;
  if (token === "Q1" || token === "Q2" || token === "Q3") return token;
  return token
    .toLowerCase()
    .split("_")
    .map((chunk) => chunk.slice(0, 1).toUpperCase() + chunk.slice(1))
    .join(" ");
}

function aiDecisionProfile(seed: string): RaceDecisionProfile {
  const paceRoll = stableUnitSeed(`${seed}:pace`);
  const pitRoll = stableUnitSeed(`${seed}:pit`);
  const fuelRoll = stableUnitSeed(`${seed}:fuel`);
  const tyreRoll = stableUnitSeed(`${seed}:tyre`);
  const orderRoll = stableUnitSeed(`${seed}:orders`);
  const weatherRoll = stableUnitSeed(`${seed}:weather`);

  return {
    paceMode: paceRoll > 0.72 ? "ATTACK" : paceRoll < 0.18 ? "CONSERVE" : "NEUTRAL",
    pitPlan: pitRoll > 0.67 ? "UNDERCUT" : pitRoll < 0.25 ? "OVERCUT" : "BALANCED",
    fuelMode: fuelRoll > 0.7 ? "PUSH" : fuelRoll < 0.24 ? "SAVE" : "NORMAL",
    tyreMode: tyreRoll > 0.7 ? "PUSH" : tyreRoll < 0.24 ? "SAVE" : "NORMAL",
    teamOrders: orderRoll > 0.62 ? "HOLD" : "FREE_FIGHT",
    weatherReaction: weatherRoll > 0.69 ? "AGGRESSIVE" : weatherRoll < 0.2 ? "SAFE" : "REACTIVE",
  };
}

function trackAdaptationKey(trackType: TrackType) {
  if (trackType === "OVAL_SHORT" || trackType === "OVAL_INTERMEDIATE" || trackType === "SUPERSPEEDWAY") {
    return "ovalAdaptation";
  }
  if (trackType === "ENDURANCE") {
    return "enduranceAdaptation";
  }
  if (trackType === "STREET") {
    return "streetAdaptation";
  }
  return "roadCourseAdaptation";
}

function buildRaceEventFeed(params: {
  sessionLabel: string;
  winnerName: string;
  winnerTeamName: string;
  managedBestPosition: number | null;
  managedPoints: number;
  dnfs: number;
  notableManagedIncidents: string[];
  decisionProfile: RaceDecisionProfile;
}) {
  const feed = [
    `Green flag: ${params.sessionLabel} has started.`,
    `Strategy loaded: pace ${params.decisionProfile.paceMode}, pit ${params.decisionProfile.pitPlan}, fuel ${params.decisionProfile.fuelMode}.`,
    `Weather protocol: ${params.decisionProfile.weatherReaction}. Team orders: ${params.decisionProfile.teamOrders}.`,
    `Chequered flag: ${params.winnerName} (${params.winnerTeamName}) takes the win.`,
  ];

  if (params.managedBestPosition) {
    feed.push(`Managed program finish: P${params.managedBestPosition} for the lead car.`);
  } else {
    feed.push("Managed program did not finish inside classified positions.");
  }

  feed.push(`Managed points this session: ${params.managedPoints}.`);

  if (params.dnfs > 0) {
    feed.push(`Reliability report: ${params.dnfs} retirement(s) recorded in this session.`);
  }

  for (const note of params.notableManagedIncidents.slice(0, 3)) {
    feed.push(`Pit wall note: ${note}`);
  }

  return feed.slice(0, 10);
}

function isMainRaceSession(sessionType: SessionType) {
  return sessionType === SessionType.RACE || sessionType === SessionType.FEATURE;
}

function isPodiumSession(sessionType: SessionType) {
  return sessionType === SessionType.RACE || sessionType === SessionType.FEATURE || sessionType === SessionType.SPRINT;
}

export async function runRaceControlSession(input: RaceSimulationInput): Promise<RaceSimulationResult> {
  const parsed = raceSimulationSchema.parse(input);

  return prisma.$transaction(async (tx) => {
    const session = await tx.session.findUnique({
      where: { id: parsed.sessionId },
      include: {
        raceWeekend: {
          include: {
            event: {
              select: {
                id: true,
                round: true,
                name: true,
                categoryId: true,
                trackType: true,
                weatherProfile: true,
              },
            },
            season: {
              select: {
                id: true,
                year: true,
                currentRound: true,
                status: true,
              },
            },
            ruleSet: {
              select: {
                id: true,
                pointSystem: true,
                sessionOrder: true,
                weatherSensitivity: true,
                safetyCarBehavior: true,
              },
            },
            sessions: {
              orderBy: [{ orderIndex: "asc" }],
              select: {
                id: true,
                orderIndex: true,
                sessionType: true,
                completed: true,
              },
            },
          },
        },
      },
    });

    if (!session) {
      throw new Error("Race session not found.");
    }
    if (!raceSessionTypes.has(session.sessionType)) {
      throw new Error("Selected session is not a race-control session.");
    }
    if (session.completed) {
      throw new Error("Race session already completed.");
    }

    const practiceSessionIds = session.raceWeekend.sessions
      .filter((row) => row.sessionType === SessionType.PRACTICE)
      .map((row) => row.id);

    const latestCompletedQualifying = [...session.raceWeekend.sessions]
      .filter((row) => qualifyingSessionTypes.has(row.sessionType) && row.completed)
      .sort((a, b) => b.orderIndex - a.orderIndex)[0];

    const [drivers, cars, teamStaff, learningRows, qualifyingRows, supplierContracts] = await Promise.all([
      tx.driver.findMany({
        where: {
          currentCategoryId: session.raceWeekend.event.categoryId,
          currentTeamId: { not: null },
        },
        include: {
          currentTeam: {
            select: {
              id: true,
              name: true,
              manufacturerName: true,
            },
          },
        },
      }),
      tx.car.findMany({
        where: {
          categoryId: session.raceWeekend.event.categoryId,
        },
        orderBy: [{ seasonYear: "desc" }],
        select: {
          id: true,
          teamId: true,
          basePerformance: true,
          reliability: true,
          downforce: true,
          drag: true,
          weight: true,
        },
      }),
      tx.staff.findMany({
        where: {
          currentCategoryId: session.raceWeekend.event.categoryId,
          currentTeamId: { not: null },
        },
        select: {
          id: true,
          currentTeamId: true,
          role: true,
          attributes: true,
        },
      }),
      practiceSessionIds.length > 0
        ? tx.sessionTeamState.findMany({
            where: {
              sessionId: { in: practiceSessionIds },
            },
          })
        : Promise.resolve([]),
      latestCompletedQualifying
        ? tx.qualifyingResult.findMany({
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
      tx.supplierContract.findMany({
        where: {
          status: ContractStatus.ACTIVE,
          team: {
            categoryId: session.raceWeekend.event.categoryId,
          },
          supplier: {
            type: {
              in: ["ENGINE", "TIRE"],
            },
          },
        },
        include: {
          supplier: {
            select: {
              type: true,
              performance: true,
              reliability: true,
              efficiency: true,
              name: true,
            },
          },
        },
      }),
    ]);

    if (drivers.length === 0) {
      throw new Error("No eligible drivers found for race simulation.");
    }

    const carByTeam = new Map<string, { basePerformance: number; reliability: number; downforce: number; drag: number; weight: number }>();
    for (const car of cars) {
      if (!carByTeam.has(car.teamId)) {
        carByTeam.set(car.teamId, {
          basePerformance: car.basePerformance,
          reliability: car.reliability,
          downforce: car.downforce,
          drag: car.drag,
          weight: car.weight,
        });
      }
    }

    const strategyByTeam = new Map<string, number[]>();
    const pitByTeam = new Map<string, number[]>();

    for (const staff of teamStaff) {
      if (!staff.currentTeamId) continue;
      const strategy = readNumberAttribute(staff.attributes, "setupQuality", 68);
      const pit = readNumberAttribute(staff.attributes, "pitStopExecution", 67);

      const strategyRows = strategyByTeam.get(staff.currentTeamId) ?? [];
      strategyRows.push(strategy);
      strategyByTeam.set(staff.currentTeamId, strategyRows);

      const pitRows = pitByTeam.get(staff.currentTeamId) ?? [];
      pitRows.push(pit);
      pitByTeam.set(staff.currentTeamId, pitRows);
    }

    const learningByTeam = new Map<string, { setupConfidence: number; trackKnowledge: number }>();
    const learningCountByTeam = new Map<string, number>();
    for (const row of learningRows) {
      const current = learningByTeam.get(row.teamId) ?? { setupConfidence: 0, trackKnowledge: 0 };
      current.setupConfidence += row.setupConfidence;
      current.trackKnowledge += row.trackKnowledge;
      learningByTeam.set(row.teamId, current);
      learningCountByTeam.set(row.teamId, (learningCountByTeam.get(row.teamId) ?? 0) + 1);
    }
    for (const [teamId, data] of learningByTeam.entries()) {
      const count = learningCountByTeam.get(teamId) ?? 1;
      learningByTeam.set(teamId, {
        setupConfidence: Math.round(data.setupConfidence / count),
        trackKnowledge: Math.round(data.trackKnowledge / count),
      });
    }

    const qualifyingMap = new Map<string, number>();
    for (const row of qualifyingRows) {
      qualifyingMap.set(row.driverId, row.position);
    }

    const fallbackGrid = [...drivers]
      .sort((a, b) => {
        const aScore = a.overall + stableUnitSeed(`${session.id}:${a.id}:grid`) * 3;
        const bScore = b.overall + stableUnitSeed(`${session.id}:${b.id}:grid`) * 3;
        return bScore - aScore;
      })
      .map((driver) => driver.id);

    const startPositionByDriver = new Map<string, number>();
    const orderedGridIds: string[] = [];
    for (const row of qualifyingRows) {
      if (!orderedGridIds.includes(row.driverId)) {
        orderedGridIds.push(row.driverId);
      }
    }
    for (const driverId of fallbackGrid) {
      if (!orderedGridIds.includes(driverId)) {
        orderedGridIds.push(driverId);
      }
    }
    orderedGridIds.forEach((driverId, index) => {
      startPositionByDriver.set(driverId, index + 1);
    });

    const supplierByTeam = new Map<string, { perf: number; reliability: number; manufacturer: string | null }>();
    for (const contract of supplierContracts) {
      const current = supplierByTeam.get(contract.teamId) ?? {
        perf: 70,
        reliability: 70,
        manufacturer: null,
      };

      if (contract.supplier.type === "ENGINE") {
        current.perf = Math.round(current.perf * 0.3 + contract.supplier.performance * 0.7);
        current.reliability = Math.round(current.reliability * 0.35 + contract.supplier.reliability * 0.65);
        current.manufacturer = contract.supplier.name;
      } else if (contract.supplier.type === "TIRE") {
        current.perf = Math.round(current.perf * 0.7 + contract.supplier.performance * 0.3);
        current.reliability = Math.round(current.reliability * 0.75 + contract.supplier.reliability * 0.25);
      }

      supplierByTeam.set(contract.teamId, current);
    }

    const sessionKind = sessionKindFromToken(session.sessionType);
    const raceDistanceMinutes = defaultRaceDistanceMinutes(
      session.raceWeekend.event.trackType as TrackType,
      sessionKind,
    );

    const entries = drivers.map((driver) => {
      const team = driver.currentTeam;
      const teamId = driver.currentTeamId;
      if (!teamId || !team) {
        return null;
      }

      const attributes = driver.attributes;
      const decisionProfile: RaceDecisionProfile =
        teamId === parsed.teamId
          ? {
              paceMode: parsed.paceMode,
              pitPlan: parsed.pitPlan,
              fuelMode: parsed.fuelMode,
              tyreMode: parsed.tyreMode,
              teamOrders: parsed.teamOrders,
              weatherReaction: parsed.weatherReaction,
            }
          : aiDecisionProfile(`${session.id}:${driver.id}:ai`);

      const car = carByTeam.get(teamId);
      const learning = learningByTeam.get(teamId) ?? { setupConfidence: 54, trackKnowledge: 46 };
      const supplier = supplierByTeam.get(teamId) ?? { perf: 71, reliability: 72, manufacturer: null };
      const strategy = Math.round(average(strategyByTeam.get(teamId) ?? [], 69));
      const pit = Math.round(average(pitByTeam.get(teamId) ?? [], 68));

      const trackAdaptation = readNumberAttribute(
        attributes,
        trackAdaptationKey(session.raceWeekend.event.trackType as TrackType),
        driver.overall,
      );

      const carPerformance = car
        ? Math.round(car.basePerformance * 0.5 + car.downforce * 0.22 + (100 - car.drag) * 0.12 + (100 - (car.weight - 680)) * 0.16)
        : Math.round(driver.overall * 0.9);
      const carReliability = car ? car.reliability : Math.round(driver.overall * 0.88);

      const perf = calculateRacePerformanceScore({
        trackType: session.raceWeekend.event.trackType as TrackType,
        weatherSensitivity: session.raceWeekend.ruleSet.weatherSensitivity,
        raceDistanceMinutes,
        driverOverall: driver.overall,
        raceCraft: readNumberAttribute(attributes, "purePace", driver.overall),
        consistency: readNumberAttribute(attributes, "consistency", driver.overall),
        overtaking: readNumberAttribute(attributes, "overtaking", driver.overall),
        defense: readNumberAttribute(attributes, "defense", driver.overall),
        emotionalControl: readNumberAttribute(attributes, "emotionalControl", 70),
        wetSkill: readNumberAttribute(attributes, "wetWeather", 68),
        trackAdaptation,
        technicalFeedback: readNumberAttribute(attributes, "technicalFeedback", 70),
        tireManagement: readNumberAttribute(attributes, "tireManagement", 70),
        fuelSaving: readNumberAttribute(attributes, "fuelSaving", 70),
        strategyIq: readNumberAttribute(attributes, "strategyIQ", 70),
        trafficAdaptation: readNumberAttribute(attributes, "trafficAdaptation", 70),
        carPerformance,
        carReliability,
        setupConfidence: learning.setupConfidence,
        trackKnowledge: learning.trackKnowledge,
        staffStrategy: strategy,
        staffPit: pit,
        supplierPerformance: supplier.perf,
        supplierReliability: supplier.reliability,
        decisionProfile,
      });

      const startPosition = startPositionByDriver.get(driver.id) ?? drivers.length;
      const outcome = simulateRaceOutcome({
        trackType: session.raceWeekend.event.trackType as TrackType,
        raceDistanceMinutes,
        startPosition,
        fieldSize: drivers.length,
        weatherSensitivity: session.raceWeekend.ruleSet.weatherSensitivity,
        safetyCarProfile: session.raceWeekend.ruleSet.safetyCarBehavior,
        paceScore: perf.paceScore,
        reliabilityScore: perf.reliabilityScore,
        raceCraftScore: perf.raceCraftScore,
        expectedPitStops: perf.expectedPitStops,
        pitStopTimeMs: perf.pitStopTimeMs,
        decisionProfile,
        seed: `${session.id}:${driver.id}:race`,
      });

      return {
        driverId: driver.id,
        driverName: driver.displayName,
        driverCountryCode: driver.countryCode,
        driverImageUrl: driver.imageUrl,
        teamId,
        teamName: team.name,
        manufacturerName: team.manufacturerName ?? supplier.manufacturer ?? team.name,
        decisionProfile,
        startPosition,
        performance: perf,
        outcome,
      };
    });

    const validEntries = entries.filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

    const finishers = validEntries
      .filter((entry) => entry.outcome.status === "FINISHED" && typeof entry.outcome.totalTimeMs === "number")
      .sort((a, b) => (a.outcome.totalTimeMs ?? Number.MAX_SAFE_INTEGER) - (b.outcome.totalTimeMs ?? Number.MAX_SAFE_INTEGER));
    const dnfs = validEntries
      .filter((entry) => entry.outcome.status === "DNF")
      .sort((a, b) => b.outcome.lapsCompleted - a.outcome.lapsCompleted);

    const ordered = [...finishers, ...dnfs];
    const pointsTable = resolveRacePointsTable(
      (session.raceWeekend.ruleSet.pointSystem as Record<string, unknown>) ?? {},
      sessionKind,
    );

    const winnerTime = finishers[0]?.outcome.totalTimeMs ?? null;

    const scored = ordered.map((entry, index) => {
      const position = index + 1;
      const gap =
        winnerTime !== null && entry.outcome.totalTimeMs !== null
          ? entry.outcome.totalTimeMs - winnerTime
          : null;
      const points = entry.outcome.status === "FINISHED" ? pointsForPosition(pointsTable, position) : 0;

      return {
        ...entry,
        position,
        points,
        gapMs: gap,
      };
    });

    await tx.raceResult.deleteMany({
      where: {
        sessionId: session.id,
      },
    });

    if (scored.length > 0) {
      await tx.raceResult.createMany({
        data: scored.map((entry) => ({
          sessionId: session.id,
          driverId: entry.driverId,
          position: entry.position,
          points: entry.points,
          lapsCompleted: entry.outcome.lapsCompleted,
          totalTimeMs: entry.outcome.totalTimeMs,
          status: entry.outcome.status,
          pitStops: entry.outcome.pitStops,
          incidents: entry.outcome.raceNotes,
        })),
      });
    }

    const managedRows = scored.filter((entry) => entry.teamId === parsed.teamId);
    const managedBestPosition = managedRows.length > 0 ? Math.min(...managedRows.map((row) => row.position)) : null;
    const managedPoints = managedRows.reduce((acc, row) => acc + row.points, 0);
    const winner = scored[0];

    const eventFeed = buildRaceEventFeed({
      sessionLabel: tokenLabelFromOrder(session.raceWeekend.ruleSet.sessionOrder, session.orderIndex),
      winnerName: winner?.driverName ?? "Unknown",
      winnerTeamName: winner?.teamName ?? "Unknown",
      managedBestPosition,
      managedPoints,
      dnfs: scored.filter((row) => row.outcome.status === "DNF").length,
      notableManagedIncidents: managedRows.flatMap((row) => row.outcome.raceNotes),
      decisionProfile: {
        paceMode: parsed.paceMode,
        pitPlan: parsed.pitPlan,
        fuelMode: parsed.fuelMode,
        tyreMode: parsed.tyreMode,
        teamOrders: parsed.teamOrders,
        weatherReaction: parsed.weatherReaction,
      },
    });

    await tx.sessionTeamState.upsert({
      where: {
        sessionId_teamId: {
          sessionId: session.id,
          teamId: parsed.teamId,
        },
      },
      update: {
        setupConfidence: managedRows.length > 0 ? clamp(58 + managedPoints, 40, 99) : 52,
        trackKnowledge: managedRows.length > 0 ? clamp(55 + (managedBestPosition ? 20 - managedBestPosition : 0), 35, 99) : 50,
        practiceDelta: managedBestPosition ? Math.max(-6, 12 - managedBestPosition) : -4,
        notes: {
          strategy: {
            paceMode: parsed.paceMode,
            pitPlan: parsed.pitPlan,
            fuelMode: parsed.fuelMode,
            tyreMode: parsed.tyreMode,
            teamOrders: parsed.teamOrders,
            weatherReaction: parsed.weatherReaction,
          },
          eventFeed,
          managedBestPosition,
          managedPoints,
        },
      },
      create: {
        sessionId: session.id,
        teamId: parsed.teamId,
        setupConfidence: managedRows.length > 0 ? clamp(58 + managedPoints, 40, 99) : 52,
        trackKnowledge: managedRows.length > 0 ? clamp(55 + (managedBestPosition ? 20 - managedBestPosition : 0), 35, 99) : 50,
        practiceDelta: managedBestPosition ? Math.max(-6, 12 - managedBestPosition) : -4,
        notes: {
          strategy: {
            paceMode: parsed.paceMode,
            pitPlan: parsed.pitPlan,
            fuelMode: parsed.fuelMode,
            tyreMode: parsed.tyreMode,
            teamOrders: parsed.teamOrders,
            weatherReaction: parsed.weatherReaction,
          },
          eventFeed,
          managedBestPosition,
          managedPoints,
        },
      },
    });

    const driverStandingsRows = await tx.standingsDriver.findMany({
      where: {
        seasonId: session.raceWeekend.season.id,
        categoryId: session.raceWeekend.event.categoryId,
      },
    });
    const teamStandingsRows = await tx.standingsTeam.findMany({
      where: {
        seasonId: session.raceWeekend.season.id,
        categoryId: session.raceWeekend.event.categoryId,
      },
    });
    const manufacturerStandingsRows = await tx.standingsManufacturer.findMany({
      where: {
        seasonId: session.raceWeekend.season.id,
        categoryId: session.raceWeekend.event.categoryId,
      },
    });

    const driverStandingsByDriver = new Map(driverStandingsRows.map((row) => [row.driverId, row]));
    const teamStandingsByTeam = new Map(teamStandingsRows.map((row) => [row.teamId, row]));
    const manufacturerStandingsByName = new Map(manufacturerStandingsRows.map((row) => [row.manufacturerName, row]));

    for (const entry of scored) {
      const driverStanding = driverStandingsByDriver.get(entry.driverId);
      const teamStanding = teamStandingsByTeam.get(entry.teamId);
      const manufacturerStanding = manufacturerStandingsByName.get(entry.manufacturerName);

      const winIncrement = isPodiumSession(session.sessionType) && entry.position === 1 ? 1 : 0;
      const podiumIncrement = isPodiumSession(session.sessionType) && entry.position <= 3 ? 1 : 0;

      if (driverStanding) {
        await tx.standingsDriver.update({
          where: { id: driverStanding.id },
          data: {
            points: driverStanding.points + entry.points,
            wins: driverStanding.wins + winIncrement,
            podiums: driverStanding.podiums + podiumIncrement,
          },
        });
      } else {
        await tx.standingsDriver.create({
          data: {
            seasonId: session.raceWeekend.season.id,
            categoryId: session.raceWeekend.event.categoryId,
            driverId: entry.driverId,
            points: entry.points,
            wins: winIncrement,
            podiums: podiumIncrement,
            poles: 0,
          },
        });
      }

      if (teamStanding) {
        await tx.standingsTeam.update({
          where: { id: teamStanding.id },
          data: {
            points: teamStanding.points + entry.points,
            wins: teamStanding.wins + winIncrement,
            podiums: teamStanding.podiums + podiumIncrement,
          },
        });
      } else {
        await tx.standingsTeam.create({
          data: {
            seasonId: session.raceWeekend.season.id,
            categoryId: session.raceWeekend.event.categoryId,
            teamId: entry.teamId,
            points: entry.points,
            wins: winIncrement,
            podiums: podiumIncrement,
          },
        });
      }

      if (manufacturerStanding) {
        await tx.standingsManufacturer.update({
          where: { id: manufacturerStanding.id },
          data: {
            points: manufacturerStanding.points + entry.points,
            wins: manufacturerStanding.wins + winIncrement,
          },
        });
      } else {
        await tx.standingsManufacturer.create({
          data: {
            seasonId: session.raceWeekend.season.id,
            categoryId: session.raceWeekend.event.categoryId,
            manufacturerName: entry.manufacturerName,
            points: entry.points,
            wins: winIncrement,
          },
        });
      }
    }

    const now = new Date();
    await tx.session.update({
      where: { id: session.id },
      data: {
        completed: true,
        startedAt: session.startedAt ?? now,
        finishedAt: now,
      },
    });

    if (isMainRaceSession(session.sessionType)) {
      const totalRounds = await tx.calendarEvent.count({
        where: {
          seasonId: session.raceWeekend.season.id,
        },
      });

      const resolution = resolveSeasonRoundAfterMainRace({
        currentRound: session.raceWeekend.season.currentRound,
        completedRound: session.raceWeekend.event.round,
        totalRounds,
      });

      await tx.season.update({
        where: { id: session.raceWeekend.season.id },
        data: {
          status: resolution.status,
          currentRound: resolution.nextRound,
        },
      });

      await tx.career.updateMany({
        where: {
          selectedCategoryId: session.raceWeekend.event.categoryId,
          currentSeasonYear: session.raceWeekend.season.year,
        },
        data: {
          seasonPhase: resolution.phase,
        },
      });
    }

    await tx.transaction.create({
      data: {
        teamId: parsed.teamId,
        kind: "RACE_SESSION",
        amount: 0,
        description: `${tokenLabelFromOrder(session.raceWeekend.ruleSet.sessionOrder, session.orderIndex)} complete. Managed points: ${managedPoints}.`,
      },
    });

    return {
      sessionId: session.id,
      entries: scored.length,
      winnerName: winner?.driverName ?? "Unknown",
      managedBestPosition,
      managedPoints,
    };
  });
}

