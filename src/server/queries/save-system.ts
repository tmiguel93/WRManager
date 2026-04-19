import { prisma } from "@/persistence/prisma";
import { getActiveCareerContext } from "@/server/queries/career";
import type { SaveCenterView, SaveSlotSummary } from "@/features/save-system/types";

function defaultSnapshotLabel(manual: boolean) {
  return manual ? "Manual checkpoint" : "Autosave checkpoint";
}

function parseSnapshotSummary(snapshot: unknown, manual: boolean) {
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) {
    return {
      version: 0,
      label: defaultSnapshotLabel(manual),
      seasonYear: null as number | null,
      currentRound: null as number | null,
      cashBalance: null as number | null,
    };
  }

  const payload = snapshot as Record<string, unknown>;
  const version = typeof payload.version === "number" ? payload.version : 0;
  const label = typeof payload.label === "string" ? payload.label : defaultSnapshotLabel(manual);

  const career = payload.career;
  const season = payload.season;

  const seasonYear =
    season && typeof season === "object" && !Array.isArray(season) && typeof (season as Record<string, unknown>).year === "number"
      ? ((season as Record<string, unknown>).year as number)
      : null;

  const currentRound =
    season && typeof season === "object" && !Array.isArray(season) && typeof (season as Record<string, unknown>).currentRound === "number"
      ? ((season as Record<string, unknown>).currentRound as number)
      : null;

  const cashBalance =
    career && typeof career === "object" && !Array.isArray(career) && typeof (career as Record<string, unknown>).cashBalance === "number"
      ? ((career as Record<string, unknown>).cashBalance as number)
      : null;

  return {
    version,
    label,
    seasonYear,
    currentRound,
    cashBalance,
  };
}

export async function getSaveCenterView(): Promise<SaveCenterView> {
  const active = await getActiveCareerContext();
  if (!active.careerId) {
    return {
      careerId: null,
      careerName: active.careerName,
      categoryCode: active.categoryCode,
      currentDateIso: active.currentDateIso,
      cashBalance: active.cashBalance,
      canSave: false,
      slots: [],
    };
  }

  const [career, slotsRaw] = await Promise.all([
    prisma.career.findUnique({
      where: { id: active.careerId },
      select: {
        id: true,
        name: true,
        saveSlots: {
          orderBy: [{ updatedAt: "desc" }],
          take: 24,
          select: {
            id: true,
            name: true,
            manual: true,
            snapshot: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    }),
    prisma.saveSlot.findMany({
      where: {
        careerId: active.careerId,
      },
      orderBy: [{ updatedAt: "desc" }],
      take: 24,
      select: {
        id: true,
        name: true,
        manual: true,
        snapshot: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
  ]);

  const sourceSlots = career?.saveSlots ?? slotsRaw;
  const slots: SaveSlotSummary[] = sourceSlots.map((slot) => {
    const parsed = parseSnapshotSummary(slot.snapshot, slot.manual);
    return {
      id: slot.id,
      name: slot.name,
      manual: slot.manual,
      createdAtIso: slot.createdAt.toISOString(),
      updatedAtIso: slot.updatedAt.toISOString(),
      snapshotVersion: parsed.version,
      snapshotLabel: parsed.label,
      seasonYear: parsed.seasonYear,
      currentRound: parsed.currentRound,
      cashBalance: parsed.cashBalance,
    };
  });

  return {
    careerId: active.careerId,
    careerName: career?.name ?? active.careerName,
    categoryCode: active.categoryCode,
    currentDateIso: active.currentDateIso,
    cashBalance: active.cashBalance,
    canSave: true,
    slots,
  };
}
