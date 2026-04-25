"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FastForward, Gauge, Pause, Play, RotateCcw, Timer } from "lucide-react";

import { CountryFlag } from "@/components/common/country-flag";
import { EntityAvatar } from "@/components/common/entity-avatar";
import { TeamLogoMark } from "@/components/common/team-logo-mark";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  buildRaceBroadcastScenario,
  snapshotRaceBroadcast,
  type RaceBroadcastInput,
} from "@/domain/rules/race-broadcast";
import { formatRaceTime, stableUnitSeed } from "@/domain/rules/race-control-sim";
import type { RaceControlCenterView } from "@/features/race-control/types";

interface RaceLiveViewerProps {
  view: RaceControlCenterView;
}

const speedOptions = [1, 2, 4, 8] as const;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function buildInputFromView(view: RaceControlCenterView): RaceBroadcastInput | null {
  const sessionLabel = view.targetSession?.label ?? "Race Session";
  const trackType = view.event?.trackType ?? "ROAD";
  const gridByDriver = new Map(view.startingGrid.map((row) => [row.driverId, row.startPosition]));

  if (view.leaderboard.length > 0) {
    return {
      sessionLabel,
      trackType,
      weatherSensitivity: view.weatherSensitivity,
      feed: view.eventFeed,
      participants: view.leaderboard.map((row) => ({
        id: row.driverId,
        name: row.driverName,
        countryCode: row.countryCode,
        teamId: row.teamId,
        teamName: row.teamName,
        teamLogoUrl: row.teamLogoUrl,
        teamPrimaryColor: row.teamPrimaryColor,
        teamSecondaryColor: row.teamSecondaryColor,
        teamAccentColor: row.teamAccentColor,
        imageUrl: row.imageUrl,
        startPosition: gridByDriver.get(row.driverId) ?? row.position,
        finalPosition: row.position,
        status: row.status === "DNF" ? "DNF" : "FINISHED",
        finalTimeMs: row.totalTimeMs,
        pitStops: row.pitStops,
        incidents: row.incidents,
        isManagedTeam: row.isManagedTeam,
      })),
      plannedDurationMs:
        view.summary?.winnerTimeMs && view.summary.winnerTimeMs > 0
          ? Math.round(view.summary.winnerTimeMs * 1.02)
          : undefined,
    };
  }

  if (view.startingGrid.length === 0) {
    return null;
  }

  const participants = [...view.startingGrid]
    .sort((a, b) => a.startPosition - b.startPosition)
    .map((row) => {
      const performanceShift = Math.round((stableUnitSeed(`${row.driverId}:preview`) - 0.5) * 10);
      const finalPosition = clamp(row.startPosition + performanceShift, 1, view.startingGrid.length);
      const dnf = stableUnitSeed(`${row.driverId}:preview:dnf`) < 0.06;
      return {
        id: row.driverId,
        name: row.driverName,
        countryCode: row.countryCode,
        teamId: row.teamId,
        teamName: row.teamName,
        teamLogoUrl: row.teamLogoUrl,
        teamPrimaryColor: row.teamPrimaryColor,
        teamSecondaryColor: row.teamSecondaryColor,
        teamAccentColor: row.teamAccentColor,
        imageUrl: row.imageUrl,
        startPosition: row.startPosition,
        finalPosition,
        status: dnf ? ("DNF" as const) : ("FINISHED" as const),
        finalTimeMs: dnf ? null : 5_500_000 + row.startPosition * 3_200 + performanceShift * 7_500,
        pitStops: 1 + Math.round(stableUnitSeed(`${row.driverId}:preview:pits`) * 2),
        incidents: dnf ? ["Mechanical issue under race conditions."] : [],
        isManagedTeam: row.isManagedTeam,
      };
    });

  return {
    sessionLabel: `${sessionLabel} · Preview`,
    trackType,
    weatherSensitivity: view.weatherSensitivity,
    feed:
      view.eventFeed.length > 0
        ? view.eventFeed
        : ["Broadcast preview based on current grid and strategy context."],
    participants,
  };
}

export function RaceLiveViewer({ view }: RaceLiveViewerProps) {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<(typeof speedOptions)[number]>(1);
  const frameRef = useRef<number | null>(null);
  const lastTickRef = useRef<number | null>(null);

  const scenario = useMemo(() => {
    const input = buildInputFromView(view);
    return input ? buildRaceBroadcastScenario(input) : null;
  }, [view]);

  const snapshot = useMemo(() => {
    if (!scenario) return null;
    return snapshotRaceBroadcast(scenario, elapsedMs);
  }, [scenario, elapsedMs]);

  useEffect(() => {
    setElapsedMs(0);
    setIsPlaying(false);
    setSpeed(1);
  }, [scenario?.durationMs, scenario?.sessionLabel]);

  useEffect(() => {
    if (!scenario || !isPlaying) return;

    const loop = (timestamp: number) => {
      const previous = lastTickRef.current ?? timestamp;
      const delta = timestamp - previous;
      lastTickRef.current = timestamp;

      setElapsedMs((current) => {
        const next = current + delta * speed;
        if (next >= scenario.durationMs) {
          setIsPlaying(false);
          return scenario.durationMs;
        }
        return next;
      });

      frameRef.current = requestAnimationFrame(loop);
    };

    frameRef.current = requestAnimationFrame(loop);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      lastTickRef.current = null;
    };
  }, [isPlaying, scenario, speed]);

  if (!scenario || !snapshot) {
    return (
      <Card className="premium-card">
        <CardHeader>
          <CardTitle className="font-heading text-xl">Live Race Viewer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-muted-foreground">
            Generate weekend context and race data to unlock the live broadcast panel.
          </div>
        </CardContent>
      </Card>
    );
  }

  const visibleEvents = scenario.events
    .filter((event) => event.timeMs <= elapsedMs)
    .slice(-8)
    .reverse();

  const trackDots = snapshot.rows.map((row) => {
    const angle = row.progress * Math.PI * 2 - Math.PI / 2;
    const radius = 40;
    const x = 50 + Math.cos(angle) * radius;
    const y = 50 + Math.sin(angle) * radius;
    return { row, x, y };
  });

  return (
    <Card className="premium-card overflow-hidden">
      <CardHeader className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="font-heading text-xl">Live Race Viewer</CardTitle>
          <Badge className="rounded-full border border-cyan-300/35 bg-cyan-500/10 text-cyan-100">
            {scenario.sessionLabel}
          </Badge>
        </div>

        <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 md:grid-cols-[1fr_auto_auto] md:items-center">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <Timer className="size-4 text-cyan-200" />
                {formatRaceTime(snapshot.elapsedMs)} / {formatRaceTime(snapshot.durationMs)}
              </span>
              <span>Lap {snapshot.rows[0]?.lap ?? 1} / {snapshot.totalLaps}</span>
            </div>
            <input
              type="range"
              min={0}
              max={snapshot.durationMs}
              step={100}
              value={snapshot.elapsedMs}
              onChange={(event) => setElapsedMs(Number.parseInt(event.target.value, 10))}
              className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/20 accent-cyan-300"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setElapsedMs(0);
                setIsPlaying(false);
              }}
              aria-label="Restart viewer"
            >
              <RotateCcw className="size-4" />
            </Button>
            <Button
              variant="premium"
              onClick={() => setIsPlaying((current) => !current)}
              className="min-w-24"
            >
              {isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
              <span>{isPlaying ? "Pause" : "Play"}</span>
            </Button>
          </div>

          <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-background/50 p-1">
            {speedOptions.map((option) => (
              <Button
                key={option}
                variant={speed === option ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setSpeed(option)}
                className="h-8 px-3 text-xs"
              >
                {option}x
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="mb-3 inline-flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-cyan-100">
              <Gauge className="size-4" />
              Track Map
            </p>
            <div className="relative mx-auto aspect-square w-full max-w-[360px] rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_center,rgba(15,23,42,0.9),rgba(2,6,23,0.95))] p-4">
              <div className="absolute inset-6 rounded-full border-2 border-cyan-300/30" />
              <div className="absolute inset-[18%] rounded-full border border-dashed border-cyan-200/20" />

              {trackDots.map(({ row, x, y }) => (
                <motion.div
                  key={row.id}
                  layout
                  transition={{ type: "spring", stiffness: 220, damping: 24 }}
                  className="absolute"
                  style={{
                    left: `calc(${x}% - 11px)`,
                    top: `calc(${y}% - 11px)`,
                  }}
                >
                  <div
                    className="flex h-[22px] w-[22px] items-center justify-center rounded-full border border-black/40 text-[10px] font-bold text-black shadow-[0_4px_12px_rgba(0,0,0,0.35)]"
                    style={{ backgroundColor: row.teamPrimaryColor }}
                    title={`${row.position}. ${row.name}`}
                  >
                    {row.position}
                  </div>
                  {row.isManagedTeam ? (
                    <span className="pointer-events-none absolute -inset-1 rounded-full border border-cyan-200/70" />
                  ) : null}
                </motion.div>
              ))}
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-cyan-100">
              <FastForward className="size-4" />
              Live Event Ticker
            </p>
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {visibleEvents.map((event) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="rounded-xl border border-white/10 bg-background/40 p-3"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-100">
                      {event.title}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">{event.detail}</p>
                  </motion.div>
                ))}
              </AnimatePresence>

              {visibleEvents.length === 0 ? (
                <div className="rounded-xl border border-white/10 bg-background/40 p-3 text-sm text-muted-foreground">
                  Awaiting race start events.
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Pos</TableHead>
                <TableHead className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Driver</TableHead>
                <TableHead className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Team</TableHead>
                <TableHead className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Gap</TableHead>
                <TableHead className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Lap</TableHead>
                <TableHead className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Tyre</TableHead>
                <TableHead className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Fuel</TableHead>
                <TableHead className="text-xs uppercase tracking-[0.14em] text-muted-foreground">State</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {snapshot.rows.slice(0, 16).map((row) => (
                <TableRow
                  key={row.id}
                  className={
                    row.isManagedTeam ? "team-row-highlight hover:bg-white/10" : "border-white/10 hover:bg-white/5"
                  }
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
                      <div>
                        <p className="text-sm font-medium">{row.name}</p>
                        <CountryFlag countryCode={row.countryCode} className="mt-1 h-3.5 w-5 rounded-sm" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <TeamLogoMark name={row.teamName} logoUrl={row.teamLogoUrl} className="h-7 w-10 rounded-lg" />
                      <div>
                        <p>{row.teamName}</p>
                        <div
                          className="mt-1 h-1 w-10 rounded-full"
                          style={{
                            background: `linear-gradient(90deg, ${row.teamPrimaryColor}, ${row.teamSecondaryColor}, ${row.teamAccentColor ?? row.teamSecondaryColor})`,
                          }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {row.position === 1 ? "Leader" : `+${(row.gapMs / 1000).toFixed(3)}s`}
                  </TableCell>
                  <TableCell className="font-semibold">{row.lap}</TableCell>
                  <TableCell className="text-xs">{row.tyrePct}%</TableCell>
                  <TableCell className="text-xs">{row.fuelPct}%</TableCell>
                  <TableCell>
                    {row.pitNow ? (
                      <Badge className="rounded-full border border-amber-300/35 bg-amber-500/10 text-amber-100">
                        PIT
                      </Badge>
                    ) : row.status === "RUNNING" ? (
                      <Badge className="rounded-full border border-cyan-300/35 bg-cyan-500/10 text-cyan-100">
                        RUN
                      </Badge>
                    ) : row.status === "FINISHED" ? (
                      <Badge className="rounded-full border border-emerald-300/35 bg-emerald-500/10 text-emerald-100">
                        FIN
                      </Badge>
                    ) : (
                      <Badge className="rounded-full border border-rose-300/35 bg-rose-500/10 text-rose-100">
                        DNF
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
      </CardContent>
    </Card>
  );
}
