import { prisma } from "@/persistence/prisma";
import {
  calculateCompetitiveIndex,
  calculateDevelopmentPace,
  calculateMonthlyBurnRate,
  generateHqAlerts,
} from "@/domain/rules/hq-dashboard";
import type { HqCashPoint, HqDashboardSnapshot, HqEvolutionPoint } from "@/features/hq/types";

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((acc, value) => acc + value, 0) / values.length;
}

function startOfMonthDate(input: Date) {
  return new Date(Date.UTC(input.getUTCFullYear(), input.getUTCMonth(), 1));
}

function monthKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(date: Date) {
  return date.toLocaleDateString("en-US", { month: "short" });
}

function buildCashFlowSeries(params: {
  currentDate: Date;
  currentBalance: number;
  monthlyBurnRate: number;
  transactions: { amount: number; occurredAt: Date }[];
}): HqCashPoint[] {
  const months: Date[] = [];
  const currentMonthStart = startOfMonthDate(params.currentDate);

  for (let offset = 5; offset >= 0; offset -= 1) {
    months.push(
      new Date(
        Date.UTC(
          currentMonthStart.getUTCFullYear(),
          currentMonthStart.getUTCMonth() - offset,
          1,
        ),
      ),
    );
  }

  const defaultDeltas = months.map(() => -params.monthlyBurnRate);
  const byMonth = new Map<string, number>();

  for (const transaction of params.transactions) {
    const key = monthKey(startOfMonthDate(transaction.occurredAt));
    byMonth.set(key, (byMonth.get(key) ?? 0) + transaction.amount);
  }

  const deltas = months.map((month, index) => {
    const key = monthKey(month);
    const transactionDelta = byMonth.get(key) ?? 0;
    if (index === months.length - 1) {
      return transactionDelta;
    }
    return defaultDeltas[index] + transactionDelta;
  });

  const totalDelta = deltas.reduce((acc, delta) => acc + delta, 0);
  let runningBalance = params.currentBalance - totalDelta;

  return months.map((month, index) => {
    runningBalance += deltas[index];
    return {
      label: monthLabel(month),
      balance: Math.round(runningBalance),
      delta: Math.round(deltas[index]),
    };
  });
}

function buildEvolutionSeries(params: {
  currentDate: Date;
  reputation: number;
  carPerformance: number;
  facilityStrength: number;
}): HqEvolutionPoint[] {
  const points: HqEvolutionPoint[] = [];
  const startReputation = Math.max(30, params.reputation - 10);
  const startPerformance = Math.max(30, params.carPerformance - 9);
  const startFacilities = Math.max(25, params.facilityStrength - 8);

  for (let index = 0; index < 6; index += 1) {
    const fraction = index / 5;
    const date = new Date(
      Date.UTC(params.currentDate.getUTCFullYear(), params.currentDate.getUTCMonth() - (5 - index), 1),
    );
    points.push({
      label: monthLabel(date),
      reputation: Math.round(startReputation + (params.reputation - startReputation) * fraction),
      performance: Math.round(startPerformance + (params.carPerformance - startPerformance) * fraction),
      facilities: Math.round(startFacilities + (params.facilityStrength - startFacilities) * fraction),
    });
  }

  return points;
}

function daysBetween(start: Date, end: Date) {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.max(0, Math.ceil((end.getTime() - start.getTime()) / msPerDay));
}

function parseFoundationSummary(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const summary = value as Record<string, unknown>;
  const contractsClosed =
    summary.contractsClosed && typeof summary.contractsClosed === "object"
      ? (summary.contractsClosed as Record<string, unknown>)
      : {};

  const strengths = Array.isArray(summary.strengths)
    ? summary.strengths.filter((item): item is string => typeof item === "string")
    : [];
  const weaknesses = Array.isArray(summary.weaknesses)
    ? summary.weaknesses.filter((item): item is string => typeof item === "string")
    : [];

  return {
    foundedAtIso: typeof summary.foundedAtIso === "string" ? summary.foundedAtIso : null,
    initialCost: typeof summary.initialCost === "number" ? summary.initialCost : 0,
    morale: typeof summary.morale === "number" ? summary.morale : 70,
    mediaExpectation:
      typeof summary.mediaExpectation === "string"
        ? summary.mediaExpectation
        : "Development campaign in progress",
    strengths,
    weaknesses,
    contractsClosed: {
      drivers: typeof contractsClosed.drivers === "number" ? contractsClosed.drivers : 0,
      staff: typeof contractsClosed.staff === "number" ? contractsClosed.staff : 0,
    },
  };
}

export async function getDashboardSnapshot(params: {
  careerId: string | null;
  categoryCode: string;
  currentDateIso: string;
}): Promise<HqDashboardSnapshot> {
  const currentDate = new Date(`${params.currentDateIso}T00:00:00.000Z`);
  const category = await prisma.category.findFirst({
    where: { code: params.categoryCode },
    select: { id: true, code: true },
  });

  const career = params.careerId
    ? await prisma.career.findUnique({
        where: { id: params.careerId },
        include: {
          selectedTeam: true,
          selectedCategory: true,
        },
      })
    : null;

  const activeCategoryId = career?.selectedCategoryId ?? category?.id ?? null;
  const activeTeamId = career?.selectedTeamId ?? null;

  const transactionWhere =
    career?.id || activeTeamId
      ? {
          OR: [
            ...(career?.id ? [{ careerId: career.id }] : []),
            ...(activeTeamId ? [{ teamId: activeTeamId }] : []),
          ],
        }
      : null;

  const [team, upcomingEvents, topDrivers, teamTransactions] = await Promise.all([
    activeTeamId
      ? prisma.team.findUnique({
          where: { id: activeTeamId },
          include: {
            drivers: { select: { id: true, displayName: true, countryCode: true, overall: true, morale: true, potential: true, imageUrl: true } },
            staff: { select: { id: true, reputation: true } },
            cars: { orderBy: { seasonYear: "desc" }, take: 1, select: { basePerformance: true, reliability: true } },
            facilities: {
              include: {
                facility: {
                  select: { maxLevel: true },
                },
              },
            },
          },
        })
      : null,
    activeCategoryId
      ? prisma.calendarEvent.findMany({
          where: {
            categoryId: activeCategoryId,
            startDate: {
              gte: currentDate,
            },
          },
          orderBy: [{ startDate: "asc" }],
          take: 6,
          select: {
            id: true,
            round: true,
            name: true,
            circuitName: true,
            countryCode: true,
            startDate: true,
          },
        })
      : [],
    activeCategoryId
      ? prisma.driver.findMany({
          where: {
            currentCategoryId: activeCategoryId,
          },
          orderBy: [{ overall: "desc" }],
          take: 6,
          select: {
            id: true,
            displayName: true,
            countryCode: true,
            overall: true,
            morale: true,
            potential: true,
            imageUrl: true,
          },
        })
      : [],
    transactionWhere
      ? prisma.transaction.findMany({
          where: transactionWhere,
          orderBy: [{ occurredAt: "asc" }],
          take: 60,
          select: {
            amount: true,
            occurredAt: true,
          },
        })
      : [],
  ]);

  const [driverContracts, staffContracts, supplierContracts, sponsorContracts] = activeTeamId
    ? await Promise.all([
        prisma.driverContract.findMany({
          where: { teamId: activeTeamId, status: "ACTIVE" },
          select: { annualSalary: true },
        }),
        prisma.staffContract.findMany({
          where: { teamId: activeTeamId, status: "ACTIVE" },
          select: { annualSalary: true },
        }),
        prisma.supplierContract.findMany({
          where: { teamId: activeTeamId, status: "ACTIVE" },
          include: { supplier: { select: { performance: true, reliability: true } } },
        }),
        prisma.sponsorContract.findMany({
          where: { teamId: activeTeamId, status: "ACTIVE" },
          select: { fixedValue: true },
        }),
      ])
    : [[], [], [], []];

  const teamReputation = team?.reputation ?? 68;
  const averageDriverOverall = average((team?.drivers ?? topDrivers).map((driver) => driver.overall)) || 70;
  const carPerformance = team?.cars[0]
    ? Math.round(team.cars[0].basePerformance * 0.72 + team.cars[0].reliability * 0.28)
    : 72;
  const supplierStrength =
    average(supplierContracts.map((contract) => (contract.supplier.performance + contract.supplier.reliability) / 2)) ||
    70;
  const facilityStrength =
    average(
      (team?.facilities ?? []).map((facility) =>
        (facility.level / Math.max(1, facility.facility.maxLevel)) * 100,
      ),
    ) || 64;
  const averageStaffReputation = average((team?.staff ?? []).map((member) => member.reputation)) || 66;
  const morale =
    team && team.drivers.length > 0
      ? Math.round(
          average(team.drivers.map((driver) => driver.morale)) * 0.72 +
            averageStaffReputation * 0.28,
        )
      : 70;

  const competitiveIndex = calculateCompetitiveIndex({
    teamReputation,
    averageDriverOverall,
    carPerformance,
    supplierStrength,
    facilityStrength,
  });

  const developmentPace = calculateDevelopmentPace({
    competitiveIndex,
    averageFacilityLevel: (average((team?.facilities ?? []).map((item) => item.level)) || 2),
    averageStaffReputation,
  });

  const annualDriverSalaries = driverContracts.reduce((acc, contract) => acc + contract.annualSalary, 0);
  const annualStaffSalaries = staffContracts.reduce((acc, contract) => acc + contract.annualSalary, 0);
  const annualSupplierCost = supplierContracts.reduce((acc, contract) => acc + contract.annualCost, 0);
  const annualSponsorIncome = sponsorContracts.reduce((acc, contract) => acc + contract.fixedValue, 0);
  const annualOperatingCost = team ? Math.round(team.budget * 0.09) : 22_000_000;

  const monthlyBurnRate = calculateMonthlyBurnRate({
    annualDriverSalaries,
    annualStaffSalaries,
    annualSupplierCost,
    annualOperatingCost,
    annualSponsorIncome,
  });

  const cashBalance = career?.cashBalance ?? 42_500_000;
  const nextEvent = upcomingEvents[0] ?? null;
  const daysUntilNextEvent = nextEvent ? daysBetween(currentDate, nextEvent.startDate) : null;
  const supplierContractsEndingSoon = supplierContracts.filter(
    (contract) => daysBetween(currentDate, contract.endDate) <= 90,
  ).length;

  const alerts = generateHqAlerts({
    cashBalance,
    monthlyBurnRate,
    morale,
    daysUntilNextEvent,
    supplierContractsEndingSoon,
  });

  const agenda = upcomingEvents.map((event) => ({
    id: event.id,
    round: event.round,
    name: event.name,
    circuitName: event.circuitName,
    countryCode: event.countryCode,
    startDateIso: event.startDate.toISOString().slice(0, 10),
    daysUntil: daysBetween(currentDate, event.startDate),
  }));

  const cashFlow = buildCashFlowSeries({
    currentDate,
    currentBalance: cashBalance,
    monthlyBurnRate,
    transactions: teamTransactions,
  });

  const evolution = buildEvolutionSeries({
    currentDate,
    reputation: teamReputation,
    carPerformance,
    facilityStrength,
  });

  const priorities: string[] = [];
  if (monthlyBurnRate > 4_000_000) priorities.push("Renegotiate supplier and operational costs.");
  if (morale < 70) priorities.push("Run morale interventions with drivers and race staff.");
  if (competitiveIndex < 76) priorities.push("Prioritize short-cycle performance upgrades.");
  if (daysUntilNextEvent !== null && daysUntilNextEvent <= 7) priorities.push("Finalize race weekend setup and strategy package.");
  if (priorities.length === 0) priorities.push("Maintain current trajectory and monitor sponsor objectives.");

  return {
    kpis: {
      cashBalance,
      monthlyBurnRate,
      morale,
      competitiveIndex,
      developmentPace,
    },
    alerts,
    nextEvent: nextEvent
      ? {
          round: nextEvent.round,
          name: nextEvent.name,
          circuitName: nextEvent.circuitName,
          countryCode: nextEvent.countryCode,
          startDateIso: nextEvent.startDate.toISOString().slice(0, 10),
        }
      : null,
    agenda,
    cashFlow,
    evolution,
    driverPulse: (team?.drivers ?? topDrivers).slice(0, 5).map((driver) => ({
      id: driver.id,
      name: driver.displayName,
      countryCode: driver.countryCode,
      overall: driver.overall,
      morale: driver.morale,
      potential: driver.potential,
      imageUrl: driver.imageUrl,
    })),
    priorities,
    foundationSummary: parseFoundationSummary(career?.foundationSummary),
  };
}
