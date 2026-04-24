import type { PropsWithChildren } from "react";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { getActiveCareerContext } from "@/server/queries/career";

export default async function GameLayout({ children }: PropsWithChildren) {
  const careerContext = await getActiveCareerContext();

  if (
    careerContext.careerId &&
    careerContext.mode === "MY_TEAM" &&
    !careerContext.onboardingComplete
  ) {
    redirect(`/career/onboarding/${careerContext.careerId}`);
  }

  return (
    <AppShell
      topBarContext={{
        teamName: careerContext.teamName,
        teamLogoUrl: careerContext.teamLogoUrl,
        categoryCode: careerContext.categoryCode,
        cashBalance: careerContext.cashBalance,
        currentDateIso: careerContext.currentDateIso,
        careerName: careerContext.careerName,
        seasonPhase: careerContext.seasonPhase,
      }}
      teamTheme={{
        primary: careerContext.teamPrimaryColor,
        secondary: careerContext.teamSecondaryColor,
        accent: careerContext.teamAccentColor,
      }}
    >
      {children}
    </AppShell>
  );
}
