import type { HqAlert } from "@/features/hq/types";

interface CompetitiveIndexInput {
  teamReputation: number;
  averageDriverOverall: number;
  carPerformance: number;
  supplierStrength: number;
  facilityStrength: number;
}

interface BurnRateInput {
  annualDriverSalaries: number;
  annualStaffSalaries: number;
  annualSupplierCost: number;
  annualOperatingCost: number;
  annualSponsorIncome: number;
}

interface AlertInput {
  cashBalance: number;
  monthlyBurnRate: number;
  morale: number;
  daysUntilNextEvent: number | null;
  supplierContractsEndingSoon: number;
}

export function calculateCompetitiveIndex(input: CompetitiveIndexInput) {
  const rawScore =
    input.teamReputation * 0.26 +
    input.averageDriverOverall * 0.24 +
    input.carPerformance * 0.25 +
    input.supplierStrength * 0.13 +
    input.facilityStrength * 0.12;

  return Math.max(1, Math.min(99, Math.round(rawScore)));
}

export function calculateMonthlyBurnRate(input: BurnRateInput) {
  const yearlyExpenses =
    input.annualDriverSalaries +
    input.annualStaffSalaries +
    input.annualSupplierCost +
    input.annualOperatingCost;
  const yearlyNet = yearlyExpenses - input.annualSponsorIncome;

  return Math.round(yearlyNet / 12);
}

export function calculateDevelopmentPace(input: {
  competitiveIndex: number;
  averageFacilityLevel: number;
  averageStaffReputation: number;
}) {
  const score =
    input.competitiveIndex * 0.45 +
    input.averageFacilityLevel * 12 +
    input.averageStaffReputation * 0.35;

  return Math.max(1, Math.min(99, Math.round(score)));
}

export function generateHqAlerts(input: AlertInput): HqAlert[] {
  const alerts: HqAlert[] = [];

  if (input.cashBalance < 20_000_000) {
    alerts.push({
      id: "cash-critical",
      severity: "HIGH",
      title: "Cash Balance Critical",
      message: "Team reserves are low. Reduce operating cost or secure sponsor income.",
    });
  } else if (input.cashBalance < 35_000_000) {
    alerts.push({
      id: "cash-warning",
      severity: "MEDIUM",
      title: "Cash Pressure Rising",
      message: "Financial cushion is shrinking. Track contracts and development spending.",
    });
  }

  if (input.monthlyBurnRate > 4_000_000) {
    alerts.push({
      id: "burn-rate",
      severity: "MEDIUM",
      title: "Monthly Burn Rate High",
      message: "Current monthly expenses are above sustainable trajectory.",
    });
  }

  if (input.morale < 62) {
    alerts.push({
      id: "morale-drop",
      severity: "HIGH",
      title: "Morale Drop Detected",
      message: "Driver/staff confidence is low. Consider leadership and strategic adjustments.",
    });
  } else if (input.morale < 72) {
    alerts.push({
      id: "morale-watch",
      severity: "LOW",
      title: "Morale Needs Attention",
      message: "Team morale is stable but below ideal competitive threshold.",
    });
  }

  if (input.daysUntilNextEvent !== null && input.daysUntilNextEvent <= 5) {
    alerts.push({
      id: "event-close",
      severity: "MEDIUM",
      title: "Race Weekend Approaching",
      message: "Next event is imminent. Lock setup and strategic prep.",
    });
  }

  if (input.supplierContractsEndingSoon > 0) {
    alerts.push({
      id: "supplier-expiring",
      severity: "LOW",
      title: "Supplier Contracts Near Expiry",
      message: `${input.supplierContractsEndingSoon} supplier contract(s) approaching deadline.`,
    });
  }

  if (alerts.length === 0) {
    alerts.push({
      id: "all-clear",
      severity: "LOW",
      title: "Operations Stable",
      message: "No critical alerts at this moment.",
    });
  }

  return alerts;
}
