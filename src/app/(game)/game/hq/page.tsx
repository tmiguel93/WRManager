import { AlertTriangle, CalendarClock, Coins, ShieldAlert, Sparkles, TrendingUp } from "lucide-react";

import { EntityAvatar } from "@/components/common/entity-avatar";
import { KpiCard } from "@/components/common/kpi-card";
import { PageHeader } from "@/components/common/page-header";
import { TeamLogoMark } from "@/components/common/team-logo-mark";
import { CountryFlag } from "@/components/common/country-flag";
import { HqCashflowChart } from "@/components/game/hq-cashflow-chart";
import { HqEvolutionChart } from "@/components/game/hq-evolution-chart";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCompactMoney, formatDate, formatMoney } from "@/lib/format";
import { getServerTranslator } from "@/i18n/server";
import { getActiveCareerContext } from "@/server/queries/career";
import { getDashboardSnapshot } from "@/server/queries/dashboard";

function toPercentDelta(current: number, previous: number) {
  if (previous === 0) return 0;
  return ((current - previous) / Math.abs(previous)) * 100;
}

export default async function HqPage() {
  const { t } = await getServerTranslator();
  const activeCareer = await getActiveCareerContext();
  const snapshot = await getDashboardSnapshot({
    careerId: activeCareer.careerId,
    categoryCode: activeCareer.categoryCode,
    currentDateIso: activeCareer.currentDateIso,
  });

  const previousCashBalance =
    snapshot.cashFlow.length > 1
      ? snapshot.cashFlow[snapshot.cashFlow.length - 2].balance
      : snapshot.kpis.cashBalance;
  const cashDelta = toPercentDelta(snapshot.kpis.cashBalance, previousCashBalance);

  const previousEvolutionPoint =
    snapshot.evolution.length > 1
      ? snapshot.evolution[snapshot.evolution.length - 2]
      : snapshot.evolution[snapshot.evolution.length - 1];
  const latestEvolutionPoint = snapshot.evolution[snapshot.evolution.length - 1];
  const competitiveDelta =
    latestEvolutionPoint && previousEvolutionPoint
      ? toPercentDelta(latestEvolutionPoint.performance, previousEvolutionPoint.performance)
      : 0;
  const developmentDelta =
    latestEvolutionPoint && previousEvolutionPoint
      ? toPercentDelta(latestEvolutionPoint.facilities, previousEvolutionPoint.facilities)
      : 0;
  const moraleDelta = toPercentDelta(snapshot.kpis.morale, 72);
  const nextAgenda = snapshot.agenda[0] ?? null;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={t("hq.eyebrow")}
        title={t("hq.title")}
        description={t("hq.description", undefined, { careerName: activeCareer.careerName })}
        badge={`${activeCareer.categoryCode} - ${activeCareer.teamName}`}
      />

      <Card className="premium-card team-outline overflow-hidden">
        <CardContent className="grid gap-4 p-5 md:grid-cols-[auto_1fr_auto] md:items-center">
          <TeamLogoMark
            name={activeCareer.teamName}
            logoUrl={activeCareer.teamLogoUrl}
            className="h-20 w-28"
            priority
          />
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{t("hq.teamIdentity")}</p>
            <p className="mt-1 font-heading text-2xl">{activeCareer.teamName}</p>
            <p className="text-sm text-muted-foreground">
              {activeCareer.teamIsCustom ? t("hq.customProgram") : t("hq.existingOperation")} · {activeCareer.categoryCode}
            </p>
          </div>
          <div className="flex gap-2">
            <span className="h-4 w-10 rounded-full border border-white/25" style={{ backgroundColor: "var(--team-primary)" }} />
            <span className="h-4 w-10 rounded-full border border-white/25" style={{ backgroundColor: "var(--team-secondary)" }} />
            <span className="h-4 w-10 rounded-full border border-white/25" style={{ backgroundColor: "var(--team-accent)" }} />
          </div>
        </CardContent>
      </Card>

      {snapshot.foundationSummary ? (
        <Card className="premium-card team-outline team-gradient">
          <CardHeader>
            <CardTitle className="font-heading text-xl">
              {activeCareer.teamIsCustom ? t("hq.foundedTitle") : t("hq.programSnapshot")}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-white/15 bg-black/20 p-3">
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{t("hq.initialCost")}</p>
              <p className="mt-2 text-base font-semibold">{formatCompactMoney(snapshot.foundationSummary.initialCost)}</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-black/20 p-3">
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{t("hq.contractsClosed")}</p>
              <p className="mt-2 text-base font-semibold">
                {t("hq.contractsClosedValue", undefined, {
                  drivers: snapshot.foundationSummary.contractsClosed.drivers,
                  staff: snapshot.foundationSummary.contractsClosed.staff,
                })}
              </p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-black/20 p-3">
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{t("hq.startingMorale")}</p>
              <p className="mt-2 text-base font-semibold">{snapshot.foundationSummary.morale}/100</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-black/20 p-3">
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{t("hq.mediaExpectation")}</p>
              <p className="mt-2 text-sm font-medium">{snapshot.foundationSummary.mediaExpectation}</p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label={t("hq.cashBalance")}
          value={formatCompactMoney(snapshot.kpis.cashBalance)}
          delta={cashDelta}
          icon={<Coins className="size-4" />}
        />
        <KpiCard
          label={t("hq.monthlyBurn")}
          value={formatCompactMoney(Math.abs(snapshot.kpis.monthlyBurnRate))}
          delta={-Math.abs(snapshot.kpis.monthlyBurnRate) / 500_000}
          icon={<ShieldAlert className="size-4" />}
        />
        <KpiCard
          label={t("hq.teamMorale")}
          value={`${snapshot.kpis.morale}/100`}
          delta={moraleDelta}
          icon={<Sparkles className="size-4" />}
        />
        <KpiCard
          label={t("hq.competitiveIndex")}
          value={`${snapshot.kpis.competitiveIndex}/100`}
          delta={competitiveDelta}
          icon={<TrendingUp className="size-4" />}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl">{t("hq.alertCenter")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {snapshot.alerts.map((alert) => (
              <div key={alert.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">{alert.title}</p>
                  <Badge
                    className={
                      alert.severity === "HIGH"
                        ? "bg-rose-500/15 text-rose-300"
                        : alert.severity === "MEDIUM"
                          ? "bg-amber-500/15 text-amber-200"
                          : "bg-emerald-500/15 text-emerald-300"
                    }
                  >
                    {alert.severity}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{alert.message}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl">{t("hq.weekendRadar")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {nextAgenda ? (
              <div className="space-y-3 rounded-2xl border border-cyan-300/20 bg-cyan-500/10 p-4">
                <Badge className="rounded-full border border-cyan-300/40 bg-cyan-300/10 text-cyan-100">
                  {t("common.round")} {nextAgenda.round}
                </Badge>
                <p className="font-heading text-lg">{nextAgenda.name}</p>
                <p className="text-sm text-muted-foreground">{nextAgenda.circuitName}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CountryFlag countryCode={nextAgenda.countryCode} className="h-4 w-6" />
                  <span>{formatDate(nextAgenda.startDateIso)}</span>
                </div>
                <div className="inline-flex items-center rounded-full border border-amber-300/40 bg-amber-400/10 px-3 py-1 text-xs text-amber-100">
                  <CalendarClock className="mr-1 size-3" />
                  {t("common.daysRemaining", undefined, { count: nextAgenda.daysUntil })}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t("hq.noUpcomingEvent")}</p>
            )}

            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{t("hq.immediatePriorities")}</p>
              {snapshot.priorities.map((priority) => (
                <div key={priority} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm">
                  {priority}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl">{t("hq.cashFlowTrend")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <HqCashflowChart data={snapshot.cashFlow} />
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <p className="text-xs text-muted-foreground">{t("hq.currentCash")}</p>
                <p className="text-lg font-semibold">{formatMoney(snapshot.kpis.cashBalance)}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <p className="text-xs text-muted-foreground">{t("hq.monthlyBurnProjection")}</p>
                <p className="text-lg font-semibold text-amber-100">{formatMoney(Math.abs(snapshot.kpis.monthlyBurnRate))}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl">{t("hq.teamEvolution")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <HqEvolutionChart data={snapshot.evolution} />
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <p className="text-xs text-muted-foreground">{t("hq.developmentPace")}</p>
                <p className="text-lg font-semibold">{snapshot.kpis.developmentPace}/100</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <p className="text-xs text-muted-foreground">{t("hq.facilitiesMomentum")}</p>
                <p className="text-lg font-semibold">{developmentDelta.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <Card className="premium-card">
        <CardHeader>
          <CardTitle className="font-heading text-xl">{t("hq.driverMoralePulse")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {snapshot.driverPulse.map((driver) => (
            <div key={driver.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <EntityAvatar
                    entityType="DRIVER"
                    name={driver.name}
                    countryCode={driver.countryCode}
                    imageUrl={driver.imageUrl}
                  />
                  <div>
                    <p className="text-sm font-medium">{driver.name}</p>
                    <p className="text-xs text-muted-foreground">OVR {driver.overall} - POT {driver.potential}</p>
                  </div>
                </div>
                <div className="text-right text-xs">
                  <p className="font-semibold text-cyan-100">{driver.morale}/100</p>
                </div>
              </div>
              <div className="mt-2">
                <Progress value={driver.morale} />
              </div>
            </div>
          ))}

          {snapshot.driverPulse.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-muted-foreground">
              <AlertTriangle className="mb-2 size-4 text-amber-300" />
              {t("hq.noRoster")}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
