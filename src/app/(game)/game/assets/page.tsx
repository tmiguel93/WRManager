import { FileCheck2, Images, PackageCheck, ShieldCheck } from "lucide-react";

import { KpiCard } from "@/components/common/kpi-card";
import { PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getServerTranslator } from "@/i18n/server";
import { getAssetPackManagerView } from "@/server/queries/assets";

export default async function AssetsPage() {
  const { t } = await getServerTranslator();
  const view = await getAssetPackManagerView().catch(() => ({
    totals: {
      entries: 0,
      packs: 0,
      approved: 0,
      pending: 0,
      placeholders: 0,
      realAssets: 0,
      publicResolved: 0,
    },
    coverage: [],
    packs: [],
    byType: [],
    recentEntries: [],
    importChecklist: [],
  }));

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={t("assets.eyebrow")}
        title={t("assets.managerTitle")}
        description={t("assets.managerDescription")}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label={t("assets.totalEntries")}
          value={`${view.totals.entries}`}
          delta={view.totals.entries / 8}
          icon={<Images className="size-4" />}
        />
        <KpiCard
          label={t("assets.activePacks")}
          value={`${view.totals.packs}`}
          delta={view.totals.packs * 4}
          icon={<PackageCheck className="size-4" />}
        />
        <KpiCard
          label={t("assets.approvedAssets")}
          value={`${view.totals.approved}`}
          delta={view.totals.approved - view.totals.pending}
          icon={<ShieldCheck className="size-4" />}
        />
        <KpiCard
          label={t("assets.publicResolved")}
          value={`${view.totals.publicResolved}`}
          delta={view.totals.publicResolved * 2}
          icon={<FileCheck2 className="size-4" />}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl">{t("assets.coverageTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {view.coverage.map((row) => (
              <div key={row.entityType} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium">{row.entityType}</span>
                  <span className="text-xs text-muted-foreground">
                    {row.linked}/{row.total} · {row.coveragePercent}%
                  </span>
                </div>
                <Progress value={row.coveragePercent} />
                <p className="mt-2 text-xs text-muted-foreground">
                  {t("assets.missingAssets", undefined, { count: row.missing })}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl">{t("assets.importFlowTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-2xl border border-cyan-300/25 bg-cyan-500/10 p-4 text-sm text-cyan-100">
              <p className="font-semibold">{t("assets.importFlowLead")}</p>
              <p className="mt-2 text-xs text-cyan-100/80">{t("assets.importFlowHint")}</p>
            </div>
            {view.importChecklist.map((item, index) => (
              <div key={item} className="flex gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 text-sm">
                <Badge className="h-6 w-6 justify-center rounded-full border border-white/15 bg-white/10 p-0 text-xs">
                  {index + 1}
                </Badge>
                <span className="text-muted-foreground">{item}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl">{t("assets.packSummary")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {view.packs.slice(0, 8).map((pack) => (
              <div key={pack.key} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold">{pack.key}</p>
                  <Badge className="rounded-full border border-white/15 bg-white/10 text-xs">{pack.total}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("assets.packStatus", undefined, {
                    approved: pack.approved,
                    pending: pack.pending,
                    placeholders: pack.placeholders,
                  })}
                </p>
              </div>
            ))}
            {view.packs.length === 0 ? <p className="text-sm text-muted-foreground">{t("assets.empty")}</p> : null}
          </CardContent>
        </Card>

        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl">{t("assets.assetTypeSummary")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {view.byType.map((row) => (
              <div key={row.key} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold">{row.key}</p>
                  <Badge className="rounded-full border border-cyan-300/35 bg-cyan-500/10 text-xs text-cyan-100">
                    {row.total}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("assets.packStatus", undefined, {
                    approved: row.approved,
                    pending: row.pending,
                    placeholders: row.placeholders,
                  })}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <Card className="premium-card">
        <CardHeader>
          <CardTitle className="font-heading text-xl">{t("assets.registryTable")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{t("assets.pack")}</TableHead>
                  <TableHead className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{t("assets.entity")}</TableHead>
                  <TableHead className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{t("assets.assetType")}</TableHead>
                  <TableHead className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{t("common.status")}</TableHead>
                  <TableHead className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{t("assets.path")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {view.recentEntries.map((entry) => (
                  <TableRow key={entry.id} className="border-white/10 hover:bg-white/5">
                    <TableCell>
                      <p className="text-sm font-medium">{entry.displayName ?? entry.packSource}</p>
                      <p className="text-xs text-muted-foreground">{entry.version ?? entry.packSource}</p>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {entry.entityType} · {entry.entityId.slice(0, 8)}
                    </TableCell>
                    <TableCell className="text-xs">{entry.assetType}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Badge className={entry.approved ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-200"}>
                          {entry.approved ? t("common.approved") : t("common.pending")}
                        </Badge>
                        <Badge className={entry.isPlaceholder ? "bg-white/10 text-white" : "bg-cyan-500/20 text-cyan-100"}>
                          {entry.isPlaceholder ? t("common.placeholder") : t("common.licensed")}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[280px] truncate text-xs text-muted-foreground">
                      {entry.publicPath ?? entry.resolvedPath ?? entry.sourcePath ?? t("common.notAvailable")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {view.recentEntries.length === 0 ? (
            <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-muted-foreground">
              {t("assets.empty")}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
