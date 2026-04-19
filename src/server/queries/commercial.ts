import { calculateSponsorOffer, calculateSupplierOffer } from "@/domain/rules/commercial-deals";
import { prisma } from "@/persistence/prisma";
import { getActiveCareerContext } from "@/server/queries/career";

export async function getSupplierMarketplaceView() {
  const context = await getActiveCareerContext();
  if (!context.teamId || !context.categoryId || !context.careerId) {
    return {
      context,
      activeContracts: [],
      suppliers: [],
    };
  }

  const [activeContracts, suppliers] = await Promise.all([
    prisma.supplierContract.findMany({
      where: {
        teamId: context.teamId,
        status: "ACTIVE",
      },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            type: true,
            performance: true,
            reliability: true,
            efficiency: true,
            drivability: true,
            baseCost: true,
            countryCode: true,
            prestigeImpact: true,
          },
        },
      },
      orderBy: [{ annualCost: "desc" }],
    }),
    prisma.supplier.findMany({
      where: {
        categories: {
          some: {
            categoryId: context.categoryId,
          },
        },
      },
      include: {
        categories: { include: { category: { select: { code: true } } } },
        contracts: {
          where: {
            teamId: context.teamId,
            status: "ACTIVE",
          },
          select: {
            id: true,
            startDate: true,
            endDate: true,
            annualCost: true,
          },
        },
      },
      orderBy: [{ type: "asc" }, { performance: "desc" }, { reliability: "desc" }],
    }),
  ]);

  const activeByType = new Map(activeContracts.map((contract) => [contract.supplier.type, contract]));

  const offers = suppliers.map((supplier) => {
    const preview = calculateSupplierOffer({
      supplierType: supplier.type,
      baseCost: supplier.baseCost,
      supplierPrestige: supplier.prestigeImpact,
      teamReputation: context.teamReputation,
      managerProfileCode: context.managerProfileCode,
      termYears: 2,
    });

    return {
      ...supplier,
      preview,
      currentTypeContract: activeByType.get(supplier.type) ?? null,
      isCurrentSupplier: supplier.contracts.length > 0,
    };
  });

  return {
    context,
    activeContracts,
    suppliers: offers,
  };
}

export async function getSponsorsMarketplaceView() {
  const context = await getActiveCareerContext();
  if (!context.teamId || !context.categoryId || !context.careerId) {
    return {
      context,
      activeContracts: [],
      sponsors: [],
    };
  }

  const [activeContracts, sponsors] = await Promise.all([
    prisma.sponsorContract.findMany({
      where: {
        teamId: context.teamId,
        status: "ACTIVE",
      },
      include: {
        sponsor: {
          select: {
            id: true,
            name: true,
            countryCode: true,
            industry: true,
            confidence: true,
            baseValue: true,
            brandColor: true,
          },
        },
      },
      orderBy: [{ fixedValue: "desc" }],
    }),
    prisma.sponsor.findMany({
      orderBy: [{ baseValue: "desc" }, { confidence: "desc" }],
      include: {
        contracts: {
          where: {
            teamId: context.teamId,
            status: "ACTIVE",
          },
          select: {
            id: true,
            fixedValue: true,
            endDate: true,
          },
        },
      },
    }),
  ]);

  const offers = sponsors.map((sponsor) => {
    const safeOffer = calculateSponsorOffer({
      baseValue: sponsor.baseValue,
      sponsorConfidence: sponsor.confidence,
      teamReputation: context.teamReputation,
      managerProfileCode: context.managerProfileCode,
      objectiveRisk: "BALANCED",
      sponsorCountryCode: sponsor.countryCode,
      teamCountryCode: context.teamCountryCode,
    });

    return {
      ...sponsor,
      preview: safeOffer,
      isActiveWithTeam: sponsor.contracts.length > 0,
    };
  });

  return {
    context,
    activeContracts,
    sponsors: offers,
  };
}
