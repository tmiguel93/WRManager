"use server";

import { cookies } from "next/headers";
import { z } from "zod";

import { normalizeLocale } from "@/i18n/config";
import { prisma } from "@/persistence/prisma";

const setLocaleSchema = z.object({
  locale: z.string().min(2),
});

interface LocaleActionResult {
  ok: boolean;
  message: string;
}

export async function setLocalePreferenceAction(
  input: z.input<typeof setLocaleSchema>,
): Promise<LocaleActionResult> {
  const parsed = setLocaleSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Invalid locale selection.",
    };
  }

  const locale = normalizeLocale(parsed.data.locale);

  const cookieStore = await cookies();
  cookieStore.set("wrm_locale", locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
    sameSite: "lax",
  });

  const profile = await prisma.profile.findFirst({
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  if (profile) {
    await prisma.profile.update({
      where: { id: profile.id },
      data: { locale },
    });
  }

  return {
    ok: true,
    message: "Language updated.",
  };
}

