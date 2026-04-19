export interface ProposalThresholds {
  acceptAt: number;
  counterAt: number;
}

export type ProposalOutcome = "ACCEPTED" | "COUNTER" | "REJECTED";

export function calculateSigningCost(annualSalary: number, bonus: number) {
  return Math.round(annualSalary * 0.12 + bonus);
}

export function resolveProposalOutcome(
  score: number,
  thresholds: ProposalThresholds,
): ProposalOutcome {
  if (score >= thresholds.acceptAt) {
    return "ACCEPTED";
  }
  if (score >= thresholds.counterAt) {
    return "COUNTER";
  }
  return "REJECTED";
}
