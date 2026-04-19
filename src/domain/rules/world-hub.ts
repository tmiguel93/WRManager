import type { RegulationWatchItem, TransferRumorItem } from "@/features/world/types";

interface TransferRumorInput {
  driverId: string;
  driverName: string;
  categoryCode: string;
  overall: number;
  potential: number;
  reputation: number;
  marketValue: number;
  seasonPoints: number;
  currentTeamId: string;
  currentTeamName: string;
  currentTeamReputation: number;
  contractEndDate: Date | null;
  destinationTeams: Array<{
    teamId: string;
    teamName: string;
    reputation: number;
  }>;
}

interface RegulationSource {
  ruleSetId: string;
  categoryCode: string;
  ruleSetName: string;
  hasSprint: boolean;
  hasStages: boolean;
  enduranceFlags: boolean;
  weatherSensitivity: number;
  parcFerme: boolean;
  qualifyingFormat: string;
  safetyCarBehavior: string;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function daysBetween(start: Date, end: Date) {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.ceil((end.getTime() - start.getTime()) / msPerDay);
}

export function importanceLabel(importance: number) {
  if (importance >= 85) return "Breaking";
  if (importance >= 70) return "Major";
  if (importance >= 55) return "Notable";
  return "Briefing";
}

export function credibilityLabel(credibility: number) {
  if (credibility >= 84) return "Very strong";
  if (credibility >= 68) return "Strong";
  if (credibility >= 50) return "Developing";
  return "Speculative";
}

export function urgencyLabel(daysUntil: number | null) {
  if (daysUntil === null) return "No deadline";
  if (daysUntil <= 2) return "Immediate";
  if (daysUntil <= 7) return "This week";
  if (daysUntil <= 21) return "Upcoming";
  return "Long range";
}

function transferDestinationScore(input: {
  driverOverall: number;
  driverReputation: number;
  currentTeamReputation: number;
  destinationReputation: number;
}) {
  const stepUp = input.destinationReputation - input.currentTeamReputation;
  const fit = 52 + stepUp * 1.2 + (input.driverOverall - 75) * 0.25 + (input.driverReputation - 72) * 0.2;
  return clamp(Math.round(fit), 1, 100);
}

export function buildTransferRumorCandidates(
  candidates: TransferRumorInput[],
  referenceDate: Date,
  limit = 12,
): TransferRumorItem[] {
  const rumors: TransferRumorItem[] = [];

  for (const candidate of candidates) {
    const daysToExpiry = candidate.contractEndDate ? daysBetween(referenceDate, candidate.contractEndDate) : 365;
    const expiryScore = clamp(Math.round(100 - daysToExpiry * 0.55), 0, 100);
    const performanceScore = clamp(
      Math.round(
        candidate.overall * 0.47 +
          candidate.potential * 0.17 +
          candidate.reputation * 0.17 +
          Math.min(45, candidate.seasonPoints * 1.6) +
          Math.min(10, candidate.marketValue / 12_000_000),
      ),
      1,
      100,
    );
    const tensionScore = clamp(Math.round(candidate.reputation - candidate.currentTeamReputation + 50), 0, 100);

    const rumorScore = clamp(
      Math.round(performanceScore * 0.44 + expiryScore * 0.38 + tensionScore * 0.18),
      1,
      100,
    );

    if (rumorScore < 56) continue;

    const destination = [...candidate.destinationTeams]
      .filter((team) => team.teamId !== candidate.currentTeamId)
      .sort((a, b) => {
        const aScore = transferDestinationScore({
          driverOverall: candidate.overall,
          driverReputation: candidate.reputation,
          currentTeamReputation: candidate.currentTeamReputation,
          destinationReputation: a.reputation,
        });
        const bScore = transferDestinationScore({
          driverOverall: candidate.overall,
          driverReputation: candidate.reputation,
          currentTeamReputation: candidate.currentTeamReputation,
          destinationReputation: b.reputation,
        });
        return bScore - aScore;
      })[0];

    if (!destination) continue;

    const credibility = clamp(
      Math.round(rumorScore * 0.72 + (daysToExpiry < 120 ? 14 : 0) + (candidate.seasonPoints > 0 ? 6 : 0)),
      20,
      97,
    );

    rumors.push({
      id: `${candidate.driverId}:${destination.teamId}`,
      driverId: candidate.driverId,
      driverName: candidate.driverName,
      fromTeamName: candidate.currentTeamName,
      toTeamName: destination.teamName,
      categoryCode: candidate.categoryCode,
      rumorScore,
      credibility,
      headline: `${candidate.driverName} linked with ${destination.teamName}`,
      summary:
        daysToExpiry <= 120
          ? `Contract pressure is rising. Sources suggest ${destination.teamName} is monitoring this deal closely.`
          : `${destination.teamName} is evaluating a long-term approach if performance momentum continues.`,
    });
  }

  return rumors.sort((a, b) => b.credibility - a.credibility).slice(0, limit);
}

export function driverHeatIndex(params: {
  points: number;
  wins: number;
  podiums: number;
  poles: number;
  overall: number;
  reputation: number;
}) {
  const score =
    params.points * 0.9 +
    params.wins * 8 +
    params.podiums * 3.6 +
    params.poles * 2.8 +
    params.overall * 0.24 +
    params.reputation * 0.2;
  return clamp(Math.round(score), 1, 100);
}

export function manufacturerHeatIndex(params: { points: number; wins: number; weatherSensitivity: number }) {
  const score = params.points * 0.88 + params.wins * 9.5 + (100 - params.weatherSensitivity) * 0.12;
  return clamp(Math.round(score), 1, 100);
}

export function buildRegulationWatch(items: RegulationSource[]): RegulationWatchItem[] {
  return items
    .map((item) => {
      let impact = 28;
      const signals: string[] = [];

      if (item.hasSprint) {
        impact += 14;
        signals.push("Sprint weekends amplify volatility");
      }
      if (item.hasStages) {
        impact += 16;
        signals.push("Stage scoring shifts race incentives");
      }
      if (item.enduranceFlags) {
        impact += 18;
        signals.push("Endurance flags increase operational load");
      }
      if (item.weatherSensitivity >= 82) {
        impact += 14;
        signals.push("High weather swing profile");
      }
      if (item.parcFerme) {
        impact += 8;
        signals.push("Parc ferme limits setup recovery");
      }
      if (item.qualifyingFormat.includes("Q1") || item.qualifyingFormat.includes("Hyperpole")) {
        impact += 6;
      }
      if (item.safetyCarBehavior.includes("CAUTION") || item.safetyCarBehavior.includes("YELLOW")) {
        impact += 7;
      }

      return {
        id: item.ruleSetId,
        categoryCode: item.categoryCode,
        title: `${item.ruleSetName} watch`,
        summary: signals.length > 0 ? signals.join(". ") : "Stable rule environment with low systemic volatility.",
        impactScore: clamp(Math.round(impact), 1, 100),
      };
    })
    .sort((a, b) => b.impactScore - a.impactScore)
    .slice(0, 10);
}
