import { NextResponse } from "next/server";

import { getCareerById } from "@/server/queries/career";

interface RouteParams {
  params: Promise<{ careerId: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { careerId } = await params;
  const career = await getCareerById(careerId);

  const redirectUrl = new URL("/game/hq", _request.url);
  if (!career) {
    return NextResponse.redirect(redirectUrl);
  }

  if (career.mode === "MY_TEAM" && !career.onboardingComplete) {
    const onboardingUrl = new URL(`/career/onboarding/${career.id}`, _request.url);
    const response = NextResponse.redirect(onboardingUrl);
    response.cookies.set("wrm_active_career_id", careerId, {
      path: "/",
      maxAge: 60 * 60 * 24 * 90,
      sameSite: "lax",
    });
    return response;
  }

  redirectUrl.searchParams.set("careerId", careerId);
  const response = NextResponse.redirect(redirectUrl);
  response.cookies.set("wrm_active_career_id", careerId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
    sameSite: "lax",
  });

  return response;
}
