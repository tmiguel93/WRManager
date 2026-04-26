import { getChampionshipCompletenessThresholds } from "@/domain/rules/championship-completeness";

export type RosterCompletenessStatus = "complete" | "partial" | "blocked";

export type RosterCompletenessInput = {
  tier: number;
  teams: number;
  drivers: number;
  staff: number;
  prospects: number;
  linkedDrivers: number;
  linkedStaff: number;
  activeDriverContracts: number;
  activeStaffContracts: number;
  teamsWithDriverGaps: number;
  teamsWithStaffGaps: number;
};

export type RosterCompletenessResult = {
  status: RosterCompletenessStatus;
  issues: string[];
  thresholds: {
    minTeams: number;
    minDrivers: number;
    minStaff: number;
    minProspects: number;
    minLinkedDrivers: number;
    minLinkedStaff: number;
    minActiveDriverContracts: number;
    minActiveStaffContracts: number;
    minDriversPerTeam: number;
    minStaffPerTeam: number;
  };
};

export function evaluateRosterCompleteness(input: RosterCompletenessInput): RosterCompletenessResult {
  const championshipThresholds = getChampionshipCompletenessThresholds(input.tier);
  const thresholds = {
    minTeams: championshipThresholds.minTeams,
    minDrivers: championshipThresholds.minDrivers,
    minStaff: championshipThresholds.minStaff,
    minProspects: championshipThresholds.minProspects,
    minLinkedDrivers: Math.min(input.drivers, championshipThresholds.minDrivers),
    minLinkedStaff: Math.min(input.staff, championshipThresholds.minStaff),
    minActiveDriverContracts: Math.min(input.linkedDrivers, championshipThresholds.minDrivers),
    minActiveStaffContracts: Math.min(input.linkedStaff, championshipThresholds.minStaff),
    minDriversPerTeam: 2,
    minStaffPerTeam: 2,
  };
  const issues: string[] = [];

  addIssue(issues, input.teams, thresholds.minTeams, "teams");
  addIssue(issues, input.drivers, thresholds.minDrivers, "drivers");
  addIssue(issues, input.staff, thresholds.minStaff, "staff");
  addIssue(issues, input.prospects, thresholds.minProspects, "academy prospects");
  addIssue(issues, input.linkedDrivers, thresholds.minLinkedDrivers, "drivers linked to teams");
  addIssue(issues, input.linkedStaff, thresholds.minLinkedStaff, "staff linked to teams");
  addIssue(issues, input.activeDriverContracts, thresholds.minActiveDriverContracts, "active driver contracts");
  addIssue(issues, input.activeStaffContracts, thresholds.minActiveStaffContracts, "active staff contracts");

  if (input.teamsWithDriverGaps > 0) {
    issues.push(`teams below ${thresholds.minDriversPerTeam} drivers: ${input.teamsWithDriverGaps}`);
  }

  if (input.teamsWithStaffGaps > 0) {
    issues.push(`teams below ${thresholds.minStaffPerTeam} staff: ${input.teamsWithStaffGaps}`);
  }

  const hasCriticalGap =
    input.teams < thresholds.minTeams ||
    input.drivers < thresholds.minDrivers ||
    input.staff < thresholds.minStaff ||
    input.linkedDrivers < thresholds.minLinkedDrivers ||
    input.linkedStaff < thresholds.minLinkedStaff ||
    input.activeDriverContracts < thresholds.minActiveDriverContracts ||
    input.activeStaffContracts < thresholds.minActiveStaffContracts;

  if (issues.length === 0) {
    return { status: "complete", issues, thresholds };
  }

  return {
    status: hasCriticalGap ? "blocked" : "partial",
    issues,
    thresholds,
  };
}

function addIssue(issues: string[], current: number, minimum: number, label: string) {
  if (current < minimum) {
    issues.push(`${label}: ${current}/${minimum}`);
  }
}
