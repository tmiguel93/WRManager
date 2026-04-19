"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";

import { getActiveCareerContext } from "@/server/queries/career";
import { createAutoSaveSlot, createManualSaveSlot, deleteSaveSlot, restoreFromSaveSlot } from "@/features/save-system/service";

const manualSaveSchema = z.object({
  name: z.string().max(80).optional(),
});

const slotSchema = z.object({
  saveSlotId: z.string().min(1),
});

interface SaveActionResult {
  ok: boolean;
  message: string;
}

function revalidateSaveViews() {
  revalidatePath("/game/save-center");
  revalidatePath("/game/hq");
  revalidatePath("/game/calendar");
  revalidatePath("/game/standings");
  revalidatePath("/game/practice");
  revalidatePath("/game/qualifying");
  revalidatePath("/game/race-control");
  revalidatePath("/game/newsroom");
  revalidatePath("/game/global-hub");
}

export async function createManualSaveAction(input: z.input<typeof manualSaveSchema>): Promise<SaveActionResult> {
  const parsed = manualSaveSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Invalid save name payload.",
    };
  }

  const active = await getActiveCareerContext();
  if (!active.careerId) {
    return {
      ok: false,
      message: "Create or select a career before saving progress.",
    };
  }

  try {
    const slot = await createManualSaveSlot({
      careerId: active.careerId,
      name: parsed.data.name,
    });

    revalidateSaveViews();

    return {
      ok: true,
      message: `Manual save created: ${slot.name}.`,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Failed to create manual save.",
    };
  }
}

export async function quickAutoSaveAction(): Promise<SaveActionResult> {
  const active = await getActiveCareerContext();
  if (!active.careerId) {
    return {
      ok: false,
      message: "No active career selected for autosave.",
    };
  }

  try {
    const slot = await createAutoSaveSlot({
      careerId: active.careerId,
      reason: "QUICK",
      minIntervalSeconds: 0,
    });

    revalidateSaveViews();

    return {
      ok: true,
      message: slot ? "Autosave checkpoint created." : "Autosave skipped by interval policy.",
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Autosave failed.",
    };
  }
}

export async function loadSaveSlotAction(input: z.input<typeof slotSchema>): Promise<SaveActionResult> {
  const parsed = slotSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Invalid load request.",
    };
  }

  const active = await getActiveCareerContext();
  if (!active.careerId) {
    return {
      ok: false,
      message: "No active career selected for loading.",
    };
  }

  try {
    const restored = await restoreFromSaveSlot({
      saveSlotId: parsed.data.saveSlotId,
      careerId: active.careerId,
    });

    const cookieStore = await cookies();
    cookieStore.set("wrm_active_career_id", restored.restoredCareerId, {
      path: "/",
      maxAge: 60 * 60 * 24 * 180,
      sameSite: "lax",
    });

    revalidateSaveViews();

    return {
      ok: true,
      message: `Save loaded: ${restored.saveName}.`,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Failed to load save.",
    };
  }
}

export async function deleteSaveSlotAction(input: z.input<typeof slotSchema>): Promise<SaveActionResult> {
  const parsed = slotSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Invalid delete request.",
    };
  }

  const active = await getActiveCareerContext();
  if (!active.careerId) {
    return {
      ok: false,
      message: "No active career selected for deleting saves.",
    };
  }

  try {
    await deleteSaveSlot({
      saveSlotId: parsed.data.saveSlotId,
      careerId: active.careerId,
    });

    revalidateSaveViews();

    return {
      ok: true,
      message: "Save slot removed.",
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Failed to delete save slot.",
    };
  }
}
