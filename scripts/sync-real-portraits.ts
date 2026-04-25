import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { realDriverSeeds, realStaffSeeds } from "../prisma/seed-data/real-world";
import { supplementalDriverSeeds, supplementalStaffSeeds } from "../prisma/seed-data/global-expansion";

interface PortraitManifest {
  generatedAt: string;
  source: string;
  drivers: Record<string, string>;
  staff: Record<string, string>;
  skipped: Array<{ kind: "driver" | "staff"; key: string; title: string; reason: string }>;
}

interface SummaryResponse {
  thumbnail?: { source?: string };
  originalimage?: { source?: string };
}

const TITLE_ALIASES: Record<string, string[]> = {
  "Frederic Vasseur": ["Frédéric Vasseur"],
  "Gabriele Mini": ["Gabriele Minì"],
  "Will Power": ["Will Power (racing driver)"],
  "Mike Hull (racing)": ["Mike Hull"],
};

function extensionFrom(contentType: string | null, sourceUrl: string) {
  const mime = (contentType ?? "").toLowerCase();
  if (mime.includes("image/jpeg")) return ".jpg";
  if (mime.includes("image/png")) return ".png";
  if (mime.includes("image/webp")) return ".webp";

  const cleanUrl = sourceUrl.split("?")[0].toLowerCase();
  if (cleanUrl.endsWith(".jpg") || cleanUrl.endsWith(".jpeg")) return ".jpg";
  if (cleanUrl.endsWith(".png")) return ".png";
  if (cleanUrl.endsWith(".webp")) return ".webp";
  return ".jpg";
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url: string, init: RequestInit, kind: string) {
  const maxAttempts = 6;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const response = await fetch(url, init);
    if (response.ok) return response;

    if ((response.status === 429 || response.status >= 500) && attempt < maxAttempts) {
      const waitMs = 800 * 2 ** (attempt - 1);
      await sleep(waitMs);
      continue;
    }

    throw new Error(`${kind} request failed (${response.status})`);
  }

  throw new Error(`${kind} request failed after retries`);
}

async function fetchPortraitFromTitle(title: string) {
  const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  const summaryResponse = await fetchWithRetry(
    summaryUrl,
    {
      headers: {
        "user-agent": "WRManagerPortraitSync/1.1 (local seed preparation)",
        accept: "application/json",
      },
    },
    "Summary",
  );

  const summary = (await summaryResponse.json()) as SummaryResponse;
  const sourceUrl = summary.thumbnail?.source ?? summary.originalimage?.source;

  if (!sourceUrl) {
    throw new Error("No thumbnail/original image in summary response");
  }

  const imageResponse = await fetchWithRetry(
    sourceUrl,
    {
      headers: {
        "user-agent": "WRManagerPortraitSync/1.1 (local seed preparation)",
      },
    },
    "Image",
  );

  const bytes = Buffer.from(await imageResponse.arrayBuffer());
  const extension = extensionFrom(imageResponse.headers.get("content-type"), sourceUrl);

  return {
    bytes,
    extension,
  };
}

async function fetchPortraitWithAliases(title: string) {
  const candidates = [title, ...(TITLE_ALIASES[title] ?? [])];
  let lastError: Error | null = null;

  for (const candidate of candidates) {
    try {
      return await fetchPortraitFromTitle(candidate);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("unknown error");
      continue;
    }
  }

  throw lastError ?? new Error("portrait download failed");
}

async function loadExistingManifest(manifestPath: string): Promise<PortraitManifest | null> {
  try {
    const raw = await readFile(manifestPath, "utf8");
    return JSON.parse(raw) as PortraitManifest;
  } catch {
    return null;
  }
}

async function main() {
  const workspaceRoot = path.resolve(__dirname, "..");
  const driversDir = path.join(workspaceRoot, "public", "assets", "portraits", "drivers");
  const staffDir = path.join(workspaceRoot, "public", "assets", "portraits", "staff");
  const manifestPath = path.join(workspaceRoot, "prisma", "seed-data", "portrait-manifest.json");

  await mkdir(driversDir, { recursive: true });
  await mkdir(staffDir, { recursive: true });

  const existing = await loadExistingManifest(manifestPath);
  const allDrivers = [...realDriverSeeds, ...supplementalDriverSeeds];
  const allStaff = [...realStaffSeeds, ...supplementalStaffSeeds];
  const allowedDriverSlugs = new Set(allDrivers.map((driver) => driver.portraitSlug));
  const allowedStaffSlugs = new Set(allStaff.map((staff) => staff.portraitSlug));
  const existingDrivers = Object.fromEntries(
    Object.entries(existing?.drivers ?? {}).filter(([slug]) => allowedDriverSlugs.has(slug)),
  );
  const existingStaff = Object.fromEntries(
    Object.entries(existing?.staff ?? {}).filter(([slug]) => allowedStaffSlugs.has(slug)),
  );

  const manifest: PortraitManifest = {
    generatedAt: new Date().toISOString(),
    source: "wikipedia-rest-summary",
    drivers: existingDrivers,
    staff: existingStaff,
    skipped: [],
  };

  for (const driver of allDrivers) {
    if (manifest.drivers[driver.portraitSlug]) continue;

    try {
      const portrait = await fetchPortraitWithAliases(driver.wikipediaTitle);
      const filename = `${driver.portraitSlug}${portrait.extension}`;
      const absolutePath = path.join(driversDir, filename);
      await writeFile(absolutePath, portrait.bytes);
      manifest.drivers[driver.portraitSlug] = `/assets/portraits/drivers/${filename}`;
      console.log(`driver ok: ${driver.displayName}`);
    } catch (error) {
      manifest.skipped.push({
        kind: "driver",
        key: driver.portraitSlug,
        title: driver.wikipediaTitle,
        reason: error instanceof Error ? error.message : "unknown error",
      });
      console.warn(`driver skip: ${driver.displayName}`);
    }

    await sleep(260);
  }

  for (const staff of allStaff) {
    if (manifest.staff[staff.portraitSlug]) continue;

    try {
      const portrait = await fetchPortraitWithAliases(staff.wikipediaTitle);
      const filename = `${staff.portraitSlug}${portrait.extension}`;
      const absolutePath = path.join(staffDir, filename);
      await writeFile(absolutePath, portrait.bytes);
      manifest.staff[staff.portraitSlug] = `/assets/portraits/staff/${filename}`;
      console.log(`staff ok: ${staff.name}`);
    } catch (error) {
      manifest.skipped.push({
        kind: "staff",
        key: staff.portraitSlug,
        title: staff.wikipediaTitle,
        reason: error instanceof Error ? error.message : "unknown error",
      });
      console.warn(`staff skip: ${staff.name}`);
    }

    await sleep(260);
  }

  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  console.log(`portrait manifest written: ${manifestPath}`);
  console.log(`driver portraits: ${Object.keys(manifest.drivers).length}/${allDrivers.length}`);
  console.log(`staff portraits: ${Object.keys(manifest.staff).length}/${allStaff.length}`);
  console.log(`skipped in run: ${manifest.skipped.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

