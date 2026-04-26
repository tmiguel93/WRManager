import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

import { z } from "zod";

import { importRosterManifest, type ImportRosterResult } from "@/persistence/importers/roster-manifest";
import { prisma } from "@/persistence/prisma";
import {
  canonicalEntityKey,
  dedupeRows,
  importSourceSchema,
  normalizeCountryCode,
  parseImportDate,
  sourcePackKey,
  type ImportSource,
} from "@/persistence/importers/dedupe-registry";

const sourceRefSchema = z.object({
  sourceId: z.string().min(1).optional(),
  source: importSourceSchema.optional(),
});

const teamSchema = sourceRefSchema.extend({
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
});

const driverSchema = sourceRefSchema.extend({
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
});

const staffSchema = sourceRefSchema.extend({
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
});

const supplierSchema = sourceRefSchema.extend({
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
});

const circuitSchema = sourceRefSchema.extend({
  name: z.string().min(2),
  countryCode: z.string().length(2),
  trackType: z.enum([
    "STREET",
    "ROAD",
    "OVAL_SHORT",
    "OVAL_INTERMEDIATE",
    "SUPERSPEEDWAY",
    "TECHNICAL",
    "HIGH_SPEED",
    "ENDURANCE",
    "MIXED",
  ]),
  city: z.string().optional(),
  lengthKm: z.number().positive().optional(),
  bannerUrl: z.string().optional().nullable(),
});

const calendarEventSchema = sourceRefSchema.extend({
  categoryCode: z.string().min(2),
  seasonYear: z.number().int().min(1900).max(2200).default(2026),
  round: z.number().int().min(1).max(99),
  name: z.string().min(2),
  circuitName: z.string().min(2),
  countryCode: z.string().length(2).optional(),
  startDateIso: z.string().date(),
  endDateIso: z.string().date(),
  trackType: circuitSchema.shape.trackType.optional(),
  weatherProfile: z.string().min(2).default("MIXED_SEASONAL"),
  ruleSetCode: z.string().min(2).optional(),
});

const championshipManifestSchema = z.object({
  version: z.literal(2),
  defaultSourceId: z.string().min(1),
  sources: z.record(z.string().min(1), importSourceSchema),
  teams: z.array(teamSchema).default([]),
  drivers: z.array(driverSchema).default([]),
  staff: z.array(staffSchema).default([]),
  suppliers: z.array(supplierSchema).default([]),
  circuits: z.array(circuitSchema).default([]),
  calendarEvents: z.array(calendarEventSchema).default([]),
});

export type ChampionshipManifest = z.infer<typeof championshipManifestSchema>;
export type ChampionshipManifestTeam = z.infer<typeof teamSchema>;
export type ChampionshipManifestDriver = z.infer<typeof driverSchema>;
export type ChampionshipManifestStaff = z.infer<typeof staffSchema>;
export type ChampionshipManifestSupplier = z.infer<typeof supplierSchema>;
export type ChampionshipManifestCircuit = z.infer<typeof circuitSchema>;
export type ChampionshipManifestCalendarEvent = z.infer<typeof calendarEventSchema>;

export interface ImportChampionshipManifestOptions {
  dryRun?: boolean;
}

export interface ImportChampionshipManifestResult {
  dryRun: boolean;
  roster: ImportRosterResult;
  created: { calendarEvents: number; circuitAssets: number };
  updated: { calendarEvents: number; circuitAssets: number };
  skipped: number;
  conflicts: string[];
  duplicates: string[];
}

export function parseChampionshipManifest(raw: unknown) {
  const parsed = championshipManifestSchema.parse(raw);
  return dedupeChampionshipManifest(parsed);
}

export function dedupeChampionshipManifest(manifest: ChampionshipManifest): ChampionshipManifest {
  const teams = dedupeRows(manifest.teams, (row) => canonicalEntityKey([row.categoryCode, row.name]));
  const drivers = dedupeRows(manifest.drivers, (row) => canonicalEntityKey([row.displayName, row.birthDateIso]));
  const staff = dedupeRows(manifest.staff, (row) => canonicalEntityKey([row.name, row.role]));
  const suppliers = dedupeRows(manifest.suppliers, (row) => canonicalEntityKey([row.name]));
  const circuits = dedupeRows(manifest.circuits, (row) => canonicalEntityKey([row.name, row.countryCode]));
  const calendarEvents = dedupeRows(manifest.calendarEvents, (row) =>
    canonicalEntityKey([row.categoryCode, row.seasonYear, row.round]),
  );

  return {
    ...manifest,
    teams: teams.rows,
    drivers: drivers.rows,
    staff: staff.rows,
    suppliers: suppliers.rows,
    circuits: circuits.rows,
    calendarEvents: calendarEvents.rows,
  };
}

export function buildRosterManifestFromChampionship(manifest: ChampionshipManifest) {
  return {
    version: 1 as const,
    source: resolveManifestSource(manifest, {}),
    teams: manifest.teams.map((row) => ({ ...stripSourceRef(row), source: resolveManifestSource(manifest, row) })),
    drivers: manifest.drivers.map((row) => ({ ...stripSourceRef(row), source: resolveManifestSource(manifest, row) })),
    staff: manifest.staff.map((row) => ({ ...stripSourceRef(row), source: resolveManifestSource(manifest, row) })),
    suppliers: manifest.suppliers.map((row) => ({ ...stripSourceRef(row), source: resolveManifestSource(manifest, row) })),
  };
}

export async function importChampionshipManifest(
  manifestPath: string,
  options: ImportChampionshipManifestOptions = {},
): Promise<ImportChampionshipManifestResult> {
  const dryRun = options.dryRun === true;
  const raw = JSON.parse(await fs.readFile(path.resolve(manifestPath), "utf-8"));
  const manifest = parseChampionshipManifest(raw);
  const rosterManifest = buildRosterManifestFromChampionship(manifest);
  const roster = await importRosterViaTempFile(rosterManifest, dryRun);

  const result: ImportChampionshipManifestResult = {
    dryRun,
    roster,
    created: { calendarEvents: 0, circuitAssets: 0 },
    updated: { calendarEvents: 0, circuitAssets: 0 },
    skipped: 0,
    conflicts: [...roster.conflicts],
    duplicates: collectDuplicateMessages(raw),
  };

  const categories = await prisma.category.findMany({
    select: { id: true, code: true, defaultRuleSetCode: true },
  });
  const categoryByCode = new Map(categories.map((category) => [category.code, category]));
  const circuitsByKey = new Map(
    manifest.circuits.map((circuit) => [canonicalEntityKey([circuit.name, circuit.countryCode]), circuit]),
  );

  for (const circuit of manifest.circuits) {
    const source = resolveManifestSource(manifest, circuit);
    const key = canonicalEntityKey([circuit.name, circuit.countryCode]);
    if (!dryRun && circuit.bannerUrl) {
      const existing = await prisma.assetRegistry.findFirst({
        where: {
          entityType: "CIRCUIT",
          entityId: key,
          assetType: "CIRCUIT_BANNER",
          packSource: sourcePackKey(source),
        },
        select: { id: true },
      });
      const payload = {
        sourcePath: circuit.bannerUrl,
        resolvedPath: circuit.bannerUrl,
        isPlaceholder: false,
        approved: true,
        meta: {
          circuitName: circuit.name,
          countryCode: normalizeCountryCode(circuit.countryCode),
          trackType: circuit.trackType,
          city: circuit.city ?? null,
          lengthKm: circuit.lengthKm ?? null,
          sourceUrl: source.url,
          sourceConfidence: source.confidence,
          lastVerifiedAt: source.lastVerifiedAt,
        },
      };

      if (existing) {
        await prisma.assetRegistry.update({ where: { id: existing.id }, data: payload });
        result.updated.circuitAssets += 1;
      } else {
        await prisma.assetRegistry.create({
          data: {
            entityType: "CIRCUIT",
            entityId: key,
            assetType: "CIRCUIT_BANNER",
            packSource: sourcePackKey(source),
            ...payload,
          },
        });
        result.created.circuitAssets += 1;
      }
    }
  }

  for (const row of manifest.calendarEvents) {
    const category = categoryByCode.get(row.categoryCode);
    if (!category) {
      result.conflicts.push(`Calendar "${row.name}" skipped: unknown category "${row.categoryCode}".`);
      result.skipped += 1;
      continue;
    }

    const existingSeason = await prisma.season.findUnique({
      where: { categoryId_year: { categoryId: category.id, year: row.seasonYear } },
      select: { id: true },
    });
    if (dryRun && !existingSeason) {
      result.created.calendarEvents += 1;
      continue;
    }
    const season =
      existingSeason ??
      (await prisma.season.create({
        data: { categoryId: category.id, year: row.seasonYear },
        select: { id: true },
      }));
    const circuit =
      circuitsByKey.get(canonicalEntityKey([row.circuitName, row.countryCode])) ??
      [...circuitsByKey.values()].find((candidate) => canonicalEntityKey([candidate.name]) === canonicalEntityKey([row.circuitName]));
    const source = resolveManifestSource(manifest, row);
    const existing = await prisma.calendarEvent.findFirst({
      where: { categoryId: category.id, seasonId: season.id, round: row.round },
      select: { id: true },
    });

    const countryCode = normalizeCountryCode(row.countryCode ?? circuit?.countryCode ?? "US");
    const trackType = row.trackType ?? circuit?.trackType ?? "ROAD";
    const payload = {
      categoryId: category.id,
      seasonId: season.id,
      round: row.round,
      name: row.name,
      circuitName: row.circuitName,
      countryCode,
      startDate: new Date(`${row.startDateIso}T00:00:00.000Z`),
      endDate: new Date(`${row.endDateIso}T00:00:00.000Z`),
      trackType,
      weatherProfile: row.weatherProfile,
      ruleSetCode: row.ruleSetCode ?? category.defaultRuleSetCode,
      sourceUrl: source.url,
      sourceConfidence: source.confidence,
      lastVerifiedAt: parseImportDate(source.lastVerifiedAt),
      metadata: {
        manifestVersion: manifest.version,
        sourceLabel: source.label,
        canonicalCircuitKey: canonicalEntityKey([row.circuitName, countryCode]),
        circuitCity: circuit?.city ?? null,
        circuitLengthKm: circuit?.lengthKm ?? null,
      },
    };

    if (dryRun) {
      if (existing) result.updated.calendarEvents += 1;
      else result.created.calendarEvents += 1;
      continue;
    }

    if (existing) {
      await prisma.calendarEvent.update({ where: { id: existing.id }, data: payload });
      result.updated.calendarEvents += 1;
    } else {
      await prisma.calendarEvent.create({ data: payload });
      result.created.calendarEvents += 1;
    }
  }

  return result;
}

async function importRosterViaTempFile(
  rosterManifest: ReturnType<typeof buildRosterManifestFromChampionship>,
  dryRun: boolean,
) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "wmm-roster-"));
  const tempPath = path.join(tempDir, "roster-manifest.json");
  try {
    await fs.writeFile(tempPath, JSON.stringify(rosterManifest, null, 2), "utf-8");
    return await importRosterManifest(tempPath, { dryRun });
  } finally {
    await fs.rm(tempDir, { force: true, recursive: true });
  }
}

function resolveManifestSource(manifest: ChampionshipManifest, row: { sourceId?: string; source?: ImportSource }) {
  if (row.source) return row.source;
  const sourceId = row.sourceId ?? manifest.defaultSourceId;
  const source = manifest.sources[sourceId];
  if (!source) {
    throw new Error(`Championship manifest source "${sourceId}" was not declared.`);
  }
  return source;
}

function stripSourceRef<T extends { sourceId?: string; source?: ImportSource }>(row: T) {
  const payload = { ...row };
  delete payload.sourceId;
  delete payload.source;
  return payload;
}

function collectDuplicateMessages(raw: unknown) {
  const parsed = championshipManifestSchema.safeParse(raw);
  if (!parsed.success) return [];
  const manifest = parsed.data;
  return [
    ...dedupeRows(manifest.teams, (row) => canonicalEntityKey([row.categoryCode, row.name])).duplicates.map(
      (item) => `team duplicate ${item.key}`,
    ),
    ...dedupeRows(manifest.drivers, (row) => canonicalEntityKey([row.displayName, row.birthDateIso])).duplicates.map(
      (item) => `driver duplicate ${item.key}`,
    ),
    ...dedupeRows(manifest.staff, (row) => canonicalEntityKey([row.name, row.role])).duplicates.map(
      (item) => `staff duplicate ${item.key}`,
    ),
    ...dedupeRows(manifest.suppliers, (row) => canonicalEntityKey([row.name])).duplicates.map(
      (item) => `supplier duplicate ${item.key}`,
    ),
    ...dedupeRows(manifest.circuits, (row) => canonicalEntityKey([row.name, row.countryCode])).duplicates.map(
      (item) => `circuit duplicate ${item.key}`,
    ),
    ...dedupeRows(manifest.calendarEvents, (row) => canonicalEntityKey([row.categoryCode, row.seasonYear, row.round])).duplicates.map(
      (item) => `calendar duplicate ${item.key}`,
    ),
  ];
}
