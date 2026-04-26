import { describe, expect, it } from "vitest";

import { evaluateCalendarCompleteness } from "@/domain/rules/calendar-completeness";

describe("calendar completeness validation", () => {
  it("blocks categories with only two calendar events", () => {
    const result = evaluateCalendarCompleteness({
      tier: 2,
      seasonExists: true,
      rounds: 2,
      circuits: 2,
      duplicateRounds: 0,
      duplicateEventKeys: 0,
      missingRoundNumbers: 0,
      missingSourceMetadata: 0,
      invalidDateRanges: 0,
      invalidRoundDateOrder: 0,
      missingRuleSets: 0,
      missingCountryCodes: 0,
      duplicateRaceWeekends: 0,
      orphanRaceWeekends: 0,
    });

    expect(result.status).toBe("blocked");
    expect(result.issues).toContain("rounds: 2/10");
  });

  it("requires enough unique circuits, not only enough events", () => {
    const result = evaluateCalendarCompleteness({
      tier: 4,
      seasonExists: true,
      rounds: 14,
      circuits: 3,
      duplicateRounds: 0,
      duplicateEventKeys: 0,
      missingRoundNumbers: 0,
      missingSourceMetadata: 0,
      invalidDateRanges: 0,
      invalidRoundDateOrder: 0,
      missingRuleSets: 0,
      missingCountryCodes: 0,
      duplicateRaceWeekends: 0,
      orphanRaceWeekends: 0,
    });

    expect(result.status).toBe("blocked");
    expect(result.issues).toContain("unique circuits: 3/12");
  });

  it("blocks duplicate rounds and invalid race weekend links", () => {
    const result = evaluateCalendarCompleteness({
      tier: 1,
      seasonExists: true,
      rounds: 8,
      circuits: 8,
      duplicateRounds: 1,
      duplicateEventKeys: 0,
      missingRoundNumbers: 0,
      missingSourceMetadata: 0,
      invalidDateRanges: 0,
      invalidRoundDateOrder: 0,
      missingRuleSets: 0,
      missingCountryCodes: 0,
      duplicateRaceWeekends: 1,
      orphanRaceWeekends: 1,
    });

    expect(result.status).toBe("blocked");
    expect(result.issues).toContain("duplicate rounds: 1");
    expect(result.issues).toContain("duplicate race weekends: 1");
    expect(result.issues).toContain("orphan race weekends: 1");
  });

  it("passes a sourced, sequential and complete calendar", () => {
    const result = evaluateCalendarCompleteness({
      tier: 3,
      seasonExists: true,
      rounds: 10,
      circuits: 10,
      duplicateRounds: 0,
      duplicateEventKeys: 0,
      missingRoundNumbers: 0,
      missingSourceMetadata: 0,
      invalidDateRanges: 0,
      invalidRoundDateOrder: 0,
      missingRuleSets: 0,
      missingCountryCodes: 0,
      duplicateRaceWeekends: 0,
      orphanRaceWeekends: 0,
    });

    expect(result.status).toBe("complete");
    expect(result.issues).toEqual([]);
  });
});
