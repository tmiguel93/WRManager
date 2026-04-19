import type { ManagerProfileCode, SupplierType } from "@/domain/models/core";

export type SponsorObjectiveRisk = "SAFE" | "BALANCED" | "AGGRESSIVE";

interface SupplierOfferInput {
  supplierType: SupplierType;
  baseCost: number;
  supplierPrestige: number;
  teamReputation: number;
  managerProfileCode: ManagerProfileCode | string;
  termYears: number;
}

interface SponsorOfferInput {
  baseValue: number;
  sponsorConfidence: number;
  teamReputation: number;
  managerProfileCode: ManagerProfileCode | string;
  objectiveRisk: SponsorObjectiveRisk;
  teamCountryCode?: string | null;
  sponsorCountryCode?: string | null;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function managerSupplierDiscount(managerProfileCode: string) {
  const map: Record<string, number> = {
    NEGOCIADOR: -0.08,
    COMERCIAL: -0.05,
    DIRETOR_GLOBAL: -0.03,
    VISIONARIO: -0.02,
    ESTRATEGISTA: -0.01,
  };
  return map[managerProfileCode] ?? 0;
}

function managerSponsorBoost(managerProfileCode: string) {
  const map: Record<string, number> = {
    NEGOCIADOR: 0.09,
    COMERCIAL: 0.11,
    DIRETOR_GLOBAL: 0.06,
    MOTIVADOR: 0.03,
    VISIONARIO: 0.02,
  };
  return map[managerProfileCode] ?? 0;
}

export function calculateSupplierOffer(input: SupplierOfferInput) {
  const safeTerm = clamp(Math.round(input.termYears), 1, 3);
  const managerDelta = managerSupplierDiscount(input.managerProfileCode);
  const reputationDelta = -((input.teamReputation - 60) * 0.0022);
  const termDelta = safeTerm === 1 ? 0.02 : safeTerm === 3 ? -0.035 : -0.012;
  const prestigeDelta = input.supplierPrestige >= 88 ? 0.05 : input.supplierPrestige >= 80 ? 0.025 : 0;
  const typeDelta = input.supplierType === "ENGINE" ? 0.03 : 0.01;

  const multiplier = clamp(1 + managerDelta + reputationDelta + termDelta + prestigeDelta + typeDelta, 0.72, 1.32);
  const annualCost = Math.round(input.baseCost * multiplier);
  const signingFee = Math.round(annualCost * (0.09 + safeTerm * 0.015));
  const negotiationConfidence = clamp(Math.round(58 + input.teamReputation * 0.3 - multiplier * 14), 45, 98);

  return {
    annualCost,
    signingFee,
    negotiationConfidence,
    multiplier,
    termYears: safeTerm,
  };
}

const objectiveProfiles: Record<SponsorObjectiveRisk, { value: number; bonus: number; confidence: number; risk: number }> = {
  SAFE: { value: 0.58, bonus: 0.75, confidence: 7, risk: 18 },
  BALANCED: { value: 0.74, bonus: 1, confidence: 0, risk: 32 },
  AGGRESSIVE: { value: 0.92, bonus: 1.28, confidence: -8, risk: 51 },
};

export function calculateSponsorOffer(input: SponsorOfferInput) {
  const profile = objectiveProfiles[input.objectiveRisk];
  const managerBoost = managerSponsorBoost(input.managerProfileCode);
  const reputationBoost = clamp((input.teamReputation - 58) * 0.0045, -0.08, 0.18);
  const countrySynergy =
    input.teamCountryCode && input.sponsorCountryCode && input.teamCountryCode === input.sponsorCountryCode ? 0.05 : 0;

  const multiplier = clamp(profile.value + managerBoost + reputationBoost + countrySynergy, 0.45, 1.35);
  const fixedValue = Math.round(input.baseValue * multiplier);
  const signingAdvance = Math.round(fixedValue * 0.24);
  const confidence = clamp(
    Math.round(input.sponsorConfidence + profile.confidence + input.teamReputation * 0.06 + managerBoost * 100),
    35,
    97,
  );

  const bonusTargets = {
    podium: Math.round(fixedValue * 0.025 * profile.bonus),
    pole: Math.round(fixedValue * 0.018 * profile.bonus),
    top10: Math.round(fixedValue * 0.009 * profile.bonus),
    win: Math.round(fixedValue * 0.032 * profile.bonus),
  };

  return {
    fixedValue,
    signingAdvance,
    confidence,
    bonusTargets,
    reputationalRisk: clamp(profile.risk + Math.round((100 - confidence) * 0.2), 10, 75),
    multiplier,
  };
}
