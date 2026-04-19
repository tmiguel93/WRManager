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

  const created = await Promise.all(
    parsed.entries.map(async (entry) => {
      const resolvedPath = path.resolve(rootDir, entry.sourcePath);
      return prisma.assetRegistry.create({
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
    }),
  );

  return { imported: created.length };
}
