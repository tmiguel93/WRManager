import "server-only";

import { createAutoSaveSlot } from "@/features/save-system/service";

export async function tryAutosaveForCareer(careerId: string | null, reason: string) {
  if (!careerId) return;

  try {
    await createAutoSaveSlot({
      careerId,
      reason,
    });
  } catch {
    // Autosave is best-effort and must never block core gameplay actions.
  }
}
