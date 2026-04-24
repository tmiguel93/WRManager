"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getActiveCareerContext } from "@/server/queries/career";
import { tryAutosaveForCareer } from "@/features/save-system/autosave";
import { runPracticeSession } from "@/features/weekend-sessions/service";
import { generateRaceWeekendSkeleton } from "@/features/weekend-rules/service";
import { toPublicErrorMessage } from "@/lib/public-error";

const runPracticeActionSchema = z.object({
  sessionId: z.string().min(1),
  runPlan: z.enum(["SHORT", "BALANCED", "LONG"]),
  aeroBalanceFocus: z.number().int().min(-100).max(100),
  weatherFocus: z.number().int().min(-100).max(100),
});

const generateWeekendActionSchema = z.object({
  eventId: z.string().min(1),
});

interface ActionResult {
  ok: boolean;
  message: string;
}

function revalidatePracticeViews() {
  revalidatePath("/game/practice");
  revalidatePath("/game/qualifying");
  revalidatePath("/game/weekend-rules");
  revalidatePath("/game/calendar");
}

export async function generateWeekendForPracticeAction(
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
    revalidatePracticeViews();

    return {
      ok: true,
      message: `Weekend generated for ${result.eventName}.`,
    };
  } catch (error) {
    return {
      ok: false,
      message: toPublicErrorMessage(error, "Could not generate weekend."),
    };
  }
}

export async function runPracticeSimulationAction(
  input: z.input<typeof runPracticeActionSchema>,
): Promise<ActionResult> {
  const parsed = runPracticeActionSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Invalid practice setup payload.",
    };
  }

  const active = await getActiveCareerContext();
  if (!active.teamId) {
    return {
      ok: false,
      message: "An active managed team is required for practice simulation.",
    };
  }

  try {
    const result = await runPracticeSession({
      sessionId: parsed.data.sessionId,
      teamId: active.teamId,
      runPlan: parsed.data.runPlan,
      aeroBalanceFocus: parsed.data.aeroBalanceFocus,
      weatherFocus: parsed.data.weatherFocus,
    });

    await tryAutosaveForCareer(active.careerId, "PRACTICE_SESSION");
    revalidatePracticeViews();

    return {
      ok: true,
      message: `Practice complete. Setup ${result.setupConfidence}, track knowledge ${result.trackKnowledge}.`,
    };
  } catch (error) {
    return {
      ok: false,
      message: toPublicErrorMessage(error, "Could not run practice session."),
    };
  }
}
