import { NextResponse } from "next/server";

import { uploadTeamLogoForCareer, TeamLogoUploadError } from "@/persistence/assets/team-logo-upload";
import { toPublicErrorMessage } from "@/lib/public-error";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const careerId = formData.get("careerId");
    const logo = formData.get("logo");

    if (typeof careerId !== "string" || !careerId.trim()) {
      return NextResponse.json(
        {
          ok: false,
          message: "Career context is required.",
        },
        { status: 400 },
      );
    }

    if (!(logo instanceof File)) {
      return NextResponse.json(
        {
          ok: false,
          message: "PNG logo file is required.",
        },
        { status: 400 },
      );
    }

    const stored = await uploadTeamLogoForCareer({
      careerId: careerId.trim(),
      file: logo,
    });

    return NextResponse.json({
      ok: true,
      message: "Team logo updated.",
      logoUrl: stored.logoUrl,
      width: stored.width,
      height: stored.height,
    });
  } catch (error) {
    if (error instanceof TeamLogoUploadError) {
      return NextResponse.json(
        {
          ok: false,
          message: error.message,
          code: error.code,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        ok: false,
        message: toPublicErrorMessage(error, "Could not upload team logo."),
      },
      { status: 500 },
    );
  }
}
