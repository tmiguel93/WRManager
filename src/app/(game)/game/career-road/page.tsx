import { Award, BrainCircuit, Flag, Handshake, Route, ShieldCheck, Sparkles, Trophy } from "lucide-react";

import { EntityAvatar } from "@/components/common/entity-avatar";
import { KpiCard } from "@/components/common/kpi-card";
import { PageHeader } from "@/components/common/page-header";
import { CountryFlag } from "@/components/common/country-flag";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getServerTranslator } from "@/i18n/server";
import { formatCompactMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getCareerIntelligenceView } from "@/server/queries/career-intelligence";

function statusKey(status: string) {
  if (status === "UNLOCKED") return "careerRoad.statusUnlocked";
  if (status === "NEAR") return "careerRoad.statusNear";
  return "careerRoad.statusLocked";
}

function opportunityStatusKey(status: string) {
  if (status === "READY") return "careerRoad.opportunityReady";
  if (status === "WATCHLIST") return "careerRoad.opportunityWatchlist";
  return "careerRoad.opportunityLongTerm";
}

function mediaTypeKey(type: string) {
  if (type === "RUMOR") return "careerRoad.mediaRumor";
  if (type === "PRESSURE") return "careerRoad.mediaPressure";
  return "careerRoad.mediaNews";
}

function priorityClass(priority: string) {
  if (priority === "HIGH") return "border-rose-300/30 bg-rose-500/10 text-rose-100";
  if (priority === "MEDIUM") return "border-amber-300/30 bg-amber-500/10 text-amber-100";
  return "border-emerald-300/30 bg-emerald-500/10 text-emerald-100";
}

function toneClass(tone: string) {
  if (tone === "WARNING") return "border-rose-300/30 bg-rose-500/10";
  if (tone === "POSITIVE") return "border-emerald-300/30 bg-emerald-500/10";
  return "border-white/10 bg-white/5";
}

export default async function CareerRoadPage() {
  const { t } = await getServerTranslator();
  const view = await getCareerIntelligenceView();
  const tierShort = t("careerRoad.tierShort");
  const nextTierLabel = view.summary.nextTier
    ? `${tierShort} ${view.summary.nextTier}`
    : t("careerRoad.eliteReached");

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={t("careerRoad.eyebrow")}
        title={t("careerRoad.title")}
        description={t("careerRoad.description")}
        badge={`${view.activeCareer.teamName} - ${view.activeCareer.categoryCode}`}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label={t("careerRoad.kpiTier")}
          value={`${tierShort} ${view.summary.currentTier} -> ${nextTierLabel}`}
          delta={view.summary.strongestGatePercent - 50}
          icon={<Route className="size-4" />}
        />
        <KpiCard
          label={t("careerRoad.kpiUnlocked")}
          value={`${view.summary.unlockedCategories}/${view.summary.totalCategories}`}
          delta={(view.summary.unlockedCategories / Math.max(1, view.summary.totalCategories)) * 100 - 50}
          icon={<Trophy className="size-4" />}
        />
        <KpiCard
          label={t("careerRoad.kpiStaff")}
          value={`${view.summary.staffQuality}/100`}
          delta={view.summary.staffQuality - 60}
          icon={<BrainCircuit className="size-4" />}
        />
        <KpiCard
          label={t("careerRoad.kpiPerformance")}
          value={`${view.summary.performanceScore}/100`}
          delta={view.summary.performanceScore - 60}
          icon={<Flag className="size-4" />}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="premium-card overflow-hidden">
          <CardHeader>
            <CardTitle className="font-heading text-xl">{t("careerRoad.roadTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {view.roadToTop.map((node) => (
              <div
                key={node.code}
                className={cn(
                  "rounded-3xl border p-4 transition-colors",
                  node.isCurrent ? "team-outline team-gradient" : "border-white/10 bg-white/5",
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="rounded-full border border-white/15 bg-white/10 text-xs">
                        {tierShort} {node.tier}
                      </Badge>
                      <p className="font-heading text-lg">{node.name}</p>
                      <span className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{node.code}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {node.region} - {node.discipline} - {t("careerRoad.teamsCount", undefined, { count: node.teamsCount })}
                    </p>
                  </div>
                  <Badge
                    className={cn(
                      "rounded-full border text-xs",
                      node.status === "UNLOCKED" && "border-emerald-300/30 bg-emerald-500/10 text-emerald-100",
                      node.status === "NEAR" && "border-cyan-300/30 bg-cyan-500/10 text-cyan-100",
                      node.status === "LOCKED" && "border-white/10 bg-white/5 text-muted-foreground",
                    )}
                  >
                    {t(statusKey(node.status))}
                  </Badge>
                </div>
                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{t("careerRoad.readiness")}</span>
                    <span>{node.progressPercent}%</span>
                  </div>
                  <Progress value={node.progressPercent} />
                </div>
                {node.missing.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {node.missing.slice(0, 4).map((item) => (
                      <Badge key={item} className="rounded-full border border-amber-300/20 bg-amber-500/10 text-xs text-amber-100">
                        {t(item)}
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card className="premium-card">
            <CardHeader>
              <CardTitle className="font-heading text-xl">{t("careerRoad.boardTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {view.boardObjectives.map((objective) => (
                <div key={objective.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{t(objective.titleKey)}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{t(objective.descriptionKey)}</p>
                    </div>
                    <Badge className={cn("rounded-full border text-[10px]", priorityClass(objective.priority))}>
                      {t(`careerRoad.priority${objective.priority}`)}
                    </Badge>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <Progress value={objective.progressPercent} />
                    <span className="w-10 text-right text-xs text-muted-foreground">{objective.progressPercent}%</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="premium-card">
            <CardHeader>
              <CardTitle className="font-heading text-xl">{t("careerRoad.chemistryTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              {view.chemistry.map((signal) => (
                <div key={signal.id} className={cn("rounded-2xl border p-3", toneClass(signal.tone))}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold">{t(signal.labelKey)}</p>
                    <span className="text-sm font-semibold">{signal.value}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{t(signal.detailKey)}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl">{t("careerRoad.opportunitiesTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead>{t("common.team")}</TableHead>
                    <TableHead>{t("common.category")}</TableHead>
                    <TableHead>{t("careerRoad.invitation")}</TableHead>
                    <TableHead>{t("common.status")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {view.opportunities.map((opportunity) => (
                    <TableRow key={opportunity.id} className="border-white/10 hover:bg-white/5">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <CountryFlag countryCode={opportunity.countryCode} className="h-4 w-6" />
                          <div>
                            <p className="text-sm font-medium">{opportunity.teamName}</p>
                            <p className="text-xs text-muted-foreground">{t(opportunity.reasonKey)}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {opportunity.categoryCode} - {tierShort} {opportunity.tier}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={opportunity.invitationScore} />
                          <span className="w-8 text-right text-xs">{opportunity.invitationScore}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className="rounded-full border border-cyan-300/25 bg-cyan-500/10 text-xs text-cyan-100">
                          {t(opportunityStatusKey(opportunity.status))}
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
            <CardTitle className="font-heading text-xl">{t("careerRoad.academyTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {view.academyProspects.map((prospect) => (
              <div key={prospect.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-center gap-3">
                  <EntityAvatar
                    entityType="DRIVER"
                    name={prospect.name}
                    countryCode={prospect.countryCode}
                    imageUrl={prospect.imageUrl}
                    className="shrink-0"
                  />
                  <div>
                    <p className="text-sm font-semibold">{prospect.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {prospect.categoryCode} - {prospect.age} - {prospect.teamName ?? t("common.freeAgent")}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{prospect.fitScore}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("drivers.overall")} {prospect.overall} / {t("common.potential")} {prospect.potential}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl">{t("careerRoad.legacyTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {view.achievements.map((achievement) => (
              <div key={achievement.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {achievement.isComplete ? (
                      <ShieldCheck className="size-4 text-emerald-300" />
                    ) : (
                      <Award className="size-4 text-muted-foreground" />
                    )}
                    <p className="text-sm font-semibold">{t(achievement.titleKey)}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{achievement.progressPercent}%</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{t(achievement.detailKey)}</p>
                <div className="mt-3">
                  <Progress value={achievement.progressPercent} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl">{t("careerRoad.mediaTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {view.mediaSignals.map((signal) => (
              <div key={signal.id} className="flex items-start justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="rounded-full border border-white/10 bg-white/10 text-[10px]">
                      {t(mediaTypeKey(signal.type))}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{signal.categoryCode}</span>
                  </div>
                  <p className="mt-2 text-sm font-medium">{signal.headline}</p>
                </div>
                <div className="flex items-center gap-1 text-sm font-semibold team-accent-text">
                  <Sparkles className="size-4" />
                  {signal.score}
                </div>
              </div>
            ))}
            {view.mediaSignals.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-muted-foreground">
                {t("careerRoad.noMediaSignals")}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </section>

      <Card className="premium-card team-outline team-gradient">
        <CardContent className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{t("careerRoad.financialReadiness")}</p>
            <p className="mt-1 font-heading text-2xl">{formatCompactMoney(view.activeCareer.cashBalance)}</p>
            <p className="text-sm text-muted-foreground">
              {t("careerRoad.financialReadinessHint", undefined, { reputation: view.activeCareer.reputation })}
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/20 px-4 py-2 text-sm">
            <Handshake className="size-4 team-accent-text" />
            {t("careerRoad.nextAction")}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
