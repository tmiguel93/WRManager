"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getActiveCareerContext } from "@/server/queries/career";
import { runRaceControlSession } from "@/features/race-control/service";
import { generateRaceWeekendSkeleton } from "@/features/weekend-rules/service";
import { tryAutosaveForCareer } from "@/features/save-system/autosave";

const runRaceActionSchema = z.object({
  sessionId: z.string().min(1),
  paceMode: z.enum(["ATTACK", "NEUTRAL", "CONSERVE"]),
  pitPlan: z.enum(["UNDERCUT", "BALANCED", "OVERCUT"]),
  fuelMode: z.enum(["PUSH", "NORMAL", "SAVE"]),
  tyreMode: z.enum(["PUSH", "NORMAL", "SAVE"]),
  teamOrders: z.enum(["HOLD", "FREE_FIGHT"]),
  weatherReaction: z.enum(["SAFE", "REACTIVE", "AGGRESSIVE"]),
});

const generateWeekendActionSchema = z.object({
  eventId: z.string().min(1),
});

interface ActionResult {
  ok: boolean;
  message: string;
}

function revalidateRaceViews() {
  revalidatePath("/game/race-control");
  revalidatePath("/game/qualifying");
  revalidatePath("/game/standings");
  revalidatePath("/game/calendar");
  revalidatePath("/game/hq");
}

export async function generateWeekendForRaceAction(
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
    revalidateRaceViews();

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

export async function runRaceControlAction(
  input: z.input<typeof runRaceActionSchema>,
): Promise<ActionResult> {
  const parsed = runRaceActionSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Invalid race strategy payload.",
    };
  }

  const active = await getActiveCareerContext();
  if (!active.teamId) {
    return {
      ok: false,
      message: "An active managed team is required for race control simulation.",
    };
  }

  try {
    const result = await runRaceControlSession({
      sessionId: parsed.data.sessionId,
      teamId: active.teamId,
      paceMode: parsed.data.paceMode,
      pitPlan: parsed.data.pitPlan,
      fuelMode: parsed.data.fuelMode,
      tyreMode: parsed.data.tyreMode,
      teamOrders: parsed.data.teamOrders,
      weatherReaction: parsed.data.weatherReaction,
    });

    await tryAutosaveForCareer(active.careerId, "RACE_SESSION");
    revalidateRaceViews();

    return {
      ok: true,
      message: `Race complete. Winner ${result.winnerName}. Managed points ${result.managedPoints}.`,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Could not run race control simulation.",
    };
  }
}

