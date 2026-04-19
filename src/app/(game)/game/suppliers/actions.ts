"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { signSponsorDeal, signSupplierDeal } from "@/features/commercial/service";
import { tryAutosaveForCareer } from "@/features/save-system/autosave";
import { getActiveCareerContext } from "@/server/queries/career";

const supplierActionSchema = z.object({
  supplierId: z.string().min(1),
  termYears: z.number().int().min(1).max(3),
});

const sponsorActionSchema = z.object({
  sponsorId: z.string().min(1),
  objectiveRisk: z.enum(["SAFE", "BALANCED", "AGGRESSIVE"]),
});

interface ActionResult {
  ok: boolean;
  message: string;
}

function revalidateCommercialViews() {
  revalidatePath("/game/hq");
  revalidatePath("/game/suppliers");
  revalidatePath("/game/sponsors");
}

export async function negotiateSupplierDealAction(input: z.input<typeof supplierActionSchema>): Promise<ActionResult> {
  const parsed = supplierActionSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Invalid supplier deal request.",
    };
  }

  const active = await getActiveCareerContext();
  if (!active.careerId || !active.teamId || !active.categoryId) {
    return {
      ok: false,
      message: "Active career with team and category is required to sign supplier deals.",
    };
  }

  try {
    const deal = await signSupplierDeal({
      careerId: active.careerId,
      teamId: active.teamId,
      categoryId: active.categoryId,
      supplierId: parsed.data.supplierId,
      termYears: parsed.data.termYears,
    });

    await tryAutosaveForCareer(active.careerId, "SUPPLIER_DEAL");
    revalidateCommercialViews();

    return {
      ok: true,
      message: `${deal.supplierName} signed for ${deal.termYears} year(s). Signing fee applied.`,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Could not sign supplier deal.",
    };
  }
}

export async function negotiateSponsorDealAction(input: z.input<typeof sponsorActionSchema>): Promise<ActionResult> {
  const parsed = sponsorActionSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Invalid sponsor deal request.",
    };
  }

  const active = await getActiveCareerContext();
  if (!active.careerId || !active.teamId) {
    return {
      ok: false,
      message: "Active career with a managed team is required to sign sponsor deals.",
    };
  }

  try {
    const deal = await signSponsorDeal({
      careerId: active.careerId,
      teamId: active.teamId,
      sponsorId: parsed.data.sponsorId,
      objectiveRisk: parsed.data.objectiveRisk,
    });

    await tryAutosaveForCareer(active.careerId, "SPONSOR_DEAL");
    revalidateCommercialViews();

    return {
      ok: true,
      message: `${deal.sponsorName} signed with ${deal.objectiveRisk.toLowerCase()} objectives.`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not sign sponsor deal.";
    if (message.toLowerCase().includes("already active")) {
      return {
        ok: false,
        message: "This sponsor is already active with your team. End the current contract before negotiating again.",
      };
    }
    if (message.toLowerCase().includes("slots")) {
      return {
        ok: false,
        message: "All sponsor slots are occupied. End one active sponsor to open a slot.",
      };
    }
    return {
      ok: false,
      message,
    };
  }
}
