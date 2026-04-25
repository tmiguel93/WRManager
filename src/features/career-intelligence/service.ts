import "server-only";

import { Prisma } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/persistence/prisma";

const objectiveSnapshotSchema = z.object({
  careerId: z.string().min(1),
  key: z.string().min(1),
  titleKey: z.string().min(1),
  descriptionKey: z.string().min(1),
  progress: z.number().int().min(0).max(100),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]),
  pinned: z.boolean().default(true),
});

const opportunityDecisionSchema = z.object({
  careerId: z.string().min(1),
  teamId: z.string().min(1),
  categoryId: z.string().min(1),
  invitationScore: z.number().int().min(0).max(100),
  reasonKey: z.string().min(1),
  status: z.enum(["WATCHLIST", "ACCEPTED", "DECLINED"]),
});

const milestoneSnapshotSchema = z.object({
  careerId: z.string().min(1),
  key: z.string().min(1),
  titleKey: z.string().min(1),
  detailKey: z.string().min(1),
  progress: z.number().int().min(0).max(100),
  achieved: z.boolean(),
});

const academyWatchlistSchema = z.object({
  careerId: z.string().min(1),
  driverId: z.string().min(1),
  fitScore: z.number().int().min(0).max(100),
  status: z.enum(["WATCHLIST", "ARCHIVED"]),
});

export type ObjectiveSnapshotInput = z.input<typeof objectiveSnapshotSchema>;
export type OpportunityDecisionInput = z.input<typeof opportunityDecisionSchema>;
export type MilestoneSnapshotInput = z.input<typeof milestoneSnapshotSchema>;
export type AcademyWatchlistInput = z.input<typeof academyWatchlistSchema>;

function toJson(value: unknown): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput {
  if (value === null || value === undefined) return Prisma.JsonNull;
  return value as Prisma.InputJsonValue;
}

export async function saveCareerObjectiveSnapshot(input: ObjectiveSnapshotInput) {
  const parsed = objectiveSnapshotSchema.parse(input);

  return prisma.careerObjective.upsert({
    where: {
      careerId_key: {
        careerId: parsed.careerId,
        key: parsed.key,
      },
    },
    update: {
      titleKey: parsed.titleKey,
      descriptionKey: parsed.descriptionKey,
      progress: parsed.progress,
      priority: parsed.priority,
      pinned: parsed.pinned,
      status: parsed.progress >= 100 ? "COMPLETED" : "ACTIVE",
      completedAt: parsed.progress >= 100 ? new Date() : null,
    },
    create: {
      careerId: parsed.careerId,
      key: parsed.key,
      titleKey: parsed.titleKey,
      descriptionKey: parsed.descriptionKey,
      progress: parsed.progress,
      priority: parsed.priority,
      pinned: parsed.pinned,
      status: parsed.progress >= 100 ? "COMPLETED" : "ACTIVE",
      completedAt: parsed.progress >= 100 ? new Date() : null,
    },
  });
}

export async function decideCareerOpportunity(input: OpportunityDecisionInput) {
  const parsed = opportunityDecisionSchema.parse(input);

  const team = await prisma.team.findUnique({
    where: { id: parsed.teamId },
    select: { id: true, categoryId: true },
  });
  if (!team || team.categoryId !== parsed.categoryId) {
    throw new Error("Career opportunity is no longer available.");
  }

  return prisma.careerOpportunity.upsert({
    where: {
      careerId_teamId_categoryId: {
        careerId: parsed.careerId,
        teamId: parsed.teamId,
        categoryId: parsed.categoryId,
      },
    },
    update: {
      invitationScore: parsed.invitationScore,
      reasonKey: parsed.reasonKey,
      status: parsed.status,
      decidedAt: parsed.status === "WATCHLIST" ? null : new Date(),
      meta: toJson({ source: "career-road" }),
    },
    create: {
      careerId: parsed.careerId,
      teamId: parsed.teamId,
      categoryId: parsed.categoryId,
      invitationScore: parsed.invitationScore,
      reasonKey: parsed.reasonKey,
      status: parsed.status,
      decidedAt: parsed.status === "WATCHLIST" ? null : new Date(),
      meta: toJson({ source: "career-road" }),
    },
  });
}

export async function recordCareerMilestone(input: MilestoneSnapshotInput) {
  const parsed = milestoneSnapshotSchema.parse(input);

  return prisma.careerMilestone.upsert({
    where: {
      careerId_key: {
        careerId: parsed.careerId,
        key: parsed.key,
      },
    },
    update: {
      titleKey: parsed.titleKey,
      progress: parsed.progress,
      status: parsed.achieved ? "ACHIEVED" : "IN_PROGRESS",
      achievedAt: parsed.achieved ? new Date() : null,
      meta: toJson({ detailKey: parsed.detailKey }),
    },
    create: {
      careerId: parsed.careerId,
      key: parsed.key,
      titleKey: parsed.titleKey,
      progress: parsed.progress,
      status: parsed.achieved ? "ACHIEVED" : "IN_PROGRESS",
      achievedAt: parsed.achieved ? new Date() : null,
      meta: toJson({ detailKey: parsed.detailKey }),
    },
  });
}

export async function setAcademyWatchlistEntry(input: AcademyWatchlistInput) {
  const parsed = academyWatchlistSchema.parse(input);

  const driver = await prisma.driver.findUnique({
    where: { id: parsed.driverId },
    select: { id: true },
  });
  if (!driver) {
    throw new Error("Driver is no longer available for academy tracking.");
  }

  return prisma.careerAcademyWatchlist.upsert({
    where: {
      careerId_driverId: {
        careerId: parsed.careerId,
        driverId: parsed.driverId,
      },
    },
    update: {
      fitScore: parsed.fitScore,
      status: parsed.status,
    },
    create: {
      careerId: parsed.careerId,
      driverId: parsed.driverId,
      fitScore: parsed.fitScore,
      status: parsed.status,
    },
  });
}
