"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Beaker, Flag, Gauge, ListChecks, ShieldAlert, Timer } from "lucide-react";
import { toast } from "sonner";

import { generateWeekendSkeletonAction } from "@/app/(game)/game/weekend-rules/actions";
import { CountryFlag } from "@/components/common/country-flag";
import { KpiCard } from "@/components/common/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { WeekendRulesCenterView } from "@/features/weekend-rules/types";
import { formatDate } from "@/lib/format";

interface WeekendRulesCenterProps {
  view: WeekendRulesCenterView;
}

function parseComplexity(pointSystem: Record<string, unknown>) {
  const value = pointSystem.complexityScore;
  return typeof value === "number" ? value : 0;
}

function parseWeatherVolatility(fuelRules: Record<string, unknown>) {
  const value = fuelRules.weatherVolatility;
  return typeof value === "string" ? value : "Unknown";
}

export function WeekendRulesCenter({ view }: WeekendRulesCenterProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedTrackPreview, setSelectedTrackPreview] = useState(view.trackPreviews[0]?.trackType ?? "ROAD");

  const activeRuleSet = view.activeRuleSet;
  const activePreview =
    view.trackPreviews.find((preview) => preview.trackType === selectedTrackPreview) ?? view.trackPreviews[0] ?? null;

  function generateForNextEvent() {
    if (!view.nextEvent || view.nextEvent.hasGeneratedWeekend) return;

    startTransition(async () => {
      const result = await generateWeekendSkeletonAction({
        eventId: view.nextEvent!.id,
      });

      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      router.refresh();
    });
  }

  if (!activeRuleSet) {
    return (
      <Card className="premium-card">
        <CardContent className="pt-6 text-sm text-muted-foreground">
          No ruleset registered for the selected category.
        </CardContent>
      </Card>
    );
  }

  const complexity = parseComplexity(activeRuleSet.pointSystem);
  const weatherVolatility = parseWeatherVolatility(activeRuleSet.fuelRules);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Ruleset Complexity"
          value={`${complexity}/100`}
          delta={complexity - 60}
          icon={<Gauge className="size-4" />}
        />
        <KpiCard
          label="Weather Sensitivity"
          value={`${activeRuleSet.weatherSensitivity}/100`}
          delta={activeRuleSet.weatherSensitivity - 50}
          icon={<Beaker className="size-4" />}
        />
        <KpiCard
          label="Session Count"
          value={`${activeRuleSet.sessionOrder.length}`}
          delta={activeRuleSet.sessionOrder.length - 5}
          icon={<ListChecks className="size-4" />}
        />
        <KpiCard
          label="Weekend Skeletons"
          value={`${view.generatedWeekends.length}`}
          delta={view.generatedWeekends.length - 2}
          icon={<Flag className="size-4" />}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl">Active Ruleset · {activeRuleSet.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm">
                Qualifying format: <span className="font-semibold">{activeRuleSet.qualifyingFormat}</span>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm">
                Safety behavior: <span className="font-semibold">{activeRuleSet.safetyCarBehavior}</span>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm">
                Weather volatility: <span className="font-semibold">{weatherVolatility}</span>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm">
                Parc Fermé: <span className="font-semibold">{activeRuleSet.parcFerme ? "Enabled" : "Disabled"}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {activeRuleSet.hasSprint ? (
                <Badge className="rounded-full border border-cyan-300/35 bg-cyan-500/10 text-cyan-100">Sprint</Badge>
              ) : null}
              {activeRuleSet.hasFeature ? (
                <Badge className="rounded-full border border-indigo-300/35 bg-indigo-500/10 text-indigo-100">Feature Race</Badge>
              ) : null}
              {activeRuleSet.hasStages ? (
                <Badge className="rounded-full border border-amber-300/35 bg-amber-500/10 text-amber-100">Stage Racing</Badge>
              ) : null}
              {activeRuleSet.enduranceFlags ? (
                <Badge className="rounded-full border border-emerald-300/35 bg-emerald-500/10 text-emerald-100">Endurance</Badge>
              ) : null}
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-muted-foreground">
              Category configuration is loaded from database rulesets and normalized by the weekend rules engine.
            </div>
          </CardContent>
        </Card>

        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl">Next Event Generator</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {view.nextEvent ? (
              <>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Round {view.nextEvent.round}</p>
                  <p className="mt-1 text-sm font-semibold">{view.nextEvent.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{view.nextEvent.circuitName}</p>
                  <p className="mt-1 inline-flex items-center gap-2 text-xs text-muted-foreground">
                    <CountryFlag countryCode={view.nextEvent.countryCode} className="h-4 w-6" />
                    {formatDate(view.nextEvent.startDateIso)} · {view.nextEvent.trackType}
                  </p>
                </div>

                <Button
                  variant="premium"
                  className="w-full"
                  disabled={isPending || view.nextEvent.hasGeneratedWeekend}
                  onClick={generateForNextEvent}
                >
                  {view.nextEvent.hasGeneratedWeekend ? "Weekend Already Generated" : "Generate Weekend Skeleton"}
                </Button>
              </>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-muted-foreground">
                No upcoming event found for this category.
              </div>
            )}

            <div className="rounded-2xl border border-amber-300/30 bg-amber-500/10 p-3 text-xs text-amber-100">
              Generated skeleton creates `RaceWeekend` + ordered `Session` rows using the selected category ruleset.
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl">Track-Type Session Preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={selectedTrackPreview} onValueChange={(value) => setSelectedTrackPreview(value)}>
              <TabsList className="rounded-2xl border border-white/10 bg-white/5 p-1">
                {view.trackPreviews.map((preview) => (
                  <TabsTrigger key={preview.trackType} value={preview.trackType} className="px-3 text-xs">
                    {preview.trackType.replaceAll("_", " ")}
                  </TabsTrigger>
                ))}
              </TabsList>
              {view.trackPreviews.map((preview) => (
                <TabsContent key={preview.trackType} value={preview.trackType} className="mt-3 space-y-2">
                  {preview.sessions.map((session) => (
                    <div key={`${preview.trackType}-${session.orderIndex}-${session.token}`} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold">
                          {session.orderIndex}. {session.label}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge className="rounded-full border border-white/15 bg-white/10 text-xs">{session.sessionType}</Badge>
                          <Badge className="rounded-full border border-cyan-300/35 bg-cyan-500/10 text-cyan-100 text-xs">
                            <Timer className="mr-1 size-3" />
                            {session.durationMinutes}m
                          </Badge>
                        </div>
                      </div>
                      {session.details ? (
                        <p className="mt-2 text-xs text-muted-foreground">{session.details}</p>
                      ) : null}
                    </div>
                  ))}
                </TabsContent>
              ))}
            </Tabs>

            {activePreview ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-muted-foreground">
                Active preview: {activePreview.label} ({activePreview.sessions.length} sessions)
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl">Generated Weekends</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {view.generatedWeekends.map((weekend) => (
              <div key={weekend.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <p className="text-sm font-semibold">
                  R{weekend.round} · {weekend.eventName}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {weekend.ruleSetCode} · {weekend.sessionsCount} sessions · generated {formatDate(weekend.generatedAtIso)}
                </p>
              </div>
            ))}
            {view.generatedWeekends.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-muted-foreground">
                No generated weekends yet for this season.
              </div>
            ) : null}

            <div className="rounded-2xl border border-rose-300/25 bg-rose-500/10 p-3 text-xs text-rose-100">
              <ShieldAlert className="mb-1 size-3.5" />
              Session generation keeps business rules out of UI and persists deterministic order for race flow modules.
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
