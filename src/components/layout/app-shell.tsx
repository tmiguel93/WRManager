import type { CSSProperties, PropsWithChildren } from "react";

import { SideNav } from "@/components/layout/side-nav";
import { TopBar } from "@/components/layout/top-bar";
import { FadeIn } from "@/components/motion/fade-in";
import { createTeamTheme } from "@/lib/team-theme";

interface AppShellProps extends PropsWithChildren {
  topBarContext: {
    teamName: string;
    teamLogoUrl: string | null;
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
          "--primary": normalizedTheme.primary,
          "--primary-foreground": normalizedTheme.onPrimary,
          "--ring": normalizedTheme.accent,
        } as CSSProperties
      }
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle_at_top_right, color-mix(in oklab, var(--team-primary) 18%, transparent) 0%, transparent 36%), radial-gradient(circle_at_bottom_left, color-mix(in oklab, var(--team-secondary) 16%, transparent) 0%, transparent 34%)",
        }}
      />
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
