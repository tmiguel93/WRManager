"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Beaker, Gauge, Route, Wrench } from "lucide-react";

import { CountryFlag } from "@/components/common/country-flag";
import { KpiCard } from "@/components/common/kpi-card";
import { EntityAvatar } from "@/components/common/entity-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PracticeCenterView } from "@/features/weekend-sessions/types";
import { formatDate } from "@/lib/format";
import {
  generateWeekendForPracticeAction,
  runPracticeSimulationAction,
} from "@/app/(game)/game/practice/actions";

interface PracticeCenterProps {
  view: PracticeCenterView;
}

export function PracticeCenter({ view }: PracticeCenterProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [runPlan, setRunPlan] = useState<"SHORT" | "BALANCED" | "LONG">("BALANCED");
  const [aeroBalanceFocus, setAeroBalanceFocus] = useState(0);
  const [weatherFocus, setWeatherFocus] = useState(10);

  function generateWeekend() {
    if (!view.event) return;
    startTransition(async () => {
      const result = await generateWeekendForPracticeAction({ eventId: view.event!.id });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      router.refresh();
    });
  }

  function runPractice(sessionId: string) {
    startTransition(async () => {
      const result = await runPracticeSimulationAction({
        sessionId,
        runPlan,
        aeroBalanceFocus,
        weatherFocus,
      });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      router.refresh();
    });
  }

  const firstPendingSession = view.practiceSessions.find((session) => !session.completed) ?? null;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Practice Sessions"
          value={`${view.practiceSessions.length}`}
          delta={view.practiceSessions.length - 2}
          icon={<Beaker className="size-4" />}
        />
        <KpiCard
          label="Setup Confidence"
          value={`${view.teamLearning?.averageSetupConfidence ?? 50}/100`}
          delta={(view.teamLearning?.averageSetupConfidence ?? 50) - 60}
          icon={<Gauge className="size-4" />}
        />
        <KpiCard
          label="Track Knowledge"
          value={`${view.teamLearning?.averageTrackKnowledge ?? 45}/100`}
          delta={(view.teamLearning?.averageTrackKnowledge ?? 45) - 55}
          icon={<Route className="size-4" />}
        />
        <KpiCard
          label="Pace Delta"
          value={`${view.teamLearning?.averagePaceDelta ?? 0 >= 0 ? "+" : ""}${view.teamLearning?.averagePaceDelta ?? 0}`}
          delta={(view.teamLearning?.averagePaceDelta ?? 0) * 4}
          icon={<Wrench className="size-4" />}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl">Weekend Context</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {view.event ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  Round {view.event.round} · {view.event.trackType}
                </p>
                <p className="mt-1 text-base font-semibold">{view.event.name}</p>
                <p className="text-xs text-muted-foreground">{view.event.circuitName}</p>
                <p className="mt-1 inline-flex items-center gap-2 text-xs text-muted-foreground">
                  <CountryFlag countryCode={view.event.countryCode} className="h-4 w-6" />
                  {formatDate(view.event.startDateIso)}
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-muted-foreground">
                No event available for practice simulation.
              </div>
            )}

            {!view.event?.hasWeekend ? (
              <Button variant="premium" className="w-full" onClick={generateWeekend} disabled={isPending || !view.event}>
                Generate Weekend Skeleton
              </Button>
            ) : (
              <Badge className="rounded-full border border-emerald-300/35 bg-emerald-500/10 text-emerald-100">
                Weekend generated
              </Badge>
            )}

            <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-muted-foreground">
              Practice progress is persisted per session and used as setup/track input for qualifying simulation.
            </div>
          </CardContent>
        </Card>

        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl">Setup Board</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Run Plan</p>
              <select
                value={runPlan}
                onChange={(event) => setRunPlan(event.target.value as "SHORT" | "BALANCED" | "LONG")}
                className="h-10 w-full rounded-xl border border-white/20 bg-background/40 px-3 text-sm"
              >
                <option value="SHORT">Short Runs</option>
                <option value="BALANCED">Balanced Program</option>
                <option value="LONG">Long Runs</option>
              </select>
            </div>

            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                Aero Balance ({aeroBalanceFocus})
              </p>
              <input
                type="range"
                min={-100}
                max={100}
                value={aeroBalanceFocus}
                onChange={(event) => setAeroBalanceFocus(Number(event.target.value))}
                className="w-full accent-cyan-300"
              />
              <p className="text-xs text-muted-foreground">-100 = high-downforce · +100 = low-drag</p>
            </div>

            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Dry/Wet Bias ({weatherFocus})</p>
              <input
                type="range"
                min={-100}
                max={100}
                value={weatherFocus}
                onChange={(event) => setWeatherFocus(Number(event.target.value))}
                className="w-full accent-amber-300"
              />
              <p className="text-xs text-muted-foreground">-100 = dry focus · +100 = wet-safe setup</p>
            </div>

            {firstPendingSession ? (
              <Button
                variant="primary"
                className="w-full"
                onClick={() => runPractice(firstPendingSession.id)}
                disabled={isPending || !view.event?.hasWeekend}
              >
                Run Next Practice Session ({firstPendingSession.tokenLabel})
              </Button>
            ) : (
              <div className="rounded-2xl border border-emerald-300/25 bg-emerald-500/10 p-3 text-xs text-emerald-100">
                All practice sessions completed for this weekend.
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl">Practice Sessions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {view.practiceSessions.map((session) => (
              <div key={session.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold">
                    {session.orderIndex}. {session.tokenLabel}
                  </p>
                  <Badge
                    className={
                      session.completed
                        ? "rounded-full border border-emerald-300/35 bg-emerald-500/10 text-emerald-100"
                        : "rounded-full border border-amber-300/35 bg-amber-500/10 text-amber-100"
                    }
                  >
                    {session.completed ? "Completed" : "Pending"}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{session.weatherState}</p>
                {session.completed ? (
                  <div className="mt-2 grid gap-2 md:grid-cols-3">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-2 text-xs">
                      Setup: {session.setupConfidence ?? "-"}
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-2 text-xs">
                      Track: {session.trackKnowledge ?? "-"}
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-2 text-xs">
                      Pace: {session.paceDelta && session.paceDelta >= 0 ? "+" : ""}
                      {session.paceDelta ?? "-"}
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 border border-white/15 bg-white/5"
                    onClick={() => runPractice(session.id)}
                    disabled={isPending || !view.event?.hasWeekend}
                  >
                    Run This Session
                  </Button>
                )}
              </div>
            ))}

            {view.practiceSessions.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-muted-foreground">
                No practice sessions available yet. Generate the weekend first.
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl">Driver Feedback Board</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {view.teamDrivers.map((driver) => (
              <div key={driver.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <EntityAvatar
                      entityType="DRIVER"
                      name={driver.name}
                      countryCode={driver.countryCode}
                      imageUrl={driver.imageUrl}
                    />
                    <p className="text-sm font-medium">{driver.name}</p>
                  </div>
                  <Badge className="rounded-full border border-white/15 bg-white/10 text-xs">OVR {driver.overall}</Badge>
                </div>
              </div>
            ))}
            {view.teamDrivers.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-muted-foreground">
                No drivers linked to the managed team.
              </div>
            ) : null}
            <div className="rounded-2xl border border-cyan-300/20 bg-cyan-500/10 p-3 text-xs text-cyan-100">
              Better practice setup/track learning directly improves qualifying baseline for your team.
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
