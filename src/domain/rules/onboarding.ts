const technicalLeadershipRoles = new Set([
  "Technical Director",
  "Chief Engineer",
  "Head of Aero",
  "Head of Aerodynamics",
  "Powertrain Specialist",
]);

const strategyLeadershipRoles = new Set([
  "Head of Strategy",
  "Race Engineer",
  "Sporting Director",
]);

export interface EvaluateMyTeamLineupInput {
  activeDriverCount: number;
  staffRoles: string[];
  minimumDrivers?: number;
}

export interface EvaluateMyTeamLineupResult {
  minimumReady: boolean;
  missingRequirements: string[];
  hasTechnicalLead: boolean;
  hasStrategyLead: boolean;
  requiredDrivers: number;
}

export interface EvaluateOnboardingMarketInput {
  driverCandidates: number;
  staffCandidates: number;
  minimumDrivers?: number;
  minimumStaff?: number;
}

export function evaluateMyTeamLineupRequirements(
  input: EvaluateMyTeamLineupInput,
): EvaluateMyTeamLineupResult {
  const requiredDrivers = input.minimumDrivers ?? 2;
  const staffRoleSet = new Set(input.staffRoles);

  const hasTechnicalLead = [...technicalLeadershipRoles].some((role) =>
    staffRoleSet.has(role),
  );
  const hasStrategyLead = [...strategyLeadershipRoles].some((role) =>
    staffRoleSet.has(role),
  );

  const missingRequirements: string[] = [];
  if (input.activeDriverCount < requiredDrivers) {
    missingRequirements.push(`DRIVERS_${requiredDrivers}`);
  }
  if (!hasTechnicalLead) {
    missingRequirements.push("TECHNICAL_LEADERSHIP");
  }
  if (!hasStrategyLead) {
    missingRequirements.push("STRATEGY_LEADERSHIP");
  }

  return {
    minimumReady: missingRequirements.length === 0,
    missingRequirements,
    hasTechnicalLead,
    hasStrategyLead,
    requiredDrivers,
  };
}

export function hasOperationalOnboardingMarket(input: EvaluateOnboardingMarketInput) {
  const minimumDrivers = input.minimumDrivers ?? 2;
  const minimumStaff = input.minimumStaff ?? 2;
  return input.driverCandidates >= minimumDrivers && input.staffCandidates >= minimumStaff;
}
