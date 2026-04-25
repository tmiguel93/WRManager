"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CloudSun, Flag, Fuel, Gauge, ListOrdered, ShieldAlert, Timer } from "lucide-react";

import { CountryFlag } from "@/components/common/country-flag";
import { EntityAvatar } from "@/components/common/entity-avatar";
import { KpiCard } from "@/components/common/kpi-card";
import { TeamLogoMark } from "@/components/common/team-logo-mark";
import { RaceLiveViewer } from "@/components/game/race-live-viewer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import type { RaceControlCenterView } from "@/features/race-control/types";
import { formatRaceTime } from "@/domain/rules/race-control-sim";
import { useI18n } from "@/i18n/client";
import {
  generateWeekendForRaceAction,
  runRaceControlAction,
} from "@/app/(game)/game/race-control/actions";

interface RaceControlCenterProps {
  view: RaceControlCenterView;
}

export function RaceControlCenter({ view }: RaceControlCenterProps) {
  const { t } = useI18n();
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

  function teamStripe(primary: string, secondary: string, accent: string | null) {
    return `linear-gradient(90deg, ${primary}, ${secondary}, ${accent ?? secondary})`;
  }

  function sessionTypeLabel(sessionType: string) {
    if (sessionType === "RACE") return t("raceCenter.sessionRace", "Race");
    if (sessionType === "SPRINT") return t("raceCenter.sessionSprint", "Sprint");
    if (sessionType === "FEATURE") return t("raceCenter.sessionFeature", "Feature");
    if (sessionType === "STAGE") return t("raceCenter.sessionStage", "Stage");
    return sessionType;
  }

  function trackTypeLabel(trackType: string) {
    return trackType
      .toLowerCase()
      .split("_")
      .map((token) => token.slice(0, 1).toUpperCase() + token.slice(1))
      .join(" ");
  }

  function resultStatusLabel(status: string) {
    if (status === "FINISHED") return t("raceCenter.finished", "Finished");
    if (status === "DNF") return t("raceCenter.dnf", "DNF");
    return status;
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label={t("raceCenter.kpiSessions", "Race Sessions")}
          value={`${view.raceSessions.length}`}
          delta={view.raceSessions.filter((session) => session.completed).length * 8}
          icon={<Flag className="size-4" />}
        />
        <KpiCard
          label={t("raceCenter.kpiWeather", "Weather Volatility")}
          value={`${view.weatherSensitivity}/100`}
          delta={view.weatherSensitivity - 68}
          icon={<CloudSun className="size-4" />}
        />
        <KpiCard
          label={t("raceCenter.kpiManagedBest", "Managed Best")}
          value={managedBest ? `P${managedBest}` : "--"}
          delta={managedBest ? (12 - managedBest) * 4 : -12}
          icon={<Gauge className="size-4" />}
        />
        <KpiCard
          label={t("raceCenter.kpiWinner", "Winner")}
          value={winner ? winner.driverName : t("raceCenter.tbd", "TBD")}
          delta={winner ? winner.points * 1.2 : 0}
          icon={<Timer className="size-4" />}
        />
      </section>

      <section>
        <RaceLiveViewer view={view} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl">{t("raceCenter.strategyTitle", "Race Control Strategy")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {view.event ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  {t("raceCenter.round", "Round")} {view.event.round} · {trackTypeLabel(view.event.trackType)}
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
                {t("raceCenter.noEvent", "No event available for race-control simulation.")}
              </div>
            )}

            {!view.event?.hasWeekend ? (
              <Button variant="premium" className="w-full" onClick={generateWeekend} disabled={isPending || !view.event}>
                {t("raceCenter.generateWeekend", "Generate Weekend Skeleton")}
              </Button>
            ) : null}

            {view.targetSession ? (
              <div className="rounded-2xl border border-cyan-300/20 bg-cyan-500/10 p-3 text-sm text-cyan-100">
                {t("raceCenter.targetSession", "Target session")}: {view.targetSession.label} (
                {view.targetSession.completed
                  ? t("raceCenter.completed", "completed")
                  : t("raceCenter.pending", "pending")}
                )
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-muted-foreground">
                {t("raceCenter.noRaceSession", "No race session available in this weekend.")}
              </div>
            )}

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{t("raceCenter.paceMap", "Pace Map")}</p>
                <select
                  value={paceMode}
                  onChange={(event) => setPaceMode(event.target.value as "ATTACK" | "NEUTRAL" | "CONSERVE")}
                  className="h-10 w-full rounded-xl border border-white/20 bg-background/40 px-3 text-sm"
                >
                  <option value="ATTACK">{t("raceCenter.attack", "Attack")}</option>
                  <option value="NEUTRAL">{t("raceCenter.neutral", "Neutral")}</option>
                  <option value="CONSERVE">{t("raceCenter.conserve", "Conserve")}</option>
                </select>
              </div>

              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{t("raceCenter.pitPlan", "Pit Plan")}</p>
                <select
                  value={pitPlan}
                  onChange={(event) => setPitPlan(event.target.value as "UNDERCUT" | "BALANCED" | "OVERCUT")}
                  className="h-10 w-full rounded-xl border border-white/20 bg-background/40 px-3 text-sm"
                >
                  <option value="UNDERCUT">{t("raceCenter.undercut", "Undercut")}</option>
                  <option value="BALANCED">{t("raceCenter.balanced", "Balanced")}</option>
                  <option value="OVERCUT">{t("raceCenter.overcut", "Overcut")}</option>
                </select>
              </div>

              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{t("raceCenter.fuelMode", "Fuel Mode")}</p>
                <select
                  value={fuelMode}
                  onChange={(event) => setFuelMode(event.target.value as "PUSH" | "NORMAL" | "SAVE")}
                  className="h-10 w-full rounded-xl border border-white/20 bg-background/40 px-3 text-sm"
                >
                  <option value="PUSH">{t("raceCenter.push", "Push")}</option>
                  <option value="NORMAL">{t("raceCenter.normal", "Normal")}</option>
                  <option value="SAVE">{t("raceCenter.save", "Save")}</option>
                </select>
              </div>

              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{t("raceCenter.tyreMode", "Tyre Mode")}</p>
                <select
                  value={tyreMode}
                  onChange={(event) => setTyreMode(event.target.value as "PUSH" | "NORMAL" | "SAVE")}
                  className="h-10 w-full rounded-xl border border-white/20 bg-background/40 px-3 text-sm"
                >
                  <option value="PUSH">{t("raceCenter.push", "Push")}</option>
                  <option value="NORMAL">{t("raceCenter.normal", "Normal")}</option>
                  <option value="SAVE">{t("raceCenter.save", "Save")}</option>
                </select>
              </div>

              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{t("raceCenter.teamOrders", "Team Orders")}</p>
                <select
                  value={teamOrders}
                  onChange={(event) => setTeamOrders(event.target.value as "HOLD" | "FREE_FIGHT")}
                  className="h-10 w-full rounded-xl border border-white/20 bg-background/40 px-3 text-sm"
                >
                  <option value="HOLD">{t("raceCenter.hold", "Hold Position")}</option>
                  <option value="FREE_FIGHT">{t("raceCenter.freeFight", "Free Fight")}</option>
                </select>
              </div>

              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{t("raceCenter.weatherReaction", "Weather Reaction")}</p>
                <select
                  value={weatherReaction}
                  onChange={(event) =>
                    setWeatherReaction(event.target.value as "SAFE" | "REACTIVE" | "AGGRESSIVE")
                  }
                  className="h-10 w-full rounded-xl border border-white/20 bg-background/40 px-3 text-sm"
                >
                  <option value="SAFE">{t("raceCenter.safe", "Safe")}</option>
                  <option value="REACTIVE">{t("raceCenter.reactive", "Reactive")}</option>
                  <option value="AGGRESSIVE">{t("raceCenter.aggressive", "Aggressive")}</option>
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
              {view.targetSession?.completed
                ? t("raceCenter.sessionCompleted", "Session Completed")
                : t("raceCenter.runRaceControl", "Run Race Control")}
            </Button>
          </CardContent>
        </Card>

        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl">{t("raceCenter.progressTitle", "Session Progress & Result")}</CardTitle>
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
                    {session.completed ? t("raceCenter.completed", "Completed") : t("raceCenter.pending", "Pending")}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{sessionTypeLabel(session.sessionType)}</p>
              </div>
            ))}

            {view.summary ? (
              <div className="rounded-2xl border border-cyan-300/20 bg-cyan-500/10 p-3 text-sm text-cyan-100">
                {t("raceCenter.winner", "Winner")}: {view.summary.winnerName} ({view.summary.winnerTeamName})
                <br />
                {t("raceCenter.managedBest", "Managed best")}:{" "}
                {view.summary.managedBestPosition ? `P${view.summary.managedBestPosition}` : t("raceCenter.na", "N/A")}
                <br />
                {t("raceCenter.managedPoints", "Managed points")}: {view.summary.managedPoints}
                <br />
                {t("raceCenter.dnf", "DNF")}: {view.summary.dnfs}
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-muted-foreground">
                {t(
                  "raceCenter.noResult",
                  "No race result yet. Run the target race session to generate leaderboard and highlights.",
                )}
              </div>
            )}

            <div className="rounded-2xl border border-amber-300/20 bg-amber-500/10 p-3 text-xs text-amber-100">
              {t(
                "raceCenter.commandHint",
                "Real-time commands are translated into pace, tyre, fuel and pit behavior before simulation rollout.",
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl">{t("raceCenter.leaderboardTitle", "Race Leaderboard")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Pos</TableHead>
                    <TableHead className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{t("raceCenter.driver", "Driver")}</TableHead>
                    <TableHead className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{t("raceCenter.team", "Team")}</TableHead>
                    <TableHead className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{t("raceCenter.status", "Status")}</TableHead>
                    <TableHead className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{t("raceCenter.time", "Time")}</TableHead>
                    <TableHead className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{t("raceCenter.gap", "Gap")}</TableHead>
                    <TableHead className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Pts</TableHead>
                    <TableHead className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{t("raceCenter.pit", "Pit")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {view.leaderboard.map((row) => (
                    <TableRow
                      key={row.driverId}
                      className={
                        row.isManagedTeam
                          ? "team-row-highlight hover:bg-white/10"
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
                      <TableCell>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <TeamLogoMark name={row.teamName} logoUrl={row.teamLogoUrl} className="h-7 w-10 rounded-lg" />
                          <div>
                            <p>{row.teamName}</p>
                            <div
                              className="mt-1 h-1 w-11 rounded-full"
                              style={{ background: teamStripe(row.teamPrimaryColor, row.teamSecondaryColor, row.teamAccentColor) }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            row.status === "FINISHED"
                              ? "rounded-full border border-emerald-300/35 bg-emerald-500/10 text-emerald-100"
                              : "rounded-full border border-rose-300/35 bg-rose-500/10 text-rose-100"
                          }
                        >
                          {resultStatusLabel(row.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {row.totalTimeMs !== null ? formatRaceTime(row.totalTimeMs) : "--"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {row.gapMs === null
                          ? "--"
                          : row.gapMs === 0
                            ? t("raceViewer.leader", "Leader")
                            : `+${(row.gapMs / 1000).toFixed(3)}s`}
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
                {t("raceCenter.noLeaderboard", "No race results yet. The table will populate after session simulation.")}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl">{t("raceCenter.eventFeedTitle", "Live Event Feed")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {view.eventFeed.length > 0 ? (
              view.eventFeed.map((event, index) => (
                <div key={`${event}-${index}`} className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm">
                  <p className="inline-flex items-center gap-2 font-medium text-cyan-100">
                    <ListOrdered className="size-4" />
                    {t("raceCenter.event", "Event")} {index + 1}
                  </p>
                  <p className="mt-1 text-muted-foreground">{event}</p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-muted-foreground">
                {t("raceCenter.noEventFeed", "Live feed will appear after race simulation.")}
              </div>
            )}

            <div className="rounded-2xl border border-rose-300/20 bg-rose-500/10 p-3 text-xs text-rose-100">
              <p className="inline-flex items-center gap-2 font-semibold">
                <ShieldAlert className="size-4" />
                {t("raceCenter.reliabilityRisk", "Reliability risk")}
              </p>
              <p className="mt-1 text-rose-100/90">
                {t(
                  "raceCenter.reliabilityHint",
                  "Attack pace and push modes increase DNF envelope. Balance strategy with session context.",
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl">{t("raceCenter.gridTitle", "Starting Grid Preview")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{t("raceCenter.start", "Start")}</TableHead>
                    <TableHead className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{t("raceCenter.driver", "Driver")}</TableHead>
                    <TableHead className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{t("raceCenter.team", "Team")}</TableHead>
                    <TableHead className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{t("raceCenter.focus", "Focus")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {view.startingGrid.map((row) => (
                    <TableRow
                      key={row.driverId}
                      className={
                        row.isManagedTeam
                          ? "team-row-highlight hover:bg-white/10"
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
                      <TableCell>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <TeamLogoMark name={row.teamName} logoUrl={row.teamLogoUrl} className="h-7 w-10 rounded-lg" />
                          <div>
                            <p>{row.teamName}</p>
                            <div
                              className="mt-1 h-1 w-11 rounded-full"
                              style={{ background: teamStripe(row.teamPrimaryColor, row.teamSecondaryColor, row.teamAccentColor) }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {row.isManagedTeam ? (
                          <Badge className="team-outline team-accent-text rounded-full border bg-white/10">
                            {t("raceCenter.managed", "Managed")}
                          </Badge>
                        ) : (
                          <Badge className="rounded-full border border-white/15 bg-white/10 text-muted-foreground">
                            {t("raceCenter.ai", "AI")}
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
                {t(
                  "raceCenter.noGrid",
                  "Starting grid unavailable. Run qualifying first or generate weekend context.",
                )}
              </div>
            ) : null}

            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-muted-foreground">
                <p className="inline-flex items-center gap-2 text-cyan-100">
                  <Fuel className="size-4" /> {t("raceCenter.fuelEnergy", "Fuel and energy")}
                </p>
                <p className="mt-1">
                  {t("raceCenter.fuelHint", "Fuel mode impacts pace and reliability envelopes in long runs.")}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-muted-foreground">
                <p className="inline-flex items-center gap-2 text-cyan-100">
                  <Gauge className="size-4" /> {t("raceCenter.tyreManagement", "Tyre management")}
                </p>
                <p className="mt-1">
                  {t(
                    "raceCenter.tyreHint",
                    "Tyre mode alters expected pit count and incident probability under pressure.",
                  )}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-muted-foreground">
                <p className="inline-flex items-center gap-2 text-cyan-100">
                  <Flag className="size-4" /> {t("raceCenter.sessionPoints", "Session points")}
                </p>
                <p className="mt-1">
                  {t(
                    "raceCenter.pointsHint",
                    "Points are assigned per ruleset and pushed directly to championship standings.",
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

