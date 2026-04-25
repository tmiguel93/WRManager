import Link from "next/link";
import { CalendarClock, Flag, Globe2, Route } from "lucide-react";

import { CountryFlag } from "@/components/common/country-flag";
import { KpiCard } from "@/components/common/kpi-card";
import { PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getServerTranslator } from "@/i18n/server";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getChampionshipCalendarView } from "@/server/queries/championship";

interface CalendarPageProps {
  searchParams: Promise<{ category?: string }>;
}

function trackTypeLabel(trackType: string) {
  return trackType
    .toLowerCase()
    .split("_")
    .map((token) => token.slice(0, 1).toUpperCase() + token.slice(1))
    .join(" ");
}

export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  const { t } = await getServerTranslator();
  const { category } = await searchParams;
  const view = await getChampionshipCalendarView(category);

  if (!view) {
    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow={t("calendar.eyebrow", "Season Flow")}
          title={t("calendar.titleGlobal", "Global Calendar")}
          description={t("calendar.noData", "No championship calendar data available for the current save context.")}
        />
      </div>
    );
  }

  const upcoming = view.events.filter((event) => event.daysUntil >= 0);
  const completed = view.events.filter((event) => event.daysUntil < 0);
  const nextEvent = upcoming[0] ?? null;
  const seasonProgress =
    view.totalRounds > 0
      ? ((Math.max(0, Math.min(view.currentRound - 1, view.totalRounds)) / view.totalRounds) * 100)
      : 0;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={t("calendar.eyebrow", "Season Flow")}
        title={t("calendar.title", "Championship Calendar")}
        description={t(
          "calendar.description",
          "Track full-season progression with category-specific rounds, track types and global motorsport schedule context.",
        )}
        badge={`${view.selectedCategory.code} · ${view.seasonYear}`}
      />

      <section className="flex flex-wrap gap-2">
        {view.categories.map((option) => {
          const isActive = option.code === view.selectedCategory.code;
          return (
            <Link
              key={option.code}
              href={`/game/calendar?category=${option.code}`}
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

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label={t("calendar.kpiProgress", "Season Progress")}
          value={`${seasonProgress.toFixed(0)}%`}
          delta={seasonProgress - 50}
          icon={<Route className="size-4" />}
        />
        <KpiCard
          label={t("calendar.kpiRounds", "Total Rounds")}
          value={`${view.totalRounds}`}
          delta={0}
          icon={<CalendarClock className="size-4" />}
        />
        <KpiCard
          label={t("calendar.kpiUpcoming", "Upcoming Events")}
          value={`${upcoming.length}`}
          delta={upcoming.length - completed.length}
          icon={<Flag className="size-4" />}
        />
        <KpiCard
          label={t("calendar.kpiCompleted", "Completed")}
          value={`${completed.length}`}
          delta={completed.length - upcoming.length}
          icon={<Globe2 className="size-4" />}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl">
              {t("calendar.timeline", "Season Timeline")} · {view.selectedCategory.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {view.events.map((event) => (
              <div
                key={event.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                      {t("calendar.round", "Round")} {event.round} · {trackTypeLabel(event.trackType)}
                    </p>
                    <p className="text-base font-semibold">{event.name}</p>
                  </div>
                  <Badge
                    className={
                      event.daysUntil < 0
                        ? "rounded-full border border-emerald-300/30 bg-emerald-500/10 text-emerald-100"
                        : "rounded-full border border-amber-300/30 bg-amber-500/10 text-amber-100"
                    }
                  >
                    {event.daysUntil < 0 ? t("calendar.completed", "Completed") : `${event.daysUntil}d`}
                  </Badge>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-2">
                    <CountryFlag countryCode={event.countryCode} className="h-4 w-6" />
                    {event.circuitName}
                  </span>
                  <span>{formatDate(event.startDateIso)}</span>
                  <span>{event.weatherProfile}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl">{t("calendar.radar", "Global Category Radar")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {view.globalOverview.map((row) => (
              <div key={row.categoryCode} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold">{row.categoryName}</p>
                  <Badge className="rounded-full border border-white/15 bg-white/10 text-xs">{row.categoryCode}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {row.currentRound}/{Math.max(1, row.totalRounds)} {t("calendar.rounds", "rounds")} · {row.status}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("calendar.next", "Next")}: {" "}
                  <span className="text-foreground">
                    {row.nextEvent ? `${row.nextEvent.name} (${formatDate(row.nextEvent.startDateIso)})` : t("calendar.tba", "TBA")}
                  </span>
                </p>
              </div>
            ))}

            {nextEvent ? (
              <div className="rounded-2xl border border-cyan-300/20 bg-cyan-500/10 p-3 text-sm text-cyan-100">
                {t("calendar.nextFocus", "Next in focus")}: {nextEvent.name} {t("calendar.at", "at")} {nextEvent.circuitName} {t("calendar.on", "on")} {formatDate(nextEvent.startDateIso)}.
              </div>
            ) : null}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
