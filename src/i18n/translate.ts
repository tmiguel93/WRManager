import type { AppLocale } from "@/i18n/config";
import { extraMessages } from "@/i18n/extra-messages";
import { messages } from "@/i18n/messages";

function readPath(source: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((current, segment) => {
    if (!current || typeof current !== "object" || Array.isArray(current)) {
      return undefined;
    }
    return (current as Record<string, unknown>)[segment];
  }, source);
}

function interpolate(template: string, values?: Record<string, string | number>) {
  if (!values) return template;
  return Object.entries(values).reduce((acc, [key, value]) => {
    return acc.replaceAll(`{${key}}`, String(value));
  }, template);
}

export function translate(
  locale: AppLocale,
  key: string,
  fallback?: string,
  values?: Record<string, string | number>,
): string {
  const localeDict = messages[locale] as Record<string, unknown>;
  const defaultDict = messages["en"] as Record<string, unknown>;
  const extraLocaleDict = extraMessages[locale] as Record<string, unknown>;
  const extraDefaultDict = extraMessages["en"] as Record<string, unknown>;

  const localized = readPath(localeDict, key);
  const extraLocalized = readPath(extraLocaleDict, key);
  const english = readPath(defaultDict, key);
  const extraEnglish = readPath(extraDefaultDict, key);
  const picked =
    (typeof localized === "string" ? localized : undefined) ??
    (typeof extraLocalized === "string" ? extraLocalized : undefined) ??
    (typeof english === "string" ? english : undefined) ??
    (typeof extraEnglish === "string" ? extraEnglish : undefined) ??
    fallback ??
    key;

  return interpolate(picked, values);
}
