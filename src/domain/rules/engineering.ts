import type { ManagerProfileCode, SupplierType } from "@/domain/models/core";

export type DevelopmentArea =
  | "FRONT_WING"
  | "REAR_WING"
  | "UNDERFLOOR"
  | "COOLING"
  | "SUSPENSION"
  | "BRAKE_PACKAGE"
  | "WEIGHT_REDUCTION"
  | "ENERGY_DEPLOYMENT"
  | "TIRE_USAGE_PACKAGE"
  | "OVAL_PACKAGE"
  | "HIGH_DOWNFORCE_PACKAGE"
  | "ENDURANCE_RELIABILITY_PACKAGE";

export interface DevelopmentProjectTemplate {
  code: string;
  name: string;
  area: DevelopmentArea;
  description: string;
  baseCost: number;
  durationWeeks: number;
  risk: number;
  expectedDelta: number;
  compatibleCategoryCodes: string[];
  supplierSynergy: SupplierType[];
}

export interface SupplierEffectInput {
  type: SupplierType;
  performance: number;
  reliability: number;
  efficiency: number;
  drivability: number;
  developmentCeiling: number;
}

export interface FacilityEffectInput {
  code: string;
  level: number;
  maxLevel: number;
  condition: number;
}

export interface CarStatsInput {
  basePerformance: number;
  reliability: number;
  weight: number;
  downforce: number;
  drag: number;
}

export const DEVELOPMENT_PROJECT_TEMPLATES: DevelopmentProjectTemplate[] = [
  {
    code: "FRONT_WING_V2",
    name: "Front Wing Evolution",
    area: "FRONT_WING",
    description: "Improves front-end bite for qualifying and initial turn-in confidence.",
    baseCost: 6_400_000,
    durationWeeks: 6,
    risk: 26,
    expectedDelta: 3,
    compatibleCategoryCodes: ["F1", "F2", "INDYCAR", "WEC_HYPERCAR", "LMGT3"],
    supplierSynergy: ["AERO", "ELECTRONICS", "TELEMETRY"],
  },
  {
    code: "REAR_WING_EFF",
    name: "Rear Wing Efficiency",
    area: "REAR_WING",
    description: "Balances rear stability with better straight-line efficiency.",
    baseCost: 6_100_000,
    durationWeeks: 6,
    risk: 24,
    expectedDelta: 3,
    compatibleCategoryCodes: ["F1", "F2", "INDYCAR", "WEC_HYPERCAR", "LMGT3"],
    supplierSynergy: ["AERO", "TELEMETRY"],
  },
  {
    code: "UNDERFLOOR_LOAD",
    name: "Underfloor Load Package",
    area: "UNDERFLOOR",
    description: "Generates stronger floor downforce and improves long-run balance.",
    baseCost: 8_300_000,
    durationWeeks: 8,
    risk: 31,
    expectedDelta: 4,
    compatibleCategoryCodes: ["F1", "F2", "INDYCAR", "WEC_HYPERCAR", "LMGT3"],
    supplierSynergy: ["AERO", "CHASSIS"],
  },
  {
    code: "COOLING_THERMAL",
    name: "Cooling Thermal Upgrade",
    area: "COOLING",
    description: "Reduces thermal stress and stabilizes pace in high-temperature races.",
    baseCost: 5_700_000,
    durationWeeks: 5,
    risk: 22,
    expectedDelta: 2,
    compatibleCategoryCodes: ["F1", "INDYCAR", "WEC_HYPERCAR", "LMGT3", "NASCAR_CUP"],
    supplierSynergy: ["ENGINE", "FUEL"],
  },
  {
    code: "SUSPENSION_PLATFORM",
    name: "Suspension Platform",
    area: "SUSPENSION",
    description: "Improves kerb handling and traction on mixed-layout circuits.",
    baseCost: 6_000_000,
    durationWeeks: 6,
    risk: 25,
    expectedDelta: 3,
    compatibleCategoryCodes: ["F1", "F2", "INDYCAR", "NASCAR_CUP", "NASCAR_XFINITY", "NASCAR_TRUCK", "LMGT3"],
    supplierSynergy: ["SUSPENSION", "CHASSIS", "TELEMETRY"],
  },
  {
    code: "BRAKE_ENDURANCE",
    name: "Brake Package",
    area: "BRAKE_PACKAGE",
    description: "Boosts braking consistency and late-race reliability under pressure.",
    baseCost: 4_900_000,
    durationWeeks: 5,
    risk: 19,
    expectedDelta: 2,
    compatibleCategoryCodes: ["F1", "F2", "INDYCAR", "NASCAR_CUP", "NASCAR_XFINITY", "NASCAR_TRUCK", "WEC_HYPERCAR", "LMGT3"],
    supplierSynergy: ["BRAKE", "TIRE"],
  },
  {
    code: "WEIGHT_REDUCTION_1",
    name: "Weight Reduction",
    area: "WEIGHT_REDUCTION",
    description: "Removes mass from non-critical systems while maintaining stiffness.",
    baseCost: 7_100_000,
    durationWeeks: 7,
    risk: 35,
    expectedDelta: 4,
    compatibleCategoryCodes: ["F1", "F2", "INDYCAR", "WEC_HYPERCAR", "LMGT3"],
    supplierSynergy: ["CHASSIS", "ELECTRONICS"],
  },
  {
    code: "ENERGY_DEPLOY_26",
    name: "Energy Deployment Package",
    area: "ENERGY_DEPLOYMENT",
    description: "Optimizes hybrid/energy deployment and improves overtaking windows.",
    baseCost: 7_800_000,
    durationWeeks: 7,
    risk: 30,
    expectedDelta: 4,
    compatibleCategoryCodes: ["F1", "INDYCAR", "WEC_HYPERCAR"],
    supplierSynergy: ["ENGINE", "ELECTRONICS", "TELEMETRY"],
  },
  {
    code: "TIRE_USAGE_LONGRUN",
    name: "Tire Usage Package",
    area: "TIRE_USAGE_PACKAGE",
    description: "Improves degradation profile and race-pace stability across stints.",
    baseCost: 5_200_000,
    durationWeeks: 5,
    risk: 21,
    expectedDelta: 2,
    compatibleCategoryCodes: ["F1", "F2", "INDYCAR", "NASCAR_CUP", "NASCAR_XFINITY", "NASCAR_TRUCK", "WEC_HYPERCAR", "LMGT3"],
    supplierSynergy: ["TIRE", "SUSPENSION", "TELEMETRY"],
  },
  {
    code: "OVAL_SPECIALIST",
    name: "Oval Package",
    area: "OVAL_PACKAGE",
    description: "Specialized aero and setup baseline for short and intermediate ovals.",
    baseCost: 6_300_000,
    durationWeeks: 6,
    risk: 27,
    expectedDelta: 3,
    compatibleCategoryCodes: ["INDYCAR", "NASCAR_CUP", "NASCAR_XFINITY", "NASCAR_TRUCK"],
    supplierSynergy: ["ENGINE", "SUSPENSION", "TELEMETRY"],
  },
  {
    code: "HIGH_DF_CITY",
    name: "High-Downforce Package",
    area: "HIGH_DOWNFORCE_PACKAGE",
    description: "Dedicated package for technical sectors and street-circuit load levels.",
    baseCost: 6_800_000,
    durationWeeks: 6,
    risk: 28,
    expectedDelta: 3,
    compatibleCategoryCodes: ["F1", "F2", "INDYCAR", "WEC_HYPERCAR", "LMGT3"],
    supplierSynergy: ["AERO", "TELEMETRY"],
  },
  {
    code: "ENDURANCE_RELIABILITY",
    name: "Endurance Reliability Package",
    area: "ENDURANCE_RELIABILITY_PACKAGE",
    description: "Targets thermal durability and consistent pace for long race windows.",
    baseCost: 8_400_000,
    durationWeeks: 9,
    risk: 33,
    expectedDelta: 5,
    compatibleCategoryCodes: ["WEC_HYPERCAR", "LMGT3"],
    supplierSynergy: ["ENGINE", "TIRE", "FUEL", "TELEMETRY"],
  },
];

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((acc, value) => acc + value, 0) / values.length;
}

function managerEngineeringModifier(profileCode: string) {
  const modifiers: Record<string, { cost: number; duration: number; risk: number; delta: number }> = {
    ENGENHEIRO: { cost: -0.08, duration: -0.12, risk: -5, delta: 2 },
    ESTRATEGISTA: { cost: -0.02, duration: -0.06, risk: -3, delta: 1 },
    NEGOCIADOR: { cost: -0.07, duration: 0, risk: 0, delta: -1 },
    COMERCIAL: { cost: -0.04, duration: 0.02, risk: 1, delta: -1 },
    VISIONARIO: { cost: 0.02, duration: 0.03, risk: 3, delta: 2 },
    FORMADOR: { cost: 0, duration: 0.02, risk: 1, delta: 1 },
    MOTIVADOR: { cost: 0, duration: 0, risk: -1, delta: 0 },
    DIRETOR_GLOBAL: { cost: -0.03, duration: -0.04, risk: -2, delta: 1 },
  };

  return modifiers[profileCode] ?? { cost: 0, duration: 0, risk: 0, delta: 0 };
}

export function listProjectTemplatesForCategory(categoryCode: string) {
  return DEVELOPMENT_PROJECT_TEMPLATES.filter((template) =>
    template.compatibleCategoryCodes.includes(categoryCode),
  );
}

export function getProjectTemplateByCode(templateCode: string) {
  return DEVELOPMENT_PROJECT_TEMPLATES.find((template) => template.code === templateCode) ?? null;
}

export function calculateSupplierPerformancePackage(suppliers: SupplierEffectInput[]) {
  const engine = suppliers.find((supplier) => supplier.type === "ENGINE");
  const tire = suppliers.find((supplier) => supplier.type === "TIRE");
  const supportSuppliers = suppliers.filter(
    (supplier) => supplier.type !== "ENGINE" && supplier.type !== "TIRE",
  );

  const engineScore = engine
    ? engine.performance * 0.46 + engine.efficiency * 0.24 + engine.reliability * 0.18 + engine.drivability * 0.12
    : 66;
  const tireScore = tire
    ? tire.performance * 0.42 + tire.reliability * 0.31 + tire.efficiency * 0.27
    : 66;
  const supportScore =
    supportSuppliers.length > 0
      ? average(
          supportSuppliers.map(
            (supplier) =>
              supplier.performance * 0.4 +
              supplier.reliability * 0.32 +
              supplier.efficiency * 0.2 +
              supplier.drivability * 0.08,
          ),
        )
      : 67;

  const compositeScore = engineScore * 0.46 + tireScore * 0.32 + supportScore * 0.22;
  const performanceDelta = clamp(Math.round((compositeScore - 72) / 3.2), -6, 12);
  const reliabilityDelta = clamp(
    Math.round((average(suppliers.map((supplier) => supplier.reliability)) - 70) / 3.8),
    -5,
    9,
  );
  const developmentSupport = clamp(
    Math.round((average(suppliers.map((supplier) => supplier.developmentCeiling)) - 71) / 3),
    -4,
    10,
  );

  return {
    compositeScore: Math.round(compositeScore),
    performanceDelta,
    reliabilityDelta,
    developmentSupport,
  };
}

export function calculateFacilityEngineeringBonus(facilities: FacilityEffectInput[]) {
  if (facilities.length === 0) {
    return {
      weightedScore: 58,
      levelAverage: 1,
      efficiencyBonus: 0,
      reliabilityBonus: 0,
      developmentPaceBonus: 0,
    };
  }

  const facilityWeights: Record<string, number> = {
    HQ: 0.8,
    FACTORY: 1.3,
    AERO: 1.35,
    SIM_CENTER: 1.1,
    DATA_CENTER: 1.05,
    PIT_TRAINING: 0.7,
    YOUTH_ACADEMY: 0.35,
  };

  const weighted = facilities.map((facility) => {
    const levelRatio = clamp(facility.level / Math.max(1, facility.maxLevel), 0, 1);
    const conditionRatio = clamp(facility.condition / 100, 0.45, 1);
    const weight = facilityWeights[facility.code] ?? 0.8;
    return {
      value: levelRatio * conditionRatio * 100,
      weight,
    };
  });

  const weightedScore =
    weighted.reduce((acc, item) => acc + item.value * item.weight, 0) /
    weighted.reduce((acc, item) => acc + item.weight, 0);

  const levelAverage = average(facilities.map((facility) => facility.level));
  const efficiencyBonus = clamp(Math.round((weightedScore - 56) / 6), -3, 9);
  const reliabilityBonus = clamp(Math.round((weightedScore - 58) / 6.5), -3, 8);
  const developmentPaceBonus = clamp(Math.round((weightedScore - 55) / 4.8), -4, 11);

  return {
    weightedScore: Math.round(weightedScore),
    levelAverage: Number(levelAverage.toFixed(2)),
    efficiencyBonus,
    reliabilityBonus,
    developmentPaceBonus,
  };
}

export function calculateDevelopmentProposal(input: {
  template: DevelopmentProjectTemplate;
  managerProfileCode: ManagerProfileCode | string;
  supplierDevelopmentSupport: number;
  facilityDevelopmentPaceBonus: number;
}) {
  const manager = managerEngineeringModifier(input.managerProfileCode);
  const supportFactor = clamp(
    (input.supplierDevelopmentSupport + input.facilityDevelopmentPaceBonus) / 24,
    -0.28,
    0.24,
  );

  const cost = Math.round(
    input.template.baseCost *
      (1 + manager.cost - supportFactor * 0.45),
  );
  const durationWeeks = clamp(
    Math.round(input.template.durationWeeks * (1 + manager.duration - supportFactor * 0.35)),
    3,
    18,
  );
  const risk = clamp(
    Math.round(
      input.template.risk +
        manager.risk -
        input.facilityDevelopmentPaceBonus * 0.55 -
        input.supplierDevelopmentSupport * 0.3,
    ),
    8,
    78,
  );
  const expectedDelta = clamp(
    Math.round(
      input.template.expectedDelta +
        manager.delta +
        (input.facilityDevelopmentPaceBonus + input.supplierDevelopmentSupport) / 6,
    ),
    1,
    12,
  );

  return {
    cost,
    durationWeeks,
    risk,
    expectedDelta,
  };
}

export function calculateFacilityUpgradeCost(params: {
  baseCost: number;
  currentLevel: number;
  maxLevel: number;
}) {
  if (params.currentLevel >= params.maxLevel) {
    return 0;
  }

  return Math.round(params.baseCost * (0.82 + params.currentLevel * 0.62));
}

export function calculateCarPerformanceEnvelope(input: {
  car: CarStatsInput;
  completedProjectDelta: number;
  supplierPerformanceDelta: number;
  supplierReliabilityDelta: number;
  facilityEfficiencyBonus: number;
  facilityReliabilityBonus: number;
}) {
  const qualifyingPace = clamp(
    Math.round(
      input.car.basePerformance * 0.42 +
        input.car.downforce * 0.31 -
        input.car.drag * 0.12 +
        (760 - input.car.weight) * 0.12 +
        input.completedProjectDelta * 1.6 +
        input.supplierPerformanceDelta * 1.4 +
        input.facilityEfficiencyBonus * 1.1,
    ),
    35,
    99,
  );

  const racePace = clamp(
    Math.round(
      input.car.basePerformance * 0.44 +
        input.car.reliability * 0.22 +
        input.car.downforce * 0.2 -
        input.car.drag * 0.08 +
        input.completedProjectDelta * 1.3 +
        input.supplierPerformanceDelta * 1.1 +
        input.facilityEfficiencyBonus * 1.2,
    ),
    35,
    99,
  );

  const reliabilityIndex = clamp(
    Math.round(
      input.car.reliability +
        input.supplierReliabilityDelta * 1.4 +
        input.facilityReliabilityBonus * 1.3 +
        input.completedProjectDelta * 0.45,
    ),
    35,
    99,
  );

  const developmentVelocity = clamp(
    Math.round(
      55 +
        input.facilityEfficiencyBonus * 2.2 +
        input.facilityReliabilityBonus * 1.4 +
        input.supplierPerformanceDelta * 1.2,
    ),
    25,
    99,
  );

  const overallIndex = clamp(
    Math.round(qualifyingPace * 0.34 + racePace * 0.42 + reliabilityIndex * 0.24),
    30,
    99,
  );

  return {
    qualifyingPace,
    racePace,
    reliabilityIndex,
    developmentVelocity,
    overallIndex,
  };
}

export function calculateRealizedProjectDelta(input: {
  expectedDelta: number;
  hiddenVariance: number;
  facilityDevelopmentPaceBonus: number;
}) {
  return clamp(
    Math.round(input.expectedDelta + input.hiddenVariance + input.facilityDevelopmentPaceBonus * 0.18),
    -3,
    16,
  );
}

export function applyProjectDeltaToCar(input: {
  car: CarStatsInput;
  area: DevelopmentArea;
  realizedDelta: number;
}) {
  const delta = input.realizedDelta;
  const next = {
    basePerformance: input.car.basePerformance,
    reliability: input.car.reliability,
    weight: input.car.weight,
    downforce: input.car.downforce,
    drag: input.car.drag,
  };

  switch (input.area) {
    case "FRONT_WING":
      next.downforce += Math.round(delta * 1.2);
      next.basePerformance += Math.round(delta * 0.7);
      break;
    case "REAR_WING":
      next.downforce += Math.round(delta * 1.1);
      next.drag += Math.round(delta * 0.4);
      next.basePerformance += Math.round(delta * 0.6);
      break;
    case "UNDERFLOOR":
      next.downforce += Math.round(delta * 1.4);
      next.basePerformance += Math.round(delta * 0.8);
      break;
    case "COOLING":
      next.reliability += Math.round(delta * 1.2);
      next.basePerformance += Math.round(delta * 0.2);
      break;
    case "SUSPENSION":
      next.basePerformance += Math.round(delta * 0.7);
      next.reliability += Math.round(delta * 0.35);
      break;
    case "BRAKE_PACKAGE":
      next.reliability += Math.round(delta * 1.1);
      break;
    case "WEIGHT_REDUCTION":
      next.weight -= Math.round(delta * 2.2);
      next.basePerformance += Math.round(delta * 0.9);
      break;
    case "ENERGY_DEPLOYMENT":
      next.basePerformance += Math.round(delta * 1.1);
      next.reliability += Math.round(delta * 0.4);
      break;
    case "TIRE_USAGE_PACKAGE":
      next.reliability += Math.round(delta * 0.9);
      next.basePerformance += Math.round(delta * 0.4);
      break;
    case "OVAL_PACKAGE":
      next.basePerformance += Math.round(delta * 0.8);
      next.drag -= Math.round(delta * 0.3);
      break;
    case "HIGH_DOWNFORCE_PACKAGE":
      next.downforce += Math.round(delta * 1.5);
      next.drag += Math.round(delta * 0.5);
      next.basePerformance += Math.round(delta * 0.5);
      break;
    case "ENDURANCE_RELIABILITY_PACKAGE":
      next.reliability += Math.round(delta * 1.5);
      next.basePerformance += Math.round(delta * 0.5);
      break;
    default:
      break;
  }

  return {
    basePerformance: clamp(next.basePerformance, 35, 99),
    reliability: clamp(next.reliability, 35, 99),
    weight: clamp(next.weight, 620, 900),
    downforce: clamp(next.downforce, 35, 99),
    drag: clamp(next.drag, 20, 99),
  };
}
