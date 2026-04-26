import { z } from "zod";

import { canonicalKey, canonicalText } from "@/lib/canonical";

export const importSourceSchema = z.object({
  label: z.string().min(2).max(120),
  url: z.string().url(),
  confidence: z.number().int().min(0).max(100).default(70),
  lastVerifiedAt: z.string().datetime(),
});

export type ImportSource = z.infer<typeof importSourceSchema>;

export type DedupeReport<T> = {
  rows: T[];
  duplicates: Array<{ key: string; keptIndex: number; duplicateIndex: number }>;
};

export function canonicalEntityKey(parts: Array<string | number | null | undefined>) {
  return canonicalKey(parts.map((part) => (part === undefined || part === null ? "" : String(part))));
}

export function canonicalAssetKey(value: string) {
  return canonicalText(value).replaceAll(" ", "-");
}

export function normalizeCountryCode(value: string) {
  return value.trim().toUpperCase();
}

export function parseImportDate(value: string) {
  return new Date(value);
}

export function sourcePackKey(source: ImportSource) {
  return canonicalAssetKey(source.label).slice(0, 80) || "import-source";
}

export function dedupeRows<T>(rows: T[], keyFor: (row: T) => string): DedupeReport<T> {
  const seen = new Map<string, number>();
  const deduped: T[] = [];
  const duplicates: DedupeReport<T>["duplicates"] = [];

  rows.forEach((row, index) => {
    const key = keyFor(row);
    const existingIndex = seen.get(key);
    if (existingIndex !== undefined) {
      duplicates.push({ key, keptIndex: existingIndex, duplicateIndex: index });
      return;
    }

    seen.set(key, index);
    deduped.push(row);
  });

  return { rows: deduped, duplicates };
}

export function chooseSource(incoming: ImportSource, existingConfidence?: number | null) {
  if (existingConfidence !== undefined && existingConfidence !== null && existingConfidence > incoming.confidence) {
    return { shouldUpdateSource: false };
  }

  return { shouldUpdateSource: true };
}
