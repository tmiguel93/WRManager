import "server-only";

import { z } from "zod";

import {
  applyProjectDeltaToCar,
  calculateDevelopmentProposal,
  calculateFacilityEngineeringBonus,
  calculateFacilityUpgradeCost,
  calculateRealizedProjectDelta,
  calculateSupplierPerformancePackage,
  getProjectTemplateByCode,
  type DevelopmentArea,
} from "@/domain/rules/engineering";
import { prisma } from "@/persistence/prisma";

const launchProjectSchema = z.object({
  careerId: z.string().min(1),
  teamId: z.string().min(1),
  categoryId: z.string().min(1),
  carId: z.string().min(1),
  templateCode: z.string().min(1),
});

const completeProjectSchema = z.object({
  careerId: z.string().min(1),
  teamId: z.string().min(1),
  projectId: z.string().min(1),
});

const upgradeFacilitySchema = z.object({
  careerId: z.string().min(1),
  teamId: z.string().min(1),
  teamFacilityId: z.string().min(1),
});

type LaunchProjectInput = z.input<typeof launchProjectSchema>;
type CompleteProjectInput = z.input<typeof completeProjectSchema>;
type UpgradeFacilityInput = z.input<typeof upgradeFacilitySchema>;

function randomHiddenVariance(risk: number) {
  const spread = Math.max(1, Math.round(risk / 16));
  return Math.floor(Math.random() * (spread * 2 + 1)) - spread;
}

export async function launchDevelopmentProject(input: LaunchProjectInput) {
  const parsed = launchProjectSchema.parse(input);

  return prisma.$transaction(async (tx) => {
    const [career, team, car, category, activeSuppliers, facilities, inProgressProjects] = await Promise.all([
      tx.career.findUnique({ where: { id: parsed.careerId } }),
      tx.team.findUnique({ where: { id: parsed.teamId } }),
      tx.car.findFirst({
        where: {
          id: parsed.carId,
          teamId: parsed.teamId,
          categoryId: parsed.categoryId,
        },
      }),
      tx.category.findUnique({
        where: { id: parsed.categoryId },
        select: { code: true },
      }),
      tx.supplierContract.findMany({
        where: { teamId: parsed.teamId, status: "ACTIVE" },
        include: {
          supplier: {
            select: {
              type: true,
              performance: true,
              reliability: true,
              efficiency: true,
              drivability: true,
              developmentCeiling: true,
            },
          },
        },
      }),
      tx.teamFacility.findMany({
        where: { teamId: parsed.teamId },
        include: { facility: { select: { code: true, maxLevel: true } } },
      }),
      tx.developmentProject.findMany({
        where: { carId: parsed.carId, status: "IN_PROGRESS" },
      }),
    ]);

    if (!career || !team || !car || !category) {
      throw new Error("Could not validate project launch context.");
    }

    const template = getProjectTemplateByCode(parsed.templateCode);
    if (!template) {
      throw new Error("Unknown development template.");
    }
    if (!template.compatibleCategoryCodes.includes(category.code)) {
      throw new Error("This project is not compatible with the current championship.");
    }

    const projectConflict = inProgressProjects.some((project) => project.area === template.area);
    if (projectConflict) {
      throw new Error("There is already an in-progress project in this development area.");
    }

    const supplierImpact = calculateSupplierPerformancePackage(
      activeSuppliers.map((contract) => ({
        type: contract.supplier.type,
        performance: contract.supplier.performance,
        reliability: contract.supplier.reliability,
        efficiency: contract.supplier.efficiency,
        drivability: contract.supplier.drivability,
        developmentCeiling: contract.supplier.developmentCeiling,
      })),
    );
    const facilityImpact = calculateFacilityEngineeringBonus(
      facilities.map((facility) => ({
        code: facility.facility.code,
        level: facility.level,
        maxLevel: facility.facility.maxLevel,
        condition: facility.condition,
      })),
    );
    const proposal = calculateDevelopmentProposal({
      template,
      managerProfileCode: career.managerProfileCode,
      supplierDevelopmentSupport: supplierImpact.developmentSupport,
      facilityDevelopmentPaceBonus: facilityImpact.developmentPaceBonus,
    });

    if (career.cashBalance < proposal.cost || team.budget < proposal.cost) {
      throw new Error("Insufficient budget for this development project.");
    }

    const now = new Date();
    const project = await tx.developmentProject.create({
      data: {
        carId: car.id,
        categoryId: parsed.categoryId,
        name: template.name,
        area: template.area,
        cost: proposal.cost,
        durationWeeks: proposal.durationWeeks,
        risk: proposal.risk,
        expectedDelta: proposal.expectedDelta,
        hiddenVariance: randomHiddenVariance(proposal.risk),
        status: "IN_PROGRESS",
        startedAt: now,
        compatibility: {
          templateCode: template.code,
          compatibleCategoryCodes: template.compatibleCategoryCodes,
          supplierSynergy: template.supplierSynergy,
        },
      },
    });

    const nextCash = career.cashBalance - proposal.cost;
    const nextBudget = team.budget - proposal.cost;

    await tx.career.update({
      where: { id: career.id },
      data: { cashBalance: nextCash },
    });
    await tx.team.update({
      where: { id: team.id },
      data: { budget: nextBudget },
    });
    await tx.transaction.create({
      data: {
        careerId: career.id,
        teamId: team.id,
        kind: "DEVELOPMENT_PROJECT_START",
        amount: -proposal.cost,
        description: `Started project ${template.name}.`,
      },
    });

    return {
      projectId: project.id,
      name: template.name,
      cost: proposal.cost,
      durationWeeks: proposal.durationWeeks,
      cashBalance: nextCash,
    };
  });
}

export async function completeDevelopmentProject(input: CompleteProjectInput) {
  const parsed = completeProjectSchema.parse(input);

  return prisma.$transaction(async (tx) => {
    const [career, project] = await Promise.all([
      tx.career.findUnique({ where: { id: parsed.careerId } }),
      tx.developmentProject.findUnique({
        where: { id: parsed.projectId },
        include: {
          car: {
            select: {
              id: true,
              teamId: true,
              basePerformance: true,
              reliability: true,
              weight: true,
              downforce: true,
              drag: true,
            },
          },
        },
      }),
    ]);

    if (!career || !project || project.car.teamId !== parsed.teamId) {
      throw new Error("Project completion validation failed.");
    }
    if (project.status !== "IN_PROGRESS") {
      throw new Error("Only in-progress projects can be completed.");
    }

    const facilities = await tx.teamFacility.findMany({
      where: { teamId: parsed.teamId },
      include: { facility: { select: { code: true, maxLevel: true } } },
    });
    const facilityImpact = calculateFacilityEngineeringBonus(
      facilities.map((facility) => ({
        code: facility.facility.code,
        level: facility.level,
        maxLevel: facility.facility.maxLevel,
        condition: facility.condition,
      })),
    );

    const realizedDelta = calculateRealizedProjectDelta({
      expectedDelta: project.expectedDelta,
      hiddenVariance: project.hiddenVariance,
      facilityDevelopmentPaceBonus: facilityImpact.developmentPaceBonus,
    });
    const nextCar = applyProjectDeltaToCar({
      car: {
        basePerformance: project.car.basePerformance,
        reliability: project.car.reliability,
        weight: project.car.weight,
        downforce: project.car.downforce,
        drag: project.car.drag,
      },
      area: project.area as DevelopmentArea,
      realizedDelta,
    });

    await tx.car.update({
      where: { id: project.car.id },
      data: nextCar,
    });

    await tx.carSpec.create({
      data: {
        carId: project.car.id,
        key: `upgrade_${project.area.toLowerCase()}`,
        value: realizedDelta,
        unit: "delta",
        source: `project:${project.id}`,
      },
    });

    await tx.developmentProject.update({
      where: { id: project.id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });

    await tx.transaction.create({
      data: {
        careerId: career.id,
        teamId: parsed.teamId,
        kind: "DEVELOPMENT_PROJECT_COMPLETE",
        amount: 0,
        description: `Completed ${project.name} with delta ${realizedDelta}.`,
      },
    });

    return {
      projectId: project.id,
      name: project.name,
      realizedDelta,
    };
  });
}

export async function upgradeTeamFacility(input: UpgradeFacilityInput) {
  const parsed = upgradeFacilitySchema.parse(input);

  return prisma.$transaction(async (tx) => {
    const [career, team, teamFacility] = await Promise.all([
      tx.career.findUnique({ where: { id: parsed.careerId } }),
      tx.team.findUnique({ where: { id: parsed.teamId } }),
      tx.teamFacility.findUnique({
        where: { id: parsed.teamFacilityId },
        include: {
          facility: true,
        },
      }),
    ]);

    if (!career || !team || !teamFacility || teamFacility.teamId !== parsed.teamId) {
      throw new Error("Could not validate facility upgrade request.");
    }
    if (teamFacility.level >= teamFacility.facility.maxLevel) {
      throw new Error("Facility is already at max level.");
    }

    const upgradeCost = calculateFacilityUpgradeCost({
      baseCost: teamFacility.facility.baseCost,
      currentLevel: teamFacility.level,
      maxLevel: teamFacility.facility.maxLevel,
    });

    if (career.cashBalance < upgradeCost || team.budget < upgradeCost) {
      throw new Error("Insufficient funds for facility upgrade.");
    }

    await tx.teamFacility.update({
      where: { id: teamFacility.id },
      data: {
        level: { increment: 1 },
        condition: Math.min(100, teamFacility.condition + 10),
      },
    });

    const nextCash = career.cashBalance - upgradeCost;
    const nextBudget = team.budget - upgradeCost;

    await tx.career.update({
      where: { id: career.id },
      data: { cashBalance: nextCash },
    });
    await tx.team.update({
      where: { id: team.id },
      data: { budget: nextBudget },
    });
    await tx.transaction.create({
      data: {
        careerId: career.id,
        teamId: team.id,
        kind: "FACILITY_UPGRADE",
        amount: -upgradeCost,
        description: `Upgraded ${teamFacility.facility.name} to level ${teamFacility.level + 1}.`,
      },
    });

    return {
      facilityName: teamFacility.facility.name,
      nextLevel: teamFacility.level + 1,
      cost: upgradeCost,
      cashBalance: nextCash,
    };
  });
}
