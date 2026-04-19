import type { TrackType } from "@/domain/models/core";

export type PracticeRunPlan = "SHORT" | "BALANCED" | "LONG";
export type QualifyingMode = "QUICK" | "DETAILED";
export type QualifyingReleaseTiming = "EARLY" | "MID" | "LATE";
export type QualifyingTyreCompound = "SOFT" | "MEDIUM" | "HARD";

interface PracticeLearningInput {
  trackType: TrackType;
  weatherSensitivity: number;
  aeroBalanceFocus: number;
  weatherFocus: number;
  runPlan: PracticeRunPlan;
  driverFeedback: number;
  staffSetup: number;
  baseSetupConfidence: number;
  baseTrackKnowledge: number;
}

interface QualifyingPerformanceInput {
  trackType: TrackType;
  mode: QualifyingMode;
  driverOverall: number;
  qualifyingSkill: number;
  emotionalControl: number;
  carPerformance: number;
  setupConfidence: number;
  trackKnowledge: number;
  riskLevel: number;
  releaseTiming: QualifyingReleaseTiming;
  tyreCompound: QualifyingTyreCompound;
  weatherSensitivity: number;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function stableUnitSeed(seed: string) {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }
  const normalized = (Math.sin(hash) + 1) / 2;
  return normalized - Math.floor(normalized);
}

function trackAeroTarget(trackType: TrackType) {
  switch (trackType) {
    case "STREET":
    case "TECHNICAL":
      return -35;
    case "ROAD":
    case "MIXED":
      return 0;
    case "HIGH_SPEED":
      return 45;
    case "OVAL_SHORT":
      return 25;
    case "OVAL_INTERMEDIATE":
      return 35;
    case "SUPERSPEEDWAY":
      return 55;
    case "ENDURANCE":
      return 15;
    default:
      return 0;
  }
}

function trackWeatherTarget(trackType: TrackType) {
  switch (trackType) {
    case "STREET":
    case "MIXED":
      return 20;
    case "ENDURANCE":
      return 35;
    default:
      return 0;
  }
}

export function calculatePracticeLearning(input: PracticeLearningInput) {
  const aeroMismatch = Math.abs(input.aeroBalanceFocus - trackAeroTarget(input.trackType)) / 100;
  const weatherMismatch = Math.abs(input.weatherFocus - trackWeatherTarget(input.trackType)) / 100;
  const runPlanBonus = input.runPlan === "LONG" ? 1.25 : input.runPlan === "BALANCED" ? 1.05 : 0.9;
  const weatherComplexity = clamp(input.weatherSensitivity / 100, 0.25, 0.95);

  const baseGain =
    6 +
    (input.driverFeedback - 50) * 0.07 +
    (input.staffSetup - 50) * 0.06 +
    (100 - input.baseSetupConfidence) * 0.09;
  const setupGain = clamp(
    Math.round(baseGain * runPlanBonus * (1 - aeroMismatch * 0.7) * (1 - weatherMismatch * 0.45)),
    2,
    19,
  );

  const trackGainBase =
    4 +
    (input.driverFeedback - 50) * 0.05 +
    (100 - input.baseTrackKnowledge) * 0.08 +
    weatherComplexity * 3.5;
  const trackKnowledgeGain = clamp(
    Math.round(trackGainBase * runPlanBonus * (1 - weatherMismatch * 0.7)),
    1,
    16,
  );

  const paceDelta = clamp(
    Math.round(setupGain * 0.55 + trackKnowledgeGain * 0.45 - (aeroMismatch + weatherMismatch) * 4),
    -3,
    14,
  );

  const incidentRisk = clamp(
    Math.round(10 + aeroMismatch * 20 + weatherMismatch * 15 + (input.runPlan === "SHORT" ? 6 : 0)),
    4,
    38,
  );

  return {
    setupGain,
    trackKnowledgeGain,
    paceDelta,
    incidentRisk,
  };
}

function compoundModifier(compound: QualifyingTyreCompound) {
  if (compound === "SOFT") return 5;
  if (compound === "MEDIUM") return 2;
  return -1;
}

function timingModifier(timing: QualifyingReleaseTiming, trackType: TrackType) {
  if (trackType === "OVAL_SHORT" || trackType === "OVAL_INTERMEDIATE" || trackType === "SUPERSPEEDWAY") {
    return timing === "LATE" ? 2 : timing === "MID" ? 1 : -1;
  }
  if (trackType === "STREET") {
    return timing === "EARLY" ? 2 : timing === "MID" ? 1 : -1;
  }
  return timing === "MID" ? 2 : timing === "LATE" ? 1 : 0;
}

export function calculateQualifyingLapScore(input: QualifyingPerformanceInput) {
  const riskWeight = clamp(input.riskLevel, 20, 95);
  const riskBoost = (riskWeight - 55) * 0.16;
  const errorRisk = clamp(
    Math.round(
      6 +
        (riskWeight - input.emotionalControl) * 0.4 +
        (input.mode === "DETAILED" ? 4 : 0) +
        input.weatherSensitivity * 0.08,
    ),
    3,
    62,
  );

  const baseScore =
    input.driverOverall * 0.34 +
    input.qualifyingSkill * 0.22 +
    input.carPerformance * 0.24 +
    input.setupConfidence * 0.12 +
    input.trackKnowledge * 0.08;

  const strategicScore =
    riskBoost +
    compoundModifier(input.tyreCompound) +
    timingModifier(input.releaseTiming, input.trackType) +
    (input.mode === "DETAILED" ? 1.6 : 0.6);

  const adjusted = clamp(Math.round(baseScore + strategicScore), 30, 99);

  return {
    lapScore: adjusted,
    errorRisk,
  };
}

const baseLapByTrack: Record<TrackType, number> = {
  STREET: 89_600,
  ROAD: 86_800,
  OVAL_SHORT: 52_500,
  OVAL_INTERMEDIATE: 45_300,
  SUPERSPEEDWAY: 43_200,
  TECHNICAL: 88_900,
  HIGH_SPEED: 84_700,
  ENDURANCE: 210_000,
  MIXED: 87_200,
};

export function lapScoreToMilliseconds(params: {
  trackType: TrackType;
  lapScore: number;
  errorRisk: number;
  seed: string;
}) {
  const baseline = baseLapByTrack[params.trackType];
  const scoreDelta = (80 - params.lapScore) * 130;
  const randomJitter = Math.round((stableUnitSeed(params.seed) - 0.5) * 280);
  const riskPenaltyChance = stableUnitSeed(`${params.seed}:risk`);
  const riskPenalty = riskPenaltyChance < params.errorRisk / 100 ? Math.round(220 + params.errorRisk * 4.2) : 0;

  return Math.max(39_000, Math.round(baseline + scoreDelta + randomJitter + riskPenalty));
}
