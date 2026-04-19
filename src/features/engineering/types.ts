import type { DevelopmentArea } from "@/domain/rules/engineering";

export type DevelopmentProjectStatus = "AVAILABLE" | "IN_PROGRESS" | "COMPLETED";

export interface EngineeringKpiPack {
  overallIndex: number;
  qualifyingPace: number;
  racePace: number;
  reliabilityIndex: number;
  developmentVelocity: number;
}

export interface EngineeringFacilityRow {
  id: string;
  code: string;
  name: string;
  description: string;
  baseCost: number;
  maxLevel: number;
  level: number;
  condition: number;
  upgradeCost: number;
}

export interface EngineeringSupplierRow {
  id: string;
  name: string;
  type: string;
  performance: number;
  reliability: number;
  efficiency: number;
  drivability: number;
  developmentCeiling: number;
  countryCode: string;
}

export interface EngineeringProjectRow {
  id: string;
  templateCode: string;
  name: string;
  area: DevelopmentArea;
  description: string;
  status: DevelopmentProjectStatus;
  cost: number;
  durationWeeks: number;
  risk: number;
  expectedDelta: number;
  hiddenVariance: number;
  startedAtIso: string | null;
  completedAtIso: string | null;
  canStart: boolean;
  canComplete: boolean;
}

export interface EngineeringCarView {
  id: string;
  modelName: string;
  seasonYear: number;
  basePerformance: number;
  reliability: number;
  weight: number;
  downforce: number;
  drag: number;
}

export interface EngineeringCenterView {
  context: {
    careerId: string | null;
    teamId: string | null;
    categoryId: string | null;
    categoryCode: string;
    teamName: string;
    cashBalance: number;
    managerProfileCode: string;
  };
  car: EngineeringCarView | null;
  kpis: EngineeringKpiPack | null;
  supplierImpact: {
    compositeScore: number;
    performanceDelta: number;
    reliabilityDelta: number;
    developmentSupport: number;
  };
  facilityImpact: {
    weightedScore: number;
    levelAverage: number;
    efficiencyBonus: number;
    reliabilityBonus: number;
    developmentPaceBonus: number;
  };
  suppliers: EngineeringSupplierRow[];
  facilities: EngineeringFacilityRow[];
  projects: EngineeringProjectRow[];
}
