import type {
  SimulationContextInput,
  SimulationEntityInput,
  SimulationScoreOutput,
} from "@/simulation/core/types";

const trackSuitability: Record<SimulationContextInput["trackType"], number> = {
  STREET: 0.98,
  ROAD: 1,
  OVAL_SHORT: 1.02,
  OVAL_INTERMEDIATE: 1.03,
  SUPERSPEEDWAY: 1.01,
  TECHNICAL: 1.04,
  HIGH_SPEED: 1.02,
  ENDURANCE: 1.03,
  MIXED: 1,
};

function seedToVariance(seed: number) {
  const normalized = Math.sin(seed * 12_989.13) * 43_758.54;
  return normalized - Math.floor(normalized);
}

export function calculatePerformanceScore(
  entity: SimulationEntityInput,
  context: SimulationContextInput,
): SimulationScoreOutput {
  const baseScore =
    entity.driverOverall * 0.25 +
    entity.driverConsistency * 0.1 +
    entity.teamPerformance * 0.2 +
    entity.carPerformance * 0.25 +
    entity.supplierPerformance * 0.1 +
    entity.morale * 0.05 +
    entity.setupConfidence * 0.05;

  const trackFactor = trackSuitability[context.trackType];
  const weatherPenalty = (context.weatherSeverity / 100) * 0.07;
  const trafficPenalty = (context.trafficDensity / 100) * 0.06;
  const categoryFactor = context.categoryModifier;
  const variance = (seedToVariance(context.randomnessSeed) - 0.5) * 6;
  const reliabilityRisk =
    (100 - entity.supplierPerformance) * 0.18 +
    context.weatherSeverity * 0.08 +
    context.trafficDensity * 0.05;

  const adjustedScore =
    baseScore * trackFactor * categoryFactor * (1 - weatherPenalty) * (1 - trafficPenalty) + variance;

  return {
    baseScore: Number(baseScore.toFixed(3)),
    adjustedScore: Number(adjustedScore.toFixed(3)),
    variance: Number(variance.toFixed(3)),
    reliabilityRisk: Number(reliabilityRisk.toFixed(3)),
  };
}
