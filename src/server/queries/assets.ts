import { prisma } from "@/persistence/prisma";

type RegistryEntry = {
  id: string;
  entityType: "DRIVER" | "TEAM" | "STAFF" | "SUPPLIER" | "SPONSOR" | "CIRCUIT";
  entityId: string;
  assetType: "DRIVER_PHOTO" | "TEAM_LOGO" | "SUPPLIER_LOGO" | "SPONSOR_BANNER" | "CIRCUIT_BANNER" | "GENERIC";
  packSource: string;
  sourcePath: string | null;
  resolvedPath: string | null;
  isPlaceholder: boolean;
  approved: boolean;
  meta: unknown;
  createdAt: Date;
};

const entityTotals = {
  DRIVER: () => prisma.driver.count(),
  TEAM: () => prisma.team.count(),
  STAFF: () => prisma.staff.count(),
  SUPPLIER: () => prisma.supplier.count(),
  SPONSOR: () => prisma.sponsor.count(),
  CIRCUIT: () => prisma.calendarEvent.count(),
} as const;

function readMetaText(meta: unknown, key: string) {
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return null;
  const value = (meta as Record<string, unknown>)[key];
  return typeof value === "string" ? value : null;
}

function summarizeBy<T extends string>(entries: RegistryEntry[], key: (entry: RegistryEntry) => T) {
  const grouped = new Map<T, { key: T; total: number; approved: number; pending: number; placeholders: number }>();
  for (const entry of entries) {
    const groupKey = key(entry);
    const row = grouped.get(groupKey) ?? {
      key: groupKey,
      total: 0,
      approved: 0,
      pending: 0,
      placeholders: 0,
    };
    row.total += 1;
    if (entry.approved) row.approved += 1;
    else row.pending += 1;
    if (entry.isPlaceholder) row.placeholders += 1;
    grouped.set(groupKey, row);
  }
  return [...grouped.values()].sort((a, b) => b.total - a.total || a.key.localeCompare(b.key));
}

export async function getAssetPackManagerView() {
  const [entries, driverTotal, teamTotal, staffTotal, supplierTotal, sponsorTotal, circuitTotal] = await Promise.all([
    prisma.assetRegistry.findMany({
      orderBy: [{ createdAt: "desc" }],
      select: {
        id: true,
        entityType: true,
        entityId: true,
        assetType: true,
        packSource: true,
        sourcePath: true,
        resolvedPath: true,
        isPlaceholder: true,
        approved: true,
        meta: true,
        createdAt: true,
      },
    }),
    entityTotals.DRIVER(),
    entityTotals.TEAM(),
    entityTotals.STAFF(),
    entityTotals.SUPPLIER(),
    entityTotals.SPONSOR(),
    entityTotals.CIRCUIT(),
  ]);

  const entityTotalByType = {
    DRIVER: driverTotal,
    TEAM: teamTotal,
    STAFF: staffTotal,
    SUPPLIER: supplierTotal,
    SPONSOR: sponsorTotal,
    CIRCUIT: circuitTotal,
  };

  const linkedEntityIds = new Map<RegistryEntry["entityType"], Set<string>>();
  for (const entry of entries) {
    const set = linkedEntityIds.get(entry.entityType) ?? new Set<string>();
    set.add(entry.entityId);
    linkedEntityIds.set(entry.entityType, set);
  }

  const coverage = Object.entries(entityTotalByType).map(([entityType, total]) => {
    const linked = linkedEntityIds.get(entityType as RegistryEntry["entityType"])?.size ?? 0;
    return {
      entityType,
      total,
      linked,
      missing: Math.max(0, total - linked),
      coveragePercent: total > 0 ? Math.round((linked / total) * 100) : 0,
    };
  });

  const approved = entries.filter((entry) => entry.approved).length;
  const placeholders = entries.filter((entry) => entry.isPlaceholder).length;
  const publicResolved = entries.filter((entry) => entry.resolvedPath?.startsWith("/")).length;

  return {
    totals: {
      entries: entries.length,
      packs: new Set(entries.map((entry) => entry.packSource)).size,
      approved,
      pending: entries.length - approved,
      placeholders,
      realAssets: entries.length - placeholders,
      publicResolved,
    },
    coverage,
    packs: summarizeBy(entries, (entry) => entry.packSource),
    byType: summarizeBy(entries, (entry) => entry.assetType),
    recentEntries: entries.slice(0, 48).map((entry) => ({
      id: entry.id,
      entityType: entry.entityType,
      entityId: entry.entityId,
      assetType: entry.assetType,
      packSource: entry.packSource,
      sourcePath: entry.sourcePath,
      resolvedPath: entry.resolvedPath,
      isPlaceholder: entry.isPlaceholder,
      approved: entry.approved,
      createdAt: entry.createdAt.toISOString(),
      displayName: readMetaText(entry.meta, "displayName"),
      version: readMetaText(entry.meta, "version"),
      publicPath: readMetaText(entry.meta, "publicPath"),
    })),
    importChecklist: [
      "Run npm run assets:inspect -- <path/to/asset-pack.json>",
      "Fix invalid paths, missing files, unsafe SVGs, hash mismatches, or attribution gaps.",
      "Run npm run assets:import -- <path/to/asset-pack.json>",
      "Review entries here before promoting assets into runtime image_url/logo_url fields.",
    ],
  };
}
