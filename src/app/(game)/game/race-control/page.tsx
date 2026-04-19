import Link from "next/link";

import { PageHeader } from "@/components/common/page-header";
import { RaceControlCenter } from "@/components/game/race-control-center";
import { cn } from "@/lib/utils";
import { getRaceControlCenterView } from "@/server/queries/race-control";

interface RaceControlPageProps {
  searchParams: Promise<{ category?: string }>;
}

export default async function RaceControlPage({ searchParams }: RaceControlPageProps) {
  const { category } = await searchParams;
  const view = await getRaceControlCenterView(category);

  if (!view) {
    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow="Race Weekend"
          title="Race Control"
          description="No race-control context available for the current save."
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Race Weekend"
        title="Race Control"
        description="Command race pace, pit windows, fuel and tyre behavior with a full event feed and final session result."
        badge={`${view.selectedCategory.code} · ${view.seasonYear}`}
      />

      <section className="flex flex-wrap gap-2">
        {view.categories.map((option) => {
          const isActive = option.code === view.selectedCategory.code;
          return (
            <Link
              key={option.code}
              href={`/game/race-control?category=${option.code}`}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                isActive
                  ? "border-cyan-300/45 bg-cyan-500/10 text-cyan-100"
                  : "border-white/15 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground",
              )}
            >
              {option.code}
            </Link>
          );
        })}
      </section>

      <RaceControlCenter view={view} />
    </div>
  );
}

