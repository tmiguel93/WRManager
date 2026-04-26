export type ChampionshipCompletenessStatus = "complete" | "partial" | "blocked" | "hidden";

export type ChampionshipCompletenessThresholds = {
  minTeams: number;
  minDrivers: number;
  minStaff: number;
  minCircuits: number;
  minRounds: number;
  minProspects: number;
};

export type ChampionshipCompletenessInput = {
  tier: number;
  teams: number;
  drivers: number;
  staff: number;
  circuits: number;
  rounds: number;
  prospects: number;
  linkedDrivers?: number;
  linkedStaff?: number;
};

export type ChampionshipCompletenessResult = {
  status: ChampionshipCompletenessStatus;
  thresholds: ChampionshipCompletenessThresholds;
  issues: string[];
};

export function getChampionshipCompletenessThresholds(tier: number): ChampionshipCompletenessThresholds {
  if (tier <= 1) {
    return { minTeams: 8, minDrivers: 16, minStaff: 24, minCircuits: 8, minRounds: 8, minProspects: 8 };
  }

  if (tier === 2) {
    return { minTeams: 10, minDrivers: 20, minStaff: 30, minCircuits: 10, minRounds: 10, minProspects: 6 };
  }

  if (tier === 3) {
    return { minTeams: 10, minDrivers: 20, minStaff: 32, minCircuits: 10, minRounds: 10, minProspects: 4 };
  }

  return { minTeams: 10, minDrivers: 20, minStaff: 35, minCircuits: 12, minRounds: 12, minProspects: 2 };
}

export function evaluateChampionshipCompleteness(
  input: ChampionshipCompletenessInput,
): ChampionshipCompletenessResult {
  const thresholds = getChampionshipCompletenessThresholds(input.tier);
  const issues: string[] = [];

  addIssue(issues, input.teams, thresholds.minTeams, "teams");
  addIssue(issues, input.drivers, thresholds.minDrivers, "drivers");
  addIssue(issues, input.staff, thresholds.minStaff, "staff");
  addIssue(issues, input.circuits, thresholds.minCircuits, "circuits");
  addIssue(issues, input.rounds, thresholds.minRounds, "rounds");
  addIssue(issues, input.prospects, thresholds.minProspects, "academy prospects");

  if (input.linkedDrivers !== undefined) {
    addIssue(issues, input.linkedDrivers, Math.min(input.drivers, thresholds.minDrivers), "drivers linked to teams");
  }

  if (input.linkedStaff !== undefined) {
    addIssue(issues, input.linkedStaff, Math.min(input.staff, thresholds.minStaff), "staff linked to teams");
  }

  const hasCriticalGap =
    input.teams < thresholds.minTeams ||
    input.drivers < thresholds.minDrivers ||
    input.staff < thresholds.minStaff ||
    input.rounds < thresholds.minRounds ||
    input.circuits < thresholds.minCircuits;

  if (issues.length === 0) {
    return { status: "complete", thresholds, issues };
  }

  return {
    status: hasCriticalGap ? "blocked" : "partial",
    thresholds,
    issues,
  };
}

function addIssue(issues: string[], current: number, minimum: number, label: string) {
  if (current < minimum) {
    issues.push(`${label}: ${current}/${minimum}`);
  }
}
