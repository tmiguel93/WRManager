import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

type PersonAsset = {
  kind: "driver" | "staff";
  slug: string;
  name: string;
  countryCode: string;
  role?: string;
};

type BrandAsset = {
  kind: "team" | "supplier" | "sponsor";
  key: string;
  name: string;
  categoryCode?: string;
  color: string;
};

type PortraitManifest = {
  generatedAt?: string;
  source?: string;
  drivers?: Record<string, string>;
  staff?: Record<string, string>;
  skipped?: Array<Record<string, string>>;
};

type BrandMarkRegistry = {
  packSource?: string;
  teams?: Record<string, string>;
  suppliers?: Record<string, string>;
  sponsors?: Record<string, string>;
};

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(scriptDir, "..");
const generatedRoot = path.join(workspaceRoot, "public", "assets", "generated");
const generatedPublicRoot = "/assets/generated";
const portraitManifestPath = path.join(workspaceRoot, "prisma", "seed-data", "portrait-manifest.json");
const brandRegistryPath = path.join(workspaceRoot, "public", "assets", "brand-marks", "brand-mark-registry.json");
const sourceFiles = [
  path.join(workspaceRoot, "prisma", "seed.ts"),
  path.join(workspaceRoot, "prisma", "seed-data", "real-world.ts"),
  path.join(workspaceRoot, "prisma", "seed-data", "global-expansion.ts"),
];

function canonicalName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function slugify(value: string) {
  return canonicalName(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function xmlEscape(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function uniqueBy<T>(items: T[], key: (item: T) => string) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const value = key(item);
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

function initials(name: string) {
  const parts = canonicalName(name).split(" ").filter(Boolean);
  const first = parts[0]?.[0] ?? "W";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : parts[0]?.[1];
  return `${first}${last ?? "R"}`.toUpperCase();
}

function hashString(value: string) {
  let hash = 2166136261;
  for (const char of value) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function paletteFor(value: string) {
  const palettes = [
    ["#0f172a", "#38bdf8", "#f8fafc"],
    ["#111827", "#f97316", "#f8fafc"],
    ["#082f49", "#22d3ee", "#ecfeff"],
    ["#1f2937", "#facc15", "#f9fafb"],
    ["#14532d", "#4ade80", "#f0fdf4"],
    ["#450a0a", "#ef4444", "#fff1f2"],
    ["#172554", "#60a5fa", "#eff6ff"],
    ["#422006", "#fb923c", "#fffbeb"],
  ];
  return palettes[hashString(value) % palettes.length];
}

function portraitSvg(person: PersonAsset) {
  const [bg, accent, text] = paletteFor(`${person.kind}:${person.slug}`);
  const label = person.kind === "driver" ? "DRIVER" : person.role?.toUpperCase() ?? "STAFF";
  const safeName = xmlEscape(canonicalName(person.name));
  const safeInitials = xmlEscape(initials(person.name));
  const safeCountry = xmlEscape(person.countryCode.toUpperCase());

  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512" role="img" aria-label="${safeName} placeholder portrait">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="${bg}"/>
      <stop offset="1" stop-color="#020617"/>
    </linearGradient>
    <radialGradient id="flare" cx="70%" cy="20%" r="70%">
      <stop offset="0" stop-color="${accent}" stop-opacity="0.65"/>
      <stop offset="1" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="512" height="512" rx="56" fill="url(#bg)"/>
  <rect width="512" height="512" rx="56" fill="url(#flare)"/>
  <path d="M48 390c72-46 144-70 216-70 70 0 136 22 200 66v78H48z" fill="${accent}" opacity="0.18"/>
  <circle cx="256" cy="200" r="86" fill="#f8fafc" opacity="0.12"/>
  <circle cx="256" cy="188" r="70" fill="${accent}" opacity="0.2"/>
  <text x="256" y="220" text-anchor="middle" font-family="Verdana, Geneva, sans-serif" font-size="92" font-weight="700" fill="${text}">${safeInitials}</text>
  <path d="M72 88h368" stroke="${accent}" stroke-width="8" stroke-linecap="round" opacity="0.85"/>
  <path d="M72 424h368" stroke="${accent}" stroke-width="8" stroke-linecap="round" opacity="0.45"/>
  <text x="256" y="374" text-anchor="middle" font-family="Verdana, Geneva, sans-serif" font-size="27" font-weight="700" fill="${text}">${safeName}</text>
  <text x="256" y="408" text-anchor="middle" font-family="Verdana, Geneva, sans-serif" font-size="18" letter-spacing="4" fill="${text}" opacity="0.75">${xmlEscape(label)} - ${safeCountry}</text>
</svg>
`;
}

function brandSvg(asset: BrandAsset) {
  const base = asset.color.startsWith("#") ? asset.color : `#${asset.color}`;
  const safeName = xmlEscape(canonicalName(asset.name));
  const safeInitials = xmlEscape(initials(asset.name));
  const label = asset.categoryCode ? `${asset.kind.toUpperCase()} - ${asset.categoryCode}` : asset.kind.toUpperCase();

  return `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360" role="img" aria-label="${safeName} placeholder brand mark">
  <defs>
    <linearGradient id="plate" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#0f172a"/>
      <stop offset="1" stop-color="#020617"/>
    </linearGradient>
  </defs>
  <rect width="640" height="360" rx="40" fill="url(#plate)"/>
  <path d="M52 82h536M52 278h536" stroke="${base}" stroke-width="10" stroke-linecap="round"/>
  <path d="M108 234 188 126h264l80 108z" fill="${base}" opacity="0.22"/>
  <text x="320" y="205" text-anchor="middle" font-family="Verdana, Geneva, sans-serif" font-size="88" font-weight="800" fill="#f8fafc">${safeInitials}</text>
  <text x="320" y="258" text-anchor="middle" font-family="Verdana, Geneva, sans-serif" font-size="28" font-weight="700" fill="#f8fafc">${safeName}</text>
  <text x="320" y="300" text-anchor="middle" font-family="Verdana, Geneva, sans-serif" font-size="16" letter-spacing="5" fill="${base}">${xmlEscape(label)}</text>
</svg>
`;
}

async function readJson<T>(filePath: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8")) as T;
  } catch {
    return fallback;
  }
}

async function readSeedText() {
  const chunks = await Promise.all(sourceFiles.map((filePath) => fs.readFile(filePath, "utf8")));
  return chunks.join("\n");
}

function extractPeople(seedText: string) {
  const drivers: PersonAsset[] = [];
  const driverPattern = /\{[^{}]*displayName:\s*"([^"]+)"[^{}]*countryCode:\s*"([^"]+)"[^{}]*portraitSlug:\s*"([^"]+)"[^{}]*\}/g;
  for (const match of seedText.matchAll(driverPattern)) {
    drivers.push({ kind: "driver", name: match[1], countryCode: match[2], slug: match[3] });
  }

  const staff: PersonAsset[] = [];
  const staffPattern = /\{[^{}]*name:\s*"([^"]+)"[^{}]*role:\s*"([^"]+)"[^{}]*countryCode:\s*"([^"]+)"[^{}]*portraitSlug:\s*"([^"]+)"[^{}]*\}/g;
  for (const match of seedText.matchAll(staffPattern)) {
    staff.push({ kind: "staff", name: match[1], role: match[2], countryCode: match[3], slug: match[4] });
  }

  return {
    drivers: uniqueBy(drivers, (driver) => driver.slug),
    staff: uniqueBy(staff, (staffMember) => staffMember.slug),
  };
}

function extractBrands(seedText: string) {
  const teams: BrandAsset[] = [];
  const teamPattern = /\["([^"]+)",\s*"([^"]+)",\s*"[^"]+",\s*"[^"]+",\s*"[^"]+",\s*[\d_]+,\s*\d+,\s*"(#[0-9a-fA-F]{6})",\s*"(#[0-9a-fA-F]{6})"\]/g;
  for (const match of seedText.matchAll(teamPattern)) {
    teams.push({
      kind: "team",
      categoryCode: match[1],
      name: match[2],
      key: `${match[1]}:${slugify(match[2])}`,
      color: match[3],
    });
  }

  const suppliers: BrandAsset[] = [];
  const supplierBlock = seedText.match(/const supplierSeed = \[([\s\S]*?)\] as const;/)?.[1] ?? "";
  const supplierPattern = /\["(?:ENGINE|TIRE)",\s*"([^"]+)",\s*"[^"]+"/g;
  for (const match of supplierBlock.matchAll(supplierPattern)) {
    suppliers.push({ kind: "supplier", key: slugify(match[1]), name: match[1], color: "#38bdf8" });
  }

  const sponsors: BrandAsset[] = [];
  const sponsorBlock = seedText.match(/const sponsorSeed = \[([\s\S]*?)\] as const;/)?.[1] ?? "";
  const sponsorPattern = /\["([^"]+)",\s*"[^"]+",\s*"[^"]+",\s*[\d_]+,\s*"([0-9a-fA-F]{6})"\]/g;
  for (const match of sponsorBlock.matchAll(sponsorPattern)) {
    sponsors.push({ kind: "sponsor", key: slugify(match[1]), name: match[1], color: `#${match[2]}` });
  }

  return {
    teams: uniqueBy(teams, (team) => team.key),
    suppliers: uniqueBy(suppliers, (supplier) => supplier.key),
    sponsors: uniqueBy(sponsors, (sponsor) => sponsor.key),
  };
}

async function writeSvg(relativePath: string, contents: string) {
  const absolutePath = path.join(generatedRoot, relativePath);
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, contents, "utf8");
  return `${generatedPublicRoot}/${relativePath.replaceAll(path.sep, "/")}`;
}

async function main() {
  const seedText = await readSeedText();
  const portraitManifest = await readJson<PortraitManifest>(portraitManifestPath, {});
  const brandRegistry = await readJson<BrandMarkRegistry>(brandRegistryPath, {});
  const people = extractPeople(seedText);
  const brands = extractBrands(seedText);
  const now = new Date().toISOString();

  const generatedPortraits = {
    drivers: {} as Record<string, string>,
    staff: {} as Record<string, string>,
  };
  const generatedBrands = {
    teams: {} as Record<string, string>,
    suppliers: {} as Record<string, string>,
    sponsors: {} as Record<string, string>,
  };
  const counts = {
    driversCreated: 0,
    staffCreated: 0,
    teamsCreated: 0,
    suppliersCreated: 0,
    sponsorsCreated: 0,
  };

  portraitManifest.drivers ??= {};
  portraitManifest.staff ??= {};

  for (const driver of people.drivers) {
    const existingPath = portraitManifest.drivers[driver.slug];
    if (existingPath) {
      if (existingPath.startsWith(generatedPublicRoot)) {
        generatedPortraits.drivers[driver.slug] = existingPath;
      }
      continue;
    }
    const publicPath = await writeSvg(`portraits/drivers/${driver.slug}.svg`, portraitSvg(driver));
    portraitManifest.drivers[driver.slug] = publicPath;
    generatedPortraits.drivers[driver.slug] = publicPath;
    counts.driversCreated += 1;
  }

  for (const staffMember of people.staff) {
    const existingPath = portraitManifest.staff[staffMember.slug];
    if (existingPath) {
      if (existingPath.startsWith(generatedPublicRoot)) {
        generatedPortraits.staff[staffMember.slug] = existingPath;
      }
      continue;
    }
    const publicPath = await writeSvg(`portraits/staff/${staffMember.slug}.svg`, portraitSvg(staffMember));
    portraitManifest.staff[staffMember.slug] = publicPath;
    generatedPortraits.staff[staffMember.slug] = publicPath;
    counts.staffCreated += 1;
  }

  for (const team of brands.teams) {
    if (brandRegistry.teams?.[team.key]) continue;
    const publicPath = await writeSvg(`brand-marks/teams/${team.categoryCode?.toLowerCase().replaceAll("_", "-")}/${slugify(team.name)}.svg`, brandSvg(team));
    generatedBrands.teams[team.key] = publicPath;
    counts.teamsCreated += 1;
  }

  for (const supplier of brands.suppliers) {
    if (brandRegistry.suppliers?.[supplier.key]) continue;
    const publicPath = await writeSvg(`brand-marks/suppliers/${supplier.key}.svg`, brandSvg(supplier));
    generatedBrands.suppliers[supplier.key] = publicPath;
    counts.suppliersCreated += 1;
  }

  for (const sponsor of brands.sponsors) {
    if (brandRegistry.sponsors?.[sponsor.key]) continue;
    const publicPath = await writeSvg(`brand-marks/sponsors/${sponsor.key}.svg`, brandSvg(sponsor));
    generatedBrands.sponsors[sponsor.key] = publicPath;
    counts.sponsorsCreated += 1;
  }

  const generatedManifest = {
    generatedAt: now,
    packSource: "local-premium-svg-placeholders",
    source: {
      type: "local-generated",
      safeForUse: true,
      scraping: false,
      licenseType: "project-generated-placeholder",
      attribution: "World Racing Manager generated SVG placeholder pack",
      trademarkWarning: "Generated placeholders are not official logos, likenesses, or endorsed marks.",
    },
    counts: {
      createdThisRun: counts,
      registeredGeneratedAssets: {
        drivers: Object.keys(generatedPortraits.drivers).length,
        staff: Object.keys(generatedPortraits.staff).length,
        teams: Object.keys(generatedBrands.teams).length,
        suppliers: Object.keys(generatedBrands.suppliers).length,
        sponsors: Object.keys(generatedBrands.sponsors).length,
      },
      seedCoverage: {
        drivers: `${Object.keys(portraitManifest.drivers).length}/${people.drivers.length}`,
        staff: `${Object.keys(portraitManifest.staff).length}/${people.staff.length}`,
        teams: `${(brandRegistry.teams ? brands.teams.filter((team) => brandRegistry.teams?.[team.key]).length : 0) + Object.keys(generatedBrands.teams).length}/${brands.teams.length}`,
        suppliers: `${(brandRegistry.suppliers ? brands.suppliers.filter((supplier) => brandRegistry.suppliers?.[supplier.key]).length : 0) + Object.keys(generatedBrands.suppliers).length}/${brands.suppliers.length}`,
        sponsors: `${(brandRegistry.sponsors ? brands.sponsors.filter((sponsor) => brandRegistry.sponsors?.[sponsor.key]).length : 0) + Object.keys(generatedBrands.sponsors).length}/${brands.sponsors.length}`,
      },
    },
    portraits: generatedPortraits,
    brandMarks: generatedBrands,
  };

  portraitManifest.generatedAt = now;
  portraitManifest.source = [
    "wikipedia-rest-summary",
    "local-premium-svg-placeholders",
  ].join("+");

  await fs.mkdir(generatedRoot, { recursive: true });
  await fs.writeFile(portraitManifestPath, `${JSON.stringify(portraitManifest, null, 2)}\n`, "utf8");
  await fs.writeFile(
    path.join(generatedRoot, "placeholder-asset-manifest.json"),
    `${JSON.stringify(generatedManifest, null, 2)}\n`,
    "utf8",
  );

  console.log(`Generated placeholder assets in ${generatedRoot}`);
  console.log(JSON.stringify(counts, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
