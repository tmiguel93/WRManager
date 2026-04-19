"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CloudSun, Flag, Fuel, Gauge, ListOrdered, ShieldAlert, Timer } from "lucide-react";

import { CountryFlag } from "@/components/common/country-flag";
import { EntityAvatar } from "@/components/common/entity-avatar";
import { KpiCard } from "@/components/common/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import type { RaceControlCenterView } from "@/features/race-control/types";
import { formatRaceTime } from "@/domain/rules/race-control-sim";
import {
  generateWeekendForRaceAction,
  runRaceControlAction,
} from "@/app/(game)/game/race-control/actions";

interface RaceControlCenterProps {
  view: RaceControlCenterView;
}

export function RaceControlCenter({ view }: RaceControlCenterProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [paceMode, setPaceMode] = useState<"ATTACK" | "NEUTRAL" | "CONSERVE">("NEUTRAL");
  const [pitPlan, setPitPlan] = useState<"UNDERCUT" | "BALANCED" | "OVERCUT">("BALANCED");
  const [fuelMode, setFuelMode] = useState<"PUSH" | "NORMAL" | "SAVE">("NORMAL");
  const [tyreMode, setTyreMode] = useState<"PUSH" | "NORMAL" | "SAVE">("NORMAL");
  const [teamOrders, setTeamOrders] = useState<"HOLD" | "FREE_FIGHT">("FREE_FIGHT");
  const [weatherReaction, setWeatherReaction] = useState<"SAFE" | "REACTIVE" | "AGGRESSIVE">("REACTIVE");

  function runRace() {
    if (!view.targetSession) return;

    startTransition(async () => {
      const result = await runRaceControlAction({
        sessionId: view.targetSession!.id,
        paceMode,
        pitPlan,
        fuelMode,
        tyreMode,
        teamOrders,
        weatherReaction,
      });

      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      router.refresh();
    });
  }

  function generateWeekend() {
    if (!view.event) return;

    startTransition(async () => {
      const result = await generateWeekendForRaceAction({ eventId: view.event!.id });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      router.refresh();
    });
  }

  const winner = view.leaderboard[0] ?? null;
  const managedBest = view.summary?.managedBestPosition ?? null;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Race Sessions"
          value={`${view.raceSessions.length}`}
          delta={view.raceSessions.filter((session) => session.completed).length * 8}
          icon={<Flag className="size-4" />}
        />
        <KpiCard
          label="Weather Volatility"
          value={`${view.weatherSensitivity}/100`}
          delta={view.weatherSensitivity - 68}
          icon={<CloudSun className="size-4" />}
        />
        <KpiCard
          label="Managed Best"
          value={managedBest ? `P${managedBest}` : "--"}
          delta={managedBest ? (12 - managedBest) * 4 : -12}
          icon={<Gauge className="size-4" />}
        />
        <KpiCard
          label="Winner"
          value={winner ? winner.driverName : "TBD"}
          delta={winner ? winner.points * 1.2 : 0}
          icon={<Timer className="size-4" />}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl">Race Control Strategy</CardTitle>
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
                No event available for race-control simulation.
              </div>
            )}

            {!view.event?.hasWeekend ? (
              <Button variant="premium" className="w-full" onClick={generateWeekend} disabled={isPending || !view.event}>
                Generate Weekend Skeleton
              </Button>
            ) : null}

            {view.targetSession ? (
              <div className="rounded-2xl border border-cyan-300/20 bg-cyan-500/10 p-3 text-sm text-cyan-100">
                Target session: {view.targetSession.label} ({view.targetSession.completed ? "completed" : "pending"})
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-muted-foreground">
                No race session available in this weekend.
              </div>
            )}

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Pace Map</p>
                <select
                  value={paceMode}
                  onChange={(event) => setPaceMode(event.target.value as "ATTACK" | "NEUTRAL" | "CONSERVE")}
                  className="h-10 w-full rounded-xl border border-white/20 bg-background/40 px-3 text-sm"
                >
                  <option value="ATTACK">Attack</option>
                  <option value="NEUTRAL">Neutral</option>
                  <option value="CONSERVE">Conserve</option>
                </select>
              </div>

              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Pit Plan</p>
                <select
                  value={pitPlan}
                  onChange={(event) => setPitPlan(event.target.value as "UNDERCUT" | "BALANCED" | "OVERCUT")}
                  className="h-10 w-full rounded-xl border border-white/20 bg-background/40 px-3 text-sm"
                >
                  <option value="UNDERCUT">Undercut</option>
                  <option value="BALANCED">Balanced</option>
                  <option value="OVERCUT">Overcut</option>
                </select>
              </div>

              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Fuel Mode</p>
                <select
                  value={fuelMode}
                  onChange={(event) => setFuelMode(event.target.value as "PUSH" | "NORMAL" | "SAVE")}
                  className="h-10 w-full rounded-xl border border-white/20 bg-background/40 px-3 text-sm"
                >
                  <option value="PUSH">Push</option>
                  <option value="NORMAL">Normal</option>
                  <option value="SAVE">Save</option>
                </select>
              </div>

              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Tyre Mode</p>
                <select
                  value={tyreMode}
                  onChange={(event) => setTyreMode(event.target.value as "PUSH" | "NORMAL" | "SAVE")}
                  className="h-10 w-full rounded-xl border border-white/20 bg-background/40 px-3 text-sm"
                >
                  <option value="PUSH">Push</option>
                  <option value="NORMAL">Normal</option>
                  <option value="SAVE">Save</option>
                </select>
              </div>

              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Team Orders</p>
                <select
                  value={teamOrders}
                  onChange={(event) => setTeamOrders(event.target.value as "HOLD" | "FREE_FIGHT")}
                  className="h-10 w-full rounded-xl border border-white/20 bg-background/40 px-3 text-sm"
                >
                  <option value="HOLD">Hold Position</option>
                  <option value="FREE_FIGHT">Free Fight</option>
                </select>
              </div>

              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Weather Reaction</p>
                <select
                  value={weatherReaction}
                  onChange={(event) =>
                    setWeatherReaction(event.target.value as "SAFE" | "REACTIVE" | "AGGRESSIVE")
                  }
                  className="h-10 w-full rounded-xl border border-white/20 bg-background/40 px-3 text-sm"
                >
                  <option value="SAFE">Safe</option>
                  <option value="REACTIVE">Reactive</option>
                  <option value="AGGRESSIVE">Aggressive</option>
                </select>
              </div>
            </div>

            <Button
              variant="primary"
              className="w-full"
              onClick={runRace}
              disabled={
                isPending ||
                !view.targetSession ||
                view.targetSession.completed ||
                !view.event?.hasWeekend
              }
            >
              {view.targetSession?.completed ? "Session Completed" : "Run Race Control"}
            </Button>
          </CardContent>
        </Card>

        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl">Session Progress & Result</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {view.raceSessions.map((session) => (
              <div key={session.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold">
                    {session.orderIndex}. {session.label}
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
                <p className="mt-1 text-xs text-muted-foreground">{session.sessionType}</p>
              </div>
            ))}

            {view.summary ? (
              <div className="rounded-2xl border border-cyan-300/20 bg-cyan-500/10 p-3 text-sm text-cyan-100">
                Winner: {view.summary.winnerName} ({view.summary.winnerTeamName})
                <br />
                Managed best: {view.summary.managedBestPosition ? `P${view.summary.managedBestPosition}` : "N/A"}
                <br />
                Managed points: {view.summary.managedPoints}
                <br />
                DNFs: {view.summary.dnfs}
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-muted-foreground">
                No race result yet. Run the target race session to generate leaderboard and highlights.
              </div>
            )}

            <div className="rounded-2xl border border-amber-300/20 bg-amber-500/10 p-3 text-xs text-amber-100">
              Real-time commands are translated into pace, tyre, fuel and pit behavior before simulation rollout.
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl">Race Leaderboard</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Pos</TableHead>
                    <TableHead className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Driver</TableHead>
                    <TableHead className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Team</TableHead>
                    <TableHead className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Status</TableHead>
                    <TableHead className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Time</TableHead>
                    <TableHead className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Gap</TableHead>
                    <TableHead className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Pts</TableHead>
                    <TableHead className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Pit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {view.leaderboard.map((row) => (
                    <TableRow
                      key={row.driverId}
                      className={
                        row.isManagedTeam
                          ? "border-cyan-300/20 bg-cyan-500/5 hover:bg-cyan-500/10"
                          : "border-white/10 hover:bg-white/5"
                      }
                    >
                      <TableCell className="font-semibold">{row.position}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <EntityAvatar
                            entityType="DRIVER"
                            name={row.driverName}
                            countryCode={row.countryCode}
                            imageUrl={row.imageUrl}
                          />
                          <span className="text-sm">{row.driverName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{row.teamName}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            row.status === "FINISHED"
                              ? "rounded-full border border-emerald-300/35 bg-emerald-500/10 text-emerald-100"
                              : "rounded-full border border-rose-300/35 bg-rose-500/10 text-rose-100"
                          }
                        >
                          {row.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {row.totalTimeMs !== null ? formatRaceTime(row.totalTimeMs) : "--"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {row.gapMs === null ? "--" : row.gapMs === 0 ? "Leader" : `+${(row.gapMs / 1000).toFixed(3)}s`}
                      </TableCell>
                      <TableCell className="font-semibold">{row.points}</TableCell>
                      <TableCell>{row.pitStops}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {view.leaderboard.length === 0 ? (
              <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-muted-foreground">
                No race results yet. The table will populate after session simulation.
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl">Live Event Feed</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {view.eventFeed.length > 0 ? (
              view.eventFeed.map((event, index) => (
                <div key={`${event}-${index}`} className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm">
                  <p className="inline-flex items-center gap-2 font-medium text-cyan-100">
                    <ListOrdered className="size-4" />
                    Event {index + 1}
                  </p>
                  <p className="mt-1 text-muted-foreground">{event}</p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-muted-foreground">
                Live feed will appear after race simulation.
              </div>
            )}

            <div className="rounded-2xl border border-rose-300/20 bg-rose-500/10 p-3 text-xs text-rose-100">
              <p className="inline-flex items-center gap-2 font-semibold">
                <ShieldAlert className="size-4" />
                Reliability risk
              </p>
              <p className="mt-1 text-rose-100/90">
                Attack pace and push modes increase DNF envelope. Balance strategy with session context.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl">Starting Grid Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Start</TableHead>
                    <TableHead className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Driver</TableHead>
                    <TableHead className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Team</TableHead>
                    <TableHead className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Focus</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {view.startingGrid.map((row) => (
                    <TableRow
                      key={row.driverId}
                      className={
                        row.isManagedTeam
                          ? "border-cyan-300/20 bg-cyan-500/5 hover:bg-cyan-500/10"
                          : "border-white/10 hover:bg-white/5"
                      }
                    >
                      <TableCell className="font-semibold">{row.startPosition}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <EntityAvatar
                            entityType="DRIVER"
                            name={row.driverName}
                            countryCode={row.countryCode}
                            imageUrl={row.imageUrl}
                          />
                          <span className="text-sm">{row.driverName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{row.teamName}</TableCell>
                      <TableCell>
                        {row.isManagedTeam ? (
                          <Badge className="rounded-full border border-cyan-300/35 bg-cyan-500/10 text-cyan-100">
                            Managed
                          </Badge>
                        ) : (
                          <Badge className="rounded-full border border-white/15 bg-white/10 text-muted-foreground">
                            AI
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {view.startingGrid.length === 0 ? (
              <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-muted-foreground">
                Starting grid unavailable. Run qualifying first or generate weekend context.
              </div>
            ) : null}

            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-muted-foreground">
                <p className="inline-flex items-center gap-2 text-cyan-100">
                  <Fuel className="size-4" /> Fuel and energy
                </p>
                <p className="mt-1">Fuel mode impacts pace and reliability envelopes in long runs.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-muted-foreground">
                <p className="inline-flex items-center gap-2 text-cyan-100">
                  <Gauge className="size-4" /> Tyre management
                </p>
                <p className="mt-1">Tyre mode alters expected pit count and incident probability under pressure.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-muted-foreground">
                <p className="inline-flex items-center gap-2 text-cyan-100">
                  <Flag className="size-4" /> Session points
                </p>
                <p className="mt-1">Points are assigned per ruleset and pushed directly to championship standings.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

