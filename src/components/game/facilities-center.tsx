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
import { formatCompactMoney } from "@/lib/format";

interface FacilitiesCenterProps {
  view: EngineeringCenterView;
}

export function FacilitiesCenter({ view }: FacilitiesCenterProps) {
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
          label="Facility Infrastructure"
          value={`${view.facilityImpact.weightedScore}/100`}
          delta={view.facilityImpact.efficiencyBonus}
          icon={<Building2 className="size-4" />}
        />
        <KpiCard
          label="Development Pace"
          value={`${view.facilityImpact.developmentPaceBonus >= 0 ? "+" : ""}${view.facilityImpact.developmentPaceBonus}`}
          delta={view.facilityImpact.developmentPaceBonus * 1.2}
          icon={<TrendingUp className="size-4" />}
        />
        <KpiCard
          label="Reliability Buffer"
          value={`${view.facilityImpact.reliabilityBonus >= 0 ? "+" : ""}${view.facilityImpact.reliabilityBonus}`}
          delta={view.facilityImpact.reliabilityBonus * 1.1}
          icon={<Landmark className="size-4" />}
        />
        <KpiCard
          label="Cash Balance"
          value={formatCompactMoney(view.context.cashBalance)}
          delta={0}
          icon={<Database className="size-4" />}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl">Facility Network</CardTitle>
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
                        <span>Progress</span>
                        <span>{levelPercent.toFixed(0)}%</span>
                      </div>
                      <Progress value={levelPercent} />
                    </div>
                    <div>
                      <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                        <span>Condition</span>
                        <span>{facility.condition}%</span>
                      </div>
                      <Progress value={facility.condition} />
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground">
                      Upgrade cost{" "}
                      <span className="font-semibold text-foreground">
                        {canUpgrade ? formatCompactMoney(facility.upgradeCost) : "MAXED"}
                      </span>
                    </p>
                    <Button
                      variant="premium"
                      size="sm"
                      className="h-8"
                      disabled={isPending || !canUpgrade || !affordable}
                      onClick={() => upgradeFacility(facility.id)}
                    >
                      {canUpgrade ? (affordable ? "Upgrade" : "Insufficient Cash") : "Max Level"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl">Engineering Context</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Manager Profile</p>
              <p className="mt-1 text-sm font-semibold">{view.context.managerProfileCode}</p>
            </div>
            <div className="rounded-2xl border border-cyan-300/20 bg-cyan-500/10 p-3 text-sm text-cyan-100">
              Facility efficiency is currently adding{" "}
              <span className="font-semibold">
                {view.facilityImpact.efficiencyBonus >= 0 ? "+" : ""}
                {view.facilityImpact.efficiencyBonus}
              </span>{" "}
              to car development throughput.
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Active Supplier Stack</p>
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
                  <span className="text-xs text-muted-foreground">No active suppliers linked.</span>
                ) : null}
              </div>
            </div>
            <div className="rounded-2xl border border-emerald-300/20 bg-emerald-500/10 p-3 text-xs text-emerald-100">
              Upgrades feed directly into project cost, completion speed, and realized engineering delta.
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
