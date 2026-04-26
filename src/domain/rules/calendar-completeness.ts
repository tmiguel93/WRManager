import { getChampionshipCompletenessThresholds } from "@/domain/rules/championship-completeness";

export type CalendarCompletenessStatus = "complete" | "partial" | "blocked";

export type CalendarCompletenessInput = {
  tier: number;
  seasonExists: boolean;
  rounds: number;
  circuits: number;
  duplicateRounds: number;
  duplicateEventKeys: number;
  missingRoundNumbers: number;
  missingSourceMetadata: number;
  invalidDateRanges: number;
  invalidRoundDateOrder: number;
  missingRuleSets: number;
  missingCountryCodes: number;
  duplicateRaceWeekends: number;
  orphanRaceWeekends: number;
};

export type CalendarCompletenessResult = {
  status: CalendarCompletenessStatus;
  issues: string[];
  thresholds: {
    minRounds: number;
    minCircuits: number;
  };
};

export function evaluateCalendarCompleteness(input: CalendarCompletenessInput): CalendarCompletenessResult {
  const championshipThresholds = getChampionshipCompletenessThresholds(input.tier);
  const thresholds = {
    minRounds: championshipThresholds.minRounds,
    minCircuits: championshipThresholds.minCircuits,
  };
  const issues: string[] = [];

  if (!input.seasonExists) {
    issues.push("season: missing");
  }

  addIssue(issues, input.rounds, thresholds.minRounds, "rounds");
  addIssue(issues, input.circuits, thresholds.minCircuits, "unique circuits");
  addZeroIssue(issues, input.duplicateRounds, "duplicate rounds");
  addZeroIssue(issues, input.duplicateEventKeys, "duplicate event keys");
  addZeroIssue(issues, input.missingRoundNumbers, "missing round numbers");
  addZeroIssue(issues, input.missingSourceMetadata, "events missing source metadata");
  addZeroIssue(issues, input.invalidDateRanges, "events with invalid date range");
  addZeroIssue(issues, input.invalidRoundDateOrder, "events out of round date order");
  addZeroIssue(issues, input.missingRuleSets, "events with missing ruleset");
  addZeroIssue(issues, input.missingCountryCodes, "events with missing country code");
  addZeroIssue(issues, input.duplicateRaceWeekends, "duplicate race weekends");
  addZeroIssue(issues, input.orphanRaceWeekends, "orphan race weekends");

  if (issues.length === 0) {
    return { status: "complete", issues, thresholds };
  }

  const hasCriticalGap =
    !input.seasonExists ||
    input.rounds < thresholds.minRounds ||
    input.circuits < thresholds.minCircuits ||
    input.duplicateRounds > 0 ||
    input.missingRoundNumbers > 0 ||
    input.invalidDateRanges > 0 ||
    input.missingRuleSets > 0 ||
    input.duplicateRaceWeekends > 0 ||
    input.orphanRaceWeekends > 0;

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

function addZeroIssue(issues: string[], current: number, label: string) {
  if (current > 0) {
    issues.push(`${label}: ${current}`);
  }
}
