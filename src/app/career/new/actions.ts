"use server";

import { cookies } from "next/headers";

import { createCareerSchema, type CreateCareerInput } from "@/features/career/schema";
import { createCareerWithSetup } from "@/features/career/service";
import { toPublicErrorMessage } from "@/lib/public-error";

interface CreateCareerActionResult {
  ok: boolean;
  careerId?: string;
  nextPath?: string;
  message: string;
  fieldErrors?: Record<string, string[]>;
}

export async function createCareerAction(
  input: CreateCareerInput,
): Promise<CreateCareerActionResult> {
  const validated = createCareerSchema.safeParse(input);
  if (!validated.success) {
    return {
      ok: false,
      message: "Validation failed.",
      fieldErrors: validated.error.flatten().fieldErrors,
    };
  }

  try {
    const created = await createCareerWithSetup(validated.data);
    const cookieStore = await cookies();
    cookieStore.set("wrm_active_career_id", created.careerId, {
      path: "/",
      maxAge: 60 * 60 * 24 * 90,
      sameSite: "lax",
    });

    return {
      ok: true,
      message: "Career created successfully.",
      careerId: created.careerId,
      nextPath:
        created.mode === "MY_TEAM"
          ? `/career/onboarding/${created.careerId}`
          : `/game/hq?careerId=${created.careerId}`,
    };
  } catch (error) {
    return {
      ok: false,
      message: toPublicErrorMessage(error, "Could not create career due to an unexpected error."),
    };
  }
}
