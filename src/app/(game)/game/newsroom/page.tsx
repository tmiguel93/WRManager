import Link from "next/link";

import { PageHeader } from "@/components/common/page-header";
import { NewsroomCenter } from "@/components/game/newsroom-center";
import { cn } from "@/lib/utils";
import { getNewsroomHubView } from "@/server/queries/motorsport-world";

interface NewsroomPageProps {
  searchParams: Promise<{ category?: string }>;
}

export default async function NewsroomPage({ searchParams }: NewsroomPageProps) {
  const { category } = await searchParams;
  const view = await getNewsroomHubView(category);

  if (!view) {
    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow="Media and Inbox"
          title="Newsroom"
          description="No newsroom context available for the current save."
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Media and Inbox"
        title="Newsroom"
        description="Monitor inbox priorities, global headlines, transfer rumors and paddock intelligence."
        badge={`${view.selectedCategory.code} - ${view.seasonYear}`}
      />

      <section className="flex flex-wrap gap-2">
        {view.categories.map((option) => {
          const isActive = option.code === view.selectedCategory.code;
          return (
            <Link
              key={option.code}
              href={`/game/newsroom?category=${option.code}`}
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

      <NewsroomCenter view={view} />
    </div>
  );
}
