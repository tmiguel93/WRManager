import Link from "next/link";
import { ArrowRight, BellRing, CalendarClock, Siren, UsersRound } from "lucide-react";

import { CountryFlag } from "@/components/common/country-flag";
import { KpiCard } from "@/components/common/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import type { NewsroomHubView } from "@/features/world/types";

interface NewsroomCenterProps {
  view: NewsroomHubView;
}

function priorityStyle(priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW") {
  if (priority === "CRITICAL") return "border-rose-300/35 bg-rose-500/10 text-rose-100";
  if (priority === "HIGH") return "border-amber-300/35 bg-amber-500/10 text-amber-100";
  if (priority === "MEDIUM") return "border-cyan-300/35 bg-cyan-500/10 text-cyan-100";
  return "border-white/20 bg-white/10 text-muted-foreground";
}

export function NewsroomCenter({ view }: NewsroomCenterProps) {
  const breakingCount = view.headlines.filter((item) => item.importance >= 82).length;
  const highCredRumors = view.rumorWire.filter((item) => item.credibility >= 72).length;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Inbox Actions"
          value={`${view.inbox.length}`}
          delta={view.inbox.length * 8}
          icon={<BellRing className="size-4" />}
        />
        <KpiCard
          label="Breaking Headlines"
          value={`${breakingCount}`}
          delta={breakingCount * 7 - 10}
          icon={<Siren className="size-4" />}
        />
        <KpiCard
          label="High Credibility Rumors"
          value={`${highCredRumors}`}
          delta={highCredRumors * 6 - 12}
          icon={<UsersRound className="size-4" />}
        />
        <KpiCard
          label="Next Event"
          value={view.nextEvent ? `${view.nextEvent.daysUntil}d` : "TBA"}
          delta={view.nextEvent ? (12 - view.nextEvent.daysUntil) * 3 : 0}
          icon={<CalendarClock className="size-4" />}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl">Team Inbox</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {view.inbox.map((item) => (
              <div key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold">{item.title}</p>
                  <Badge className={`rounded-full border ${priorityStyle(item.priority)}`}>{item.priority}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{item.source}</p>
                <p className="mt-2 text-sm text-muted-foreground">{item.summary}</p>
                <Link
                  href={item.actionHref}
                  className="mt-2 inline-flex items-center gap-2 text-xs font-medium text-cyan-100 hover:text-cyan-50"
                >
                  {item.actionLabel}
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            ))}
            {view.inbox.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-muted-foreground">
                Inbox is clear. No immediate actions.
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl">News Wire</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {view.headlines.slice(0, 8).map((item) => (
              <div key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="rounded-full border border-white/20 bg-white/10 text-[10px]">
                    {item.categoryCode}
                  </Badge>
                  <Badge className="rounded-full border border-cyan-300/30 bg-cyan-500/10 text-[10px] text-cyan-100">
                    {item.importanceLabel}
                  </Badge>
                </div>
                <p className="mt-2 text-sm font-semibold">{item.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{item.body}</p>
                <p className="mt-2 text-[11px] text-muted-foreground">{formatDate(item.publishedAtIso)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl">Transfer Rumor Board</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Driver</TableHead>
                    <TableHead className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Current</TableHead>
                    <TableHead className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Linked</TableHead>
                    <TableHead className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Credibility</TableHead>
                    <TableHead className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {view.transferRumors.map((item) => (
                    <TableRow key={item.id} className="border-white/10 hover:bg-white/5">
                      <TableCell className="font-medium">{item.driverName}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{item.fromTeamName}</TableCell>
                      <TableCell className="text-xs text-cyan-100">{item.toTeamName}</TableCell>
                      <TableCell>
                        <Badge className="rounded-full border border-amber-300/35 bg-amber-500/10 text-amber-100">
                          {item.credibility}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold">{item.rumorScore}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {view.transferRumors.length === 0 ? (
              <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-muted-foreground">
                No strong transfer links in the current data cycle.
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl">Rumor Stream</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {view.rumorWire.slice(0, 8).map((item) => (
              <div key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="rounded-full border border-white/20 bg-white/10 text-[10px]">
                    {item.categoryCode}
                  </Badge>
                  <Badge className="rounded-full border border-emerald-300/30 bg-emerald-500/10 text-[10px] text-emerald-100">
                    {item.credibilityLabel}
                  </Badge>
                </div>
                <p className="mt-2 text-sm font-semibold">{item.headline}</p>
                <p className="mt-1 text-xs text-muted-foreground">{item.body}</p>
              </div>
            ))}
            <Link
              href="/game/global-hub"
              className="inline-flex items-center gap-2 text-xs font-semibold text-cyan-100 hover:text-cyan-50"
            >
              Open Global Motorsport Hub
              <ArrowRight className="size-3.5" />
            </Link>
          </CardContent>
        </Card>
      </section>

      {view.nextEvent ? (
        <section>
          <Card className="premium-card">
            <CardHeader>
              <CardTitle className="font-heading text-xl">Next Event Focus</CardTitle>
            </CardHeader>
            <CardContent className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                Round {view.nextEvent.round}
              </p>
              <p className="mt-1 text-base font-semibold">{view.nextEvent.name}</p>
              <p className="text-xs text-muted-foreground">{view.nextEvent.circuitName}</p>
              <p className="mt-2 inline-flex items-center gap-2 text-xs text-muted-foreground">
                <CountryFlag countryCode={view.nextEvent.countryCode} className="h-4 w-6" />
                {formatDate(view.nextEvent.startDateIso)} - {view.nextEvent.daysUntil} days
              </p>
              <p className="mt-2 text-xs text-cyan-100">
                Weekend generated: {view.nextEvent.hasWeekend ? "yes" : "no"}
              </p>
            </CardContent>
          </Card>
        </section>
      ) : null}
    </div>
  );
}
