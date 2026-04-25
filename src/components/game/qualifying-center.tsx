"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Gauge, Timer, Zap } from "lucide-react";

import { CountryFlag } from "@/components/common/country-flag";
import { EntityAvatar } from "@/components/common/entity-avatar";
import { KpiCard } from "@/components/common/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { QualifyingCenterView } from "@/features/weekend-sessions/types";
import { useI18n } from "@/i18n/client";
import { formatDate } from "@/lib/format";
import {
  generateWeekendForQualifyingAction,
  runQualifyingSimulationAction,
} from "@/app/(game)/game/qualifying/actions";

interface QualifyingCenterProps {
  view: QualifyingCenterView;
}

function formatLap(milliseconds: number) {
  const minutes = Math.floor(milliseconds / 60_000);
  const seconds = Math.floor((milliseconds % 60_000) / 1000);
  const millis = milliseconds % 1000;
  return `${minutes}:${String(seconds).padStart(2, "0")}.${String(millis).padStart(3, "0")}`;
}

export function QualifyingCenter({ view }: QualifyingCenterProps) {
  const { t } = useI18n();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<"QUICK" | "DETAILED">("QUICK");
  const [riskLevel, setRiskLevel] = useState(62);
  const [releaseTiming, setReleaseTiming] = useState<"EARLY" | "MID" | "LATE">("MID");
  const [tyreCompound, setTyreCompound] = useState<"SOFT" | "MEDIUM" | "HARD">("SOFT");

  function trackTypeLabel(trackType: string) {
    return trackType
      .toLowerCase()
      .split("_")
      .map((token) => token.slice(0, 1).toUpperCase() + token.slice(1))
      .join(" ");
  }

  function generateWeekend() {
    if (!view.event) return;
    startTransition(async () => {
      const result = await generateWeekendForQualifyingAction({ eventId: view.event!.id });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      router.refresh();
    });
  }

  function runQualifying() {
    if (!view.targetSession) return;
    startTransition(async () => {
      const result = await runQualifyingSimulationAction({
        sessionId: view.targetSession!.id,
        mode,
        riskLevel,
        releaseTiming,
        tyreCompound,
      });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      router.refresh();
    });
  }

  const poleLap = view.leaderboard[0]?.bestLapMs ?? null;
  const myBest = view.leaderboard.find((row) => row.isManagedTeam) ?? null;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label={t("qualifying.kpiSessions", "Qualifying Sessions")}
          value={`${view.qualifyingSessions.length}`}
          delta={view.qualifyingSessions.length - 1}
          icon={<Timer className="size-4" />}
        />
        <KpiCard
          label={t("qualifying.kpiSetup", "Setup Baseline")}
          value={`${view.teamLearning?.setupConfidence ?? 52}/100`}
          delta={(view.teamLearning?.setupConfidence ?? 52) - 58}
          icon={<Gauge className="size-4" />}
        />
        <KpiCard
          label={t("qualifying.kpiTrack", "Track Learning")}
          value={`${view.teamLearning?.trackKnowledge ?? 46}/100`}
          delta={(view.teamLearning?.trackKnowledge ?? 46) - 54}
          icon={<Zap className="size-4" />}
        />
        <KpiCard
          label={t("qualifying.kpiPole", "Current Pole")}
          value={poleLap ? formatLap(poleLap) : "--"}
          delta={0}
          icon={<Timer className="size-4" />}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl">{t("qualifying.controlTitle", "Qualifying Control")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {view.event ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  {t("qualifying.round", "Round")} {view.event.round} · {trackTypeLabel(view.event.trackType)}
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
                {t("qualifying.noEvent", "No event available for qualifying simulation.")}
              </div>
            )}

            {!view.event?.hasWeekend ? (
              <Button variant="premium" className="w-full" onClick={generateWeekend} disabled={isPending || !view.event}>
                {t("qualifying.generateWeekend", "Generate Weekend Skeleton")}
              </Button>
            ) : null}

            {view.targetSession ? (
              <div className="rounded-2xl border border-cyan-300/20 bg-cyan-500/10 p-3 text-sm text-cyan-100">
                {t("qualifying.targetSession", "Target session")}: {view.targetSession.label} {view.targetSession.completed ? `(${t("qualifying.completed", "completed")})` : `(${t("qualifying.pending", "pending")})`}
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-muted-foreground">
                {t("qualifying.noSession", "No qualifying session available in this weekend.")}
              </div>
            )}

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{t("qualifying.mode", "Mode")}</p>
                <select
                  value={mode}
                  onChange={(event) => setMode(event.target.value as "QUICK" | "DETAILED")}
                  className="h-10 w-full rounded-xl border border-white/20 bg-background/40 px-3 text-sm"
                >
                  <option value="QUICK">{t("qualifying.quick", "Quick Simulation")}</option>
                  <option value="DETAILED">{t("qualifying.detailed", "Detailed Mode")}</option>
                </select>
              </div>
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{t("qualifying.tyreCompound", "Tyre Compound")}</p>
                <select
                  value={tyreCompound}
                  onChange={(event) => setTyreCompound(event.target.value as "SOFT" | "MEDIUM" | "HARD")}
                  className="h-10 w-full rounded-xl border border-white/20 bg-background/40 px-3 text-sm"
                >
                  <option value="SOFT">{t("qualifying.soft", "Soft")}</option>
                  <option value="MEDIUM">{t("qualifying.medium", "Medium")}</option>
                  <option value="HARD">{t("qualifying.hard", "Hard")}</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{t("qualifying.risk", "Risk Level")} ({riskLevel})</p>
              <input
                type="range"
                min={20}
                max={95}
                value={riskLevel}
                onChange={(event) => setRiskLevel(Number(event.target.value))}
                className="w-full accent-cyan-300"
                disabled={mode === "QUICK"}
              />
              <p className="text-xs text-muted-foreground">
                {t("qualifying.riskHint", "Higher risk can gain lap time but increases error probability.")}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{t("qualifying.releaseTiming", "Release Timing")}</p>
              <select
                value={releaseTiming}
                onChange={(event) => setReleaseTiming(event.target.value as "EARLY" | "MID" | "LATE")}
                className="h-10 w-full rounded-xl border border-white/20 bg-background/40 px-3 text-sm"
                disabled={mode === "QUICK"}
              >
                <option value="EARLY">{t("qualifying.early", "Early")}</option>
                <option value="MID">{t("qualifying.mid", "Mid Session")}</option>
                <option value="LATE">{t("qualifying.late", "Late")}</option>
              </select>
            </div>

            <Button
              variant="primary"
              className="w-full"
              onClick={runQualifying}
              disabled={isPending || !view.targetSession || view.targetSession.completed || !view.event?.hasWeekend}
            >
              {view.targetSession?.completed
                ? t("qualifying.sessionCompleted", "Session Completed")
                : t("qualifying.runSession", "Run Qualifying Session")}
            </Button>
          </CardContent>
        </Card>

        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl">{t("qualifying.progressTitle", "Session Progress")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {view.qualifyingSessions.map((session) => (
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
                    {session.completed ? t("qualifying.completed", "Completed") : t("qualifying.pending", "Pending")}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{session.weatherState}</p>
              </div>
            ))}
            {view.qualifyingSessions.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-muted-foreground">
                {t("qualifying.noSessions", "No qualifying sessions available yet.")}
              </div>
            ) : null}

            {myBest ? (
              <div className="rounded-2xl border border-cyan-300/20 bg-cyan-500/10 p-3 text-sm text-cyan-100">
                {t("qualifying.managedBest", "Managed team best")}: P{myBest.position} · {myBest.name} · {formatLap(myBest.bestLapMs)}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </section>

      <section>
        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl">{t("qualifying.leaderboardTitle", "Qualifying Leaderboard")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Pos</TableHead>
                    <TableHead className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{t("qualifying.driver", "Driver")}</TableHead>
                    <TableHead className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{t("qualifying.team", "Team")}</TableHead>
                    <TableHead className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{t("qualifying.lap", "Lap")}</TableHead>
                    <TableHead className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{t("qualifying.gap", "Gap")}</TableHead>
                    <TableHead className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{t("qualifying.tyre", "Tyre")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {view.leaderboard.map((row) => (
                    <TableRow
                      key={row.driverId}
                      className={row.isManagedTeam ? "border-cyan-300/20 bg-cyan-500/5 hover:bg-cyan-500/10" : "border-white/10 hover:bg-white/5"}
                    >
                      <TableCell className="font-semibold">{row.position}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <EntityAvatar
                            entityType="DRIVER"
                            name={row.name}
                            countryCode={row.countryCode}
                            imageUrl={row.imageUrl}
                          />
                          <span className="text-sm">{row.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{row.teamName}</TableCell>
                      <TableCell className="font-semibold">{formatLap(row.bestLapMs)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {row.gapMs === 0 ? "-" : `+${(row.gapMs / 1000).toFixed(3)}s`}
                      </TableCell>
                      <TableCell>{row.tyreCompound ?? "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {view.leaderboard.length === 0 ? (
              <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-muted-foreground">
                {t("qualifying.noResult", "No qualifying result yet. Run the target session to populate the grid.")}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
