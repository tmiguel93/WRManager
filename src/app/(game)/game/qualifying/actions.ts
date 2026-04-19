"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getActiveCareerContext } from "@/server/queries/career";
import { tryAutosaveForCareer } from "@/features/save-system/autosave";
import { runQualifyingSession } from "@/features/weekend-sessions/service";
import { generateRaceWeekendSkeleton } from "@/features/weekend-rules/service";

const runQualifyingActionSchema = z.object({
  sessionId: z.string().min(1),
  mode: z.enum(["QUICK", "DETAILED"]),
  riskLevel: z.number().int().min(20).max(95),
  releaseTiming: z.enum(["EARLY", "MID", "LATE"]),
  tyreCompound: z.enum(["SOFT", "MEDIUM", "HARD"]),
});

const generateWeekendActionSchema = z.object({
  eventId: z.string().min(1),
});

interface ActionResult {
  ok: boolean;
  message: string;
}

function revalidateQualifyingViews() {
  revalidatePath("/game/practice");
  revalidatePath("/game/qualifying");
  revalidatePath("/game/weekend-rules");
  revalidatePath("/game/calendar");
}

export async function generateWeekendForQualifyingAction(
  input: z.input<typeof generateWeekendActionSchema>,
): Promise<ActionResult> {
  const parsed = generateWeekendActionSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Invalid event payload.",
    };
  }

  try {
    const result = await generateRaceWeekendSkeleton({
      eventId: parsed.data.eventId,
    });

    await tryAutosaveForCareer((await getActiveCareerContext()).careerId, "WEEKEND_GENERATED");
    revalidateQualifyingViews();

    return {
      ok: true,
      message: `Weekend generated for ${result.eventName}.`,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Could not generate weekend.",
    };
  }
}

export async function runQualifyingSimulationAction(
  input: z.input<typeof runQualifyingActionSchema>,
): Promise<ActionResult> {
  const parsed = runQualifyingActionSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Invalid qualifying payload.",
    };
  }

  const active = await getActiveCareerContext();
  if (!active.teamId) {
    return {
      ok: false,
      message: "An active managed team is required for qualifying simulation.",
    };
  }

  try {
    const result = await runQualifyingSession({
      sessionId: parsed.data.sessionId,
      teamId: active.teamId,
      mode: parsed.data.mode,
      riskLevel: parsed.data.riskLevel,
      releaseTiming: parsed.data.releaseTiming,
      tyreCompound: parsed.data.tyreCompound,
    });

    await tryAutosaveForCareer(active.careerId, "QUALIFYING_SESSION");
    revalidateQualifyingViews();

    return {
      ok: true,
      message: `Qualifying complete. Grid entries: ${result.entries}.`,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Could not run qualifying session.",
    };
  }
}
