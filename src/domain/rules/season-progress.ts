import type { CareerSeasonPhase, SeasonStatus } from "@prisma/client";

export interface SeasonRoundResolution {
  status: SeasonStatus;
  nextRound: number;
  phase: CareerSeasonPhase;
  completedRound: number;
  totalRounds: number;
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
