import "server-only";

import { z } from "zod";
import { SessionType } from "@prisma/client";

import { buildWeekendSessionTemplates, normalizeWeekendRuleSet } from "@/domain/rules/weekend-rules";
import { prisma } from "@/persistence/prisma";

const generateWeekendSchema = z.object({
  eventId: z.string().min(1),
});

type GenerateWeekendInput = z.input<typeof generateWeekendSchema>;

function tokenToSessionType(token: string): SessionType {
  switch (token) {
    case "SPRINT":
      return SessionType.SPRINT;
    case "FEATURE":
      return SessionType.FEATURE;
    case "STAGE_1":
    case "STAGE_2":
      return SessionType.STAGE;
    case "RACE":
    case "RACE_FINAL_STAGE":
    case "RACE_ENDURANCE":
      return SessionType.RACE;
    case "HYPERPOLE":
      return SessionType.HYPERPOLE;
    case "QUALIFYING":
    case "Q1":
    case "Q2":
    case "Q3":
      return SessionType.QUALIFYING;
    default:
      return SessionType.PRACTICE;
  }
}

export async function generateRaceWeekendSkeleton(input: GenerateWeekendInput) {
  const parsed = generateWeekendSchema.parse(input);

  return prisma.$transaction(async (tx) => {
    const event = await tx.calendarEvent.findUnique({
      where: { id: parsed.eventId },
      include: {
        season: true,
        category: true,
        raceWeekends: {
          take: 1,
          select: { id: true },
        },
      },
    });

    if (!event) {
      throw new Error("Event not found.");
    }
    if (event.raceWeekends.length > 0) {
      throw new Error("Race weekend already generated for this event.");
    }

    const ruleSet =
      (await tx.ruleSet.findFirst({
        where: {
          code: event.ruleSetCode,
          categoryId: event.categoryId,
        },
        include: {
          category: {
            select: {
              code: true,
              name: true,
            },
          },
        },
      })) ??
      (await tx.ruleSet.findFirst({
        where: {
          code: event.category.defaultRuleSetCode,
          categoryId: event.categoryId,
        },
        include: {
          category: {
            select: {
              code: true,
              name: true,
            },
          },
        },
      }));

    if (!ruleSet) {
      throw new Error("No compatible ruleset found for this event.");
    }

    const runtimeRuleSet = normalizeWeekendRuleSet({
      id: ruleSet.id,
      code: ruleSet.code,
      name: ruleSet.name,
      categoryCode: ruleSet.category.code,
      categoryName: ruleSet.category.name,
      qualifyingFormat: ruleSet.qualifyingFormat,
      hasSprint: ruleSet.hasSprint,
      hasFeature: ruleSet.hasFeature,
      hasStages: ruleSet.hasStages,
      enduranceFlags: ruleSet.enduranceFlags,
      weatherSensitivity: ruleSet.weatherSensitivity,
      parcFerme: ruleSet.parcFerme,
      safetyCarBehavior: ruleSet.safetyCarBehavior,
      sessionOrder: ruleSet.sessionOrder,
      pointSystem: ruleSet.pointSystem,
      tireRules: ruleSet.tireRules,
      fuelRules: ruleSet.fuelRules,
      requiredPitRules: ruleSet.requiredPitRules,
      manufacturerRules: ruleSet.manufacturerRules,
    });

    const sessions = buildWeekendSessionTemplates(runtimeRuleSet.sessionOrder, event.trackType);

    const weatherSeed = Math.floor(Math.random() * 1000) + 1;
    const raceWeekend = await tx.raceWeekend.create({
      data: {
        seasonId: event.seasonId,
        eventId: event.id,
        ruleSetId: ruleSet.id,
        weatherSeed,
      },
    });

    for (const session of sessions) {
      const weatherState =
        session.phase === "PRACTICE"
          ? "VARIABLE"
          : session.sessionType === "RACE"
            ? "RACE_DYNAMIC"
            : "STABLE";

      await tx.session.create({
        data: {
          raceWeekendId: raceWeekend.id,
          sessionType: tokenToSessionType(session.token),
          orderIndex: session.orderIndex,
          weatherState,
          completed: false,
        },
      });
    }

    return {
      raceWeekendId: raceWeekend.id,
      eventName: event.name,
      ruleSetCode: ruleSet.code,
      sessionsCount: sessions.length,
    };
  });
}
