import "server-only";

import { ContractStatus, ProposalStatus, ProposalTargetType, type Prisma } from "@prisma/client";
import { z } from "zod";

import { calculateSigningCost, resolveProposalOutcome } from "@/domain/rules/negotiation-proposal";
import { evaluateMyTeamLineupRequirements } from "@/domain/rules/onboarding";
import { prisma } from "@/persistence/prisma";

const submitProposalSchema = z.object({
  careerId: z.string().min(1),
  teamId: z.string().min(1),
  targetType: z.enum(["DRIVER", "STAFF"]),
  targetId: z.string().min(1),
  role: z.string().min(2),
  annualSalary: z.number().int().min(100_000),
  bonus: z.number().int().min(0).max(5_000_000),
  durationYears: z.number().int().min(1).max(5),
});

const finalizeOnboardingSchema = z.object({
  careerId: z.string().min(1),
});

type SubmitProposalInput = z.input<typeof submitProposalSchema>;
type FinalizeOnboardingInput = z.input<typeof finalizeOnboardingSchema>;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function contractWindow(durationYears: number) {
  const startDate = new Date();
  const endDate = new Date(
    Date.UTC(startDate.getUTCFullYear() + durationYears, startDate.getUTCMonth(), startDate.getUTCDate()),
  );
  return { startDate, endDate };
}

function createDecisionScore(params: {
  offeredSalary: number;
  expectedSalary: number;
  teamReputation: number;
  managerProfileCode: string;
  targetReputation: number;
}) {
  const salaryRatio = params.offeredSalary / Math.max(1, params.expectedSalary);
  const salaryWeight = clamp(Math.round((salaryRatio - 1) * 95), -40, 40);
  const reputationFit = Math.round((params.teamReputation - params.targetReputation) * 0.45);
  const managerBonus =
    params.managerProfileCode === "NEGOCIADOR" || params.managerProfileCode === "COMERCIAL"
      ? 8
      : params.managerProfileCode === "MOTIVADOR"
        ? 5
        : 0;

  const randomEnvelope = Math.round((Math.random() - 0.5) * 18);
  return 62 + salaryWeight + reputationFit + managerBonus + randomEnvelope;
}

async function assertNoPendingProposal(tx: Prisma.TransactionClient, params: {
  teamId: string;
  targetType: ProposalTargetType;
  targetId: string;
}) {
  const existingPending = await tx.negotiationProposal.findFirst({
    where: {
      teamId: params.teamId,
      targetType: params.targetType,
      status: ProposalStatus.PENDING,
      ...(params.targetType === ProposalTargetType.DRIVER
        ? { driverId: params.targetId }
        : { staffId: params.targetId }),
    },
    select: { id: true },
  });

  if (existingPending) {
    throw new Error("There is already a pending proposal for this target.");
  }
}

export async function submitNegotiationProposal(input: SubmitProposalInput) {
  const parsed = submitProposalSchema.parse(input);

  return prisma.$transaction(async (tx) => {
    const [career, team] = await Promise.all([
      tx.career.findUnique({
        where: { id: parsed.careerId },
        select: {
          id: true,
          cashBalance: true,
          managerProfileCode: true,
          seasonPhase: true,
        },
      }),
      tx.team.findUnique({
        where: { id: parsed.teamId },
        select: {
          id: true,
          reputation: true,
          budget: true,
          categoryId: true,
          name: true,
        },
      }),
    ]);

    if (!career || !team) {
      throw new Error("Career or team context is invalid for this proposal.");
    }

    await assertNoPendingProposal(tx, {
      teamId: team.id,
      targetType: parsed.targetType as ProposalTargetType,
      targetId: parsed.targetId,
    });

    const signingCost = calculateSigningCost(parsed.annualSalary, parsed.bonus);
    if (career.cashBalance < signingCost) {
      throw new Error("Insufficient budget for this proposal.");
    }

    if (parsed.targetType === "DRIVER") {
      const driver = await tx.driver.findUnique({
        where: { id: parsed.targetId },
        select: {
          id: true,
          displayName: true,
          salary: true,
          marketValue: true,
          reputation: true,
          morale: true,
          currentTeamId: true,
          currentCategoryId: true,
          contracts: {
            where: { status: ContractStatus.ACTIVE },
            select: { id: true },
            take: 1,
          },
        },
      });

      if (!driver) {
        throw new Error("Driver not found for proposal.");
      }
      if (driver.currentTeamId || driver.contracts.length > 0) {
        throw new Error("Driver is not eligible right now. Target free agents only.");
      }

      const expectedSalary = Math.max(driver.salary, Math.round(driver.marketValue * 0.14));
      const score = createDecisionScore({
        offeredSalary: parsed.annualSalary,
        expectedSalary,
        teamReputation: team.reputation,
        managerProfileCode: career.managerProfileCode,
        targetReputation: driver.reputation,
      });

      const proposal = await tx.negotiationProposal.create({
        data: {
          careerId: career.id,
          teamId: team.id,
          targetType: ProposalTargetType.DRIVER,
          driverId: driver.id,
          role: parsed.role,
          annualSalary: parsed.annualSalary,
          bonus: parsed.bonus,
          durationYears: parsed.durationYears,
          status: ProposalStatus.PENDING,
          clauses: { expectedSalary },
        },
      });

      const outcome = resolveProposalOutcome(score, { acceptAt: 76, counterAt: 60 });

      if (outcome === "ACCEPTED") {
        const { startDate, endDate } = contractWindow(parsed.durationYears);
        await tx.driverContract.create({
          data: {
            driverId: driver.id,
            teamId: team.id,
            role: parsed.role,
            annualSalary: parsed.annualSalary,
            buyoutClause: parsed.annualSalary * 3,
            bonusWin: Math.round(parsed.bonus * 0.32),
            bonusPodium: Math.round(parsed.bonus * 0.24),
            bonusPole: Math.round(parsed.bonus * 0.18),
            bonusTopTen: Math.round(parsed.bonus * 0.12),
            bonusStageWin: Math.round(parsed.bonus * 0.14),
            startDate,
            endDate,
            status: ContractStatus.ACTIVE,
            clauses: { signedFromProposal: proposal.id },
          },
        });

        await tx.driver.update({
          where: { id: driver.id },
          data: {
            currentTeamId: team.id,
            currentCategoryId: team.categoryId,
            morale: clamp(driver.morale + 5, 35, 99),
          },
        });

        await tx.negotiationProposal.update({
          where: { id: proposal.id },
          data: {
            status: ProposalStatus.ACCEPTED,
            respondedAt: new Date(),
            responseMessage: `${driver.displayName} accepted the offer.`,
          },
        });

        await tx.career.update({
          where: { id: career.id },
          data: { cashBalance: career.cashBalance - signingCost },
        });
        await tx.team.update({
          where: { id: team.id },
          data: { budget: Math.max(0, team.budget - signingCost) },
        });
        await tx.transaction.create({
          data: {
            careerId: career.id,
            teamId: team.id,
            kind: "NEGOTIATION_SIGNING",
            amount: -signingCost,
            description: `Driver signed: ${driver.displayName} (${parsed.role}).`,
          },
        });

        return {
          status: "ACCEPTED" as const,
          message: `${driver.displayName} accepted your proposal.`,
        };
      }

      if (outcome === "COUNTER") {
        const counterAnnualSalary = Math.round(expectedSalary * 1.08);
        await tx.negotiationProposal.update({
          where: { id: proposal.id },
          data: {
            status: ProposalStatus.COUNTER,
            respondedAt: new Date(),
            responseMessage: `${driver.displayName} requested a higher salary.`,
            counterAnnualSalary,
          },
        });
        return {
          status: "COUNTER" as const,
          message: `${driver.displayName} sent a counter-offer (${counterAnnualSalary.toLocaleString("en-US")}/year).`,
        };
      }

      await tx.negotiationProposal.update({
        where: { id: proposal.id },
        data: {
          status: ProposalStatus.REJECTED,
          respondedAt: new Date(),
          responseMessage: `${driver.displayName} rejected the proposal.`,
        },
      });
      return {
        status: "REJECTED" as const,
        message: `${driver.displayName} rejected the proposal.`,
      };
    }

    const staff = await tx.staff.findUnique({
      where: { id: parsed.targetId },
      select: {
        id: true,
        name: true,
        salary: true,
        reputation: true,
        currentTeamId: true,
        contracts: {
          where: { status: ContractStatus.ACTIVE },
          select: { id: true },
          take: 1,
        },
      },
    });

    if (!staff) {
      throw new Error("Staff member not found for proposal.");
    }
    if (staff.currentTeamId || staff.contracts.length > 0) {
      throw new Error("Staff member is not eligible right now. Target free agents only.");
    }

    const expectedSalary = Math.max(staff.salary, Math.round(staff.salary * 1.08));
    const score = createDecisionScore({
      offeredSalary: parsed.annualSalary,
      expectedSalary,
      teamReputation: team.reputation,
      managerProfileCode: career.managerProfileCode,
      targetReputation: staff.reputation,
    });

    const proposal = await tx.negotiationProposal.create({
      data: {
        careerId: career.id,
        teamId: team.id,
        targetType: ProposalTargetType.STAFF,
        staffId: staff.id,
        role: parsed.role,
        annualSalary: parsed.annualSalary,
        bonus: parsed.bonus,
        durationYears: parsed.durationYears,
        status: ProposalStatus.PENDING,
        clauses: { expectedSalary },
      },
    });

    const outcome = resolveProposalOutcome(score, { acceptAt: 74, counterAt: 58 });

    if (outcome === "ACCEPTED") {
      const { startDate, endDate } = contractWindow(parsed.durationYears);
      await tx.staffContract.create({
        data: {
          staffId: staff.id,
          teamId: team.id,
          role: parsed.role,
          annualSalary: parsed.annualSalary,
          bonusObjectives: { signingBonus: parsed.bonus, signedFromProposal: proposal.id },
          startDate,
          endDate,
          status: ContractStatus.ACTIVE,
        },
      });

      await tx.staff.update({
        where: { id: staff.id },
        data: {
          currentTeamId: team.id,
          currentCategoryId: team.categoryId,
        },
      });

      await tx.negotiationProposal.update({
        where: { id: proposal.id },
        data: {
          status: ProposalStatus.ACCEPTED,
          respondedAt: new Date(),
          responseMessage: `${staff.name} accepted the offer.`,
        },
      });

      await tx.career.update({
        where: { id: career.id },
        data: { cashBalance: career.cashBalance - signingCost },
      });
      await tx.team.update({
        where: { id: team.id },
        data: { budget: Math.max(0, team.budget - signingCost) },
      });
      await tx.transaction.create({
        data: {
          careerId: career.id,
          teamId: team.id,
          kind: "NEGOTIATION_SIGNING",
          amount: -signingCost,
          description: `Staff signed: ${staff.name} (${parsed.role}).`,
        },
      });

      return {
        status: "ACCEPTED" as const,
        message: `${staff.name} accepted your proposal.`,
      };
    }

    if (outcome === "COUNTER") {
      const counterAnnualSalary = Math.round(expectedSalary * 1.06);
      await tx.negotiationProposal.update({
        where: { id: proposal.id },
        data: {
          status: ProposalStatus.COUNTER,
          respondedAt: new Date(),
          responseMessage: `${staff.name} requested a salary adjustment.`,
          counterAnnualSalary,
        },
      });

      return {
        status: "COUNTER" as const,
        message: `${staff.name} sent a counter-offer (${counterAnnualSalary.toLocaleString("en-US")}/year).`,
      };
    }

    await tx.negotiationProposal.update({
      where: { id: proposal.id },
      data: {
        status: ProposalStatus.REJECTED,
        respondedAt: new Date(),
        responseMessage: `${staff.name} rejected the proposal.`,
      },
    });

    return {
      status: "REJECTED" as const,
      message: `${staff.name} rejected the proposal.`,
    };
  });
}

export async function finalizeMyTeamOnboarding(input: FinalizeOnboardingInput) {
  const parsed = finalizeOnboardingSchema.parse(input);

  return prisma.$transaction(async (tx) => {
    const career = await tx.career.findUnique({
      where: { id: parsed.careerId },
      select: {
        id: true,
        mode: true,
        selectedTeamId: true,
        onboardingComplete: true,
      },
    });

    if (!career || career.mode !== "MY_TEAM" || !career.selectedTeamId) {
      throw new Error("This onboarding flow is only available for My Team careers.");
    }
    if (career.onboardingComplete) {
      return { ok: true, message: "Onboarding already completed." };
    }

    const [driverContracts, staffContracts, team, avgMorale] = await Promise.all([
      tx.driverContract.findMany({
        where: { teamId: career.selectedTeamId, status: ContractStatus.ACTIVE },
        select: { annualSalary: true, role: true },
      }),
      tx.staffContract.findMany({
        where: { teamId: career.selectedTeamId, status: ContractStatus.ACTIVE },
        select: { annualSalary: true, role: true },
      }),
      tx.team.findUnique({
        where: { id: career.selectedTeamId },
        select: { id: true, name: true, countryCode: true },
      }),
      tx.driver.aggregate({
        where: { currentTeamId: career.selectedTeamId },
        _avg: { morale: true },
      }),
    ]);

    const lineupCheck = evaluateMyTeamLineupRequirements({
      activeDriverCount: driverContracts.length,
      staffRoles: staffContracts.map((contract) => contract.role),
      minimumDrivers: 2,
    });

    if (!lineupCheck.minimumReady) {
      throw new Error(
        "Minimum lineup not complete. Sign at least 2 drivers plus technical and strategy leadership staff.",
      );
    }

    const payroll = [
      ...driverContracts.map((contract) => contract.annualSalary),
      ...staffContracts.map((contract) => contract.annualSalary),
    ].reduce((acc, value) => acc + value, 0);

    const mediaExpectation =
      driverContracts.length >= 3 && staffContracts.length >= 4
        ? "Promising debut with stable structure"
        : "Development year with growth potential";

    await tx.career.update({
      where: { id: career.id },
      data: {
        onboardingComplete: true,
        foundationSummary: {
          foundedAtIso: new Date().toISOString(),
          lineupReady: true,
          contractsClosed: {
            drivers: driverContracts.length,
            staff: staffContracts.length,
          },
          initialCost: payroll,
          morale: Math.round(avgMorale._avg.morale ?? 70),
          mediaExpectation,
          firstSponsor: null,
          strengths: ["Structured lineup", "Defined technical leadership"],
          weaknesses: ["Limited historical data", "Early-stage team chemistry"],
        },
      },
    });

    if (team) {
      await tx.transaction.create({
        data: {
          careerId: career.id,
          teamId: team.id,
          kind: "TEAM_FOUNDATION",
          amount: 0,
          description: `${team.name} foundation phase completed with active lineup.`,
        },
      });
    }

    return {
      ok: true,
      message: "Founding lineup completed. Your team is ready for season start.",
    };
  });
}
