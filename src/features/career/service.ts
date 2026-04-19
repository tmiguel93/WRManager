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

  const team = await tx.team.create({
    data: {
      categoryId: category.id,
      name: input.myTeamName!.trim(),
      shortName: input.myTeamShortName!.trim().toUpperCase(),
      slug: `${slugify(input.myTeamName!)}-${randomSuffix()}`,
      countryCode: input.myTeamCountryCode!.trim().toUpperCase(),
      headquarters: input.myTeamHeadquarters!.trim(),
      budget: computeStartingBudget({
        mode: "MY_TEAM",
        managerProfileCode: input.managerProfileCode,
        requestedBudget: input.requestedBudget,
      }),
      reputation: 52,
      fanbase: 34,
      history: `${input.myTeamName} joined the world motorsport ecosystem in 2026.`,
      primaryColor: input.myTeamPrimaryColor ?? "#0ea5e9",
      secondaryColor: input.myTeamSecondaryColor ?? "#facc15",
      philosophy: input.myTeamPhilosophy!.trim(),
      manufacturerName: engineSupplier.name,
    },
  });

  await tx.teamHistory.create({
    data: {
      teamId: team.id,
      seasonYear: 2026,
      summary: "Expansion team entering debut season.",
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

  const launchSponsor = await tx.sponsor.findFirst({
    orderBy: { baseValue: "desc" },
  });

  if (launchSponsor) {
    await tx.sponsorContract.create({
      data: {
        sponsorId: launchSponsor.id,
        teamId: team.id,
        startDate: new Date(Date.UTC(2026, 0, 1)),
        endDate: new Date(Date.UTC(2027, 0, 1)),
        fixedValue: Math.round(launchSponsor.baseValue * 0.55),
        confidence: 65,
        bonusTargets: { top10: 90_000, podium: 250_000 },
      },
    });
  }

  const rookieNames = [
    [`${team.shortName} Lead`, "Driver"],
    [`${team.shortName} Prospect`, "Driver"],
  ] as const;

  for (const [index, nameParts] of rookieNames.entries()) {
    const [firstName, lastName] = nameParts;
    const driver = await tx.driver.create({
      data: {
        firstName,
        lastName,
        displayName: `${firstName} ${lastName}`,
        countryCode: team.countryCode,
        birthDate: new Date(Date.UTC(2001 + index, 5, 12 + index)),
        overall: index === 0 ? 73 : 69,
        potential: index === 0 ? 86 : 89,
        reputation: index === 0 ? 57 : 51,
        marketValue: 3_800_000 + index * 400_000,
        salary: 850_000 + index * 120_000,
        morale: 74,
        personality: index === 0 ? "Leader" : "Rookie",
        preferredDisciplines: [category.code],
        attributes: {
          purePace: 71 + index * 2,
          consistency: 68 + index,
          qualifying: 70 + index * 2,
          launch: 65,
          defense: 64,
          overtaking: 69,
          aggression: 60,
          emotionalControl: 67,
          wetWeather: 66,
          technicalFeedback: 70,
          tireManagement: 67,
          fuelSaving: 65,
          strategyIQ: 63,
          trafficAdaptation: 66,
          ovalAdaptation: 60,
          streetAdaptation: 68,
          roadCourseAdaptation: 67,
          enduranceAdaptation: 64,
        },
        currentCategoryId: category.id,
        currentTeamId: team.id,
      },
    });

    await tx.driverContract.create({
      data: {
        driverId: driver.id,
        teamId: team.id,
        role: index === 0 ? "Lead Driver" : "Race Driver",
        annualSalary: driver.salary,
        buyoutClause: driver.salary * 4,
        bonusWin: 150_000,
        bonusPodium: 90_000,
        bonusPole: 60_000,
        bonusTopTen: 40_000,
        startDate: new Date(Date.UTC(2026, 0, 1)),
        endDate: new Date(Date.UTC(2028, 0, 1)),
        clauses: { academyPromotion: index === 1 },
      },
    });
  }

  const staffProfiles = [
    { name: `${team.shortName} Tech Director`, role: "Technical Director", specialty: "Aero" },
    { name: `${team.shortName} Strategy Lead`, role: "Head of Strategy", specialty: "Pit Wall" },
  ];

  for (const [index, staffProfile] of staffProfiles.entries()) {
    const staff = await tx.staff.create({
      data: {
        name: staffProfile.name,
        role: staffProfile.role,
        countryCode: team.countryCode,
        reputation: 58 + index * 3,
        salary: 520_000 + index * 90_000,
        specialty: staffProfile.specialty,
        compatibility: { categories: [category.code] },
        personality: index === 0 ? "Driven" : "Calm",
        attributes: {
          pitStopExecution: 62 + index * 3,
          setupQuality: 64 + index * 2,
          degradationControl: 60 + index * 2,
          scoutingDepth: 58 + index,
          upgradeEfficiency: 61 + index * 3,
          talentRetention: 59 + index,
        },
        currentTeamId: team.id,
        currentCategoryId: category.id,
      },
    });

    await tx.staffContract.create({
      data: {
        staffId: staff.id,
        teamId: team.id,
        role: staffProfile.role,
        annualSalary: staff.salary,
        startDate: new Date(Date.UTC(2026, 0, 1)),
        endDate: new Date(Date.UTC(2028, 0, 1)),
        bonusObjectives: { pointsTarget: 80 + index * 20 },
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

  return team.id;
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

    let selectedTeamId: string | null = parsed.selectedTeamId ?? null;
    let cashBalance = computeStartingBudget({
      mode: parsed.mode,
      managerProfileCode: parsed.managerProfileCode,
      requestedBudget: parsed.requestedBudget,
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
    }

    if (parsed.mode === "MY_TEAM") {
      selectedTeamId = await createMyTeamProgram(tx, parsed);
      cashBalance = computeStartingBudget({
        mode: parsed.mode,
        managerProfileCode: parsed.managerProfileCode,
        requestedBudget: parsed.requestedBudget,
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

    const career = await tx.career.create({
      data: {
        profileId: profile.id,
        name: parsed.careerName.trim(),
        mode: parsed.mode,
        managerProfileCode: parsed.managerProfileCode,
        currentSeasonYear: 2026,
        selectedCategoryId: parsed.categoryId,
        selectedTeamId,
        cashBalance,
        reputation: parsed.mode === "MY_TEAM" ? 44 : 56,
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
