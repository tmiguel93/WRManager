import "server-only";

import { SessionType } from "@prisma/client";
import { z } from "zod";

import {
  calculatePracticeLearning,
  calculateQualifyingLapScore,
  lapScoreToMilliseconds,
  stableUnitSeed,
  type PracticeRunPlan,
  type QualifyingMode,
  type QualifyingReleaseTiming,
  type QualifyingTyreCompound,
} from "@/domain/rules/weekend-session-sim";
import { prisma } from "@/persistence/prisma";
import type { TrackType } from "@/domain/models/core";

const practiceSchema = z.object({
  sessionId: z.string().min(1),
  teamId: z.string().min(1),
  runPlan: z.enum(["SHORT", "BALANCED", "LONG"]),
  aeroBalanceFocus: z.number().int().min(-100).max(100),
  weatherFocus: z.number().int().min(-100).max(100),
});

const qualifyingSchema = z.object({
  sessionId: z.string().min(1),
  teamId: z.string().min(1),
  mode: z.enum(["QUICK", "DETAILED"]),
  riskLevel: z.number().int().min(20).max(95),
  releaseTiming: z.enum(["EARLY", "MID", "LATE"]),
  tyreCompound: z.enum(["SOFT", "MEDIUM", "HARD"]),
});

type PracticeInput = z.input<typeof practiceSchema>;
type QualifyingInput = z.input<typeof qualifyingSchema>;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function readAttribute(attributes: unknown, key: string, fallback = 70) {
  if (!attributes || typeof attributes !== "object" || Array.isArray(attributes)) {
    return fallback;
  }
  const value = (attributes as Record<string, unknown>)[key];
  return typeof value === "number" ? value : fallback;
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((acc, value) => acc + value, 0) / values.length;
}

function decideAiReleaseTiming(seed: string): QualifyingReleaseTiming {
  const roll = stableUnitSeed(seed);
  if (roll < 0.33) return "EARLY";
  if (roll < 0.66) return "MID";
  return "LATE";
}

function decideAiTyreCompound(seed: string): QualifyingTyreCompound {
  const roll = stableUnitSeed(seed);
  if (roll < 0.56) return "SOFT";
  if (roll < 0.87) return "MEDIUM";
  return "HARD";
}

export async function runPracticeSession(input: PracticeInput) {
  const parsed = practiceSchema.parse(input);

  return prisma.$transaction(async (tx) => {
    const session = await tx.session.findUnique({
      where: { id: parsed.sessionId },
      include: {
        raceWeekend: {
          include: {
            event: {
              select: {
                trackType: true,
              },
            },
            ruleSet: {
              select: {
                weatherSensitivity: true,
              },
            },
            sessions: {
              where: {
                sessionType: SessionType.PRACTICE,
                completed: true,
              },
              include: {
                teamStates: {
                  where: { teamId: parsed.teamId },
                },
              },
            },
          },
        },
      },
    });

    if (!session) {
      throw new Error("Practice session not found.");
    }
    if (session.sessionType !== SessionType.PRACTICE) {
      throw new Error("Selected session is not a practice session.");
    }
    if (session.completed) {
      throw new Error("Practice session already completed.");
    }

    const [teamDrivers, teamStaff] = await Promise.all([
      tx.driver.findMany({
        where: { currentTeamId: parsed.teamId },
        select: {
          id: true,
          attributes: true,
        },
      }),
      tx.staff.findMany({
        where: { currentTeamId: parsed.teamId },
        select: {
          id: true,
          attributes: true,
        },
      }),
    ]);

    const previousStates = session.raceWeekend.sessions
      .map((practice) => practice.teamStates[0] ?? null)
      .filter((state): state is NonNullable<typeof state> => Boolean(state));
    const baselineSetup = previousStates.length > 0 ? Math.round(average(previousStates.map((state) => state.setupConfidence))) : 52;
    const baselineKnowledge = previousStates.length > 0 ? Math.round(average(previousStates.map((state) => state.trackKnowledge))) : 44;

    const driverFeedback = clamp(
      Math.round(average(teamDrivers.map((driver) => readAttribute(driver.attributes, "technicalFeedback", 72)))),
      45,
      99,
    );
    const staffSetup = clamp(
      Math.round(average(teamStaff.map((staff) => readAttribute(staff.attributes, "setupQuality", 70)))),
      45,
      99,
    );

    const learning = calculatePracticeLearning({
      trackType: session.raceWeekend.event.trackType as TrackType,
      weatherSensitivity: session.raceWeekend.ruleSet.weatherSensitivity,
      aeroBalanceFocus: parsed.aeroBalanceFocus,
      weatherFocus: parsed.weatherFocus,
      runPlan: parsed.runPlan as PracticeRunPlan,
      driverFeedback,
      staffSetup,
      baseSetupConfidence: baselineSetup,
      baseTrackKnowledge: baselineKnowledge,
    });

    const setupConfidence = clamp(baselineSetup + learning.setupGain, 35, 99);
    const trackKnowledge = clamp(baselineKnowledge + learning.trackKnowledgeGain, 25, 99);

    await tx.sessionTeamState.upsert({
      where: {
        sessionId_teamId: {
          sessionId: session.id,
          teamId: parsed.teamId,
        },
      },
      update: {
        setupConfidence,
        trackKnowledge,
        practiceDelta: learning.paceDelta,
        notes: {
          runPlan: parsed.runPlan,
          aeroBalanceFocus: parsed.aeroBalanceFocus,
          weatherFocus: parsed.weatherFocus,
          incidentRisk: learning.incidentRisk,
        },
      },
      create: {
        sessionId: session.id,
        teamId: parsed.teamId,
        setupConfidence,
        trackKnowledge,
        practiceDelta: learning.paceDelta,
        notes: {
          runPlan: parsed.runPlan,
          aeroBalanceFocus: parsed.aeroBalanceFocus,
          weatherFocus: parsed.weatherFocus,
          incidentRisk: learning.incidentRisk,
        },
      },
    });

    const now = new Date();
    await tx.session.update({
      where: { id: session.id },
      data: {
        completed: true,
        startedAt: session.startedAt ?? now,
        finishedAt: now,
      },
    });

    await tx.transaction.create({
      data: {
        teamId: parsed.teamId,
        kind: "PRACTICE_SESSION",
        amount: 0,
        description: `Practice complete: setup +${learning.setupGain}, track +${learning.trackKnowledgeGain}, pace ${learning.paceDelta >= 0 ? "+" : ""}${learning.paceDelta}.`,
      },
    });

    return {
      setupConfidence,
      trackKnowledge,
      paceDelta: learning.paceDelta,
      incidentRisk: learning.incidentRisk,
      sessionId: session.id,
    };
  });
}

export async function runQualifyingSession(input: QualifyingInput) {
  const parsed = qualifyingSchema.parse(input);

  return prisma.$transaction(async (tx) => {
    const session = await tx.session.findUnique({
      where: { id: parsed.sessionId },
      include: {
        raceWeekend: {
          include: {
            event: {
              select: {
                categoryId: true,
                trackType: true,
                weatherProfile: true,
              },
            },
            sessions: {
              where: {
                sessionType: SessionType.PRACTICE,
              },
              select: {
                id: true,
              },
            },
            ruleSet: {
              select: {
                weatherSensitivity: true,
              },
            },
          },
        },
      },
    });

    if (!session) {
      throw new Error("Qualifying session not found.");
    }
    if (session.sessionType !== SessionType.QUALIFYING && session.sessionType !== SessionType.HYPERPOLE) {
      throw new Error("Selected session is not a qualifying session.");
    }
    if (session.completed) {
      throw new Error("Qualifying session already completed.");
    }

    const [drivers, cars, practiceLearning] = await Promise.all([
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
              reputation: true,
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
        },
      }),
      tx.sessionTeamState.findMany({
        where: {
          sessionId: { in: session.raceWeekend.sessions.map((practice) => practice.id) },
        },
      }),
    ]);

    const carByTeam = new Map<string, { basePerformance: number; reliability: number; downforce: number }>();
    for (const car of cars) {
      if (!carByTeam.has(car.teamId)) {
        carByTeam.set(car.teamId, {
          basePerformance: car.basePerformance,
          reliability: car.reliability,
          downforce: car.downforce,
        });
      }
    }

    const learningByTeam = new Map<string, { setupConfidence: number; trackKnowledge: number }>();
    for (const state of practiceLearning) {
      const current = learningByTeam.get(state.teamId) ?? { setupConfidence: 0, trackKnowledge: 0 };
      current.setupConfidence += state.setupConfidence;
      current.trackKnowledge += state.trackKnowledge;
      learningByTeam.set(state.teamId, current);
    }
    const countsByTeam = new Map<string, number>();
    for (const state of practiceLearning) {
      countsByTeam.set(state.teamId, (countsByTeam.get(state.teamId) ?? 0) + 1);
    }
    for (const [teamId, values] of learningByTeam.entries()) {
      const count = countsByTeam.get(teamId) ?? 1;
      learningByTeam.set(teamId, {
        setupConfidence: Math.round(values.setupConfidence / count),
        trackKnowledge: Math.round(values.trackKnowledge / count),
      });
    }

    const results = drivers.map((driver) => {
      const teamId = driver.currentTeamId;
      const team = driver.currentTeam;
      const car = teamId ? carByTeam.get(teamId) : null;
      const learning = teamId ? learningByTeam.get(teamId) : null;

      const isManagedTeam = Boolean(teamId && teamId === parsed.teamId);
      const aiSeed = `${session.id}:${driver.id}:ai`;
      const mode: QualifyingMode = isManagedTeam ? parsed.mode : "QUICK";
      const riskLevel = isManagedTeam ? parsed.riskLevel : clamp(Math.round(56 + stableUnitSeed(aiSeed) * 22), 35, 88);
      const releaseTiming: QualifyingReleaseTiming = isManagedTeam
        ? parsed.releaseTiming
        : decideAiReleaseTiming(aiSeed);
      const tyreCompound: QualifyingTyreCompound = isManagedTeam
        ? parsed.tyreCompound
        : decideAiTyreCompound(`${aiSeed}:compound`);

      const qualifyingSkill = readAttribute(driver.attributes, "qualifying", driver.overall);
      const emotionalControl = readAttribute(driver.attributes, "emotionalControl", 70);
      const carPerformance = car
        ? Math.round(car.basePerformance * 0.52 + car.reliability * 0.24 + car.downforce * 0.24)
        : Math.round(driver.overall * 0.88);
      const setupConfidence = learning?.setupConfidence ?? 54;
      const trackKnowledge = learning?.trackKnowledge ?? 46;

      const perf = calculateQualifyingLapScore({
        trackType: session.raceWeekend.event.trackType as TrackType,
        mode,
        driverOverall: driver.overall,
        qualifyingSkill,
        emotionalControl,
        carPerformance,
        setupConfidence,
        trackKnowledge,
        riskLevel,
        releaseTiming,
        tyreCompound,
        weatherSensitivity: session.raceWeekend.ruleSet.weatherSensitivity,
      });

      const bestLapMs = lapScoreToMilliseconds({
        trackType: session.raceWeekend.event.trackType as TrackType,
        lapScore: perf.lapScore,
        errorRisk: perf.errorRisk,
        seed: `${session.id}:${driver.id}:${mode}:${riskLevel}:${releaseTiming}:${tyreCompound}`,
      });

      return {
        driverId: driver.id,
        teamId,
        teamName: team?.name ?? "Independent",
        tyreCompound,
        bestLapMs,
        mode,
      };
    });

    const ordered = [...results].sort((a, b) => a.bestLapMs - b.bestLapMs);
    const poleTime = ordered[0]?.bestLapMs ?? 0;

    await tx.qualifyingResult.deleteMany({
      where: { sessionId: session.id },
    });

    if (ordered.length > 0) {
      await tx.qualifyingResult.createMany({
        data: ordered.map((result, index) => ({
          sessionId: session.id,
          driverId: result.driverId,
          position: index + 1,
          bestLapMs: result.bestLapMs,
          gapMs: index === 0 ? 0 : result.bestLapMs - poleTime,
          tyreCompound: result.tyreCompound,
        })),
      });
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

    await tx.transaction.create({
      data: {
        teamId: parsed.teamId,
        kind: "QUALIFYING_SESSION",
        amount: 0,
        description: `Qualifying complete (${parsed.mode}) with risk ${parsed.riskLevel} and ${parsed.tyreCompound}.`,
      },
    });

    const managedTop = ordered
      .map((result, index) => ({ ...result, position: index + 1 }))
      .filter((result) => result.teamId === parsed.teamId)
      .slice(0, 2);

    return {
      sessionId: session.id,
      entries: ordered.length,
      poleTimeMs: poleTime,
      managedTop,
    };
  });
}
