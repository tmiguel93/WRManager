"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  completeDevelopmentProject,
  launchDevelopmentProject,
  upgradeTeamFacility,
} from "@/features/engineering/service";
import { tryAutosaveForCareer } from "@/features/save-system/autosave";
import { getActiveCareerContext } from "@/server/queries/career";
import { toPublicErrorMessage } from "@/lib/public-error";

const launchProjectActionSchema = z.object({
  carId: z.string().min(1),
  templateCode: z.string().min(1),
});

const completeProjectActionSchema = z.object({
  projectId: z.string().min(1),
});

const upgradeFacilityActionSchema = z.object({
  teamFacilityId: z.string().min(1),
});

interface ActionResult {
  ok: boolean;
  message: string;
}

function revalidateEngineeringViews() {
  revalidatePath("/game/hq");
  revalidatePath("/game/car-development");
  revalidatePath("/game/facilities");
}

export async function launchDevelopmentProjectAction(
  input: z.input<typeof launchProjectActionSchema>,
): Promise<ActionResult> {
  const parsed = launchProjectActionSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Invalid development project payload.",
    };
  }

  const active = await getActiveCareerContext();
  if (!active.careerId || !active.teamId || !active.categoryId) {
    return {
      ok: false,
      message: "An active career with team and category is required.",
    };
  }

  try {
    const project = await launchDevelopmentProject({
      careerId: active.careerId,
      teamId: active.teamId,
      categoryId: active.categoryId,
      carId: parsed.data.carId,
      templateCode: parsed.data.templateCode,
    });

    await tryAutosaveForCareer(active.careerId, "DEVELOPMENT_LAUNCH");
    revalidateEngineeringViews();

    return {
      ok: true,
      message: `${project.name} started (${project.durationWeeks} weeks).`,
    };
  } catch (error) {
    return {
      ok: false,
      message: toPublicErrorMessage(error, "Could not start development project."),
    };
  }
}

export async function completeDevelopmentProjectAction(
  input: z.input<typeof completeProjectActionSchema>,
): Promise<ActionResult> {
  const parsed = completeProjectActionSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Invalid project completion payload.",
    };
  }

  const active = await getActiveCareerContext();
  if (!active.careerId || !active.teamId) {
    return {
      ok: false,
      message: "An active career with a managed team is required.",
    };
  }

  try {
    const result = await completeDevelopmentProject({
      careerId: active.careerId,
      teamId: active.teamId,
      projectId: parsed.data.projectId,
    });

    await tryAutosaveForCareer(active.careerId, "DEVELOPMENT_COMPLETE");
    revalidateEngineeringViews();

    return {
      ok: true,
      message: `${result.name} completed with performance delta ${result.realizedDelta}.`,
    };
  } catch (error) {
    return {
      ok: false,
      message: toPublicErrorMessage(error, "Could not complete project."),
    };
  }
}

export async function upgradeTeamFacilityAction(
  input: z.input<typeof upgradeFacilityActionSchema>,
): Promise<ActionResult> {
  const parsed = upgradeFacilityActionSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Invalid facility upgrade payload.",
    };
  }

  const active = await getActiveCareerContext();
  if (!active.careerId || !active.teamId) {
    return {
      ok: false,
      message: "An active career with a managed team is required.",
    };
  }

  try {
    const result = await upgradeTeamFacility({
      careerId: active.careerId,
      teamId: active.teamId,
      teamFacilityId: parsed.data.teamFacilityId,
    });

    await tryAutosaveForCareer(active.careerId, "FACILITY_UPGRADE");
    revalidateEngineeringViews();

    return {
      ok: true,
      message: `${result.facilityName} upgraded to level ${result.nextLevel}.`,
    };
  } catch (error) {
    return {
      ok: false,
      message: toPublicErrorMessage(error, "Could not upgrade facility."),
    };
  }
}
