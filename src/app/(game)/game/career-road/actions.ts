"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  decideCareerOpportunity,
  recordCareerMilestone,
  saveCareerObjectiveSnapshot,
  setAcademyWatchlistEntry,
} from "@/features/career-intelligence/service";
import { tryAutosaveForCareer } from "@/features/save-system/autosave";
import { toPublicErrorMessage } from "@/lib/public-error";
import { getActiveCareerContext } from "@/server/queries/career";

const objectiveActionSchema = z.object({
  key: z.string().min(1),
  titleKey: z.string().min(1),
  descriptionKey: z.string().min(1),
  progress: z.number().int().min(0).max(100),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]),
});

const opportunityActionSchema = z.object({
  teamId: z.string().min(1),
  categoryId: z.string().min(1),
  invitationScore: z.number().int().min(0).max(100),
  reasonKey: z.string().min(1),
  status: z.enum(["WATCHLIST", "ACCEPTED", "DECLINED"]),
});

const milestoneActionSchema = z.object({
  key: z.string().min(1),
  titleKey: z.string().min(1),
  detailKey: z.string().min(1),
  progress: z.number().int().min(0).max(100),
  achieved: z.boolean(),
});

const watchlistActionSchema = z.object({
  driverId: z.string().min(1),
  fitScore: z.number().int().min(0).max(100),
  status: z.enum(["WATCHLIST", "ARCHIVED"]),
});

interface CareerRoadActionResult {
  ok: boolean;
  messageKey: string;
  message?: string;
}

function revalidateCareerRoadViews() {
  revalidatePath("/game/career-road");
  revalidatePath("/game/hq");
  revalidatePath("/game/scouting");
  revalidatePath("/game/newsroom");
  revalidatePath("/game/global-hub");
}

async function requireCareer() {
  const active = await getActiveCareerContext();
  if (!active.careerId) {
    throw new Error("No active career selected.");
  }
  return { ...active, careerId: active.careerId };
}

export async function saveCareerObjectiveAction(
  input: z.input<typeof objectiveActionSchema>,
): Promise<CareerRoadActionResult> {
  const parsed = objectiveActionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, messageKey: "careerRoad.actionInvalid" };
  }

  try {
    const active = await requireCareer();
    await saveCareerObjectiveSnapshot({
      careerId: active.careerId,
      ...parsed.data,
      pinned: true,
    });
    await tryAutosaveForCareer(active.careerId, "CAREER_OBJECTIVE");
    revalidateCareerRoadViews();
    return { ok: true, messageKey: "careerRoad.actionObjectiveSaved" };
  } catch (error) {
    return {
      ok: false,
      messageKey: "careerRoad.actionFailed",
      message: toPublicErrorMessage(error, "Could not save objective."),
    };
  }
}

export async function decideCareerOpportunityAction(
  input: z.input<typeof opportunityActionSchema>,
): Promise<CareerRoadActionResult> {
  const parsed = opportunityActionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, messageKey: "careerRoad.actionInvalid" };
  }

  try {
    const active = await requireCareer();
    await decideCareerOpportunity({
      careerId: active.careerId,
      ...parsed.data,
    });
    await tryAutosaveForCareer(active.careerId, "CAREER_OPPORTUNITY");
    revalidateCareerRoadViews();
    return {
      ok: true,
      messageKey:
        parsed.data.status === "ACCEPTED"
          ? "careerRoad.actionOpportunityAccepted"
          : parsed.data.status === "DECLINED"
            ? "careerRoad.actionOpportunityDeclined"
            : "careerRoad.actionOpportunitySaved",
    };
  } catch (error) {
    return {
      ok: false,
      messageKey: "careerRoad.actionFailed",
      message: toPublicErrorMessage(error, "Could not update opportunity."),
    };
  }
}

export async function setAcademyWatchlistAction(
  input: z.input<typeof watchlistActionSchema>,
): Promise<CareerRoadActionResult> {
  const parsed = watchlistActionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, messageKey: "careerRoad.actionInvalid" };
  }

  try {
    const active = await requireCareer();
    await setAcademyWatchlistEntry({
      careerId: active.careerId,
      ...parsed.data,
    });
    await tryAutosaveForCareer(active.careerId, "ACADEMY_WATCHLIST");
    revalidateCareerRoadViews();
    return {
      ok: true,
      messageKey:
        parsed.data.status === "WATCHLIST"
          ? "careerRoad.actionProspectAdded"
          : "careerRoad.actionProspectArchived",
    };
  } catch (error) {
    return {
      ok: false,
      messageKey: "careerRoad.actionFailed",
      message: toPublicErrorMessage(error, "Could not update academy watchlist."),
    };
  }
}

export async function recordCareerMilestoneAction(
  input: z.input<typeof milestoneActionSchema>,
): Promise<CareerRoadActionResult> {
  const parsed = milestoneActionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, messageKey: "careerRoad.actionInvalid" };
  }

  try {
    const active = await requireCareer();
    await recordCareerMilestone({
      careerId: active.careerId,
      ...parsed.data,
    });
    await tryAutosaveForCareer(active.careerId, "CAREER_MILESTONE");
    revalidateCareerRoadViews();
    return { ok: true, messageKey: "careerRoad.actionMilestoneRecorded" };
  } catch (error) {
    return {
      ok: false,
      messageKey: "careerRoad.actionFailed",
      message: toPublicErrorMessage(error, "Could not record milestone."),
    };
  }
}
