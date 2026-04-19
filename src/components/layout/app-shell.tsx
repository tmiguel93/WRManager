import type { CSSProperties, PropsWithChildren } from "react";

import { SideNav } from "@/components/layout/side-nav";
import { TopBar } from "@/components/layout/top-bar";
import { FadeIn } from "@/components/motion/fade-in";
import { createTeamTheme } from "@/lib/team-theme";

interface AppShellProps extends PropsWithChildren {
  topBarContext: {
    teamName: string;
    categoryCode: string;
    cashBalance: number;
    currentDateIso: string;
    careerName: string;
    seasonPhase: "PRESEASON" | "ROUND_ACTIVE" | "MID_SEASON" | "SEASON_END" | "OFFSEASON";
  };
  teamTheme: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

export function AppShell({ children, topBarContext, teamTheme }: AppShellProps) {
  const normalizedTheme = createTeamTheme({
    primary: teamTheme.primary,
    secondary: teamTheme.secondary,
    accent: teamTheme.accent,
  });

  return (
    <div
      className="relative flex min-h-screen bg-app-surface"
      style={
        {
          "--team-primary": normalizedTheme.primary,
          "--team-secondary": normalizedTheme.secondary,
          "--team-accent": normalizedTheme.accent,
        } as CSSProperties
      }
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(14,165,233,0.18)_0%,_transparent_36%),radial-gradient(circle_at_bottom_left,_rgba(234,179,8,0.12)_0%,_transparent_34%)]" />
      <SideNav />
      <div className="relative z-10 flex min-h-screen flex-1 flex-col">
        <TopBar {...topBarContext} />
        <main className="flex-1 px-4 py-6 md:px-6 lg:px-10">
          <FadeIn>{children}</FadeIn>
        </main>
      </div>
    </div>
  );
}
