import { promises as fs } from "node:fs";
import path from "node:path";

import { z } from "zod";

import { canonicalKey, canonicalText } from "@/lib/canonical";
import { prisma } from "@/persistence/prisma";

const sourceSchema = z.object({
  label: z.string().min(2).max(80),
  url: z.string().url(),
  confidence: z.number().int().min(0).max(100).default(70),
  lastVerifiedAt: z.string().datetime(),
});

const teamSchema = z.object({
  categoryCode: z.string().min(2),
  name: z.string().min(2),
  shortName: z.string().min(2).max(8).optional(),
  countryCode: z.string().length(2),
  headquarters: z.string().min(2).optional(),
  budget: z.number().int().min(1_000_000).optional(),
  reputation: z.number().int().min(1).max(99).optional(),
  fanbase: z.number().int().min(1).max(99).optional(),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  secondaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  logoUrl: z.string().optional().nullable(),
  philosophy: z.string().min(4).optional(),
  source: sourceSchema.optional(),
});

const driverSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  displayName: z.string().min(2),
  countryCode: z.string().length(2),
  birthDateIso: z.string().date(),
  categoryCode: z.string().min(2),
  teamName: z.string().min(2).optional().nullable(),
  overall: z.number().int().min(40).max(99),
  potential: z.number().int().min(40).max(99),
  reputation: z.number().int().min(1).max(99),
  marketValue: z.number().int().min(100_000),
  salary: z.number().int().min(100_000),
  morale: z.number().int().min(1).max(99),
  personality: z.string().min(2),
  primaryTraitCode: z.string().min(2),
  imageUrl: z.string().optional().nullable(),
  source: sourceSchema.optional(),
});

const staffSchema = z.object({
  name: z.string().min(2),
  role: z.string().min(2),
  countryCode: z.string().length(2),
  specialty: z.string().min(2),
  teamName: z.string().min(2).optional().nullable(),
  categoryCode: z.string().min(2),
  reputation: z.number().int().min(1).max(99),
  salary: z.number().int().min(100_000),
  personality: z.string().min(2),
  imageUrl: z.string().optional().nullable(),
  source: sourceSchema.optional(),
});

const supplierSchema = z.object({
  type: z.enum([
    "ENGINE",
    "TIRE",
    "BRAKE",
    "SUSPENSION",
    "TRANSMISSION",
    "FUEL",
    "ELECTRONICS",
    "AERO",
    "CHASSIS",
    "PIT_EQUIPMENT",
    "TELEMETRY",
  ]),
  name: z.string().min(2),
  countryCode: z.string().length(2),
  baseCost: z.number().int().min(100_000),
  performance: z.number().int().min(1).max(99),
  reliability: z.number().int().min(1).max(99),
  efficiency: z.number().int().min(1).max(99),
  drivability: z.number().int().min(1).max(99),
  developmentCeiling: z.number().int().min(1).max(99),
  maintenanceCost: z.number().int().min(100_000),
  prestigeImpact: z.number().int().min(1).max(99),
  sponsorSynergy: z.number().int().min(1).max(99),
  categoryCodes: z.array(z.string().min(2)).default([]),
  source: sourceSchema.optional(),
});

const rosterManifestSchema = z.object({
  version: z.literal(1),
  source: sourceSchema,
  teams: z.array(teamSchema).default([]),
  drivers: z.array(driverSchema).default([]),
  staff: z.array(staffSchema).default([]),
  suppliers: z.array(supplierSchema).default([]),
});

type RosterManifest = z.infer<typeof rosterManifestSchema>;
type SourcePayload = z.infer<typeof sourceSchema>;

interface ImportOptions {
  dryRun?: boolean;
}

export interface ImportRosterResult {
  dryRun: boolean;
  created: { teams: number; drivers: number; staff: number; suppliers: number };
  updated: { teams: number; drivers: number; staff: number; suppliers: number };
  skipped: number;
  conflicts: string[];
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

function initialsFromName(name: string) {
  const tokens = name.split(" ").filter(Boolean);
  if (tokens.length === 0) return "TM";
  if (tokens.length === 1) return tokens[0].slice(0, 3).toUpperCase();
  return `${tokens[0][0] ?? ""}${tokens[1][0] ?? ""}`.toUpperCase();
}

function resolveSource(entrySource: SourcePayload | undefined, fallback: SourcePayload) {
  return entrySource ?? fallback;
}

function buildDriverAttributes(overall: number, potential: number) {
  const base = Math.max(45, Math.min(99, overall));
  const cap = Math.max(base, Math.min(99, potential));
  return {
    purePace: base,
    consistency: Math.max(40, base - 4),
    qualifying: Math.min(99, base + 2),
    launch: Math.max(40, base - 3),
    defense: Math.max(40, base - 2),
    overtaking: Math.max(40, base - 1),
    aggression: Math.max(40, base - 5),
    emotionalControl: Math.max(40, base - 3),
    wetWeather: Math.max(40, base - 4),
    technicalFeedback: Math.max(40, base - 2),
    tireManagement: Math.max(40, base - 3),
    fuelSaving: Math.max(40, base - 4),
    strategyIQ: Math.max(40, base - 2),
    trafficAdaptation: Math.max(40, base - 2),
    ovalAdaptation: Math.max(40, base - 6),
    streetAdaptation: Math.max(40, base - 2),
    roadCourseAdaptation: Math.max(40, base - 1),
    enduranceAdaptation: Math.max(40, base - 5),
    ceiling: cap,
  };
}

function buildStaffAttributes(reputation: number) {
  const base = Math.max(40, Math.min(99, reputation));
  return {
    pitStopExecution: Math.max(40, base - 10),
    setupQuality: Math.max(40, base - 8),
    degradationControl: Math.max(40, base - 9),
    scoutingDepth: Math.max(40, base - 10),
    upgradeEfficiency: Math.max(40, base - 8),
    talentRetention: Math.max(40, base - 8),
  };
}

async function parseManifest(manifestPath: string): Promise<RosterManifest> {
  const absolutePath = path.resolve(manifestPath);
  const raw = await fs.readFile(absolutePath, "utf-8");
  const parsed = rosterManifestSchema.parse(JSON.parse(raw));

  return {
    ...parsed,
    drivers: dedupeManifestDrivers(parsed.drivers),
    staff: dedupeManifestStaff(parsed.staff),
    teams: dedupeManifestTeams(parsed.teams),
    suppliers: dedupeManifestSuppliers(parsed.suppliers),
  };
}

export function dedupeManifestTeams(rows: RosterManifest["teams"]) {
  const seen = new Set<string>();
  return rows.filter((row) => {
    const key = canonicalKey([row.categoryCode, row.name]);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function dedupeManifestDrivers(rows: RosterManifest["drivers"]) {
  const seen = new Set<string>();
  return rows.filter((row) => {
    const key = canonicalKey([row.displayName, row.birthDateIso]);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function dedupeManifestStaff(rows: RosterManifest["staff"]) {
  const seen = new Set<string>();
  return rows.filter((row) => {
    const key = canonicalKey([row.name, row.role]);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function dedupeManifestSuppliers(rows: RosterManifest["suppliers"]) {
  const seen = new Set<string>();
  return rows.filter((row) => {
    const key = canonicalText(row.name);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function syncAssetRegistry(params: {
  entityType: "DRIVER" | "TEAM" | "STAFF" | "SUPPLIER";
  entityId: string;
  assetType: "DRIVER_PHOTO" | "TEAM_LOGO" | "GENERIC" | "SUPPLIER_LOGO";
  sourcePath: string | null;
  packSource: string;
}) {
  const existing = await prisma.assetRegistry.findFirst({
    where: {
      entityType: params.entityType,
      entityId: params.entityId,
      assetType: params.assetType,
      packSource: params.packSource,
    },
    select: { id: true },
  });

  const payload = {
    sourcePath: params.sourcePath,
    resolvedPath: params.sourcePath,
    isPlaceholder: !params.sourcePath,
    approved: Boolean(params.sourcePath),
  };

  if (existing) {
    await prisma.assetRegistry.update({
      where: { id: existing.id },
      data: payload,
    });
    return;
  }

  await prisma.assetRegistry.create({
    data: {
      entityType: params.entityType,
      entityId: params.entityId,
      assetType: params.assetType,
      packSource: params.packSource,
      ...payload,
    },
  });
}

export async function importRosterManifest(
  manifestPath: string,
  options: ImportOptions = {},
): Promise<ImportRosterResult> {
  const manifest = await parseManifest(manifestPath);
  const dryRun = options.dryRun === true;

  const [categories, teams, drivers, staff, suppliers] = await Promise.all([
    prisma.category.findMany({ select: { id: true, code: true } }),
    prisma.team.findMany({
      select: { id: true, name: true, categoryId: true, isCustom: true, slug: true },
    }),
    prisma.driver.findMany({
      select: { id: true, displayName: true, birthDate: true, currentTeam: { select: { isCustom: true } } },
    }),
    prisma.staff.findMany({
      select: { id: true, name: true, role: true, currentTeam: { select: { isCustom: true } } },
    }),
    prisma.supplier.findMany({ select: { id: true, name: true } }),
  ]);

  const categoryByCode = new Map(categories.map((item) => [item.code, item.id]));
  const teamSlugSet = new Set(teams.map((item) => item.slug));
  const teamByKey = new Map(
    teams.map((item) => [canonicalKey([item.categoryId, item.name]), item]),
  );
  const driverByKey = new Map(
    drivers.map((item) => [canonicalKey([item.displayName, item.birthDate.toISOString().slice(0, 10)]), item]),
  );
  const staffByKey = new Map(
    staff.map((item) => [canonicalKey([item.name, item.role]), item]),
  );
  const supplierByKey = new Map(suppliers.map((item) => [canonicalText(item.name), item]));

  const result: ImportRosterResult = {
    dryRun,
    created: { teams: 0, drivers: 0, staff: 0, suppliers: 0 },
    updated: { teams: 0, drivers: 0, staff: 0, suppliers: 0 },
    skipped: 0,
    conflicts: [],
  };

  const sourceLabel = canonicalText(manifest.source.label).replaceAll(" ", "-");

  for (const row of manifest.teams) {
    const categoryId = categoryByCode.get(row.categoryCode);
    if (!categoryId) {
      result.conflicts.push(`Team "${row.name}" skipped: unknown category "${row.categoryCode}".`);
      result.skipped += 1;
      continue;
    }

    const key = canonicalKey([categoryId, row.name]);
    const existing = teamByKey.get(key);
    const source = resolveSource(row.source, manifest.source);

    if (existing && existing.isCustom) {
      result.conflicts.push(`Team "${row.name}" skipped: custom team override preserved.`);
      result.skipped += 1;
      continue;
    }

    const shortName = (row.shortName ?? initialsFromName(row.name)).slice(0, 8).toUpperCase();
    const baseSlug = slugify(row.name);
    let slug = baseSlug || "team";
    let slugSuffix = 1;
    while (!existing && teamSlugSet.has(slug)) {
      slug = `${baseSlug}-${slugSuffix}`;
      slugSuffix += 1;
    }

    if (!dryRun && existing) {
      await prisma.team.update({
        where: { id: existing.id },
        data: {
          shortName,
          countryCode: row.countryCode.toUpperCase(),
          headquarters: row.headquarters ?? "Global HQ",
          budget: row.budget ?? 15_000_000,
          reputation: row.reputation ?? 60,
          fanbase: row.fanbase ?? 50,
          primaryColor: row.primaryColor ?? "#0ea5e9",
          secondaryColor: row.secondaryColor ?? "#facc15",
          accentColor: row.accentColor ?? row.secondaryColor ?? "#22d3ee",
          logoUrl: row.logoUrl ?? null,
          philosophy: row.philosophy ?? "Balanced growth and performance program.",
          sourceUrl: source.url,
          sourceConfidence: source.confidence,
          lastVerifiedAt: new Date(source.lastVerifiedAt),
        },
      });
      if (row.logoUrl) {
        await syncAssetRegistry({
          entityType: "TEAM",
          entityId: existing.id,
          assetType: "TEAM_LOGO",
          sourcePath: row.logoUrl,
          packSource: sourceLabel,
        });
      }
    }

    if (existing) {
      result.updated.teams += 1;
      continue;
    }

    if (!dryRun) {
      const created = await prisma.team.create({
        data: {
          categoryId,
          name: row.name,
          shortName,
          slug,
          countryCode: row.countryCode.toUpperCase(),
          headquarters: row.headquarters ?? "Global HQ",
          budget: row.budget ?? 15_000_000,
          reputation: row.reputation ?? 60,
          fanbase: row.fanbase ?? 50,
          history: `${row.name} imported through roster manifest.`,
          primaryColor: row.primaryColor ?? "#0ea5e9",
          secondaryColor: row.secondaryColor ?? "#facc15",
          accentColor: row.accentColor ?? row.secondaryColor ?? "#22d3ee",
          logoUrl: row.logoUrl ?? null,
          philosophy: row.philosophy ?? "Balanced growth and performance program.",
          isCustom: false,
          sourceUrl: source.url,
          sourceConfidence: source.confidence,
          lastVerifiedAt: new Date(source.lastVerifiedAt),
        },
      });
      teamByKey.set(key, { ...created, isCustom: false });
      teamSlugSet.add(slug);

      if (row.logoUrl) {
        await syncAssetRegistry({
          entityType: "TEAM",
          entityId: created.id,
          assetType: "TEAM_LOGO",
          sourcePath: row.logoUrl,
          packSource: sourceLabel,
        });
      }
    }

    result.created.teams += 1;
  }

  for (const row of manifest.drivers) {
    const categoryId = categoryByCode.get(row.categoryCode);
    if (!categoryId) {
      result.conflicts.push(`Driver "${row.displayName}" skipped: unknown category "${row.categoryCode}".`);
      result.skipped += 1;
      continue;
    }

    const team = row.teamName ? teamByKey.get(canonicalKey([categoryId, row.teamName])) ?? null : null;
    const key = canonicalKey([row.displayName, row.birthDateIso]);
    const existing = driverByKey.get(key);
    const source = resolveSource(row.source, manifest.source);
    const existingInCustomTeam = Boolean(existing?.currentTeam?.isCustom);

    if (existingInCustomTeam) {
      result.conflicts.push(`Driver "${row.displayName}" skipped: assigned to custom team override.`);
      result.skipped += 1;
      continue;
    }

    const payload = {
      firstName: row.firstName,
      lastName: row.lastName,
      displayName: row.displayName,
      countryCode: row.countryCode.toUpperCase(),
      birthDate: new Date(`${row.birthDateIso}T00:00:00.000Z`),
      imageUrl: row.imageUrl ?? null,
      overall: row.overall,
      potential: row.potential,
      reputation: row.reputation,
      marketValue: row.marketValue,
      salary: row.salary,
      morale: row.morale,
      personality: row.personality,
      primaryTraitCode: row.primaryTraitCode,
      preferredDisciplines: [row.categoryCode],
      attributes: buildDriverAttributes(row.overall, row.potential),
      currentCategoryId: categoryId,
      currentTeamId: team?.id ?? null,
      sourceUrl: source.url,
      sourceConfidence: source.confidence,
      lastVerifiedAt: new Date(source.lastVerifiedAt),
    };

    if (!dryRun && existing) {
      await prisma.driver.update({
        where: { id: existing.id },
        data: payload,
      });
      if (row.imageUrl) {
        await syncAssetRegistry({
          entityType: "DRIVER",
          entityId: existing.id,
          assetType: "DRIVER_PHOTO",
          sourcePath: row.imageUrl,
          packSource: sourceLabel,
        });
      }
    }

    if (existing) {
      result.updated.drivers += 1;
      continue;
    }

    if (!dryRun) {
      const created = await prisma.driver.create({ data: payload });
      driverByKey.set(key, { ...created, currentTeam: null });
      if (row.imageUrl) {
        await syncAssetRegistry({
          entityType: "DRIVER",
          entityId: created.id,
          assetType: "DRIVER_PHOTO",
          sourcePath: row.imageUrl,
          packSource: sourceLabel,
        });
      }
    }

    result.created.drivers += 1;
  }

  for (const row of manifest.staff) {
    const categoryId = categoryByCode.get(row.categoryCode);
    if (!categoryId) {
      result.conflicts.push(`Staff "${row.name}" skipped: unknown category "${row.categoryCode}".`);
      result.skipped += 1;
      continue;
    }

    const team = row.teamName ? teamByKey.get(canonicalKey([categoryId, row.teamName])) ?? null : null;
    const key = canonicalKey([row.name, row.role]);
    const existing = staffByKey.get(key);
    const source = resolveSource(row.source, manifest.source);
    const existingInCustomTeam = Boolean(existing?.currentTeam?.isCustom);

    if (existingInCustomTeam) {
      result.conflicts.push(`Staff "${row.name}" skipped: assigned to custom team override.`);
      result.skipped += 1;
      continue;
    }

    const payload = {
      name: row.name,
      role: row.role,
      countryCode: row.countryCode.toUpperCase(),
      imageUrl: row.imageUrl ?? null,
      reputation: row.reputation,
      salary: row.salary,
      specialty: row.specialty,
      compatibility: { categories: [row.categoryCode], imported: true },
      personality: row.personality,
      attributes: buildStaffAttributes(row.reputation),
      currentTeamId: team?.id ?? null,
      currentCategoryId: categoryId,
      sourceUrl: source.url,
      sourceConfidence: source.confidence,
      lastVerifiedAt: new Date(source.lastVerifiedAt),
    };

    if (!dryRun && existing) {
      await prisma.staff.update({
        where: { id: existing.id },
        data: payload,
      });
      if (row.imageUrl) {
        await syncAssetRegistry({
          entityType: "STAFF",
          entityId: existing.id,
          assetType: "GENERIC",
          sourcePath: row.imageUrl,
          packSource: sourceLabel,
        });
      }
    }

    if (existing) {
      result.updated.staff += 1;
      continue;
    }

    if (!dryRun) {
      const created = await prisma.staff.create({ data: payload });
      staffByKey.set(key, { ...created, currentTeam: null });
      if (row.imageUrl) {
        await syncAssetRegistry({
          entityType: "STAFF",
          entityId: created.id,
          assetType: "GENERIC",
          sourcePath: row.imageUrl,
          packSource: sourceLabel,
        });
      }
    }

    result.created.staff += 1;
  }

  for (const row of manifest.suppliers) {
    const key = canonicalText(row.name);
    const existing = supplierByKey.get(key);
    const source = resolveSource(row.source, manifest.source);
    const payload = {
      type: row.type,
      name: row.name,
      countryCode: row.countryCode.toUpperCase(),
      baseCost: row.baseCost,
      performance: row.performance,
      reliability: row.reliability,
      efficiency: row.efficiency,
      drivability: row.drivability,
      developmentCeiling: row.developmentCeiling,
      maintenanceCost: row.maintenanceCost,
      prestigeImpact: row.prestigeImpact,
      sponsorSynergy: row.sponsorSynergy,
      tags: { imported: true },
      sourceUrl: source.url,
      sourceConfidence: source.confidence,
      lastVerifiedAt: new Date(source.lastVerifiedAt),
    };

    let supplierId: string | null = existing?.id ?? null;

    if (!dryRun && existing) {
      await prisma.supplier.update({
        where: { id: existing.id },
        data: payload,
      });
    }

    if (existing) {
      result.updated.suppliers += 1;
    } else {
      if (!dryRun) {
        const created = await prisma.supplier.create({ data: payload });
        supplierByKey.set(key, created);
        supplierId = created.id;

        if (row.type === "ENGINE") {
          await prisma.engineSupplier.create({
            data: {
              supplierId: created.id,
              power: row.performance,
              torque: Math.min(99, row.performance + 3),
              thermalEfficiency: row.efficiency,
              hybridDeployment: Math.min(99, row.efficiency + 2),
              weight: Math.max(50, 100 - Math.round((row.reliability + row.efficiency) / 4)),
            },
          });
        }

        if (row.type === "TIRE") {
          await prisma.tireSupplier.create({
            data: {
              supplierId: created.id,
              peakGrip: row.performance,
              durability: row.reliability,
              thermalWindow: row.efficiency,
              wetPerformance: Math.max(40, Math.round((row.performance + row.reliability) / 2)),
              degradationCurve: Math.max(40, 110 - row.reliability),
              consistency: Math.max(40, Math.round((row.reliability + row.efficiency) / 2)),
            },
          });
        }
      }

      result.created.suppliers += 1;
    }

    if (!dryRun && row.categoryCodes.length > 0 && supplierId) {
      for (const categoryCode of row.categoryCodes) {
        const categoryId = categoryByCode.get(categoryCode);
        if (!categoryId) {
          result.conflicts.push(`Supplier "${row.name}" category "${categoryCode}" missing.`);
          continue;
        }
        await prisma.supplierCategory.upsert({
          where: { supplierId_categoryId: { supplierId, categoryId } },
          update: {},
          create: { supplierId, categoryId },
        });
      }
    }
  }

  return result;
}
