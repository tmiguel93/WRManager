import { prisma } from "@/persistence/prisma";
import { inspectAssetPack, type AssetPackPayload } from "@/persistence/assets/asset-pack-manifest";

export type { AssetPackPayload };

export async function importAssetPack(manifestPath: string) {
  const report = await inspectAssetPack(manifestPath);
  if (report.invalidEntries.length > 0) {
    throw new Error(`Asset pack has ${report.invalidEntries.length} invalid entr${report.invalidEntries.length === 1 ? "y" : "ies"}. Run --dry-run for details.`);
  }

  const uniqueEntries = new Map<string, (typeof report.validEntries)[number]>();
  for (const entry of report.validEntries) {
    if (!entry.entry.entityId) continue;
    const key = `${entry.entry.entityType}:${entry.entry.entityId}:${entry.entry.assetType}:${report.pack.packSource}`;
    uniqueEntries.set(key, entry);
  }

  let imported = 0;
  for (const inspected of uniqueEntries.values()) {
    const entry = inspected.entry;
    if (!entry.entityId) continue;
    const approved = entry.approved ?? entry.review?.status === "approved";
    const existing = await prisma.assetRegistry.findFirst({
      where: {
        entityType: entry.entityType,
        entityId: entry.entityId,
        assetType: entry.assetType,
        packSource: report.pack.packSource,
      },
      select: { id: true },
      orderBy: { createdAt: "desc" },
    });
    const meta = {
      formatVersion: report.pack.formatVersion,
      displayName: report.pack.displayName ?? report.pack.packSource,
      version: report.pack.version ?? null,
      author: report.pack.author ?? null,
      description: report.pack.description ?? null,
      mediaType: entry.mediaType ?? null,
      sha256: inspected.sha256,
      publicPath: inspected.publicPath,
      attribution: entry.attribution ?? null,
      review: entry.review ?? { status: report.pack.defaultReviewStatus },
      warnings: inspected.warnings,
    };

    if (existing) {
      await prisma.assetRegistry.update({
        where: { id: existing.id },
        data: {
          sourcePath: inspected.sourcePath,
          resolvedPath: inspected.publicPath ?? inspected.resolvedPath,
          isPlaceholder: false,
          approved,
          meta,
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
        packSource: report.pack.packSource,
        sourcePath: inspected.sourcePath,
        resolvedPath: inspected.publicPath ?? inspected.resolvedPath,
        isPlaceholder: false,
        approved,
        meta,
      },
    });
    imported += 1;
  }

  return { imported, inspected: report.entries.length, skipped: report.validEntries.length - imported };
}
