import "server-only";

import { ContractStatus, Prisma } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/persistence/prisma";
import type { CareerSnapshotV2 } from "@/features/save-system/types";

const snapshotSchema = z.object({
  version: z.literal(2),
  savedAtIso: z.string(),
  trigger: z.enum(["MANUAL", "AUTO"]),
  label: z.string(),
  career: z.object({
    id: z.string(),
    name: z.string(),
    mode: z.enum(["TEAM_PRINCIPAL", "MY_TEAM", "GLOBAL"]),
    managerProfileCode: z.string(),
    currentSeasonYear: z.number().int(),
    selectedCategoryId: z.string().nullable(),
    selectedTeamId: z.string().nullable(),
    cashBalance: z.number().int(),
    reputation: z.number().int(),
  }),
  season: z
    .object({
      id: z.string(),
      categoryId: z.string(),
      year: z.number().int(),
      status: z.enum(["PRESEASON", "ACTIVE", "FINISHED"]),
      currentRound: z.number().int(),
    })
    .nullable(),
  sessions: z.array(
    z.object({
      id: z.string(),
      completed: z.boolean(),
      startedAtIso: z.string().nullable(),
      finishedAtIso: z.string().nullable(),
    }),
  ),
  sessionTeamStates: z.array(
    z.object({
      sessionId: z.string(),
      teamId: z.string(),
      setupConfidence: z.number().int(),
      trackKnowledge: z.number().int(),
      practiceDelta: z.number().int(),
      notes: z.unknown(),
    }),
  ),
  qualifyingResults: z.array(
    z.object({
      sessionId: z.string(),
      driverId: z.string(),
      position: z.number().int(),
      bestLapMs: z.number().int(),
      gapMs: z.number().int().nullable(),
      tyreCompound: z.string().nullable(),
    }),
  ),
  raceResults: z.array(
    z.object({
      sessionId: z.string(),
      driverId: z.string(),
      position: z.number().int(),
      points: z.number().int(),
      lapsCompleted: z.number().int(),
      totalTimeMs: z.number().int().nullable(),
      status: z.string(),
      pitStops: z.number().int(),
      incidents: z.unknown(),
    }),
  ),
  standings: z.object({
    drivers: z.array(
      z.object({
        driverId: z.string(),
        points: z.number().int(),
        wins: z.number().int(),
        podiums: z.number().int(),
        poles: z.number().int(),
      }),
    ),
    teams: z.array(
      z.object({
        teamId: z.string(),
        points: z.number().int(),
        wins: z.number().int(),
        podiums: z.number().int(),
      }),
    ),
    manufacturers: z.array(
      z.object({
        manufacturerName: z.string(),
        points: z.number().int(),
        wins: z.number().int(),
      }),
    ),
  }),
  transactions: z.array(
    z.object({
      careerId: z.string().nullable(),
      teamId: z.string().nullable(),
      kind: z.string(),
      amount: z.number().int(),
      description: z.string(),
      occurredAtIso: z.string(),
    }),
  ),
});

type SnapshotInput = z.infer<typeof snapshotSchema>;

function nowLabel() {
  const now = new Date();
  const date = now.toISOString().slice(0, 16).replace("T", " ");
  return date;
}

function parseDate(value: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toPrismaJson(
  value: unknown,
): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput {
  if (value === null || value === undefined) {
    return Prisma.JsonNull;
  }
  return value as Prisma.InputJsonValue;
}

function toPrismaSnapshot(snapshot: CareerSnapshotV2): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(snapshot)) as Prisma.InputJsonValue;
}

async function buildSnapshot(tx: Prisma.TransactionClient, params: {
  careerId: string;
  trigger: "MANUAL" | "AUTO";
  label: string;
}): Promise<CareerSnapshotV2> {
  const career = await tx.career.findUnique({
    where: { id: params.careerId },
    include: {
      selectedCategory: { select: { id: true } },
      selectedTeam: { select: { id: true } },
    },
  });

  if (!career) {
    throw new Error("Career not found for save snapshot.");
  }

  const season = career.selectedCategoryId
    ? await tx.season.findFirst({
        where: {
          categoryId: career.selectedCategoryId,
          year: career.currentSeasonYear,
        },
      })
    : null;

  const sessions = season
    ? await tx.session.findMany({
        where: {
          raceWeekend: {
            seasonId: season.id,
          },
        },
        select: {
          id: true,
          completed: true,
          startedAt: true,
          finishedAt: true,
        },
      })
    : [];

  const sessionIds = sessions.map((session) => session.id);

  const [sessionTeamStates, qualifyingResults, raceResults, standingsDriver, standingsTeam, standingsManufacturer, transactions] =
    await Promise.all([
      sessionIds.length > 0
        ? tx.sessionTeamState.findMany({
            where: {
              sessionId: { in: sessionIds },
            },
            select: {
              sessionId: true,
              teamId: true,
              setupConfidence: true,
              trackKnowledge: true,
              practiceDelta: true,
              notes: true,
            },
          })
        : Promise.resolve([]),
      sessionIds.length > 0
        ? tx.qualifyingResult.findMany({
            where: {
              sessionId: { in: sessionIds },
            },
            select: {
              sessionId: true,
              driverId: true,
              position: true,
              bestLapMs: true,
              gapMs: true,
              tyreCompound: true,
            },
          })
        : Promise.resolve([]),
      sessionIds.length > 0
        ? tx.raceResult.findMany({
            where: {
              sessionId: { in: sessionIds },
            },
            select: {
              sessionId: true,
              driverId: true,
              position: true,
              points: true,
              lapsCompleted: true,
              totalTimeMs: true,
              status: true,
              pitStops: true,
              incidents: true,
            },
          })
        : Promise.resolve([]),
      season
        ? tx.standingsDriver.findMany({
            where: {
              seasonId: season.id,
              categoryId: season.categoryId,
            },
            select: {
              driverId: true,
              points: true,
              wins: true,
              podiums: true,
              poles: true,
            },
          })
        : Promise.resolve([]),
      season
        ? tx.standingsTeam.findMany({
            where: {
              seasonId: season.id,
              categoryId: season.categoryId,
            },
            select: {
              teamId: true,
              points: true,
              wins: true,
              podiums: true,
            },
          })
        : Promise.resolve([]),
      season
        ? tx.standingsManufacturer.findMany({
            where: {
              seasonId: season.id,
              categoryId: season.categoryId,
            },
            select: {
              manufacturerName: true,
              points: true,
              wins: true,
            },
          })
        : Promise.resolve([]),
      tx.transaction.findMany({
        where: {
          OR: [
            { careerId: career.id },
            ...(career.selectedTeamId ? [{ teamId: career.selectedTeamId }] : []),
          ],
        },
        orderBy: [{ occurredAt: "asc" }],
        select: {
          careerId: true,
          teamId: true,
          kind: true,
          amount: true,
          description: true,
          occurredAt: true,
        },
      }),
    ]);

  return {
    version: 2,
    savedAtIso: new Date().toISOString(),
    trigger: params.trigger,
    label: params.label,
    career: {
      id: career.id,
      name: career.name,
      mode: career.mode,
      managerProfileCode: career.managerProfileCode,
      currentSeasonYear: career.currentSeasonYear,
      selectedCategoryId: career.selectedCategoryId,
      selectedTeamId: career.selectedTeamId,
      cashBalance: career.cashBalance,
      reputation: career.reputation,
    },
    season: season
      ? {
          id: season.id,
          categoryId: season.categoryId,
          year: season.year,
          status: season.status,
          currentRound: season.currentRound,
        }
      : null,
    sessions: sessions.map((session) => ({
      id: session.id,
      completed: session.completed,
      startedAtIso: session.startedAt?.toISOString() ?? null,
      finishedAtIso: session.finishedAt?.toISOString() ?? null,
    })),
    sessionTeamStates: sessionTeamStates.map((row) => ({
      sessionId: row.sessionId,
      teamId: row.teamId,
      setupConfidence: row.setupConfidence,
      trackKnowledge: row.trackKnowledge,
      practiceDelta: row.practiceDelta,
      notes: row.notes,
    })),
    qualifyingResults: qualifyingResults.map((row) => ({
      sessionId: row.sessionId,
      driverId: row.driverId,
      position: row.position,
      bestLapMs: row.bestLapMs,
      gapMs: row.gapMs ?? null,
      tyreCompound: row.tyreCompound ?? null,
    })),
    raceResults: raceResults.map((row) => ({
      sessionId: row.sessionId,
      driverId: row.driverId,
      position: row.position,
      points: row.points,
      lapsCompleted: row.lapsCompleted,
      totalTimeMs: row.totalTimeMs ?? null,
      status: row.status,
      pitStops: row.pitStops,
      incidents: row.incidents,
    })),
    standings: {
      drivers: standingsDriver.map((row) => ({
        driverId: row.driverId,
        points: row.points,
        wins: row.wins,
        podiums: row.podiums,
        poles: row.poles,
      })),
      teams: standingsTeam.map((row) => ({
        teamId: row.teamId,
        points: row.points,
        wins: row.wins,
        podiums: row.podiums,
      })),
      manufacturers: standingsManufacturer.map((row) => ({
        manufacturerName: row.manufacturerName,
        points: row.points,
        wins: row.wins,
      })),
    },
    transactions: transactions.map((transaction) => ({
      careerId: transaction.careerId,
      teamId: transaction.teamId,
      kind: transaction.kind,
      amount: transaction.amount,
      description: transaction.description,
      occurredAtIso: transaction.occurredAt.toISOString(),
    })),
  };
}

export async function createManualSaveSlot(params: {
  careerId: string;
  name?: string;
}) {
  return prisma.$transaction(async (tx) => {
    const career = await tx.career.findUnique({
      where: { id: params.careerId },
      select: {
        id: true,
        profileId: true,
        name: true,
      },
    });
    if (!career) {
      throw new Error("Career not found for manual save.");
    }

    const label = params.name?.trim() || `Manual Save ${nowLabel()}`;
    const snapshot = await buildSnapshot(tx, {
      careerId: career.id,
      trigger: "MANUAL",
      label,
    });

    const slot = await tx.saveSlot.create({
      data: {
        profileId: career.profileId,
        careerId: career.id,
        name: label,
        manual: true,
        snapshot: toPrismaSnapshot(snapshot),
      },
    });

    const manualSlots = await tx.saveSlot.findMany({
      where: {
        careerId: career.id,
        manual: true,
      },
      orderBy: [{ updatedAt: "desc" }],
      select: { id: true },
    });
    const overflow = manualSlots.slice(12).map((entry) => entry.id);
    if (overflow.length > 0) {
      await tx.saveSlot.deleteMany({
        where: {
          id: { in: overflow },
        },
      });
    }

    return slot;
  });
}

export async function createAutoSaveSlot(params: {
  careerId: string;
  reason: string;
  minIntervalSeconds?: number;
}) {
  const minIntervalSeconds = params.minIntervalSeconds ?? 90;

  return prisma.$transaction(async (tx) => {
    const career = await tx.career.findUnique({
      where: { id: params.careerId },
      select: {
        id: true,
        profileId: true,
      },
    });
    if (!career) return null;

    const latestAuto = await tx.saveSlot.findFirst({
      where: {
        careerId: career.id,
        manual: false,
      },
      orderBy: [{ updatedAt: "desc" }],
      select: {
        id: true,
        updatedAt: true,
      },
    });

    if (latestAuto) {
      const elapsedSeconds = Math.floor((Date.now() - latestAuto.updatedAt.getTime()) / 1000);
      if (elapsedSeconds < minIntervalSeconds) {
        return null;
      }
    }

    const label = `Autosave (${params.reason})`;
    const snapshot = await buildSnapshot(tx, {
      careerId: career.id,
      trigger: "AUTO",
      label,
    });

    const slot = await tx.saveSlot.create({
      data: {
        profileId: career.profileId,
        careerId: career.id,
        manual: false,
        name: label,
        snapshot: toPrismaSnapshot(snapshot),
      },
    });

    const autoSlots = await tx.saveSlot.findMany({
      where: {
        careerId: career.id,
        manual: false,
      },
      orderBy: [{ updatedAt: "desc" }],
      select: { id: true },
    });
    const overflow = autoSlots.slice(5).map((entry) => entry.id);
    if (overflow.length > 0) {
      await tx.saveSlot.deleteMany({
        where: { id: { in: overflow } },
      });
    }

    return slot;
  });
}

export async function restoreFromSaveSlot(params: {
  saveSlotId: string;
  careerId: string;
}) {
  return prisma.$transaction(async (tx) => {
    const slot = await tx.saveSlot.findUnique({
      where: { id: params.saveSlotId },
      include: {
        career: {
          select: {
            id: true,
            profileId: true,
          },
        },
      },
    });

    if (!slot || !slot.career || slot.career.id !== params.careerId) {
      throw new Error("Save slot not found for this career.");
    }

    const parsedSnapshot = snapshotSchema.safeParse(slot.snapshot);
    if (!parsedSnapshot.success) {
      throw new Error("Save snapshot payload is invalid.");
    }
    const snapshot: SnapshotInput = parsedSnapshot.data;

    const career = await tx.career.findUnique({
      where: { id: params.careerId },
      select: { id: true, selectedTeamId: true },
    });
    if (!career) {
      throw new Error("Career not found while restoring save.");
    }

    await tx.career.update({
      where: { id: params.careerId },
      data: {
        currentSeasonYear: snapshot.career.currentSeasonYear,
        cashBalance: snapshot.career.cashBalance,
        reputation: snapshot.career.reputation,
        managerProfileCode: snapshot.career.managerProfileCode,
        selectedCategoryId: snapshot.career.selectedCategoryId,
        selectedTeamId: snapshot.career.selectedTeamId,
      },
    });

    if (snapshot.season) {
      await tx.season.update({
        where: { id: snapshot.season.id },
        data: {
          status: snapshot.season.status,
          currentRound: snapshot.season.currentRound,
        },
      });

      const seasonSessionIds = (
        await tx.session.findMany({
          where: {
            raceWeekend: {
              seasonId: snapshot.season.id,
            },
          },
          select: { id: true },
        })
      ).map((row) => row.id);

      if (seasonSessionIds.length > 0) {
        await tx.session.updateMany({
          where: {
            id: { in: seasonSessionIds },
          },
          data: {
            completed: false,
            startedAt: null,
            finishedAt: null,
          },
        });

        for (const session of snapshot.sessions) {
          await tx.session.update({
            where: { id: session.id },
            data: {
              completed: session.completed,
              startedAt: parseDate(session.startedAtIso),
              finishedAt: parseDate(session.finishedAtIso),
            },
          });
        }

        await tx.sessionTeamState.deleteMany({
          where: {
            sessionId: { in: seasonSessionIds },
          },
        });
        if (snapshot.sessionTeamStates.length > 0) {
          await tx.sessionTeamState.createMany({
            data: snapshot.sessionTeamStates.map((row) => ({
              sessionId: row.sessionId,
              teamId: row.teamId,
              setupConfidence: row.setupConfidence,
              trackKnowledge: row.trackKnowledge,
              practiceDelta: row.practiceDelta,
              notes: toPrismaJson(row.notes),
            })),
          });
        }

        await tx.qualifyingResult.deleteMany({
          where: { sessionId: { in: seasonSessionIds } },
        });
        if (snapshot.qualifyingResults.length > 0) {
          await tx.qualifyingResult.createMany({
            data: snapshot.qualifyingResults.map((row) => ({
              sessionId: row.sessionId,
              driverId: row.driverId,
              position: row.position,
              bestLapMs: row.bestLapMs,
              gapMs: row.gapMs,
              tyreCompound: row.tyreCompound,
            })),
          });
        }

        await tx.raceResult.deleteMany({
          where: { sessionId: { in: seasonSessionIds } },
        });
        if (snapshot.raceResults.length > 0) {
          await tx.raceResult.createMany({
            data: snapshot.raceResults.map((row) => ({
              sessionId: row.sessionId,
              driverId: row.driverId,
              position: row.position,
              points: row.points,
              lapsCompleted: row.lapsCompleted,
              totalTimeMs: row.totalTimeMs,
              status: row.status,
              pitStops: row.pitStops,
              incidents: toPrismaJson(row.incidents),
            })),
          });
        }
      }

      await tx.standingsDriver.deleteMany({
        where: {
          seasonId: snapshot.season.id,
          categoryId: snapshot.season.categoryId,
        },
      });
      if (snapshot.standings.drivers.length > 0) {
        await tx.standingsDriver.createMany({
          data: snapshot.standings.drivers.map((row) => ({
            seasonId: snapshot.season!.id,
            categoryId: snapshot.season!.categoryId,
            driverId: row.driverId,
            points: row.points,
            wins: row.wins,
            podiums: row.podiums,
            poles: row.poles,
          })),
        });
      }

      await tx.standingsTeam.deleteMany({
        where: {
          seasonId: snapshot.season.id,
          categoryId: snapshot.season.categoryId,
        },
      });
      if (snapshot.standings.teams.length > 0) {
        await tx.standingsTeam.createMany({
          data: snapshot.standings.teams.map((row) => ({
            seasonId: snapshot.season!.id,
            categoryId: snapshot.season!.categoryId,
            teamId: row.teamId,
            points: row.points,
            wins: row.wins,
            podiums: row.podiums,
          })),
        });
      }

      await tx.standingsManufacturer.deleteMany({
        where: {
          seasonId: snapshot.season.id,
          categoryId: snapshot.season.categoryId,
        },
      });
      if (snapshot.standings.manufacturers.length > 0) {
        await tx.standingsManufacturer.createMany({
          data: snapshot.standings.manufacturers.map((row) => ({
            seasonId: snapshot.season!.id,
            categoryId: snapshot.season!.categoryId,
            manufacturerName: row.manufacturerName,
            points: row.points,
            wins: row.wins,
          })),
        });
      }
    }

    await tx.transaction.deleteMany({
      where: {
        OR: [
          { careerId: params.careerId },
          ...(career.selectedTeamId ? [{ teamId: career.selectedTeamId }] : []),
        ],
      },
    });

    if (snapshot.transactions.length > 0) {
      await tx.transaction.createMany({
        data: snapshot.transactions.map((row) => ({
          careerId: row.careerId,
          teamId: row.teamId,
          kind: row.kind,
          amount: row.amount,
          description: row.description,
          occurredAt: parseDate(row.occurredAtIso) ?? new Date(),
        })),
      });
    }

    return {
      restoredCareerId: params.careerId,
      saveName: slot.name,
    };
  });
}

export async function deleteSaveSlot(params: {
  saveSlotId: string;
  careerId: string;
}) {
  return prisma.$transaction(async (tx) => {
    const slot = await tx.saveSlot.findUnique({
      where: { id: params.saveSlotId },
      select: {
        id: true,
        careerId: true,
      },
    });
    if (!slot || slot.careerId !== params.careerId) {
      throw new Error("Save slot not found for this career.");
    }

    await tx.saveSlot.delete({
      where: { id: params.saveSlotId },
    });
  });
}

export async function getExpiringContractPulse(params: {
  teamId: string | null;
  horizonDays: number;
}) {
  if (!params.teamId) {
    return { driver: 0, staff: 0, supplier: 0, sponsor: 0 };
  }

  const horizon = new Date();
  horizon.setUTCDate(horizon.getUTCDate() + params.horizonDays);

  const [driver, staff, supplier, sponsor] = await Promise.all([
    prisma.driverContract.count({
      where: {
        teamId: params.teamId,
        status: ContractStatus.ACTIVE,
        endDate: { lte: horizon },
      },
    }),
    prisma.staffContract.count({
      where: {
        teamId: params.teamId,
        status: ContractStatus.ACTIVE,
        endDate: { lte: horizon },
      },
    }),
    prisma.supplierContract.count({
      where: {
        teamId: params.teamId,
        status: ContractStatus.ACTIVE,
        endDate: { lte: horizon },
      },
    }),
    prisma.sponsorContract.count({
      where: {
        teamId: params.teamId,
        status: ContractStatus.ACTIVE,
        endDate: { lte: horizon },
      },
    }),
  ]);

  return { driver, staff, supplier, sponsor };
}
