import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { z } from "zod";

const allowedExtensions = new Set([".svg", ".png", ".jpg", ".jpeg", ".webp"]);
const maxAssetBytes = 5 * 1024 * 1024;

const attributionSchema = z.object({
  title: z.string().min(1).optional(),
  author: z.string().min(1).optional(),
  sourcePage: z.string().url().optional(),
  licenseType: z.string().min(1),
  licenseUrl: z.string().url().nullable().optional(),
  trademarkWarning: z.boolean().default(true),
  rightsNotes: z.string().optional(),
});

const reviewSchema = z.object({
  status: z.enum(["approved", "needs_review", "rejected"]).default("needs_review"),
  reviewedBy: z.string().nullable().optional(),
  reviewedAt: z.string().nullable().optional(),
});

const entityLookupSchema = z.object({
  slug: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  categoryCode: z.string().min(1).optional(),
});

const assetEntrySchema = z.object({
  entityType: z.enum(["DRIVER", "TEAM", "STAFF", "SUPPLIER", "SPONSOR", "CIRCUIT"]),
  entityId: z.string().min(1).optional(),
  entityLookup: entityLookupSchema.optional(),
  assetType: z.enum(["DRIVER_PHOTO", "TEAM_LOGO", "SUPPLIER_LOGO", "SPONSOR_BANNER", "CIRCUIT_BANNER", "GENERIC"]),
  sourcePath: z.string().min(1).optional(),
  file: z.string().min(1).optional(),
  mediaType: z.string().min(1).optional(),
  sha256: z.string().regex(/^[a-f0-9]{64}$/i).optional(),
  approved: z.boolean().optional(),
  attribution: attributionSchema.optional(),
  review: reviewSchema.optional(),
}).refine((entry) => Boolean(entry.entityId || entry.entityLookup), {
  message: "Each entry needs entityId or entityLookup.",
}).refine((entry) => Boolean(entry.sourcePath || entry.file), {
  message: "Each entry needs sourcePath or file.",
});

export const assetPackSchema = z.object({
  formatVersion: z.number().int().positive().default(1),
  packSource: z.string().regex(/^[a-z0-9][a-z0-9._-]{1,80}$/i),
  displayName: z.string().min(1).optional(),
  version: z.string().min(1).optional(),
  author: z.string().min(1).optional(),
  description: z.string().optional(),
  defaultReviewStatus: z.enum(["approved", "needs_review", "rejected"]).default("needs_review"),
  entries: z.array(assetEntrySchema).min(1),
});

export type AssetPackPayload = z.infer<typeof assetPackSchema>;
export type AssetPackEntry = AssetPackPayload["entries"][number];

export type AssetPackInspectionEntry = {
  index: number;
  entry: AssetPackEntry;
  sourcePath: string;
  resolvedPath: string;
  publicPath: string | null;
  sha256: string | null;
  errors: string[];
  warnings: string[];
};

export type AssetPackInspectionReport = {
  manifestPath: string;
  rootDir: string;
  pack: AssetPackPayload;
  entries: AssetPackInspectionEntry[];
  validEntries: AssetPackInspectionEntry[];
  invalidEntries: AssetPackInspectionEntry[];
};

function normalizeAssetPath(entry: AssetPackEntry) {
  return entry.sourcePath ?? entry.file ?? "";
}

function isUnsafeRelativePath(value: string) {
  return (
    path.isAbsolute(value) ||
    value.includes("\0") ||
    /^[a-z]+:\/\//i.test(value) ||
    /^[a-z]:[\\/]/i.test(value) ||
    value.split(/[\\/]/).includes("..")
  );
}

function toPublicPath(resolvedPath: string) {
  const publicRoot = path.resolve(process.cwd(), "public");
  const relative = path.relative(publicRoot, resolvedPath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) return null;
  return `/${relative.replaceAll(path.sep, "/")}`;
}

async function sha256(filePath: string) {
  const buffer = await fs.readFile(filePath);
  return createHash("sha256").update(buffer).digest("hex");
}

async function validateSvg(filePath: string) {
  const svg = await fs.readFile(filePath, "utf8");
  const blockedPatterns = [
    /<script[\s>]/i,
    /<foreignObject[\s>]/i,
    /\son[a-z]+\s*=/i,
    /\b(?:href|xlink:href)\s*=\s*["']https?:/i,
    /url\(\s*https?:/i,
  ];
  return blockedPatterns.some((pattern) => pattern.test(svg))
    ? ["SVG contains script, foreignObject, event handlers, or remote references."]
    : [];
}

export async function readAssetPackManifest(manifestPath: string) {
  const raw = await fs.readFile(manifestPath, "utf8");
  return assetPackSchema.parse(JSON.parse(raw));
}

export async function inspectAssetPack(manifestPath: string): Promise<AssetPackInspectionReport> {
  const pack = await readAssetPackManifest(manifestPath);
  const rootDir = path.dirname(path.resolve(manifestPath));
  const entries: AssetPackInspectionEntry[] = [];
  const seen = new Set<string>();

  for (const [index, entry] of pack.entries.entries()) {
    const sourcePath = normalizeAssetPath(entry);
    const errors: string[] = [];
    const warnings: string[] = [];
    let resolvedPath = path.resolve(rootDir, sourcePath);
    let digest: string | null = null;

    if (isUnsafeRelativePath(sourcePath)) {
      errors.push("Asset path must be relative and cannot contain traversal, URLs, drive letters, or null bytes.");
      resolvedPath = path.join(rootDir, "__invalid__");
    }

    if (!resolvedPath.startsWith(`${rootDir}${path.sep}`) && resolvedPath !== rootDir) {
      errors.push("Asset path resolves outside of the manifest directory.");
    }

    const extension = path.extname(sourcePath).toLowerCase();
    if (!allowedExtensions.has(extension)) {
      errors.push(`Unsupported asset extension: ${extension || "(none)"}.`);
    }

    try {
      const stat = await fs.stat(resolvedPath);
      if (!stat.isFile()) errors.push("Asset path is not a file.");
      if (stat.size > maxAssetBytes) errors.push("Asset exceeds the 5MB safety limit.");
      digest = await sha256(resolvedPath);
      if (entry.sha256 && entry.sha256.toLowerCase() !== digest) {
        errors.push("SHA-256 mismatch.");
      }
      if (extension === ".svg") {
        errors.push(...(await validateSvg(resolvedPath)));
      }
    } catch {
      errors.push("Asset file was not found.");
    }

    if (!entry.entityId) {
      warnings.push("entityLookup is accepted for review, but import currently requires manual entityId resolution.");
    }

    if (!entry.attribution?.licenseType) {
      warnings.push("Attribution licenseType is recommended for all non-placeholder asset packs.");
    }

    const duplicateKey = `${entry.entityType}:${entry.entityId ?? JSON.stringify(entry.entityLookup)}:${entry.assetType}:${sourcePath}`;
    if (seen.has(duplicateKey)) {
      errors.push("Duplicate asset entry in manifest.");
    }
    seen.add(duplicateKey);

    entries.push({
      index,
      entry,
      sourcePath,
      resolvedPath,
      publicPath: toPublicPath(resolvedPath),
      sha256: digest,
      errors,
      warnings,
    });
  }

  return {
    manifestPath: path.resolve(manifestPath),
    rootDir,
    pack,
    entries,
    validEntries: entries.filter((entry) => entry.errors.length === 0),
    invalidEntries: entries.filter((entry) => entry.errors.length > 0),
  };
}
