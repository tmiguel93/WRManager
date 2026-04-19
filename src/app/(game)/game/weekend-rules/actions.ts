"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { generateRaceWeekendSkeleton } from "@/features/weekend-rules/service";

const generateWeekendActionSchema = z.object({
  eventId: z.string().min(1),
});

interface ActionResult {
  ok: boolean;
  message: string;
}

export async function generateWeekendSkeletonAction(
  input: z.input<typeof generateWeekendActionSchema>,
): Promise<ActionResult> {
  const parsed = generateWeekendActionSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Invalid event payload for weekend generation.",
    };
  }

  try {
    const result = await generateRaceWeekendSkeleton({
      eventId: parsed.data.eventId,
    });

    revalidatePath("/game/weekend-rules");
    revalidatePath("/game/calendar");

    return {
      ok: true,
      message: `Weekend generated for ${result.eventName} with ${result.sessionsCount} sessions.`,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Could not generate weekend skeleton.",
    };
  }
}
