import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

import { evaluateCalendarCompleteness } from "../src/domain/rules/calendar-completeness";

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./prisma/dev.db" });
const prisma = new PrismaClient({ adapter });

async function main() {
  const categories = await prisma.category.findMany({
    orderBy: [{ tier: "asc" }, { code: "asc" }],
    include: {
      ruleSets: {
        select: { code: true },
      },
      seasons: {
        where: { year: 2026 },
        include: {
          events: {
            orderBy: [{ round: "asc" }, { startDate: "asc" }],
            include: {
              raceWeekends: {
                select: { id: true, seasonId: true },
              },
            },
          },
        },
      },
    },
  });

  const rows = categories.map((category) => {
    const season = category.seasons[0] ?? null;
    const events = season?.events ?? [];
    const ruleSetCodes = new Set(category.ruleSets.map((ruleSet) => ruleSet.code));
    const duplicateRounds = countDuplicates(events.map((event) => String(event.round)));
    const duplicateEventKeys = countDuplicates(
      events.map((event) => canonicalKey([event.name, event.circuitName, event.startDate.toISOString().slice(0, 10)])),
    );
    const invalidRoundDateOrder = countRoundDateOrderIssues(events);
    const duplicateRaceWeekends = events.filter((event) => event.raceWeekends.length > 1).length;
    const orphanRaceWeekends = events.reduce(
      (total, event) => total + event.raceWeekends.filter((weekend) => weekend.seasonId !== event.seasonId).length,
      0,
    );
    const result = evaluateCalendarCompleteness({
      tier: category.tier,
      seasonExists: season !== null,
      rounds: events.length,
      circuits: new Set(events.map((event) => canonicalKey([event.circuitName, event.countryCode]))).size,
      duplicateRounds,
      duplicateEventKeys,
      missingRoundNumbers: countMissingRoundNumbers(events.map((event) => event.round)),
      missingSourceMetadata: events.filter(
        (event) => !event.sourceUrl || !event.lastVerifiedAt || event.sourceConfidence < 40,
      ).length,
      invalidDateRanges: events.filter((event) => event.startDate > event.endDate).length,
      invalidRoundDateOrder,
      missingRuleSets: events.filter((event) => !event.ruleSetCode || !ruleSetCodes.has(event.ruleSetCode)).length,
      missingCountryCodes: events.filter((event) => event.countryCode.trim().length !== 2).length,
      duplicateRaceWeekends,
      orphanRaceWeekends,
    });

    return {
      code: category.code,
      tier: category.tier,
      rounds: events.length,
      circuits: new Set(events.map((event) => canonicalKey([event.circuitName, event.countryCode]))).size,
      duplicateRounds,
      duplicateEventKeys,
      missingRoundNumbers: countMissingRoundNumbers(events.map((event) => event.round)),
      missingSources: events.filter((event) => !event.sourceUrl || !event.lastVerifiedAt || event.sourceConfidence < 40)
        .length,
      invalidDates: events.filter((event) => event.startDate > event.endDate).length,
      dateOrderIssues: invalidRoundDateOrder,
      missingRuleSets: events.filter((event) => !event.ruleSetCode || !ruleSetCodes.has(event.ruleSetCode)).length,
      duplicateRaceWeekends,
      orphanRaceWeekends,
      status: result.status,
      issues: result.issues.join("; ") || "ok",
    };
  });

  console.table(rows);
  if (rows.some((row) => row.status !== "complete")) {
    process.exitCode = 1;
  }
}

function countMissingRoundNumbers(rounds: number[]) {
  if (rounds.length === 0) return 0;
  const roundSet = new Set(rounds);
  let missing = 0;
  for (let round = 1; round <= Math.max(...rounds); round += 1) {
    if (!roundSet.has(round)) missing += 1;
  }
  return missing;
}

function countDuplicates(values: string[]) {
  const seen = new Set<string>();
  let duplicates = 0;
  for (const value of values) {
    if (seen.has(value)) {
      duplicates += 1;
    } else {
      seen.add(value);
    }
  }
  return duplicates;
}

function countRoundDateOrderIssues(events: Array<{ round: number; startDate: Date }>) {
  let issues = 0;
  let previousStart: Date | null = null;
  for (const event of [...events].sort((a, b) => a.round - b.round)) {
    if (previousStart && event.startDate < previousStart) {
      issues += 1;
    }
    previousStart = event.startDate;
  }
  return issues;
}

function canonicalKey(parts: Array<string | number | null | undefined>) {
  return parts
    .map((part) => String(part ?? ""))
    .join(" ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
