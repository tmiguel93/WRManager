import type { CareerMode, ManagerProfileCode } from "@/domain/models/core";

const tierBaseBudget: Record<number, number> = {
  1: 5_500_000,
  2: 14_000_000,
  3: 48_000_000,
  4: 128_000_000,
};

const categoryBaselineBudget: Record<string, number> = {
  FORMULA_VEE: 3_800_000,
  F4: 5_200_000,
  FORMULA_REGIONAL: 8_500_000,
  USF_JUNIORS: 5_100_000,
  GB3: 6_700_000,
  TURISMO_NACIONAL: 4_900_000,
  GT4_REGIONAL: 7_400_000,
  PROTOTYPE_CUP: 9_400_000,
  F3: 13_500_000,
  INDY_NXT_FEEDER: 16_000_000,
  NASCAR_TRUCK: 18_500_000,
  DTM_TROPHY: 16_700_000,
  GT3_NATIONAL: 17_100_000,
  LMP3: 19_800_000,
  SUPER_FORMULA_LIGHTS: 15_600_000,
  TOURING_CONTINENTAL: 16_300_000,
  F2: 47_500_000,
  FORMULA_E: 58_000_000,
  NASCAR_XFINITY: 51_000_000,
  INDY_NXT: 42_000_000,
  DTM: 63_000_000,
  LMGT3: 67_500_000,
  GT_WORLD_CHALLENGE: 69_000_000,
  LMP2: 72_000_000,
  F1: 128_000_000,
  INDYCAR: 112_000_000,
  NASCAR_CUP: 121_000_000,
  WEC_HYPERCAR: 145_000_000,
  SUPER_FORMULA: 84_000_000,
  IMSA_GTP: 116_000_000,
};

const modeMultiplier: Record<CareerMode, number> = {
  TEAM_PRINCIPAL: 1,
  MY_TEAM: 0.88,
  GLOBAL: 1.05,
};

const managerBudgetDelta: Partial<Record<ManagerProfileCode, number>> = {
  NEGOCIADOR: 850_000,
  COMERCIAL: 1_200_000,
  ENGENHEIRO: 450_000,
  ESTRATEGISTA: 300_000,
  FORMADOR: 500_000,
};

export function computeStartingBudget(params: {
  mode: CareerMode;
  managerProfileCode: ManagerProfileCode;
  categoryTier?: number | null;
  categoryCode?: string | null;
  teamReputation?: number | null;
  sponsorBoost?: number | null;
  isExistingTeam?: boolean;
  requestedBudget?: number | null;
}) {
  const tier = Math.max(1, Math.min(4, params.categoryTier ?? 2));
  const baseTierBudget =
    (params.categoryCode ? categoryBaselineBudget[params.categoryCode] : null) ??
    tierBaseBudget[tier] ??
    tierBaseBudget[2];
  const requestedBudget = params.requestedBudget ?? null;
  const modeAdjustedBase = Math.round(baseTierBudget * modeMultiplier[params.mode]);
  const delta = managerBudgetDelta[params.managerProfileCode] ?? 0;
  const reputationMultiplier = params.teamReputation
    ? Math.max(0.82, Math.min(1.24, 0.86 + params.teamReputation / 210))
    : 1;
  const sponsorMultiplier = params.sponsorBoost
    ? Math.max(1, Math.min(1.22, 1 + params.sponsorBoost))
    : 1;
  const existingTeamMultiplier = params.isExistingTeam ? 1.08 : 1;

  const computedBaseline = Math.round(
    modeAdjustedBase * reputationMultiplier * sponsorMultiplier * existingTeamMultiplier + delta,
  );

  if (params.mode === "MY_TEAM" && requestedBudget) {
    const min = Math.round(baseTierBudget * 0.72);
    const max = Math.round(baseTierBudget * 1.32);
    return Math.max(min, Math.min(max, requestedBudget + delta));
  }

  return Math.max(3_200_000, computedBaseline);
}
