import type {
  BoardObjective,
  CareerGateStatus,
  CategoryGateInput,
  CategoryProgressNode,
} from "@/features/career-intelligence/types";

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function moneyGateForTier(tier: number) {
  const gates: Record<number, number> = {
    1: 2_500_000,
    2: 8_000_000,
    3: 28_000_000,
    4: 95_000_000,
  };

  return gates[tier] ?? 160_000_000;
}

export function requiredReputationForTier(tier: number) {
  return clamp(18 + tier * 17, 0, 92);
}

export function requiredStaffQualityForTier(tier: number) {
  return clamp(38 + tier * 10, 0, 88);
}

export function requiredPerformanceForTier(tier: number) {
  return clamp(34 + tier * 11, 0, 90);
}

function ratio(current: number, required: number) {
  if (required <= 0) return 100;
  return clamp((current / required) * 100);
}

function gateStatus(progressPercent: number, isCurrent: boolean): CareerGateStatus {
  if (isCurrent || progressPercent >= 100) return "UNLOCKED";
  if (progressPercent >= 72) return "NEAR";
  return "LOCKED";
}

export function buildCategoryGate(input: CategoryGateInput): CategoryProgressNode {
  const isCurrent = input.code === input.activeCategoryCode;
  const requiredReputation = requiredReputationForTier(input.tier);
  const requiredCash = moneyGateForTier(input.tier);
  const requiredStaffQuality = requiredStaffQualityForTier(input.tier);
  const requiredPerformance = requiredPerformanceForTier(input.tier);

  const tierPenalty = input.tier <= input.activeTier + 1 ? 0 : (input.tier - input.activeTier - 1) * 18;
  const progressPercent = Math.round(
    clamp(
      (ratio(input.reputation, requiredReputation) +
        ratio(input.cashBalance, requiredCash) +
        ratio(input.staffQuality, requiredStaffQuality) +
        ratio(input.performanceScore, requiredPerformance)) /
        4 -
        tierPenalty,
    ),
  );

  const missing: string[] = [];
  if (input.reputation < requiredReputation) missing.push("careerRoad.missingReputation");
  if (input.cashBalance < requiredCash) missing.push("careerRoad.missingCash");
  if (input.staffQuality < requiredStaffQuality) missing.push("careerRoad.missingStaff");
  if (input.performanceScore < requiredPerformance) missing.push("careerRoad.missingPerformance");
  if (input.tier > input.activeTier + 1) missing.push("careerRoad.missingTierPath");

  return {
    code: input.code,
    name: input.name,
    discipline: input.discipline,
    tier: input.tier,
    region: input.region,
    teamsCount: input.teamsCount,
    status: gateStatus(progressPercent, isCurrent),
    progressPercent,
    requiredReputation,
    requiredCash,
    requiredStaffQuality,
    requiredPerformance,
    missing: isCurrent ? [] : missing,
    isCurrent,
  };
}

export function scoreCareerOpportunity(params: {
  categoryTier: number;
  activeTier: number;
  teamReputation: number;
  careerReputation: number;
  teamBudget: number;
  cashBalance: number;
}) {
  const tierFit = clamp(100 - Math.abs(params.categoryTier - params.activeTier) * 18);
  const reputationFit = clamp(100 - Math.max(0, params.teamReputation - params.careerReputation) * 1.8);
  const budgetFit = clamp((params.cashBalance / Math.max(1, params.teamBudget * 0.25)) * 100);
  const ambitionBonus = params.categoryTier > params.activeTier ? 8 : 0;

  return Math.round(clamp(tierFit * 0.34 + reputationFit * 0.42 + budgetFit * 0.24 + ambitionBonus));
}

export function opportunityStatus(score: number): "READY" | "WATCHLIST" | "LONG_TERM" {
  if (score >= 78) return "READY";
  if (score >= 56) return "WATCHLIST";
  return "LONG_TERM";
}

export function buildBoardObjectives(params: {
  cashBalance: number;
  tierBaselineCash: number;
  staffQuality: number;
  performanceScore: number;
  nextGatePercent: number;
  prospectCount: number;
}): BoardObjective[] {
  return [
    {
      id: "financial-stability",
      titleKey: "careerRoad.objectiveFinancialTitle",
      descriptionKey: "careerRoad.objectiveFinancialDescription",
      progressPercent: Math.round(ratio(params.cashBalance, params.tierBaselineCash)),
      priority: params.cashBalance < params.tierBaselineCash * 0.55 ? "HIGH" : "MEDIUM",
    },
    {
      id: "staff-spine",
      titleKey: "careerRoad.objectiveStaffTitle",
      descriptionKey: "careerRoad.objectiveStaffDescription",
      progressPercent: Math.round(clamp(params.staffQuality)),
      priority: params.staffQuality < 62 ? "HIGH" : "LOW",
    },
    {
      id: "competitive-package",
      titleKey: "careerRoad.objectivePerformanceTitle",
      descriptionKey: "careerRoad.objectivePerformanceDescription",
      progressPercent: Math.round(clamp(params.performanceScore)),
      priority: params.performanceScore < 66 ? "HIGH" : "MEDIUM",
    },
    {
      id: "next-category",
      titleKey: "careerRoad.objectiveNextTierTitle",
      descriptionKey: "careerRoad.objectiveNextTierDescription",
      progressPercent: Math.round(clamp(params.nextGatePercent)),
      priority: params.nextGatePercent >= 72 ? "HIGH" : "MEDIUM",
    },
    {
      id: "academy-pipeline",
      titleKey: "careerRoad.objectiveAcademyTitle",
      descriptionKey: "careerRoad.objectiveAcademyDescription",
      progressPercent: Math.round(clamp(params.prospectCount * 18)),
      priority: params.prospectCount === 0 ? "HIGH" : "LOW",
    },
  ];
}

export function sponsorFitScore(params: {
  cashBalance: number;
  teamReputation: number;
  categoryTier: number;
  activeSponsorCount: number;
}) {
  const commercialBase = params.teamReputation * 0.46 + params.categoryTier * 11;
  const cashNeed = params.cashBalance < moneyGateForTier(params.categoryTier) * 0.7 ? 12 : 0;
  const saturationPenalty = params.activeSponsorCount > 3 ? (params.activeSponsorCount - 3) * 7 : 0;

  return Math.round(clamp(commercialBase + cashNeed - saturationPenalty));
}

export function teamChemistryTone(value: number): "POSITIVE" | "NEUTRAL" | "WARNING" {
  if (value >= 75) return "POSITIVE";
  if (value >= 58) return "NEUTRAL";
  return "WARNING";
}

export { moneyGateForTier };
