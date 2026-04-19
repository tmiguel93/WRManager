import Link from "next/link";

import { PageHeader } from "@/components/common/page-header";
import { WeekendRulesCenter } from "@/components/game/weekend-rules-center";
import { getWeekendRulesCenterView } from "@/server/queries/weekend-rules";
import { cn } from "@/lib/utils";

interface WeekendRulesPageProps {
  searchParams: Promise<{ category?: string }>;
}

export default async function WeekendRulesPage({ searchParams }: WeekendRulesPageProps) {
  const { category } = await searchParams;
  const view = await getWeekendRulesCenterView(category);

  if (!view) {
    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow="Weekend Engine"
          title="Weekend Rules"
          description="No ruleset data available for the current save context."
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Weekend Engine"
        title="Weekend Rules"
        description="Category-specific rulesets, session formats and race weekend generation layer for multi-series simulation."
        badge={`${view.selectedCategory.code} · ${view.seasonYear}`}
      />

      <section className="flex flex-wrap gap-2">
        {view.categories.map((option) => {
          const isActive = option.code === view.selectedCategory.code;
          return (
            <Link
              key={option.code}
              href={`/game/weekend-rules?category=${option.code}`}
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

      <WeekendRulesCenter view={view} />
    </div>
  );
}
