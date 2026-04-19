"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";

import { finalizeMyTeamOnboarding, submitNegotiationProposal } from "@/features/contracts/service";
import { tryAutosaveForCareer } from "@/features/save-system/autosave";
import { prisma } from "@/persistence/prisma";

const proposalSchema = z.object({
  careerId: z.string().min(1),
  targetType: z.enum(["DRIVER", "STAFF"]),
  targetId: z.string().min(1),
  role: z.string().min(2),
  annualSalary: z.number().int().min(100_000),
  bonus: z.number().int().min(0).max(5_000_000),
  durationYears: z.number().int().min(1).max(5),
});

const finalizeSchema = z.object({
  careerId: z.string().min(1),
});

interface ActionResult {
  ok: boolean;
  message: string;
  status?: "ACCEPTED" | "COUNTER" | "REJECTED";
}

function revalidateOnboardingViews(careerId: string) {
  revalidatePath(`/career/onboarding/${careerId}`);
  revalidatePath("/game/hq");
  revalidatePath("/game/scouting");
  revalidatePath("/game/drivers");
  revalidatePath("/game/staff");
}

export async function submitOnboardingProposalAction(
  input: z.input<typeof proposalSchema>,
): Promise<ActionResult> {
  const parsed = proposalSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Invalid negotiation proposal payload.",
    };
  }

  const career = await prisma.career.findUnique({
    where: { id: parsed.data.careerId },
    select: {
      id: true,
      mode: true,
      selectedTeamId: true,
      onboardingComplete: true,
    },
  });

  if (!career || career.mode !== "MY_TEAM" || !career.selectedTeamId) {
    return {
      ok: false,
      message: "This proposal flow is only available for My Team onboarding.",
    };
  }

  if (career.onboardingComplete) {
    return {
      ok: false,
      message: "Onboarding already completed for this career.",
    };
  }

  try {
    const result = await submitNegotiationProposal({
      careerId: career.id,
      teamId: career.selectedTeamId,
      targetType: parsed.data.targetType,
      targetId: parsed.data.targetId,
      role: parsed.data.role,
      annualSalary: parsed.data.annualSalary,
      bonus: parsed.data.bonus,
      durationYears: parsed.data.durationYears,
    });

    await tryAutosaveForCareer(career.id, "ONBOARDING_NEGOTIATION");
    revalidateOnboardingViews(career.id);

    return {
      ok: true,
      message: result.message,
      status: result.status,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Could not submit onboarding proposal.",
    };
  }
}

export async function finalizeOnboardingAction(
  input: z.input<typeof finalizeSchema>,
): Promise<ActionResult & { nextPath?: string }> {
  const parsed = finalizeSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Invalid onboarding completion payload.",
    };
  }

  try {
    const result = await finalizeMyTeamOnboarding({ careerId: parsed.data.careerId });

    const cookieStore = await cookies();
    cookieStore.set("wrm_active_career_id", parsed.data.careerId, {
      path: "/",
      maxAge: 60 * 60 * 24 * 90,
      sameSite: "lax",
    });

    await tryAutosaveForCareer(parsed.data.careerId, "MY_TEAM_FOUNDATION");
    revalidateOnboardingViews(parsed.data.careerId);

    return {
      ok: true,
      message: result.message,
      nextPath: "/game/hq",
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Could not finalize onboarding.",
    };
  }
}
