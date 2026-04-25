"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Building2, Database, Landmark, TrendingUp } from "lucide-react";
import { toast } from "sonner";

import { upgradeTeamFacilityAction } from "@/app/(game)/game/car-development/actions";
import { KpiCard } from "@/components/common/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { EngineeringCenterView } from "@/features/engineering/types";
import { useI18n } from "@/i18n/client";
import { formatCompactMoney } from "@/lib/format";

interface FacilitiesCenterProps {
  view: EngineeringCenterView;
}

export function FacilitiesCenter({ view }: FacilitiesCenterProps) {
  const { t } = useI18n();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function upgradeFacility(teamFacilityId: string) {
    startTransition(async () => {
      const result = await upgradeTeamFacilityAction({ teamFacilityId });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label={t("facilities.infrastructure")}
          value={`${view.facilityImpact.weightedScore}/100`}
          delta={view.facilityImpact.efficiencyBonus}
          icon={<Building2 className="size-4" />}
        />
        <KpiCard
          label={t("facilities.developmentPace")}
          value={`${view.facilityImpact.developmentPaceBonus >= 0 ? "+" : ""}${view.facilityImpact.developmentPaceBonus}`}
          delta={view.facilityImpact.developmentPaceBonus * 1.2}
          icon={<TrendingUp className="size-4" />}
        />
        <KpiCard
          label={t("facilities.reliabilityBuffer")}
          value={`${view.facilityImpact.reliabilityBonus >= 0 ? "+" : ""}${view.facilityImpact.reliabilityBonus}`}
          delta={view.facilityImpact.reliabilityBonus * 1.1}
          icon={<Landmark className="size-4" />}
        />
        <KpiCard
          label={t("facilities.cashBalance")}
          value={formatCompactMoney(view.context.cashBalance)}
          delta={0}
          icon={<Database className="size-4" />}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl">{t("facilities.network")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {view.facilities.map((facility) => {
              const levelPercent = (facility.level / Math.max(1, facility.maxLevel)) * 100;
              const canUpgrade = facility.level < facility.maxLevel && facility.upgradeCost > 0;
              const affordable = view.context.cashBalance >= facility.upgradeCost;

              return (
                <div key={facility.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{facility.name}</p>
                      <p className="text-xs text-muted-foreground">{facility.description}</p>
                    </div>
                    <Badge className="rounded-full border border-cyan-300/35 bg-cyan-500/10 text-cyan-100">
                      L{facility.level}/{facility.maxLevel}
                    </Badge>
                  </div>

                  <div className="mt-3 space-y-2">
                    <div>
                      <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                        <span>{t("facilities.progress")}</span>
                        <span>{levelPercent.toFixed(0)}%</span>
                      </div>
                      <Progress value={levelPercent} />
                    </div>
                    <div>
                      <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                        <span>{t("facilities.condition")}</span>
                        <span>{facility.condition}%</span>
                      </div>
                      <Progress value={facility.condition} />
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground">
                      {t("facilities.upgradeCost")}{" "}
                      <span className="font-semibold text-foreground">
                        {canUpgrade ? formatCompactMoney(facility.upgradeCost) : t("facilities.maxed")}
                      </span>
                    </p>
                    <Button
                      variant="premium"
                      size="sm"
                      className="h-8"
                      disabled={isPending || !canUpgrade || !affordable}
                      onClick={() => upgradeFacility(facility.id)}
                    >
                      {canUpgrade ? (affordable ? t("facilities.upgrade") : t("facilities.insufficientCash")) : t("facilities.maxLevel")}
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl">{t("facilities.context")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{t("facilities.managerProfile")}</p>
              <p className="mt-1 text-sm font-semibold">{view.context.managerProfileCode}</p>
            </div>
            <div className="rounded-2xl border border-cyan-300/20 bg-cyan-500/10 p-3 text-sm text-cyan-100">
              {t("facilities.efficiencyHint", undefined, {
                value: `${view.facilityImpact.efficiencyBonus >= 0 ? "+" : ""}${view.facilityImpact.efficiencyBonus}`,
              })}
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{t("facilities.supplierStack")}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {view.suppliers.map((supplier) => (
                  <Badge
                    key={supplier.id}
                    className="rounded-full border border-white/15 bg-white/10 text-xs"
                  >
                    {supplier.type} · {supplier.name}
                  </Badge>
                ))}
                {view.suppliers.length === 0 ? (
                  <span className="text-xs text-muted-foreground">{t("facilities.noSuppliers")}</span>
                ) : null}
              </div>
            </div>
            <div className="rounded-2xl border border-emerald-300/20 bg-emerald-500/10 p-3 text-xs text-emerald-100">
              {t("facilities.upgradeHint")}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
