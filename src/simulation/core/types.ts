import type { TrackType } from "@/domain/models/core";

export interface SimulationEntityInput {
  driverOverall: number;
  driverConsistency: number;
  teamPerformance: number;
  carPerformance: number;
  supplierPerformance: number;
  morale: number;
  setupConfidence: number;
}

export interface SimulationContextInput {
  trackType: TrackType;
  weatherSeverity: number;
  trafficDensity: number;
  categoryModifier: number;
  randomnessSeed: number;
}

export interface SimulationScoreOutput {
  baseScore: number;
  adjustedScore: number;
  variance: number;
  reliabilityRisk: number;
}
