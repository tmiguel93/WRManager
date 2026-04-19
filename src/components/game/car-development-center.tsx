"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Cog, Gauge, Rocket, ShieldCheck, Timer, Wrench } from "lucide-react";
import { toast } from "sonner";

import {
  completeDevelopmentProjectAction,
  launchDevelopmentProjectAction,
} from "@/app/(game)/game/car-development/actions";
import { KpiCard } from "@/components/common/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { EngineeringCenterView } from "@/features/engineering/types";
import { formatCompactMoney } from "@/lib/format";

interface CarDevelopmentCenterProps {
  view: EngineeringCenterView;
}

export function CarDevelopmentCenter({ view }: CarDevelopmentCenterProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [areaFilter, setAreaFilter] = useState<string>("ALL");

  const filteredProjects = useMemo(() => {
    if (areaFilter === "ALL") return view.projects;
    return view.projects.filter((project) => project.area === areaFilter);
  }, [areaFilter, view.projects]);

  function startProject(carId: string, templateCode: string) {
    startTransition(async () => {
      const result = await launchDevelopmentProjectAction({ carId, templateCode });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      router.refresh();
    });
  }

  function completeProject(projectId: string) {
    startTransition(async () => {
      const result = await completeDevelopmentProjectAction({ projectId });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      router.refresh();
    });
  }

  const projectAreas = ["ALL", ...new Set(view.projects.map((project) => project.area))];
  const inProgressCount = view.projects.filter((project) => project.status === "IN_PROGRESS").length;
  const completedCount = view.projects.filter((project) => project.status === "COMPLETED").length;

  if (!view.car || !view.kpis) {
    return (
      <Card className="premium-card">
        <CardContent className="pt-6 text-sm text-muted-foreground">
          No active car found for the current team/category context.
        </CardContent>
      </Card>
    );
  }
  const activeCar = view.car;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Overall Car Index"
          value={`${view.kpis.overallIndex}/100`}
          delta={view.supplierImpact.performanceDelta * 0.9}
          icon={<Gauge className="size-4" />}
        />
        <KpiCard
          label="Qualifying Pace"
          value={`${view.kpis.qualifyingPace}/100`}
          delta={view.facilityImpact.efficiencyBonus * 0.8}
          icon={<Rocket className="size-4" />}
        />
        <KpiCard
          label="Race Pace"
          value={`${view.kpis.racePace}/100`}
          delta={view.supplierImpact.performanceDelta * 0.65}
          icon={<Timer className="size-4" />}
        />
        <KpiCard
          label="Reliability"
          value={`${view.kpis.reliabilityIndex}/100`}
          delta={view.supplierImpact.reliabilityDelta * 0.7}
          icon={<ShieldCheck className="size-4" />}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl">Current Car Platform</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-lg font-semibold">{view.car.modelName}</p>
              <p className="text-xs text-muted-foreground">Season {view.car.seasonYear}</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm">
                Base Performance: <span className="font-semibold">{view.car.basePerformance}</span>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm">
                Reliability: <span className="font-semibold">{view.car.reliability}</span>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm">
                Downforce: <span className="font-semibold">{view.car.downforce}</span>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm">
                Drag: <span className="font-semibold">{view.car.drag}</span>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm">
              Weight: <span className="font-semibold">{view.car.weight} kg</span>
            </div>
          </CardContent>
        </Card>

        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl">Supplier Influence Package</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-cyan-300/20 bg-cyan-500/10 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-cyan-100/80">Composite Supplier Score</p>
              <p className="mt-2 text-2xl font-semibold text-cyan-100">{view.supplierImpact.compositeScore}/100</p>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                <span>Performance impact</span>
                <span>{view.supplierImpact.performanceDelta >= 0 ? "+" : ""}{view.supplierImpact.performanceDelta}</span>
              </div>
              <Progress value={50 + view.supplierImpact.performanceDelta * 4} />
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                <span>Reliability impact</span>
                <span>{view.supplierImpact.reliabilityDelta >= 0 ? "+" : ""}{view.supplierImpact.reliabilityDelta}</span>
              </div>
              <Progress value={50 + view.supplierImpact.reliabilityDelta * 4} />
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                <span>Development support</span>
                <span>{view.supplierImpact.developmentSupport >= 0 ? "+" : ""}{view.supplierImpact.developmentSupport}</span>
              </div>
              <Progress value={50 + view.supplierImpact.developmentSupport * 4} />
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl">Engineering Programs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-center">
                <p className="text-xs text-muted-foreground">In Progress</p>
                <p className="text-lg font-semibold">{inProgressCount}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-center">
                <p className="text-xs text-muted-foreground">Completed</p>
                <p className="text-lg font-semibold">{completedCount}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-center">
                <p className="text-xs text-muted-foreground">Cash Reserve</p>
                <p className="text-lg font-semibold text-cyan-100">{formatCompactMoney(view.context.cashBalance)}</p>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-muted-foreground">
              Manager profile <span className="font-semibold text-foreground">{view.context.managerProfileCode}</span>{" "}
              currently applies budget and risk modifiers to all new projects.
            </div>
          </CardContent>
        </Card>

        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl">Project Tree Filter</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <select
              value={areaFilter}
              onChange={(event) => setAreaFilter(event.target.value)}
              className="h-10 w-full rounded-xl border border-white/20 bg-background/40 px-3 text-sm text-foreground"
            >
              {projectAreas.map((area) => (
                <option key={area} value={area}>
                  {area === "ALL" ? "All engineering areas" : area.replaceAll("_", " ")}
                </option>
              ))}
            </select>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-muted-foreground">
              Supplier stack and facility level are already reflected in cost, duration and risk previews.
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredProjects.map((project) => (
          <Card key={project.id} className="premium-card">
            <CardHeader className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="font-heading text-lg">{project.name}</CardTitle>
                <Badge
                  className={
                    project.status === "COMPLETED"
                      ? "rounded-full border border-emerald-300/35 bg-emerald-500/10 text-emerald-100"
                      : project.status === "IN_PROGRESS"
                        ? "rounded-full border border-amber-300/35 bg-amber-500/10 text-amber-100"
                        : "rounded-full border border-white/15 bg-white/10 text-white"
                  }
                >
                  {project.status.replaceAll("_", " ")}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{project.description}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-2 text-xs">
                <div className="rounded-xl border border-white/10 bg-white/5 p-2">
                  Cost: <span className="font-semibold">{formatCompactMoney(project.cost)}</span>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-2">
                  Duration: <span className="font-semibold">{project.durationWeeks} weeks</span>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-2">
                  Risk: <span className="font-semibold">{project.risk}%</span>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-2">
                  Expected delta: <span className="font-semibold">+{project.expectedDelta}</span>
                </div>
              </div>

              {project.status === "IN_PROGRESS" ? (
                <Button
                  variant="premium"
                  size="sm"
                  className="h-9 w-full"
                  disabled={isPending || !project.canComplete}
                  onClick={() => completeProject(project.id)}
                >
                  <Wrench className="mr-1 size-3.5" />
                  Complete Upgrade
                </Button>
              ) : project.status === "AVAILABLE" ? (
                <Button
                  variant="primary"
                  size="sm"
                  className="h-9 w-full"
                  disabled={isPending || !project.canStart}
                  onClick={() => startProject(activeCar.id, project.templateCode)}
                >
                  <Cog className="mr-1 size-3.5" />
                  Start Project
                </Button>
              ) : (
                <div className="rounded-xl border border-emerald-300/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100">
                  Upgrade integrated in the current car platform.
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
