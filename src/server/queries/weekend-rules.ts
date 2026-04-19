import { getActiveCareerContext } from "@/server/queries/career";
import { prisma } from "@/persistence/prisma";
import type { TrackType } from "@/domain/models/core";
import {
  buildWeekendSessionTemplates,
  normalizeWeekendRuleSet,
  trackPreviewCandidatesForDiscipline,
  weekendComplexityScore,
  weatherVolatilityLabel,
} from "@/domain/rules/weekend-rules";
import type { WeekendRulesCenterView } from "@/features/weekend-rules/types";

async function resolveSelectedCategory(requestedCategoryCode?: string) {
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
      defaultRuleSetCode: true,
    },
  });

  const selected =
    categories.find((category) => category.code === requestedCategoryCode) ??
    categories.find((category) => category.code === active.categoryCode) ??
    categories[0] ??
    null;

  return {
    seasonYear,
    categories,
    selected,
  };
}

export async function getWeekendRulesCenterView(
  requestedCategoryCode?: string,
): Promise<WeekendRulesCenterView | null> {
  const context = await resolveSelectedCategory(requestedCategoryCode);
  if (!context.selected) return null;

  const [season, ruleSets] = await Promise.all([
    prisma.season.findFirst({
      where: {
        categoryId: context.selected.id,
        year: context.seasonYear,
      },
      include: {
        events: {
          orderBy: [{ round: "asc" }],
          include: {
            raceWeekends: {
              select: { id: true },
            },
          },
        },
        raceWeekends: {
          orderBy: [{ generatedAt: "desc" }],
          include: {
            event: { select: { name: true, round: true } },
            sessions: { select: { id: true } },
            ruleSet: { select: { code: true } },
          },
          take: 8,
        },
      },
    }),
    prisma.ruleSet.findMany({
      where: {
        categoryId: context.selected.id,
      },
      include: {
        category: {
          select: {
            code: true,
            name: true,
            discipline: true,
          },
        },
      },
      orderBy: [{ createdAt: "asc" }],
    }),
  ]);

  const normalizedRuleSets = ruleSets.map((ruleSet) =>
    normalizeWeekendRuleSet({
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
    }),
  );

  const activeRuleSet =
    normalizedRuleSets.find((ruleSet) => ruleSet.code === context.selected.defaultRuleSetCode) ??
    normalizedRuleSets[0] ??
    null;

  const previewTrackTypes = trackPreviewCandidatesForDiscipline(context.selected.discipline);
  const trackPreviews = activeRuleSet
    ? previewTrackTypes.map((trackType) => ({
        trackType,
        label: `${trackType.replaceAll("_", " ")}`,
        sessions: buildWeekendSessionTemplates(activeRuleSet.sessionOrder, trackType as TrackType),
      }))
    : [];

  const now = new Date();
  const nextEvent = season?.events.find((event) => event.startDate >= now) ?? season?.events[0] ?? null;

  return {
    categories: context.categories.map((category) => ({
      id: category.id,
      code: category.code,
      name: category.name,
      discipline: category.discipline,
      tier: category.tier,
    })),
    selectedCategory: {
      id: context.selected.id,
      code: context.selected.code,
      name: context.selected.name,
      discipline: context.selected.discipline,
      tier: context.selected.tier,
    },
    seasonYear: season?.year ?? context.seasonYear,
    activeRuleSet: activeRuleSet
      ? {
          ...activeRuleSet,
          pointSystem: {
            ...activeRuleSet.pointSystem,
            complexityScore: weekendComplexityScore(activeRuleSet),
          },
          fuelRules: {
            ...activeRuleSet.fuelRules,
            weatherVolatility: weatherVolatilityLabel(activeRuleSet.weatherSensitivity),
          },
        }
      : null,
    availableRuleSets: normalizedRuleSets,
    trackPreviews,
    nextEvent: nextEvent
      ? {
          id: nextEvent.id,
          round: nextEvent.round,
          name: nextEvent.name,
          circuitName: nextEvent.circuitName,
          countryCode: nextEvent.countryCode,
          trackType: nextEvent.trackType as TrackType,
          startDateIso: nextEvent.startDate.toISOString().slice(0, 10),
          hasGeneratedWeekend: nextEvent.raceWeekends.length > 0,
        }
      : null,
    generatedWeekends:
      season?.raceWeekends.map((weekend) => ({
        id: weekend.id,
        eventName: weekend.event.name,
        round: weekend.event.round,
        ruleSetCode: weekend.ruleSet.code,
        sessionsCount: weekend.sessions.length,
        generatedAtIso: weekend.generatedAt.toISOString().slice(0, 10),
      })) ?? [],
  };
}
