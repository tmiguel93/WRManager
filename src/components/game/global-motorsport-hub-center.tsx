import { Globe2, Orbit, RadioTower, Trophy } from "lucide-react";

import { EntityAvatar } from "@/components/common/entity-avatar";
import { KpiCard } from "@/components/common/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import { formatRaceTime } from "@/domain/rules/race-control-sim";
import type { GlobalMotorsportHubView } from "@/features/world/types";
import { useI18n } from "@/i18n/client";

interface GlobalMotorsportHubCenterProps {
  view: GlobalMotorsportHubView;
}

export function GlobalMotorsportHubCenter({ view }: GlobalMotorsportHubCenterProps) {
  const { t } = useI18n();
  const categoriesWithActiveNextEvent = view.categories.filter((category) => Boolean(category.nextEventName)).length;
  const highCredRumors = view.rumorWire.filter((item) => item.credibility >= 75).length;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label={t("globalHub.worldCategories")}
          value={`${view.categories.length}`}
          delta={view.categories.length * 4}
          icon={<Globe2 className="size-4" />}
        />
        <KpiCard
          label={t("globalHub.activeNextEvents")}
          value={`${categoriesWithActiveNextEvent}`}
          delta={categoriesWithActiveNextEvent * 6 - 10}
          icon={<Orbit className="size-4" />}
        />
        <KpiCard
          label={t("globalHub.highCredRumors")}
          value={`${highCredRumors}`}
          delta={highCredRumors * 5 - 8}
          icon={<RadioTower className="size-4" />}
        />
        <KpiCard
          label={t("globalHub.recentResults")}
          value={`${view.recentResults.length}`}
          delta={view.recentResults.length * 4}
          icon={<Trophy className="size-4" />}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl">{t("globalHub.categoryPulse")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {view.categories.map((row) => (
              <div key={row.categoryCode} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold">{row.categoryName}</p>
                  <Badge className="rounded-full border border-white/20 bg-white/10 text-xs">{row.categoryCode}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {row.currentRound}/{Math.max(1, row.totalRounds)} {t("calendar.rounds")} - {row.status}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("common.next")}:{" "}
                  <span className="text-foreground">
                    {row.nextEventName && row.nextEventDateIso
                      ? `${row.nextEventName} (${formatDate(row.nextEventDateIso)})`
                      : t("calendar.tba")}
                  </span>
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl">{t("globalHub.regulationWatch")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {view.regulationWatch.map((item) => (
              <div key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold">{item.title}</p>
                  <Badge className="rounded-full border border-amber-300/35 bg-amber-500/10 text-amber-100">
                    {t("common.impact")} {item.impactScore}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{item.categoryCode}</p>
                <p className="mt-2 text-xs text-muted-foreground">{item.summary}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl">{t("globalHub.hotDrivers")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{t("raceCenter.driver")}</TableHead>
                    <TableHead className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{t("raceCenter.team")}</TableHead>
                    <TableHead className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{t("globalHub.category")}</TableHead>
                    <TableHead className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{t("standings.points")}</TableHead>
                    <TableHead className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{t("globalHub.heat")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {view.hotDrivers.map((driver) => (
                    <TableRow key={driver.driverId} className="border-white/10 hover:bg-white/5">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <EntityAvatar
                            entityType="DRIVER"
                            name={driver.name}
                            countryCode={driver.countryCode}
                            imageUrl={driver.imageUrl}
                          />
                          <span className="text-sm">{driver.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{driver.teamName}</TableCell>
                      <TableCell>{driver.categoryCode}</TableCell>
                      <TableCell className="font-semibold">{driver.points}</TableCell>
                      <TableCell>
                        <Badge className="rounded-full border border-cyan-300/35 bg-cyan-500/10 text-cyan-100">
                          {driver.heatIndex}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl">{t("globalHub.hotManufacturers")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                      {t("standings.manufacturerLeader")}
                    </TableHead>
                    <TableHead className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{t("globalHub.category")}</TableHead>
                    <TableHead className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{t("standings.points")}</TableHead>
                    <TableHead className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{t("standings.wins")}</TableHead>
                    <TableHead className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{t("globalHub.heat")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {view.hotManufacturers.map((manufacturer) => (
                    <TableRow key={`${manufacturer.categoryCode}-${manufacturer.manufacturerName}`} className="border-white/10 hover:bg-white/5">
                      <TableCell className="font-medium">{manufacturer.manufacturerName}</TableCell>
                      <TableCell>{manufacturer.categoryCode}</TableCell>
                      <TableCell className="font-semibold">{manufacturer.points}</TableCell>
                      <TableCell>{manufacturer.wins}</TableCell>
                      <TableCell>
                        <Badge className="rounded-full border border-emerald-300/35 bg-emerald-500/10 text-emerald-100">
                          {manufacturer.heatIndex}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl">{t("globalHub.transferRadar")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {view.transferRumors.map((item) => (
              <div key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold">{item.headline}</p>
                  <Badge className="rounded-full border border-amber-300/35 bg-amber-500/10 text-amber-100">
                    {item.credibility}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {item.fromTeamName} to {item.toTeamName} ({item.categoryCode})
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{item.summary}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl">{t("globalHub.recentResults")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {view.recentResults.map((result) => (
              <div key={result.sessionId} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold">
                    {result.categoryCode} - {result.eventName}
                  </p>
                  <Badge className="rounded-full border border-white/20 bg-white/10 text-xs">
                    {result.sessionLabel}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("common.winner")}: {result.winnerDriverName} ({result.winnerTeamName})
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("common.time")}: {typeof result.winnerTimeMs === "number" ? formatRaceTime(result.winnerTimeMs) : t("common.notAvailable")}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl">{t("globalHub.worldHeadlines")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {view.worldHeadlines.slice(0, 12).map((item) => (
              <div key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="rounded-full border border-white/20 bg-white/10 text-[10px]">
                    {item.categoryCode}
                  </Badge>
                  <Badge className="rounded-full border border-cyan-300/35 bg-cyan-500/10 text-[10px] text-cyan-100">
                    {item.importanceLabel}
                  </Badge>
                </div>
                <p className="mt-2 text-sm font-semibold">{item.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{item.body}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl">{t("globalHub.rumorWire")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {view.rumorWire.slice(0, 12).map((item) => (
              <div key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="rounded-full border border-white/20 bg-white/10 text-[10px]">
                    {item.categoryCode}
                  </Badge>
                  <Badge className="rounded-full border border-emerald-300/35 bg-emerald-500/10 text-[10px] text-emerald-100">
                    {item.credibilityLabel}
                  </Badge>
                </div>
                <p className="mt-2 text-sm font-semibold">{item.headline}</p>
                <p className="mt-1 text-xs text-muted-foreground">{item.body}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
