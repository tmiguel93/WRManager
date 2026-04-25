import { promises as fs } from "node:fs";
import path from "node:path";
import { z } from "zod";

import { prisma } from "@/persistence/prisma";

const assetEntrySchema = z.object({
  entityType: z.enum(["DRIVER", "TEAM", "STAFF", "SUPPLIER", "SPONSOR", "CIRCUIT"]),
  entityId: z.string().min(1),
  assetType: z.enum(["DRIVER_PHOTO", "TEAM_LOGO", "SUPPLIER_LOGO", "SPONSOR_BANNER", "CIRCUIT_BANNER", "GENERIC"]),
  sourcePath: z.string().min(1),
  approved: z.boolean().default(false),
});

const assetPackSchema = z.object({
  packSource: z.string().min(1),
  entries: z.array(assetEntrySchema).min(1),
});

export type AssetPackPayload = z.infer<typeof assetPackSchema>;

export async function importAssetPack(manifestPath: string) {
  const raw = await fs.readFile(manifestPath, "utf-8");
  const parsed = assetPackSchema.parse(JSON.parse(raw));
  const rootDir = path.dirname(manifestPath);

  const uniqueEntries = new Map<string, (typeof parsed.entries)[number]>();
  for (const entry of parsed.entries) {
    const key = `${entry.entityType}:${entry.entityId}:${entry.assetType}:${parsed.packSource}`;
    uniqueEntries.set(key, entry);
  }

  let imported = 0;
  for (const entry of uniqueEntries.values()) {
    const resolvedPath = path.resolve(rootDir, entry.sourcePath);
    const existing = await prisma.assetRegistry.findFirst({
      where: {
        entityType: entry.entityType,
        entityId: entry.entityId,
        assetType: entry.assetType,
        packSource: parsed.packSource,
      },
      select: { id: true },
      orderBy: { createdAt: "desc" },
    });

    if (existing) {
      await prisma.assetRegistry.update({
        where: { id: existing.id },
        data: {
          sourcePath: entry.sourcePath,
          resolvedPath,
          isPlaceholder: false,
          approved: entry.approved,
        },
      });
      imported += 1;
      continue;
    }

    await prisma.assetRegistry.create({
      data: {
        entityType: entry.entityType,
        entityId: entry.entityId,
        assetType: entry.assetType,
        packSource: parsed.packSource,
        sourcePath: entry.sourcePath,
        resolvedPath,
        isPlaceholder: false,
        approved: entry.approved,
      },
    });
    imported += 1;
  }

  return { imported };
}
