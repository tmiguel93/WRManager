import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { prisma } from "@/persistence/prisma";
import { readPngMetadata } from "@/lib/png";

const MAX_FILE_BYTES = 2_500_000;
const MIN_DIMENSION = 64;
const MAX_DIMENSION = 4096;
const TEAM_LOGO_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "team-logos");

export class TeamLogoUploadError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = "TeamLogoUploadError";
  }
}

function ensurePngFile(file: File) {
  const filename = file.name.toLowerCase();
  const hasPngName = filename.endsWith(".png");
  const hasPngMime = file.type === "image/png" || file.type === "";

  if (!hasPngName || !hasPngMime) {
    throw new TeamLogoUploadError("INVALID_TYPE", "Team logo must be a PNG file.");
  }

  if (file.size <= 0 || file.size > MAX_FILE_BYTES) {
    throw new TeamLogoUploadError(
      "INVALID_SIZE",
      "PNG logo must be smaller than 2.5 MB.",
    );
  }
}

function sanitizeSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 36);
}

export async function uploadTeamLogoForCareer(input: { careerId: string; file: File }) {
  ensurePngFile(input.file);

  const bytes = new Uint8Array(await input.file.arrayBuffer());
  const png = readPngMetadata(bytes);
  if (
    png.width < MIN_DIMENSION ||
    png.height < MIN_DIMENSION ||
    png.width > MAX_DIMENSION ||
    png.height > MAX_DIMENSION
  ) {
    throw new TeamLogoUploadError(
      "INVALID_DIMENSIONS",
      "PNG logo must be between 64px and 4096px on both sides.",
    );
  }

  const career = await prisma.career.findUnique({
    where: { id: input.careerId },
    select: {
      id: true,
      mode: true,
      selectedTeam: {
        select: {
          id: true,
          slug: true,
          isCustom: true,
          logoUrl: true,
        },
      },
    },
  });

  if (!career?.selectedTeam || career.mode !== "MY_TEAM" || !career.selectedTeam.isCustom) {
    throw new TeamLogoUploadError(
      "TEAM_NOT_ELIGIBLE",
      "Logo upload is available only for custom team careers.",
    );
  }

  await mkdir(TEAM_LOGO_UPLOAD_DIR, { recursive: true });

  const fileName = `${sanitizeSlug(career.selectedTeam.slug)}-${Date.now()}-${randomUUID().slice(0, 8)}.png`;
  const absolutePath = path.join(TEAM_LOGO_UPLOAD_DIR, fileName);
  const publicPath = `/uploads/team-logos/${fileName}`;

  await writeFile(absolutePath, Buffer.from(bytes));

  const previousLogoUrl = career.selectedTeam.logoUrl;

  const updated = await prisma.$transaction(async (tx) => {
    await tx.team.update({
      where: { id: career.selectedTeam!.id },
      data: { logoUrl: publicPath },
    });

    const existingRegistryEntry = await tx.assetRegistry.findFirst({
      where: {
        entityType: "TEAM",
        entityId: career.selectedTeam!.id,
        assetType: "TEAM_LOGO",
        packSource: "user-upload",
      },
      select: { id: true },
      orderBy: { createdAt: "desc" },
    });

    const meta = {
      uploadedAtIso: new Date().toISOString(),
      width: png.width,
      height: png.height,
      sizeBytes: input.file.size,
      mimeType: "image/png",
      sourceConfidence: "user-provided",
    };

    if (existingRegistryEntry) {
      await tx.assetRegistry.update({
        where: { id: existingRegistryEntry.id },
        data: {
          sourcePath: publicPath,
          resolvedPath: absolutePath,
          isPlaceholder: false,
          approved: true,
          meta,
        },
      });
    } else {
      await tx.assetRegistry.create({
        data: {
          entityType: "TEAM",
          entityId: career.selectedTeam!.id,
          assetType: "TEAM_LOGO",
          packSource: "user-upload",
          sourcePath: publicPath,
          resolvedPath: absolutePath,
          isPlaceholder: false,
          approved: true,
          meta,
        },
      });
    }

    return {
      teamId: career.selectedTeam!.id,
      logoUrl: publicPath,
      width: png.width,
      height: png.height,
    };
  });

  if (previousLogoUrl && previousLogoUrl.startsWith("/uploads/team-logos/") && previousLogoUrl !== publicPath) {
    const stalePath = path.join(process.cwd(), "public", previousLogoUrl.replace(/^\//, ""));
    await unlink(stalePath).catch(() => {
      return null;
    });
  }

  return updated;
}
