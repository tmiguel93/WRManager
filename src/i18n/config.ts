export const SUPPORTED_LOCALES = ["pt-BR", "en", "es"] as const;

export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = "pt-BR";

const LOCALE_ALIASES: Record<string, AppLocale> = {
  pt: "pt-BR",
  "pt-br": "pt-BR",
  "pt_br": "pt-BR",
  en: "en",
  "en-us": "en",
  "en-gb": "en",
  es: "es",
  "es-es": "es",
  "es-mx": "es",
};

export function normalizeLocale(input: string | null | undefined): AppLocale {
  if (!input) return DEFAULT_LOCALE;
  const normalized = input.trim().toLowerCase();
  return LOCALE_ALIASES[normalized] ?? DEFAULT_LOCALE;
}

export function localeLabel(locale: AppLocale): string {
  if (locale === "pt-BR") return "PT-BR";
  if (locale === "es") return "ES";
  return "EN";
}

