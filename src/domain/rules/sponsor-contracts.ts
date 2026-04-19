export type SponsorGuardReason = "DUPLICATE_SPONSOR" | "SLOTS_FULL";

export interface SponsorContractGuardInput {
  sponsorId: string;
  activeSponsorIds: string[];
  maxActiveContracts?: number;
}

export interface SponsorContractGuardResult {
  allowed: boolean;
  reason?: SponsorGuardReason;
}

export function evaluateSponsorContractGuard(
  input: SponsorContractGuardInput,
): SponsorContractGuardResult {
  const maxActiveContracts = input.maxActiveContracts ?? 3;

  if (input.activeSponsorIds.includes(input.sponsorId)) {
    return { allowed: false, reason: "DUPLICATE_SPONSOR" };
  }

  if (input.activeSponsorIds.length >= maxActiveContracts) {
    return { allowed: false, reason: "SLOTS_FULL" };
  }

  return { allowed: true };
}
