import Link from "next/link";

import { PageHeader } from "@/components/common/page-header";
import { QualifyingCenter } from "@/components/game/qualifying-center";
import { getQualifyingCenterView } from "@/server/queries/weekend-sessions";
import { cn } from "@/lib/utils";

interface QualifyingPageProps {
  searchParams: Promise<{ category?: string }>;
}

export default async function QualifyingPage({ searchParams }: QualifyingPageProps) {
  const { category } = await searchParams;
  const view = await getQualifyingCenterView(category);

  if (!view) {
    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow="Race Weekend"
          title="Qualifying"
          description="No qualifying context available for the current save."
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Race Weekend"
        title="Qualifying"
        description="Run quick or detailed qualifying simulations with risk, release timing and tyre strategy controls."
        badge={`${view.selectedCategory.code} · ${view.seasonYear}`}
      />

      <section className="flex flex-wrap gap-2">
        {view.categories.map((option) => {
          const isActive = option.code === view.selectedCategory.code;
          return (
            <Link
              key={option.code}
              href={`/game/qualifying?category=${option.code}`}
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

      <QualifyingCenter view={view} />
    </div>
  );
}
