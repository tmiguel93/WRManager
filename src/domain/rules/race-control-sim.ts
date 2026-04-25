import type { TrackType } from "@/domain/models/core";

export type RacePaceMode = "ATTACK" | "NEUTRAL" | "CONSERVE";
export type RaceFuelMode = "PUSH" | "NORMAL" | "SAVE";
export type RaceTyreMode = "PUSH" | "NORMAL" | "SAVE";
export type RacePitPlan = "UNDERCUT" | "BALANCED" | "OVERCUT";
export type RaceTeamOrders = "HOLD" | "FREE_FIGHT";
export type RaceWeatherReaction = "SAFE" | "REACTIVE" | "AGGRESSIVE";

export type RaceSessionKind = "SPRINT" | "FEATURE" | "STAGE" | "RACE";

export interface RaceDecisionProfile {
  paceMode: RacePaceMode;
  fuelMode: RaceFuelMode;
  tyreMode: RaceTyreMode;
  pitPlan: RacePitPlan;
  teamOrders: RaceTeamOrders;
  weatherReaction: RaceWeatherReaction;
}

export interface RacePerformanceInput {
  trackType: TrackType;
  weatherSensitivity: number;
  raceDistanceMinutes: number;
  driverOverall: number;
  raceCraft: number;
  consistency: number;
  overtaking: number;
  defense: number;
  emotionalControl: number;
  wetSkill: number;
  trackAdaptation: number;
  technicalFeedback: number;
  tireManagement: number;
  fuelSaving: number;
  strategyIq: number;
  trafficAdaptation: number;
  carPerformance: number;
  carReliability: number;
  setupConfidence: number;
  trackKnowledge: number;
  staffStrategy: number;
  staffPit: number;
  supplierPerformance: number;
  supplierReliability: number;
  decisionProfile: RaceDecisionProfile;
}

export interface RacePerformanceScore {
  paceScore: number;
  reliabilityScore: number;
  pitStopTimeMs: number;
  expectedPitStops: number;
  incidentRisk: number;
  raceCraftScore: number;
}

export interface RaceOutcomeInput {
  trackType: TrackType;
  raceDistanceMinutes: number;
  startPosition: number;
  fieldSize: number;
  weatherSensitivity: number;
  safetyCarProfile: string;
  paceScore: number;
  reliabilityScore: number;
  raceCraftScore: number;
  incidentRisk?: number;
  expectedPitStops: number;
  pitStopTimeMs: number;
  decisionProfile: RaceDecisionProfile;
  seed: string;
}

export interface RaceOutcome {
  status: "FINISHED" | "DNF";
  totalTimeMs: number | null;
  lapsCompleted: number;
  pitStops: number;
  incidentPenaltyMs: number;
  raceNotes: string[];
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function safeRound(value: number) {
  return Math.round(Number.isFinite(value) ? value : 0);
}

export function stableUnitSeed(seed: string) {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }
  const normalized = (Math.sin(hash) + 1) / 2;
  return normalized - Math.floor(normalized);
}

function trackPitBaselineMs(trackType: TrackType) {
  switch (trackType) {
    case "OVAL_SHORT":
      return 12_600;
    case "OVAL_INTERMEDIATE":
      return 12_200;
    case "SUPERSPEEDWAY":
      return 11_800;
    case "ENDURANCE":
      return 32_000;
    default:
      return 21_000;
  }
}

function baseLapByTrack(trackType: TrackType) {
  switch (trackType) {
    case "OVAL_SHORT":
      return 26_300;
    case "OVAL_INTERMEDIATE":
      return 29_800;
    case "SUPERSPEEDWAY":
      return 46_800;
    case "ENDURANCE":
      return 212_000;
    case "HIGH_SPEED":
      return 86_000;
    case "STREET":
      return 90_000;
    case "TECHNICAL":
      return 89_500;
    case "MIXED":
      return 87_800;
    default:
      return 88_200;
  }
}

function strategyPaceModifier(profile: RaceDecisionProfile) {
  const paceMode = profile.paceMode === "ATTACK" ? 4.6 : profile.paceMode === "CONSERVE" ? -3.2 : 0;
  const fuelMode = profile.fuelMode === "PUSH" ? 2.6 : profile.fuelMode === "SAVE" ? -2.2 : 0;
  const tyreMode = profile.tyreMode === "PUSH" ? 2.2 : profile.tyreMode === "SAVE" ? -1.8 : 0;
  const pitPlan = profile.pitPlan === "UNDERCUT" ? 1.3 : profile.pitPlan === "OVERCUT" ? 0.4 : 0;
  const weatherReaction =
    profile.weatherReaction === "AGGRESSIVE" ? 1.2 : profile.weatherReaction === "SAFE" ? -0.8 : 0;

  return paceMode + fuelMode + tyreMode + pitPlan + weatherReaction;
}

function strategyReliabilityModifier(profile: RaceDecisionProfile) {
  const paceMode = profile.paceMode === "ATTACK" ? -8.2 : profile.paceMode === "CONSERVE" ? 5.2 : 0;
  const fuelMode = profile.fuelMode === "PUSH" ? -4.5 : profile.fuelMode === "SAVE" ? 3.8 : 0;
  const tyreMode = profile.tyreMode === "PUSH" ? -3.5 : profile.tyreMode === "SAVE" ? 2.5 : 0;
  const weatherReaction =
    profile.weatherReaction === "AGGRESSIVE" ? -2.9 : profile.weatherReaction === "SAFE" ? 2.3 : 0;

  return paceMode + fuelMode + tyreMode + weatherReaction;
}

function strategyIncidentModifier(profile: RaceDecisionProfile) {
  const paceMode = profile.paceMode === "ATTACK" ? 4.2 : profile.paceMode === "CONSERVE" ? -2.4 : 0;
  const tyreMode = profile.tyreMode === "PUSH" ? 2.2 : profile.tyreMode === "SAVE" ? -1.2 : 0;
  const orders = profile.teamOrders === "FREE_FIGHT" ? 2.8 : -1.8;
  const weatherReaction =
    profile.weatherReaction === "AGGRESSIVE" ? 2.4 : profile.weatherReaction === "SAFE" ? -2.1 : 0;

  return paceMode + tyreMode + orders + weatherReaction;
}

function strategyPitModifier(profile: RaceDecisionProfile) {
  if (profile.pitPlan === "UNDERCUT") return -1;
  if (profile.pitPlan === "OVERCUT") return 1;
  return 0;
}

function expectedStops(raceDistanceMinutes: number, tyreManagement: number, fuelSaving: number, profile: RaceDecisionProfile) {
  const stintEfficiency = (tyreManagement * 0.6 + fuelSaving * 0.4) / 100;
  const distanceFactor = raceDistanceMinutes / 62;
  const baselineStops = distanceFactor * (1.65 - stintEfficiency * 0.75);
  const strategyModifier = strategyPitModifier(profile) + (profile.tyreMode === "PUSH" ? 1 : profile.tyreMode === "SAVE" ? -1 : 0);
  return clamp(Math.round(baselineStops + strategyModifier), 1, Math.max(2, Math.round(distanceFactor * 2.4)));
}

export function calculateRacePerformanceScore(input: RacePerformanceInput): RacePerformanceScore {
  const weatherPressure = clamp(input.weatherSensitivity / 100, 0, 1);
  const wetSkillDelta = (input.wetSkill - 70) * weatherPressure;
  const basePace =
    input.driverOverall * 0.17 +
    input.raceCraft * 0.14 +
    input.consistency * 0.1 +
    input.overtaking * 0.09 +
    input.trackAdaptation * 0.08 +
    input.tireManagement * 0.08 +
    input.fuelSaving * 0.06 +
    input.strategyIq * 0.06 +
    input.trafficAdaptation * 0.05 +
    input.carPerformance * 0.12 +
    input.setupConfidence * 0.025 +
    input.trackKnowledge * 0.025 +
    input.staffStrategy * 0.03 +
    input.supplierPerformance * 0.02 +
    wetSkillDelta * 0.055;

  const paceScore = clamp(safeRound(basePace + strategyPaceModifier(input.decisionProfile)), 35, 99);

  const baseReliability =
    input.consistency * 0.2 +
    input.emotionalControl * 0.09 +
    input.technicalFeedback * 0.05 +
    input.carReliability * 0.38 +
    input.staffPit * 0.11 +
    input.supplierReliability * 0.09 +
    (100 - input.weatherSensitivity) * 0.08 +
    wetSkillDelta * 0.045;

  const reliabilityScore = clamp(safeRound(baseReliability + strategyReliabilityModifier(input.decisionProfile)), 28, 99);

  const expectedPitStops = expectedStops(
    input.raceDistanceMinutes,
    input.tireManagement,
    input.fuelSaving,
    input.decisionProfile,
  );

  const pitStopTimeMs = clamp(
    safeRound(trackPitBaselineMs(input.trackType) - (input.staffPit - 60) * 85 + expectedPitStops * 120),
    9_500,
    37_000,
  );

  const incidentRisk = clamp(
    safeRound(
      58 -
        reliabilityScore * 0.46 +
        input.weatherSensitivity * 0.12 -
        wetSkillDelta * 0.06 +
        strategyIncidentModifier(input.decisionProfile),
    ),
    3,
    58,
  );

  const raceCraftScore = clamp(
    safeRound(input.raceCraft * 0.44 + input.defense * 0.16 + input.overtaking * 0.24 + input.trafficAdaptation * 0.16),
    35,
    99,
  );

  return {
    paceScore,
    reliabilityScore,
    pitStopTimeMs,
    expectedPitStops,
    incidentRisk,
    raceCraftScore,
  };
}

function cautionIntensity(profile: string, seed: string) {
  const base = stableUnitSeed(`${seed}:caution`);
  if (profile.includes("CAUTION") || profile.includes("YELLOW") || profile.includes("SAFETY")) {
    return 0.08 + base * 0.12;
  }
  return 0.02 + base * 0.08;
}

function estimateLaps(trackType: TrackType, raceDistanceMinutes: number) {
  const avgLapMs = baseLapByTrack(trackType);
  const raceWindowMs = raceDistanceMinutes * 60_000;
  return Math.max(8, Math.round(raceWindowMs / avgLapMs));
}

export function simulateRaceOutcome(input: RaceOutcomeInput): RaceOutcome {
  const caution = cautionIntensity(input.safetyCarProfile, input.seed);
  const paceDeltaMs = (80 - input.paceScore) * 1_860;
  const craftDeltaMs = (68 - input.raceCraftScore) * 690;
  const fieldPressure = clamp(input.fieldSize / 30, 0.7, 1.45);
  const gridPenaltyMs = Math.max(0, input.startPosition - 1) * (880 - caution * 2800) * fieldPressure;

  const baseRaceMs = input.raceDistanceMinutes * 60_000;
  const pitStops = clamp(
    safeRound(input.expectedPitStops + (stableUnitSeed(`${input.seed}:pit`) < 0.18 ? 1 : 0)),
    1,
    8,
  );
  const pitTimeTotal = pitStops * input.pitStopTimeMs;

  const modeledIncidentRisk =
    input.incidentRisk ??
    safeRound(
      42 -
        input.reliabilityScore * 0.35 +
        input.weatherSensitivity * 0.06 +
        strategyIncidentModifier(input.decisionProfile),
    );

  const dnfRisk = clamp(
    safeRound(modeledIncidentRisk * 0.52 + (input.decisionProfile.fuelMode === "PUSH" ? 2 : 0)),
    1,
    36,
  );
  const dnfRoll = stableUnitSeed(`${input.seed}:dnf`) * 100;

  const raceNotes: string[] = [];
  let status: "FINISHED" | "DNF" = "FINISHED";
  let incidentPenaltyMs = 0;

  if (dnfRoll < dnfRisk) {
    status = "DNF";
    raceNotes.push("Mechanical issue forced retirement.");
  } else {
    const incidentRoll = stableUnitSeed(`${input.seed}:incident`) * 100;
    const incidentThreshold = clamp(modeledIncidentRisk * 0.62, 4, 32);
    if (incidentRoll < incidentThreshold) {
      incidentPenaltyMs = safeRound(6_000 + stableUnitSeed(`${input.seed}:incident:delta`) * 22_000);
      raceNotes.push("Lost time after a race incident in traffic.");
    }

    if (input.decisionProfile.teamOrders === "HOLD") {
      raceNotes.push("Team orders stabilized the intra-team battle.");
    }

    if (input.decisionProfile.pitPlan === "UNDERCUT") {
      raceNotes.push("Undercut window executed for track position.");
    }
    if (input.decisionProfile.paceMode === "ATTACK") {
      raceNotes.push("Aggressive pace map maintained during key stints.");
    }
    if (input.decisionProfile.weatherReaction === "AGGRESSIVE") {
      raceNotes.push("Early weather reaction call paid off in changing conditions.");
    }
  }

  const randomJitter = safeRound((stableUnitSeed(`${input.seed}:jitter`) - 0.5) * 12_600);

  const totalTimeMs =
    status === "DNF"
      ? null
      : safeRound(baseRaceMs + paceDeltaMs + craftDeltaMs + gridPenaltyMs + pitTimeTotal + incidentPenaltyMs + randomJitter);

  const laps = estimateLaps(input.trackType, input.raceDistanceMinutes);
  const dnfLaps = clamp(safeRound(laps * (0.45 + stableUnitSeed(`${input.seed}:dnf:laps`) * 0.45)), 1, laps - 1);

  return {
    status,
    totalTimeMs,
    lapsCompleted: status === "DNF" ? dnfLaps : laps,
    pitStops,
    incidentPenaltyMs,
    raceNotes,
  };
}

function readNumberArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is number => typeof entry === "number" && Number.isFinite(entry));
}

function nascarStylePoints(raceWinPoints: number, gridSize = 40) {
  const table: number[] = [raceWinPoints];
  let current = Math.max(1, raceWinPoints - 5);
  for (let index = 1; index < gridSize; index += 1) {
    table.push(current);
    current = Math.max(1, current - (index < 5 ? 2 : 1));
  }
  return table;
}

export function resolveRacePointsTable(pointSystem: Record<string, unknown>, sessionKind: RaceSessionKind): number[] {
  const race = readNumberArray(pointSystem.race);
  const sprint = readNumberArray(pointSystem.sprint);
  const feature = readNumberArray(pointSystem.feature);
  const stageTopTen = readNumberArray(pointSystem.stageTop10);

  if (sessionKind === "STAGE") {
    if (stageTopTen.length > 0) return stageTopTen;
    const stageWin = typeof pointSystem.stageWin === "number" ? pointSystem.stageWin : 10;
    return [stageWin, 9, 8, 7, 6, 5, 4, 3, 2, 1];
  }

  if (sessionKind === "SPRINT") {
    if (sprint.length > 0) return sprint;
    if (race.length > 0) return race.map((value) => Math.max(0, Math.round(value * 0.45)));
    return [8, 7, 6, 5, 4, 3, 2, 1];
  }

  if (sessionKind === "FEATURE") {
    if (feature.length > 0) return feature;
    if (race.length > 0) return race;
    return [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
  }

  if (race.length > 0) return race;

  const raceWin = typeof pointSystem.raceWin === "number" ? pointSystem.raceWin : 40;
  return nascarStylePoints(raceWin);
}

export function pointsForPosition(pointsTable: number[], position: number) {
  if (position <= 0) return 0;
  return pointsTable[position - 1] ?? 0;
}

export function formatRaceTime(milliseconds: number) {
  const hours = Math.floor(milliseconds / 3_600_000);
  const minutes = Math.floor((milliseconds % 3_600_000) / 60_000);
  const seconds = Math.floor((milliseconds % 60_000) / 1000);
  const millis = milliseconds % 1000;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(millis).padStart(3, "0")}`;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}.${String(millis).padStart(3, "0")}`;
}

export function sessionKindFromToken(sessionType: string): RaceSessionKind {
  if (sessionType === "SPRINT") return "SPRINT";
  if (sessionType === "FEATURE") return "FEATURE";
  if (sessionType === "STAGE") return "STAGE";
  return "RACE";
}

export function defaultRaceDistanceMinutes(trackType: TrackType, sessionKind: RaceSessionKind) {
  if (sessionKind === "STAGE") return 40;
  if (sessionKind === "SPRINT") return 45;
  if (sessionKind === "FEATURE") return 65;
  if (trackType === "ENDURANCE") return 360;
  if (trackType === "SUPERSPEEDWAY") return 95;
  return 90;
}

