import { redirect } from "next/navigation";

import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { MyTeamOnboarding } from "@/features/career/components/my-team-onboarding";
import { getMyTeamOnboardingView } from "@/server/queries/career-onboarding";

interface OnboardingPageProps {
  params: Promise<{ careerId: string }>;
}

export default async function CareerOnboardingPage({ params }: OnboardingPageProps) {
  const { careerId } = await params;
  const view = await getMyTeamOnboardingView(careerId);

  if (!view) {
    redirect("/career/new");
  }

  if (view.career.mode !== "MY_TEAM") {
    redirect(`/game/hq?careerId=${careerId}`);
  }

  if (view.career.onboardingComplete) {
    redirect(`/game/hq?careerId=${careerId}`);
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-app-surface px-6 py-8 md:px-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_6%,_rgba(56,189,248,0.16),_transparent_30%),radial-gradient(circle_at_78%_14%,_rgba(250,204,21,0.12),_transparent_28%)]" />
      <main className="relative z-10 mx-auto w-full max-w-7xl space-y-7">
        <PageHeader
          eyebrow="My Team Founding"
          title="Build Your Starting Lineup"
          description="Before entering HQ, lock your first drivers and core staff with real contract negotiations."
          badge={`${view.team.shortName} · ${view.category.code}`}
        />

        <Card className="premium-card border-amber-300/20 bg-amber-500/10">
          <CardContent className="p-4 text-sm text-amber-100/90">
            Launch rule active: this career starts in feeder tiers and requires a complete founding lineup before season kickoff.
          </CardContent>
        </Card>

        <MyTeamOnboarding
          careerId={view.career.id}
          managerProfileCode={view.career.managerProfileCode}
          team={view.team}
          category={view.category}
          cashBalance={view.career.cashBalance}
          lineup={view.lineup}
          market={view.market}
        />
      </main>
    </div>
  );
}
