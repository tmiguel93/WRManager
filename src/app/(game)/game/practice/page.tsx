import Link from "next/link";

import { PageHeader } from "@/components/common/page-header";
import { PracticeCenter } from "@/components/game/practice-center";
import { getPracticeCenterView } from "@/server/queries/weekend-sessions";
import { cn } from "@/lib/utils";

interface PracticePageProps {
  searchParams: Promise<{ category?: string }>;
}

export default async function PracticePage({ searchParams }: PracticePageProps) {
  const { category } = await searchParams;
  const view = await getPracticeCenterView(category);

  if (!view) {
    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow="Race Weekend"
          title="Practice"
          description="No practice context available for the current save."
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Race Weekend"
        title="Practice"
        description="Run setup programs, build track knowledge and prepare qualifying baseline through structured practice sessions."
        badge={`${view.selectedCategory.code} · ${view.seasonYear}`}
      />

      <section className="flex flex-wrap gap-2">
        {view.categories.map((option) => {
          const isActive = option.code === view.selectedCategory.code;
          return (
            <Link
              key={option.code}
              href={`/game/practice?category=${option.code}`}
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

      <PracticeCenter view={view} />
    </div>
  );
}
