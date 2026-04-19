import type { PropsWithChildren } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { getActiveCareerContext } from "@/server/queries/career";

export default async function GameLayout({ children }: PropsWithChildren) {
  const careerContext = await getActiveCareerContext();

  return (
    <AppShell
      topBarContext={{
        teamName: careerContext.teamName,
        categoryCode: careerContext.categoryCode,
        cashBalance: careerContext.cashBalance,
        currentDateIso: careerContext.currentDateIso,
        careerName: careerContext.careerName,
      }}
    >
      {children}
    </AppShell>
  );
}
