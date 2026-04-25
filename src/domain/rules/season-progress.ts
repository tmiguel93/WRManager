import { SessionType, type CareerSeasonPhase, type SeasonStatus } from "@prisma/client";

export interface SeasonRoundResolution {
  status: SeasonStatus;
  nextRound: number;
  phase: CareerSeasonPhase;
  completedRound: number;
  totalRounds: number;
}

export interface SeasonActivationResolution {
  status: SeasonStatus;
  phase: CareerSeasonPhase;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function resolveSeasonRoundAfterMainRace(params: {
  currentRound: number;
  completedRound: number;
  totalRounds: number;
}): SeasonRoundResolution {
  const totalRounds = Math.max(1, params.totalRounds);
  const completedRound = clamp(params.completedRound, 1, totalRounds);

  if (completedRound >= totalRounds) {
    return {
      status: "FINISHED",
      nextRound: totalRounds,
      phase: "SEASON_END",
      completedRound,
      totalRounds,
    };
  }

  const nextRound = clamp(Math.max(params.currentRound, completedRound + 1), 1, totalRounds);
  const middleRound = Math.ceil(totalRounds / 2);
  const phase: CareerSeasonPhase = completedRound >= middleRound ? "MID_SEASON" : "ROUND_ACTIVE";

  return {
    status: "ACTIVE",
    nextRound,
    phase,
    completedRound,
    totalRounds,
  };
}

export function deriveCareerPhaseFromSeason(params: {
  seasonStatus: SeasonStatus;
  currentRound: number;
  totalRounds: number;
}): CareerSeasonPhase {
  if (params.seasonStatus === "PRESEASON") {
    return "PRESEASON";
  }

  if (params.seasonStatus === "FINISHED") {
    return "OFFSEASON";
  }

  const totalRounds = Math.max(1, params.totalRounds);
  const currentRound = clamp(params.currentRound, 1, totalRounds);
  const middleRound = Math.ceil(totalRounds / 2);

  if (currentRound >= middleRound) {
    return "MID_SEASON";
  }

  return "ROUND_ACTIVE";
}

export function resolveSeasonActivationFromCompetitiveSession(params: {
  seasonStatus: SeasonStatus;
  currentRound: number;
  totalRounds: number;
}): SeasonActivationResolution {
  if (params.seasonStatus !== "PRESEASON") {
    return {
      status: params.seasonStatus,
      phase: deriveCareerPhaseFromSeason({
        seasonStatus: params.seasonStatus,
        currentRound: params.currentRound,
        totalRounds: params.totalRounds,
      }),
    };
  }

  return {
    status: "ACTIVE",
    phase: deriveCareerPhaseFromSeason({
      seasonStatus: "ACTIVE",
      currentRound: params.currentRound,
      totalRounds: params.totalRounds,
    }),
  };
}

const raceSessionTypes = new Set<SessionType>([
  SessionType.SPRINT,
  SessionType.FEATURE,
  SessionType.STAGE,
  SessionType.RACE,
]);

export function isCompetitiveRaceSession(sessionType: SessionType) {
  return raceSessionTypes.has(sessionType);
}

export function isRoundClosingRaceSession(params: {
  sessionType: SessionType;
  orderIndex: number;
  weekendSessions: Array<{
    sessionType: SessionType;
    orderIndex: number;
  }>;
}) {
  if (!isCompetitiveRaceSession(params.sessionType)) {
    return false;
  }

  const raceOrderIndexes = params.weekendSessions
    .filter((row) => raceSessionTypes.has(row.sessionType))
    .map((row) => row.orderIndex);

  if (raceOrderIndexes.length === 0) {
    return false;
  }

  const lastRaceOrder = Math.max(...raceOrderIndexes);
  return params.orderIndex === lastRaceOrder;
}
