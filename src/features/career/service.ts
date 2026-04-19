import "server-only";

import type { Prisma } from "@prisma/client";

import { computeStartingBudget } from "@/domain/rules/starting-budget";
import { prisma } from "@/persistence/prisma";
import { createCareerSchema, type CreateCareerInput } from "@/features/career/schema";
import type { CreatedCareerResult } from "@/features/career/types";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function randomSuffix() {
  return Math.random().toString(36).slice(2, 7);
}

async function getOrCreateDefaultProfile(tx: Prisma.TransactionClient) {
  const profile = await tx.profile.findFirst({
    orderBy: { createdAt: "asc" },
  });

  if (profile) {
    return profile;
  }

  return tx.profile.create({
    data: {
      displayName: "Commissioner",
      locale: "en-US",
      currency: "USD",
    },
  });
}

async function createMyTeamProgram(tx: Prisma.TransactionClient, input: CreateCareerInput) {
  const category = await tx.category.findUnique({
    where: { id: input.categoryId },
  });

  if (!category) {
    throw new Error("Selected category not found.");
  }

  const engineSupplier = await tx.supplier.findFirst({
    where: {
      id: input.startingSupplierId,
      type: "ENGINE",
      categories: {
        some: {
          categoryId: category.id,
        },
      },
    },
  });

  if (!engineSupplier) {
    throw new Error("The selected power unit is not compatible with this category.");
  }

  const teamBudget = computeStartingBudget({
    mode: "MY_TEAM",
    managerProfileCode: input.managerProfileCode,
    requestedBudget: input.requestedBudget,
    categoryTier: category.tier,
    categoryCode: category.code,
    isExistingTeam: false,
  });

  const team = await tx.team.create({
    data: {
      categoryId: category.id,
      name: input.myTeamName!.trim(),
      shortName: input.myTeamShortName!.trim().toUpperCase(),
      slug: `${slugify(input.myTeamName!)}-${randomSuffix()}`,
      countryCode: input.myTeamCountryCode!.trim().toUpperCase(),
      headquarters: input.myTeamHeadquarters!.trim(),
      budget: teamBudget,
      reputation: 52,
      fanbase: 34,
      history: `${input.myTeamName} joined the world motorsport ecosystem in 2026.`,
      primaryColor: input.myTeamPrimaryColor ?? "#0ea5e9",
      secondaryColor: input.myTeamSecondaryColor ?? "#facc15",
      accentColor: input.myTeamAccentColor ?? input.myTeamSecondaryColor ?? "#22d3ee",
      philosophy: input.myTeamPhilosophy!.trim(),
      manufacturerName: engineSupplier.name,
      isCustom: true,
    },
  });

  await tx.teamHistory.create({
    data: {
      teamId: team.id,
      seasonYear: 2026,
      summary: "Expansion team entering debut season with a staged onboarding plan.",
    },
  });

  const facilities = await tx.facility.findMany();
  if (facilities.length > 0) {
    await tx.teamFacility.createMany({
      data: facilities.map((facility) => ({
        teamId: team.id,
        facilityId: facility.id,
        level: 1,
        condition: 82,
      })),
    });
  }

  const newCar = await tx.car.create({
    data: {
      teamId: team.id,
      categoryId: category.id,
      modelName: `${team.shortName}-26`,
      seasonYear: 2026,
      basePerformance: 65,
      reliability: 72,
      weight: 725,
      downforce: 66,
      drag: 61,
    },
  });

  await tx.carSpec.createMany({
    data: [
      { carId: newCar.id, key: "front_wing", value: 2, unit: "tier", source: "my-team-init" },
      { carId: newCar.id, key: "rear_wing", value: 2, unit: "tier", source: "my-team-init" },
      { carId: newCar.id, key: "underfloor", value: 2, unit: "tier", source: "my-team-init" },
    ],
  });

  const tireSupplier = await tx.supplier.findFirst({
    where: {
      type: "TIRE",
      categories: {
        some: {
          categoryId: category.id,
        },
      },
    },
    orderBy: [{ performance: "desc" }, { reliability: "desc" }],
  });

  await tx.supplierContract.create({
    data: {
      teamId: team.id,
      supplierId: engineSupplier.id,
      startDate: new Date(Date.UTC(2026, 0, 1)),
      endDate: new Date(Date.UTC(2026, 11, 31)),
      annualCost: Math.round(engineSupplier.baseCost * 0.86),
      clauses: { scope: "powertrain", launchDeal: true },
    },
  });

  if (tireSupplier) {
    await tx.supplierContract.create({
      data: {
        teamId: team.id,
        supplierId: tireSupplier.id,
        startDate: new Date(Date.UTC(2026, 0, 1)),
        endDate: new Date(Date.UTC(2026, 11, 31)),
        annualCost: Math.round(tireSupplier.baseCost * 0.9),
        clauses: { scope: "tires" },
      },
    });
  }

  await tx.teamContract.create({
    data: {
      teamId: team.id,
      title: "Launch Investor Package",
      details: "Founding capital package for first championship cycle.",
      annualValue: 11_000_000,
      startDate: new Date(Date.UTC(2026, 0, 1)),
      endDate: new Date(Date.UTC(2027, 0, 1)),
      clauses: { performanceReview: "Top 12 finish target" },
    },
  });

  return { teamId: team.id, teamBudget };
}

export async function createCareerWithSetup(input: CreateCareerInput): Promise<CreatedCareerResult> {
  const parsed = createCareerSchema.parse(input);

  return prisma.$transaction(async (tx) => {
    const profile = await getOrCreateDefaultProfile(tx);
    const selectedCategory = await tx.category.findUnique({
      where: { id: parsed.categoryId },
    });

    if (!selectedCategory) {
      throw new Error("Category not found.");
    }

    if (selectedCategory.tier > 2) {
      throw new Error("Top-tier categories are locked at career start. Progress from feeder tiers first.");
    }

    let selectedTeamId: string | null = parsed.selectedTeamId ?? null;
    let cashBalance = computeStartingBudget({
      mode: parsed.mode,
      managerProfileCode: parsed.managerProfileCode,
      requestedBudget: parsed.requestedBudget,
      categoryTier: selectedCategory.tier,
      categoryCode: selectedCategory.code,
      isExistingTeam: parsed.mode === "TEAM_PRINCIPAL",
    });

    if (parsed.mode === "TEAM_PRINCIPAL") {
      const selectedTeam = await tx.team.findUnique({
        where: { id: parsed.selectedTeamId },
      });

      if (!selectedTeam) {
        throw new Error("Team not found.");
      }
      if (selectedTeam.categoryId !== parsed.categoryId) {
        throw new Error("Selected team is not part of the chosen category.");
      }

      selectedTeamId = selectedTeam.id;
      cashBalance = Math.max(cashBalance, Math.round(selectedTeam.budget * 0.3));
      cashBalance = computeStartingBudget({
        mode: parsed.mode,
        managerProfileCode: parsed.managerProfileCode,
        categoryTier: selectedCategory.tier,
        categoryCode: selectedCategory.code,
        teamReputation: selectedTeam.reputation,
        isExistingTeam: true,
      });
    }

    if (parsed.mode === "MY_TEAM") {
      const myTeam = await createMyTeamProgram(tx, parsed);
      selectedTeamId = myTeam.teamId;
      cashBalance = computeStartingBudget({
        mode: parsed.mode,
        managerProfileCode: parsed.managerProfileCode,
        requestedBudget: parsed.requestedBudget,
        categoryTier: selectedCategory.tier,
        categoryCode: selectedCategory.code,
        isExistingTeam: false,
      });
    }

    if (parsed.mode === "GLOBAL" && selectedTeamId) {
      const selectedTeam = await tx.team.findUnique({
        where: { id: selectedTeamId },
      });
      if (!selectedTeam || selectedTeam.categoryId !== parsed.categoryId) {
        throw new Error("Invalid optional starting team for global mode.");
      }
    }

    const initialFoundationSummary =
      parsed.mode === "MY_TEAM"
        ? {
            foundedAtIso: new Date().toISOString(),
            lineupReady: false,
            initialCost: 0,
            mediaExpectation: "Underdog with long-term upside",
            strengths: ["Flexible structure", "Early supplier backing"],
            weaknesses: ["Unproven lineup", "Low category reputation"],
          }
        : undefined;

    const career = await tx.career.create({
      data: {
        profileId: profile.id,
        name: parsed.careerName.trim(),
        mode: parsed.mode,
        managerProfileCode: parsed.managerProfileCode,
        currentSeasonYear: 2026,
        seasonPhase: "PRESEASON",
        selectedCategoryId: parsed.categoryId,
        selectedTeamId,
        cashBalance,
        reputation: parsed.mode === "MY_TEAM" ? 44 : 56,
        onboardingComplete: parsed.mode !== "MY_TEAM",
        ...(initialFoundationSummary ? { foundationSummary: initialFoundationSummary } : {}),
      },
    });

    await tx.transaction.create({
      data: {
        careerId: career.id,
        teamId: selectedTeamId,
        kind: "INITIAL_CAPITAL",
        amount: career.cashBalance,
        description: "Career opening balance for season launch.",
      },
    });

    await tx.saveSlot.create({
      data: {
        profileId: profile.id,
        careerId: career.id,
        name: `${career.name} - Slot 1`,
        manual: false,
        snapshot: {
          version: 1,
          createdAt: new Date().toISOString(),
          careerId: career.id,
          mode: career.mode,
          teamId: selectedTeamId,
          categoryId: career.selectedCategoryId,
        },
      },
    });

    return {
      careerId: career.id,
      mode: career.mode,
      selectedCategoryId: career.selectedCategoryId ?? parsed.categoryId,
      selectedTeamId,
    };
  });
}
