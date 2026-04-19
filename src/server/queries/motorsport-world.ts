import { ContractStatus, SessionType } from "@prisma/client";

import {
  buildRegulationWatch,
  buildTransferRumorCandidates,
  credibilityLabel,
  driverHeatIndex,
  importanceLabel,
  manufacturerHeatIndex,
  urgencyLabel,
} from "@/domain/rules/world-hub";
import { formatRaceTime } from "@/domain/rules/race-control-sim";
import { prisma } from "@/persistence/prisma";
import { getActiveCareerContext } from "@/server/queries/career";
import type {
  GlobalCategoryPulse,
  GlobalMotorsportHubView,
  HotDriverItem,
  HotManufacturerItem,
  InboxItem,
  NewsHeadlineItem,
  NewsroomHubView,
  RumorWireItem,
  TransferRumorItem,
  WorldCategoryOption,
} from "@/features/world/types";

const raceSessionTypes: SessionType[] = [
  SessionType.SPRINT,
  SessionType.FEATURE,
  SessionType.STAGE,
  SessionType.RACE,
];

function daysBetween(start: Date, end: Date) {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.ceil((end.getTime() - start.getTime()) / msPerDay);
}

function tokenLabelFromOrder(sessionOrder: unknown, orderIndex: number) {
  if (!Array.isArray(sessionOrder)) return `Session ${orderIndex}`;
  const token = sessionOrder[orderIndex - 1];
  if (typeof token !== "string") return `Session ${orderIndex}`;
  if (token === "Q1" || token === "Q2" || token === "Q3") return token;
  return token
    .toLowerCase()
    .split("_")
    .map((chunk) => chunk.slice(0, 1).toUpperCase() + chunk.slice(1))
    .join(" ");
}

async function resolveWorldContext(requestedCategoryCode?: string) {
  const active = await getActiveCareerContext();
  const referenceDate = new Date(`${active.currentDateIso}T00:00:00.000Z`);
  const referenceYear = referenceDate.getUTCFullYear();

  const categories = await prisma.category.findMany({
    orderBy: [{ tier: "asc" }, { name: "asc" }],
    select: {
      id: true,
      code: true,
      name: true,
      discipline: true,
      tier: true,
    },
  });

  const selected =
    categories.find((category) => category.code === requestedCategoryCode) ??
    categories.find((category) => category.code === active.categoryCode) ??
    categories[0] ??
    null;

  if (!selected) return null;

  const season =
    (await prisma.season.findFirst({
      where: {
        categoryId: selected.id,
        year: referenceYear,
      },
      include: {
        events: {
          orderBy: [{ round: "asc" }],
          include: {
            raceWeekends: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    })) ??
    (await prisma.season.findFirst({
      where: {
        categoryId: selected.id,
      },
      orderBy: [{ year: "desc" }],
      include: {
        events: {
          orderBy: [{ round: "asc" }],
          include: {
            raceWeekends: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    }));

  const nextEvent = season?.events.find((event) => event.startDate >= referenceDate) ?? season?.events[0] ?? null;

  return {
    active,
    referenceDate,
    referenceYear,
    categories: categories as WorldCategoryOption[],
    selected: selected as WorldCategoryOption,
    season,
    nextEvent,
  };
}

async function buildTransferRumorsForCategory(params: {
  categoryId: string;
  categoryCode: string;
  seasonId: string | null;
  referenceDate: Date;
  limit: number;
}): Promise<TransferRumorItem[]> {
  const [drivers, destinationTeams] = await Promise.all([
    prisma.driver.findMany({
      where: {
        currentCategoryId: params.categoryId,
        currentTeamId: { not: null },
      },
      select: {
        id: true,
        displayName: true,
        overall: true,
        potential: true,
        reputation: true,
        marketValue: true,
        currentTeamId: true,
        currentTeam: {
          select: {
            name: true,
            reputation: true,
          },
        },
      },
    }),
    prisma.team.findMany({
      where: { categoryId: params.categoryId },
      orderBy: [{ reputation: "desc" }],
      take: 10,
      select: {
        id: true,
        name: true,
        reputation: true,
      },
    }),
  ]);

  if (drivers.length === 0 || destinationTeams.length === 0) return [];

  const driverIds = drivers.map((driver) => driver.id);
  const [contracts, standings] = await Promise.all([
    prisma.driverContract.findMany({
      where: {
        driverId: { in: driverIds },
        status: ContractStatus.ACTIVE,
      },
      orderBy: [{ endDate: "asc" }],
      select: {
        driverId: true,
        endDate: true,
      },
    }),
    params.seasonId
      ? prisma.standingsDriver.findMany({
          where: {
            seasonId: params.seasonId,
            categoryId: params.categoryId,
            driverId: { in: driverIds },
          },
          select: {
            driverId: true,
            points: true,
          },
        })
      : Promise.resolve([]),
  ]);

  const contractByDriver = new Map<string, Date>();
  for (const contract of contracts) {
    if (!contractByDriver.has(contract.driverId)) {
      contractByDriver.set(contract.driverId, contract.endDate);
    }
  }

  const pointsByDriver = new Map(standings.map((row) => [row.driverId, row.points]));

  return buildTransferRumorCandidates(
    drivers
      .filter((driver) => Boolean(driver.currentTeamId && driver.currentTeam))
      .map((driver) => ({
        driverId: driver.id,
        driverName: driver.displayName,
        categoryCode: params.categoryCode,
        overall: driver.overall,
        potential: driver.potential,
        reputation: driver.reputation,
        marketValue: driver.marketValue,
        seasonPoints: pointsByDriver.get(driver.id) ?? 0,
        currentTeamId: driver.currentTeamId!,
        currentTeamName: driver.currentTeam?.name ?? "Unknown",
        currentTeamReputation: driver.currentTeam?.reputation ?? 60,
        contractEndDate: contractByDriver.get(driver.id) ?? null,
        destinationTeams: destinationTeams.map((team) => ({
          teamId: team.id,
          teamName: team.name,
          reputation: team.reputation,
        })),
      })),
    params.referenceDate,
    params.limit,
  );
}

function buildInboxItems(params: {
  nextEvent: {
    id: string;
    name: string;
    daysUntil: number;
    hasWeekend: boolean;
  } | null;
  expiringContracts: {
    driver: number;
    staff: number;
    supplier: number;
    sponsor: number;
  };
  latestRaceSummary: string | null;
  topRumor: RumorWireItem | null;
  transferRumor: TransferRumorItem | null;
  breakingHeadline: NewsHeadlineItem | null;
  selectedCategoryCode: string;
}): InboxItem[] {
  const inbox: InboxItem[] = [];

  if (params.nextEvent) {
    if (!params.nextEvent.hasWeekend && params.nextEvent.daysUntil <= 10) {
      inbox.push({
        id: `weekend-${params.nextEvent.id}`,
        title: "Weekend structure pending",
        summary: `${params.nextEvent.name} starts in ${params.nextEvent.daysUntil} days and still needs a generated race weekend.`,
        priority: params.nextEvent.daysUntil <= 3 ? "CRITICAL" : "HIGH",
        source: `Calendar - ${urgencyLabel(params.nextEvent.daysUntil)}`,
        actionHref: `/game/weekend-rules?category=${params.selectedCategoryCode}`,
        actionLabel: "Open weekend rules",
      });
    } else if (params.nextEvent.daysUntil <= 7) {
      inbox.push({
        id: `prep-${params.nextEvent.id}`,
        title: "Race prep window open",
        summary: `${params.nextEvent.name} is ${params.nextEvent.daysUntil} days away. Practice and qualifying plans should be locked.`,
        priority: params.nextEvent.daysUntil <= 2 ? "HIGH" : "MEDIUM",
        source: `Race Operations - ${urgencyLabel(params.nextEvent.daysUntil)}`,
        actionHref: `/game/practice?category=${params.selectedCategoryCode}`,
        actionLabel: "Open practice center",
      });
    }
  }

  const totalExpiring =
    params.expiringContracts.driver +
    params.expiringContracts.staff +
    params.expiringContracts.supplier +
    params.expiringContracts.sponsor;
  if (totalExpiring > 0) {
    inbox.push({
      id: "expiring-contracts",
      title: "Contracts nearing expiry",
      summary: `${totalExpiring} active deal(s) are inside the 120-day horizon. Secure your core program before negotiation leverage drops.`,
      priority: totalExpiring >= 3 ? "HIGH" : "MEDIUM",
      source: "Contract Office",
      actionHref: "/game/drivers",
      actionLabel: "Review contracts",
    });
  }

  if (params.latestRaceSummary) {
    inbox.push({
      id: "post-race-review",
      title: "Post-race review ready",
      summary: params.latestRaceSummary,
      priority: "MEDIUM",
      source: "Race Control Analytics",
      actionHref: `/game/race-control?category=${params.selectedCategoryCode}`,
      actionLabel: "Open race control",
    });
  }

  if (params.transferRumor && params.transferRumor.credibility >= 72) {
    inbox.push({
      id: `transfer-${params.transferRumor.driverId}`,
      title: "Transfer market alert",
      summary: params.transferRumor.headline,
      priority: params.transferRumor.credibility >= 84 ? "HIGH" : "MEDIUM",
      source: `Scouting Wire - ${credibilityLabel(params.transferRumor.credibility)}`,
      actionHref: "/game/scouting",
      actionLabel: "Open scouting board",
    });
  }

  if (params.topRumor && params.topRumor.credibility >= 78) {
    inbox.push({
      id: `rumor-${params.topRumor.id}`,
      title: "High-credibility rumor detected",
      summary: params.topRumor.headline,
      priority: "MEDIUM",
      source: `Rumor Desk - ${params.topRumor.credibilityLabel}`,
      actionHref: "/game/newsroom",
      actionLabel: "Open rumor wire",
    });
  }

  if (params.breakingHeadline) {
    inbox.push({
      id: `headline-${params.breakingHeadline.id}`,
      title: "Breaking headline",
      summary: params.breakingHeadline.title,
      priority: "LOW",
      source: `Media Desk - ${params.breakingHeadline.importanceLabel}`,
      actionHref: "/game/newsroom",
      actionLabel: "Open newsroom",
    });
  }

  return inbox.slice(0, 8);
}

export async function getNewsroomHubView(requestedCategoryCode?: string): Promise<NewsroomHubView | null> {
  const context = await resolveWorldContext(requestedCategoryCode);
  if (!context) return null;

  const expiryBoundary = new Date(context.referenceDate.getTime());
  expiryBoundary.setUTCDate(expiryBoundary.getUTCDate() + 120);

  const [headlinesRaw, rumorWireRaw, latestRaceSessions, expiringContracts, transferRumors] = await Promise.all([
    prisma.newsItem.findMany({
      where: {
        OR: [{ categoryCode: context.selected.code }, { categoryCode: "GLOBAL" }],
      },
      orderBy: [{ publishedAt: "desc" }],
      take: 20,
      select: {
        id: true,
        title: true,
        body: true,
        categoryCode: true,
        importance: true,
        publishedAt: true,
      },
    }),
    prisma.rumor.findMany({
      where: {
        OR: [{ categoryCode: context.selected.code }, { categoryCode: "GLOBAL" }],
      },
      orderBy: [{ createdAt: "desc" }],
      take: 20,
      select: {
        id: true,
        headline: true,
        body: true,
        categoryCode: true,
        credibility: true,
        createdAt: true,
      },
    }),
    prisma.session.findMany({
      where: {
        completed: true,
        sessionType: {
          in: raceSessionTypes,
        },
        raceWeekend: {
          event: {
            categoryId: context.selected.id,
          },
        },
      },
      orderBy: [{ finishedAt: "desc" }],
      take: 4,
      include: {
        raceWeekend: {
          include: {
            event: {
              select: {
                id: true,
                name: true,
                round: true,
              },
            },
            ruleSet: {
              select: {
                sessionOrder: true,
              },
            },
          },
        },
        raceRows: {
          orderBy: [{ position: "asc" }],
          take: 3,
          include: {
            driver: {
              select: {
                id: true,
                displayName: true,
                currentTeam: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    }),
    context.active.teamId
      ? Promise.all([
          prisma.driverContract.count({
            where: {
              teamId: context.active.teamId,
              status: ContractStatus.ACTIVE,
              endDate: { lte: expiryBoundary },
            },
          }),
          prisma.staffContract.count({
            where: {
              teamId: context.active.teamId,
              status: ContractStatus.ACTIVE,
              endDate: { lte: expiryBoundary },
            },
          }),
          prisma.supplierContract.count({
            where: {
              teamId: context.active.teamId,
              status: ContractStatus.ACTIVE,
              endDate: { lte: expiryBoundary },
            },
          }),
          prisma.sponsorContract.count({
            where: {
              teamId: context.active.teamId,
              status: ContractStatus.ACTIVE,
              endDate: { lte: expiryBoundary },
            },
          }),
        ]).then(([driver, staff, supplier, sponsor]) => ({ driver, staff, supplier, sponsor }))
      : Promise.resolve({ driver: 0, staff: 0, supplier: 0, sponsor: 0 }),
    buildTransferRumorsForCategory({
      categoryId: context.selected.id,
      categoryCode: context.selected.code,
      seasonId: context.season?.id ?? null,
      referenceDate: context.referenceDate,
      limit: 12,
    }),
  ]);

  const headlines: NewsHeadlineItem[] = headlinesRaw.map((item) => ({
    id: item.id,
    title: item.title,
    body: item.body,
    categoryCode: item.categoryCode,
    importance: item.importance,
    importanceLabel: importanceLabel(item.importance),
    publishedAtIso: item.publishedAt.toISOString().slice(0, 10),
  }));

  const rumorWire: RumorWireItem[] = rumorWireRaw.map((item) => ({
    id: item.id,
    headline: item.headline,
    body: item.body,
    categoryCode: item.categoryCode,
    credibility: item.credibility,
    credibilityLabel: credibilityLabel(item.credibility),
    createdAtIso: item.createdAt.toISOString().slice(0, 10),
  }));

  const latestRace = latestRaceSessions[0] ?? null;
  const latestRaceSummary =
    latestRace && latestRace.raceRows.length > 0
      ? (() => {
          const winner = latestRace.raceRows[0];
          const sessionLabel = tokenLabelFromOrder(latestRace.raceWeekend.ruleSet.sessionOrder, latestRace.orderIndex);
          const timing =
            typeof winner.totalTimeMs === "number" ? ` in ${formatRaceTime(winner.totalTimeMs)}` : "";
          return `${winner.driver.displayName} won ${latestRace.raceWeekend.event.name} (${sessionLabel})${timing}.`;
        })()
      : null;

  const nextEvent = context.nextEvent
    ? {
        id: context.nextEvent.id,
        round: context.nextEvent.round,
        name: context.nextEvent.name,
        circuitName: context.nextEvent.circuitName,
        countryCode: context.nextEvent.countryCode,
        startDateIso: context.nextEvent.startDate.toISOString().slice(0, 10),
        daysUntil: daysBetween(context.referenceDate, context.nextEvent.startDate),
        hasWeekend: context.nextEvent.raceWeekends.length > 0,
      }
    : null;

  const inbox = buildInboxItems({
    nextEvent,
    expiringContracts,
    latestRaceSummary,
    topRumor: rumorWire[0] ?? null,
    transferRumor: transferRumors[0] ?? null,
    breakingHeadline: headlines.find((item) => item.importance >= 82) ?? null,
    selectedCategoryCode: context.selected.code,
  });

  return {
    categories: context.categories,
    selectedCategory: context.selected,
    seasonYear: context.season?.year ?? context.referenceYear,
    nextEvent,
    inbox,
    headlines,
    rumorWire,
    transferRumors,
  };
}

export async function getGlobalMotorsportHubView(): Promise<GlobalMotorsportHubView> {
  const active = await getActiveCareerContext();
  const referenceDate = new Date(`${active.currentDateIso}T00:00:00.000Z`);
  const referenceYear = referenceDate.getUTCFullYear();

  const categories = await prisma.category.findMany({
    orderBy: [{ tier: "asc" }, { name: "asc" }],
    select: {
      id: true,
      code: true,
      name: true,
      defaultRuleSetCode: true,
    },
  });

  const categorySeasonData = await Promise.all(
    categories.map(async (category) => {
      const season =
        (await prisma.season.findFirst({
          where: {
            categoryId: category.id,
            year: referenceYear,
          },
          include: {
            events: {
              orderBy: [{ round: "asc" }],
            },
          },
        })) ??
        (await prisma.season.findFirst({
          where: { categoryId: category.id },
          orderBy: [{ year: "desc" }],
          include: {
            events: {
              orderBy: [{ round: "asc" }],
            },
          },
        }));

      const nextEvent =
        season?.events.find((event) => event.startDate >= referenceDate) ?? season?.events[0] ?? null;

      return {
        categoryId: category.id,
        categoryCode: category.code,
        categoryName: category.name,
        defaultRuleSetCode: category.defaultRuleSetCode,
        seasonId: season?.id ?? null,
        seasonStatus: season?.status ?? "N/A",
        currentRound: season?.currentRound ?? 0,
        totalRounds: season?.events.length ?? 0,
        nextEventName: nextEvent?.name ?? null,
        nextEventDateIso: nextEvent ? nextEvent.startDate.toISOString().slice(0, 10) : null,
      };
    }),
  );

  const pulses: GlobalCategoryPulse[] = categorySeasonData.map((item) => ({
    categoryCode: item.categoryCode,
    categoryName: item.categoryName,
    status: item.seasonStatus,
    currentRound: item.currentRound,
    totalRounds: item.totalRounds,
    nextEventName: item.nextEventName,
    nextEventDateIso: item.nextEventDateIso,
  }));

  const seasonIds = categorySeasonData.map((item) => item.seasonId).filter((id): id is string => Boolean(id));

  const [newsRaw, rumorsRaw, raceSessions, standingsDrivers, standingsManufacturers, ruleSets] = await Promise.all([
    prisma.newsItem.findMany({
      orderBy: [{ publishedAt: "desc" }],
      take: 26,
      select: {
        id: true,
        title: true,
        body: true,
        categoryCode: true,
        importance: true,
        publishedAt: true,
      },
    }),
    prisma.rumor.findMany({
      orderBy: [{ createdAt: "desc" }],
      take: 26,
      select: {
        id: true,
        headline: true,
        body: true,
        categoryCode: true,
        credibility: true,
        createdAt: true,
      },
    }),
    prisma.session.findMany({
      where: {
        completed: true,
        sessionType: {
          in: raceSessionTypes,
        },
      },
      orderBy: [{ finishedAt: "desc" }],
      take: 14,
      include: {
        raceWeekend: {
          include: {
            event: {
              include: {
                category: {
                  select: {
                    code: true,
                  },
                },
              },
            },
            ruleSet: {
              select: {
                sessionOrder: true,
              },
            },
          },
        },
        raceRows: {
          orderBy: [{ position: "asc" }],
          take: 3,
          include: {
            driver: {
              select: {
                displayName: true,
                currentTeam: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    }),
    seasonIds.length > 0
      ? prisma.standingsDriver.findMany({
          where: {
            seasonId: {
              in: seasonIds,
            },
          },
          include: {
            category: {
              select: {
                code: true,
              },
            },
            driver: {
              select: {
                id: true,
                displayName: true,
                countryCode: true,
                imageUrl: true,
                overall: true,
                reputation: true,
                currentTeam: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        })
      : Promise.resolve([]),
    seasonIds.length > 0
      ? prisma.standingsManufacturer.findMany({
          where: {
            seasonId: {
              in: seasonIds,
            },
          },
          include: {
            category: {
              select: {
                code: true,
              },
            },
          },
        })
      : Promise.resolve([]),
    prisma.ruleSet.findMany({
      include: {
        category: {
          select: {
            code: true,
          },
        },
      },
    }),
  ]);

  const worldHeadlines: NewsHeadlineItem[] = newsRaw.map((item) => ({
    id: item.id,
    title: item.title,
    body: item.body,
    categoryCode: item.categoryCode,
    importance: item.importance,
    importanceLabel: importanceLabel(item.importance),
    publishedAtIso: item.publishedAt.toISOString().slice(0, 10),
  }));

  const rumorWire: RumorWireItem[] = rumorsRaw.map((item) => ({
    id: item.id,
    headline: item.headline,
    body: item.body,
    categoryCode: item.categoryCode,
    credibility: item.credibility,
    credibilityLabel: credibilityLabel(item.credibility),
    createdAtIso: item.createdAt.toISOString().slice(0, 10),
  }));

  const recentResults = raceSessions
    .filter((session) => session.raceRows.length > 0)
    .map((session) => {
      const winner = session.raceRows[0];
      return {
        sessionId: session.id,
        categoryCode: session.raceWeekend.event.category.code,
        eventName: session.raceWeekend.event.name,
        round: session.raceWeekend.event.round,
        sessionLabel: tokenLabelFromOrder(session.raceWeekend.ruleSet.sessionOrder, session.orderIndex),
        winnerDriverName: winner.driver.displayName,
        winnerTeamName: winner.driver.currentTeam?.name ?? "Independent",
        winnerTimeMs: winner.totalTimeMs,
        podium: session.raceRows.map((row) => ({
          position: row.position,
          driverName: row.driver.displayName,
          teamName: row.driver.currentTeam?.name ?? "Independent",
          status: row.status,
        })),
      };
    })
    .slice(0, 10);

  const weatherSensitivityByCategory = new Map<string, number>();
  for (const ruleSet of ruleSets) {
    const current = weatherSensitivityByCategory.get(ruleSet.category.code);
    if (typeof current === "number") continue;
    weatherSensitivityByCategory.set(ruleSet.category.code, ruleSet.weatherSensitivity);
  }

  const hotDrivers: HotDriverItem[] = standingsDrivers
    .map((row) => ({
      driverId: row.driver.id,
      name: row.driver.displayName,
      countryCode: row.driver.countryCode,
      imageUrl: row.driver.imageUrl ?? null,
      categoryCode: row.category.code,
      teamName: row.driver.currentTeam?.name ?? "Independent",
      points: row.points,
      heatIndex: driverHeatIndex({
        points: row.points,
        wins: row.wins,
        podiums: row.podiums,
        poles: row.poles,
        overall: row.driver.overall,
        reputation: row.driver.reputation,
      }),
    }))
    .sort((a, b) => b.heatIndex - a.heatIndex)
    .slice(0, 12);

  const hotManufacturers: HotManufacturerItem[] = standingsManufacturers
    .map((row) => ({
      manufacturerName: row.manufacturerName,
      categoryCode: row.category.code,
      points: row.points,
      wins: row.wins,
      heatIndex: manufacturerHeatIndex({
        points: row.points,
        wins: row.wins,
        weatherSensitivity: weatherSensitivityByCategory.get(row.category.code) ?? 70,
      }),
    }))
    .sort((a, b) => b.heatIndex - a.heatIndex)
    .slice(0, 12);

  const regulationWatch = buildRegulationWatch(
    ruleSets.map((ruleSet) => ({
      ruleSetId: ruleSet.id,
      categoryCode: ruleSet.category.code,
      ruleSetName: ruleSet.name,
      hasSprint: ruleSet.hasSprint,
      hasStages: ruleSet.hasStages,
      enduranceFlags: ruleSet.enduranceFlags,
      weatherSensitivity: ruleSet.weatherSensitivity,
      parcFerme: ruleSet.parcFerme,
      qualifyingFormat: ruleSet.qualifyingFormat,
      safetyCarBehavior: ruleSet.safetyCarBehavior,
    })),
  );

  const globalTransferRumorsNested = await Promise.all(
    categorySeasonData
      .filter((entry) => Boolean(entry.categoryId))
      .map(async (entry) =>
        buildTransferRumorsForCategory({
          categoryId: entry.categoryId,
          categoryCode: entry.categoryCode,
          seasonId: entry.seasonId,
          referenceDate,
          limit: 4,
        }),
      ),
  );

  const transferRumors = globalTransferRumorsNested
    .flat()
    .sort((a, b) => b.credibility - a.credibility)
    .slice(0, 16);

  return {
    referenceDateIso: referenceDate.toISOString().slice(0, 10),
    categories: pulses,
    worldHeadlines,
    rumorWire,
    transferRumors,
    hotDrivers,
    hotManufacturers,
    regulationWatch,
    recentResults,
  };
}
