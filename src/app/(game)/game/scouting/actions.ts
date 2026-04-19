"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { submitNegotiationProposal } from "@/features/contracts/service";
import { getActiveCareerContext } from "@/server/queries/career";
import { tryAutosaveForCareer } from "@/features/save-system/autosave";

const submitProposalSchema = z.object({
  targetType: z.enum(["DRIVER", "STAFF"]),
  targetId: z.string().min(1),
  role: z.string().min(2),
  annualSalary: z.number().int().min(100_000),
  bonus: z.number().int().min(0).max(5_000_000),
  durationYears: z.number().int().min(1).max(5),
});

interface ActionResult {
  ok: boolean;
  message: string;
  status?: "ACCEPTED" | "COUNTER" | "REJECTED";
}

export async function submitScoutingProposalAction(
  input: z.input<typeof submitProposalSchema>,
): Promise<ActionResult> {
  const parsed = submitProposalSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Invalid proposal payload.",
    };
  }

  const active = await getActiveCareerContext();
  if (!active.careerId || !active.teamId) {
    return {
      ok: false,
      message: "A managed team is required to send proposals.",
    };
  }

  try {
    const result = await submitNegotiationProposal({
      careerId: active.careerId,
      teamId: active.teamId,
      targetType: parsed.data.targetType,
      targetId: parsed.data.targetId,
      role: parsed.data.role,
      annualSalary: parsed.data.annualSalary,
      bonus: parsed.data.bonus,
      durationYears: parsed.data.durationYears,
    });

    await tryAutosaveForCareer(active.careerId, "NEGOTIATION_PROPOSAL");
    revalidatePath("/game/scouting");
    revalidatePath("/game/drivers");
    revalidatePath("/game/staff");
    revalidatePath("/game/hq");

    return {
      ok: true,
      message: result.message,
      status: result.status,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Could not send proposal.",
    };
  }
}

