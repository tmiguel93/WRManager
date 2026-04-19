import "server-only";

import { z } from "zod";

import { calculateSponsorOffer, calculateSupplierOffer, type SponsorObjectiveRisk } from "@/domain/rules/commercial-deals";
import { evaluateSponsorContractGuard } from "@/domain/rules/sponsor-contracts";
import { prisma } from "@/persistence/prisma";

const supplierDealSchema = z.object({
  careerId: z.string().min(1),
  teamId: z.string().min(1),
  categoryId: z.string().min(1),
  supplierId: z.string().min(1),
  termYears: z.number().int().min(1).max(3),
});

const sponsorDealSchema = z.object({
  careerId: z.string().min(1),
  teamId: z.string().min(1),
  sponsorId: z.string().min(1),
  objectiveRisk: z.enum(["SAFE", "BALANCED", "AGGRESSIVE"]),
});

type SignSupplierDealInput = z.input<typeof supplierDealSchema>;
type SignSponsorDealInput = z.input<typeof sponsorDealSchema>;

export async function signSupplierDeal(input: SignSupplierDealInput) {
  const parsed = supplierDealSchema.parse(input);

  return prisma.$transaction(async (tx) => {
    const [career, team, supplier] = await Promise.all([
      tx.career.findUnique({ where: { id: parsed.careerId } }),
      tx.team.findUnique({ where: { id: parsed.teamId } }),
      tx.supplier.findFirst({
        where: {
          id: parsed.supplierId,
          categories: {
            some: {
              categoryId: parsed.categoryId,
            },
          },
        },
      }),
    ]);

    if (!career || !team || !supplier) {
      throw new Error("Could not validate supplier deal with current career context.");
    }

    const offer = calculateSupplierOffer({
      supplierType: supplier.type,
      baseCost: supplier.baseCost,
      supplierPrestige: supplier.prestigeImpact,
      teamReputation: team.reputation,
      managerProfileCode: career.managerProfileCode,
      termYears: parsed.termYears,
    });

    if (career.cashBalance < offer.signingFee) {
      throw new Error("Insufficient cash balance for this supplier signing fee.");
    }

    const startDate = new Date();
    const endDate = new Date(Date.UTC(startDate.getUTCFullYear() + offer.termYears, startDate.getUTCMonth(), startDate.getUTCDate()));

    await tx.supplierContract.updateMany({
      where: {
        teamId: parsed.teamId,
        status: "ACTIVE",
        supplier: { type: supplier.type },
      },
      data: {
        status: "TERMINATED",
        endDate: startDate,
      },
    });

    await tx.supplierContract.create({
      data: {
        teamId: parsed.teamId,
        supplierId: supplier.id,
        startDate,
        endDate,
        annualCost: offer.annualCost,
        clauses: {
          negotiationConfidence: offer.negotiationConfidence,
          contractMultiplier: Number(offer.multiplier.toFixed(3)),
          termYears: offer.termYears,
          supplierType: supplier.type,
        },
      },
    });

    const nextCash = career.cashBalance - offer.signingFee;
    const nextTeamBudget = Math.max(0, team.budget - offer.signingFee);

    await tx.career.update({
      where: { id: career.id },
      data: {
        cashBalance: nextCash,
      },
    });

    await tx.team.update({
      where: { id: team.id },
      data: {
        budget: nextTeamBudget,
      },
    });

    await tx.transaction.create({
      data: {
        careerId: career.id,
        teamId: team.id,
        kind: "SUPPLIER_SIGNING_FEE",
        amount: -offer.signingFee,
        description: `Signed ${supplier.name} (${supplier.type}) for ${offer.termYears} year(s).`,
      },
    });

    return {
      supplierName: supplier.name,
      supplierType: supplier.type,
      annualCost: offer.annualCost,
      signingFee: offer.signingFee,
      termYears: offer.termYears,
      cashBalance: nextCash,
    };
  });
}

export async function signSponsorDeal(input: SignSponsorDealInput) {
  const parsed = sponsorDealSchema.parse(input);

  return prisma.$transaction(async (tx) => {
    const [career, team, sponsor] = await Promise.all([
      tx.career.findUnique({ where: { id: parsed.careerId } }),
      tx.team.findUnique({ where: { id: parsed.teamId } }),
      tx.sponsor.findUnique({ where: { id: parsed.sponsorId } }),
    ]);

    if (!career || !team || !sponsor) {
      throw new Error("Could not validate sponsor deal with current career context.");
    }

    const offer = calculateSponsorOffer({
      baseValue: sponsor.baseValue,
      sponsorConfidence: sponsor.confidence,
      teamReputation: team.reputation,
      managerProfileCode: career.managerProfileCode,
      objectiveRisk: parsed.objectiveRisk as SponsorObjectiveRisk,
      sponsorCountryCode: sponsor.countryCode,
      teamCountryCode: team.countryCode,
    });

    const startDate = new Date();
    const endDate = new Date(Date.UTC(startDate.getUTCFullYear() + 1, startDate.getUTCMonth(), startDate.getUTCDate()));

    const activeContracts = await tx.sponsorContract.findMany({
      where: {
        teamId: team.id,
        status: "ACTIVE",
      },
      select: { sponsorId: true },
    });

    const guard = evaluateSponsorContractGuard({
      sponsorId: sponsor.id,
      activeSponsorIds: activeContracts.map((contract) => contract.sponsorId),
      maxActiveContracts: 3,
    });

    if (!guard.allowed) {
      if (guard.reason === "DUPLICATE_SPONSOR") {
        throw new Error("Sponsor already active with this team. End the current contract before renegotiating.");
      }
      throw new Error("All sponsor slots are already filled. End an active sponsor before signing a new one.");
    }

    await tx.sponsorContract.create({
      data: {
        sponsorId: sponsor.id,
        teamId: team.id,
        startDate,
        endDate,
        fixedValue: offer.fixedValue,
        bonusTargets: offer.bonusTargets,
        confidence: offer.confidence,
        clauses: {
          objectiveRisk: parsed.objectiveRisk,
          reputationalRisk: offer.reputationalRisk,
          multiplier: Number(offer.multiplier.toFixed(3)),
        },
      },
    });

    const nextCash = career.cashBalance + offer.signingAdvance;
    const nextTeamBudget = team.budget + offer.signingAdvance;

    await tx.career.update({
      where: { id: career.id },
      data: {
        cashBalance: nextCash,
      },
    });

    await tx.team.update({
      where: { id: team.id },
      data: {
        budget: nextTeamBudget,
      },
    });

    await tx.transaction.create({
      data: {
        careerId: career.id,
        teamId: team.id,
        kind: "SPONSOR_SIGNING_ADVANCE",
        amount: offer.signingAdvance,
        description: `Signed sponsor ${sponsor.name} with ${parsed.objectiveRisk.toLowerCase()} targets.`,
      },
    });

    return {
      sponsorName: sponsor.name,
      objectiveRisk: parsed.objectiveRisk,
      fixedValue: offer.fixedValue,
      signingAdvance: offer.signingAdvance,
      confidence: offer.confidence,
      cashBalance: nextCash,
    };
  });
}
