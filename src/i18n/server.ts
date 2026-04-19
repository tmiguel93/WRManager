import "server-only";

import { cookies } from "next/headers";

import { DEFAULT_LOCALE, normalizeLocale, type AppLocale } from "@/i18n/config";
import { translate } from "@/i18n/translate";
import { prisma } from "@/persistence/prisma";

export async function getCurrentLocale(): Promise<AppLocale> {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("wrm_locale")?.value ?? null;
  if (cookieLocale) {
    return normalizeLocale(cookieLocale);
  }

  const profile = await prisma.profile.findFirst({
    orderBy: { createdAt: "asc" },
    select: { locale: true },
  });
  if (!profile) {
    return DEFAULT_LOCALE;
  }
  return normalizeLocale(profile.locale);
}

export async function getServerTranslator() {
  const locale = await getCurrentLocale();
  return {
    locale,
    t: (key: string, fallback?: string, values?: Record<string, string | number>) =>
      translate(locale, key, fallback, values),
  };
}

