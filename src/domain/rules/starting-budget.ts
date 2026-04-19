import type { CareerMode, ManagerProfileCode } from "@/domain/models/core";

const modeBaseBudget: Record<CareerMode, number> = {
  TEAM_PRINCIPAL: 40_000_000,
  MY_TEAM: 75_000_000,
  GLOBAL: 55_000_000,
};

const managerBudgetDelta: Partial<Record<ManagerProfileCode, number>> = {
  NEGOCIADOR: 6_000_000,
  COMERCIAL: 5_000_000,
  ENGENHEIRO: 2_000_000,
  ESTRATEGISTA: 1_000_000,
  FORMADOR: 3_000_000,
};

export function computeStartingBudget(params: {
  mode: CareerMode;
  managerProfileCode: ManagerProfileCode;
  requestedBudget?: number | null;
}) {
  const requestedBudget = params.requestedBudget ?? null;
  const baseBudget =
    params.mode === "MY_TEAM" && requestedBudget
      ? requestedBudget
      : modeBaseBudget[params.mode];
  const delta = managerBudgetDelta[params.managerProfileCode] ?? 0;

  return Math.max(20_000_000, baseBudget + delta);
}
