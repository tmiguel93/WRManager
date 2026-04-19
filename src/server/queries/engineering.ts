import {
  calculateCarPerformanceEnvelope,
  calculateDevelopmentProposal,
  calculateFacilityEngineeringBonus,
  calculateFacilityUpgradeCost,
  calculateSupplierPerformancePackage,
  listProjectTemplatesForCategory,
} from "@/domain/rules/engineering";
import { prisma } from "@/persistence/prisma";
import type { DevelopmentProjectStatus, EngineeringCenterView } from "@/features/engineering/types";
import { getActiveCareerContext } from "@/server/queries/career";

function normalizeProjectStatus(status: string): DevelopmentProjectStatus {
  if (status === "COMPLETED") return "COMPLETED";
  if (status === "IN_PROGRESS") return "IN_PROGRESS";
  return "AVAILABLE";
}

function extractTemplateCodeFromCompatibility(value: unknown): string | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const maybeTemplateCode = (value as Record<string, unknown>).templateCode;
  return typeof maybeTemplateCode === "string" ? maybeTemplateCode : null;
}

export async function getEngineeringCenterView(): Promise<EngineeringCenterView> {
  const context = await getActiveCareerContext();

  if (!context.careerId || !context.teamId || !context.categoryId) {
    return {
      context: {
        careerId: context.careerId,
        teamId: context.teamId,
        categoryId: context.categoryId,
        categoryCode: context.categoryCode,
        teamName: context.teamName,
        cashBalance: context.cashBalance,
        managerProfileCode: context.managerProfileCode,
      },
      car: null,
      kpis: null,
      suppliers: [],
      facilities: [],
      projects: [],
      supplierImpact: {
        compositeScore: 60,
        performanceDelta: 0,
        reliabilityDelta: 0,
        developmentSupport: 0,
      },
      facilityImpact: {
        weightedScore: 58,
        levelAverage: 1,
        efficiencyBonus: 0,
        reliabilityBonus: 0,
        developmentPaceBonus: 0,
      },
    };
  }

  const team = await prisma.team.findUnique({
    where: { id: context.teamId },
    include: {
      cars: {
        where: { categoryId: context.categoryId },
        orderBy: [{ seasonYear: "desc" }],
        take: 1,
        include: {
          projects: {
            orderBy: [{ startedAt: "desc" }, { id: "desc" }],
          },
        },
      },
      supplierContracts: {
        where: { status: "ACTIVE" },
        orderBy: [{ annualCost: "desc" }],
        include: {
          supplier: {
            select: {
              id: true,
              name: true,
              type: true,
              countryCode: true,
              performance: true,
              reliability: true,
              efficiency: true,
              drivability: true,
              developmentCeiling: true,
            },
          },
        },
      },
      facilities: {
        include: {
          facility: {
            select: {
              id: true,
              code: true,
              name: true,
              description: true,
              baseCost: true,
              maxLevel: true,
            },
          },
        },
        orderBy: [{ level: "desc" }, { condition: "desc" }],
      },
    },
  });

  const car = team?.cars[0] ?? null;
  const suppliers = (team?.supplierContracts ?? []).map((contract) => contract.supplier);
  const facilities = team?.facilities ?? [];

  const supplierImpact = calculateSupplierPerformancePackage(
    suppliers.map((supplier) => ({
      type: supplier.type,
      performance: supplier.performance,
      reliability: supplier.reliability,
      efficiency: supplier.efficiency,
      drivability: supplier.drivability,
      developmentCeiling: supplier.developmentCeiling,
    })),
  );
  const facilityImpact = calculateFacilityEngineeringBonus(
    facilities.map((row) => ({
      code: row.facility.code,
      level: row.level,
      maxLevel: row.facility.maxLevel,
      condition: row.condition,
    })),
  );

  const kpis = car
    ? calculateCarPerformanceEnvelope({
        car: {
          basePerformance: car.basePerformance,
          reliability: car.reliability,
          weight: car.weight,
          downforce: car.downforce,
          drag: car.drag,
        },
        completedProjectDelta: 0,
        supplierPerformanceDelta: supplierImpact.performanceDelta,
        supplierReliabilityDelta: supplierImpact.reliabilityDelta,
        facilityEfficiencyBonus: facilityImpact.efficiencyBonus,
        facilityReliabilityBonus: facilityImpact.reliabilityBonus,
      })
    : null;

  const templates = listProjectTemplatesForCategory(context.categoryCode);
  const carProjects = car?.projects ?? [];
  type CarProjectRow = (typeof carProjects)[number];
  const latestByTemplate = new Map<string, CarProjectRow>();

  for (const project of carProjects) {
    const templateCode = extractTemplateCodeFromCompatibility(project.compatibility) ?? project.name;
    if (!latestByTemplate.has(templateCode)) {
      latestByTemplate.set(templateCode, project);
    }
  }

  const projects = templates.map((template) => {
    const existing = latestByTemplate.get(template.code) ?? null;

    if (existing) {
      const status = normalizeProjectStatus(existing.status);
      return {
        id: existing.id,
        templateCode: template.code,
        name: existing.name,
        area: existing.area as typeof template.area,
        description: template.description,
        status,
        cost: existing.cost,
        durationWeeks: existing.durationWeeks,
        risk: existing.risk,
        expectedDelta: existing.expectedDelta,
        hiddenVariance: existing.hiddenVariance,
        startedAtIso: existing.startedAt?.toISOString() ?? null,
        completedAtIso: existing.completedAt?.toISOString() ?? null,
        canStart: false,
        canComplete: status === "IN_PROGRESS",
      };
    }

    const proposal = calculateDevelopmentProposal({
      template,
      managerProfileCode: context.managerProfileCode,
      supplierDevelopmentSupport: supplierImpact.developmentSupport,
      facilityDevelopmentPaceBonus: facilityImpact.developmentPaceBonus,
    });

    return {
      id: `template:${template.code}`,
      templateCode: template.code,
      name: template.name,
      area: template.area,
      description: template.description,
      status: "AVAILABLE" as const,
      cost: proposal.cost,
      durationWeeks: proposal.durationWeeks,
      risk: proposal.risk,
      expectedDelta: proposal.expectedDelta,
      hiddenVariance: 0,
      startedAtIso: null,
      completedAtIso: null,
      canStart: Boolean(car),
      canComplete: false,
    };
  });

  return {
    context: {
      careerId: context.careerId,
      teamId: context.teamId,
      categoryId: context.categoryId,
      categoryCode: context.categoryCode,
      teamName: context.teamName,
      cashBalance: context.cashBalance,
      managerProfileCode: context.managerProfileCode,
    },
    car: car
      ? {
          id: car.id,
          modelName: car.modelName,
          seasonYear: car.seasonYear,
          basePerformance: car.basePerformance,
          reliability: car.reliability,
          weight: car.weight,
          downforce: car.downforce,
          drag: car.drag,
        }
      : null,
    kpis,
    suppliers: suppliers.map((supplier) => ({
      id: supplier.id,
      name: supplier.name,
      type: supplier.type,
      performance: supplier.performance,
      reliability: supplier.reliability,
      efficiency: supplier.efficiency,
      drivability: supplier.drivability,
      developmentCeiling: supplier.developmentCeiling,
      countryCode: supplier.countryCode,
    })),
    facilities: facilities.map((facility) => ({
      id: facility.id,
      code: facility.facility.code,
      name: facility.facility.name,
      description: facility.facility.description,
      baseCost: facility.facility.baseCost,
      maxLevel: facility.facility.maxLevel,
      level: facility.level,
      condition: facility.condition,
      upgradeCost: calculateFacilityUpgradeCost({
        baseCost: facility.facility.baseCost,
        currentLevel: facility.level,
        maxLevel: facility.facility.maxLevel,
      }),
    })),
    projects,
    supplierImpact,
    facilityImpact,
  };
}
