import type { TrackType } from "@/domain/models/core";
import { stableUnitSeed } from "@/domain/rules/race-control-sim";

export interface RaceBroadcastParticipantInput {
  id: string;
  name: string;
  countryCode: string;
  teamId: string | null;
  teamName: string;
  teamLogoUrl: string | null;
  teamPrimaryColor: string;
  teamSecondaryColor: string;
  teamAccentColor: string | null;
  imageUrl: string | null;
  startPosition: number;
  finalPosition: number;
  status: "FINISHED" | "DNF";
  finalTimeMs: number | null;
  pitStops: number;
  incidents: string[];
  isManagedTeam: boolean;
}

export interface RaceBroadcastInput {
  sessionLabel: string;
  trackType: TrackType;
  weatherSensitivity: number;
  feed: string[];
  participants: RaceBroadcastParticipantInput[];
  plannedDurationMs?: number;
}

export interface RaceBroadcastEvent {
  id: string;
  timeMs: number;
  title: string;
  detail: string;
  severity: "info" | "warning" | "critical";
}

export interface RaceBroadcastScenarioParticipant {
  id: string;
  name: string;
  countryCode: string;
  teamId: string | null;
  teamName: string;
  teamLogoUrl: string | null;
  teamPrimaryColor: string;
  teamSecondaryColor: string;
  teamAccentColor: string | null;
  imageUrl: string | null;
  startPosition: number;
  finalPosition: number;
  status: "FINISHED" | "DNF";
  finalTimeMs: number | null;
  pitStops: number;
  incidents: string[];
  isManagedTeam: boolean;
  paceFactor: number;
  startBias: number;
  targetProgress: number;
  pitWindows: number[];
  pitDurationMs: number;
}

export interface RaceBroadcastScenario {
  sessionLabel: string;
  trackType: TrackType;
  weatherSensitivity: number;
  durationMs: number;
  totalLaps: number;
  participants: RaceBroadcastScenarioParticipant[];
  events: RaceBroadcastEvent[];
}

export interface RaceBroadcastSnapshotRow {
  id: string;
  name: string;
  countryCode: string;
  teamId: string | null;
  teamName: string;
  teamLogoUrl: string | null;
  teamPrimaryColor: string;
  teamSecondaryColor: string;
  teamAccentColor: string | null;
  imageUrl: string | null;
  position: number;
  progress: number;
  gapMs: number;
  lap: number;
  tyrePct: number;
  fuelPct: number;
  pitNow: boolean;
  status: "RUNNING" | "FINISHED" | "DNF";
  isManagedTeam: boolean;
}

export interface RaceBroadcastSnapshot {
  elapsedMs: number;
  durationMs: number;
  progress: number;
  totalLaps: number;
  rows: RaceBroadcastSnapshotRow[];
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function round(value: number) {
  return Math.round(Number.isFinite(value) ? value : 0);
}

function baselineLapMs(trackType: TrackType) {
  switch (trackType) {
    case "OVAL_SHORT":
      return 27_000;
    case "OVAL_INTERMEDIATE":
      return 31_000;
    case "SUPERSPEEDWAY":
      return 46_000;
    case "ENDURANCE":
      return 220_000;
    case "HIGH_SPEED":
      return 84_000;
    case "STREET":
      return 92_000;
    case "TECHNICAL":
      return 91_000;
    case "MIXED":
      return 89_000;
    default:
      return 88_000;
  }
}

function fallbackDurationMs(trackType: TrackType) {
  if (trackType === "ENDURANCE") return 6 * 60 * 60 * 1000;
  if (trackType === "SUPERSPEEDWAY") return 95 * 60 * 1000;
  return 90 * 60 * 1000;
}

function eventTimeFromIndex(index: number, total: number, durationMs: number) {
  if (total <= 1) return round(durationMs * 0.5);
  const ratio = 0.12 + (index / (total - 1)) * 0.76;
  return round(durationMs * ratio);
}

export function buildRaceBroadcastScenario(input: RaceBroadcastInput): RaceBroadcastScenario {
  const fieldSize = Math.max(1, input.participants.length);
  const maxFinishTime = input.participants.reduce((max, participant) => {
    if (participant.finalTimeMs === null) return max;
    return Math.max(max, participant.finalTimeMs);
  }, 0);
  const durationMs = Math.max(
    3 * 60 * 1000,
    input.plannedDurationMs ?? (maxFinishTime > 0 ? maxFinishTime : fallbackDurationMs(input.trackType)),
  );
  const totalLaps = clamp(round(durationMs / baselineLapMs(input.trackType)), 8, 500);

  const participants = [...input.participants]
    .sort((a, b) => a.startPosition - b.startPosition)
    .map((participant) => {
      const seedBase = `${participant.id}:${participant.teamId ?? "independent"}`;
      const seed = stableUnitSeed(`${seedBase}:pace`);
      const finalWeight = (fieldSize - participant.finalPosition + 1) / fieldSize;
      const startWeight = (fieldSize - participant.startPosition + 1) / fieldSize;
      const finishPace =
        participant.finalTimeMs && participant.finalTimeMs > 0
          ? durationMs / participant.finalTimeMs
          : 0.92 + finalWeight * 0.18;
      const paceFactor = clamp(finishPace + (seed - 0.5) * 0.06, 0.72, 1.28);
      const startBias = clamp((startWeight - 0.5) * 0.09, -0.045, 0.06);

      const dnfProgress =
        participant.status === "DNF"
          ? clamp(0.35 + stableUnitSeed(`${seedBase}:dnf`) * 0.45, 0.26, 0.88)
          : 1;
      const targetProgress = participant.status === "DNF" ? dnfProgress : 1;

      const stopCount = clamp(participant.pitStops, 0, 8);
      const pitWindows = Array.from({ length: stopCount }, (_, stopIndex) => {
        const centerRatio = (stopIndex + 1) / (stopCount + 1);
        const jitter = (stableUnitSeed(`${seedBase}:pit:${stopIndex}`) - 0.5) * 0.08;
        return clamp(centerRatio + jitter, 0.08, 0.95);
      });
      const pitDurationMs = clamp(
        round(
          (input.trackType === "ENDURANCE" ? 33_000 : input.trackType.includes("OVAL") ? 12_000 : 21_000) +
            (stableUnitSeed(`${seedBase}:pit:duration`) - 0.5) * 3500,
        ),
        8_500,
        38_000,
      );

      return {
        ...participant,
        paceFactor,
        startBias,
        targetProgress,
        pitWindows,
        pitDurationMs,
      };
    });

  const events: RaceBroadcastEvent[] = [
    {
      id: "event-start",
      timeMs: 0,
      title: "Green Flag",
      detail: `${input.sessionLabel} started. Field released.`,
      severity: "info",
    },
  ];

  input.feed.forEach((line, index) => {
    events.push({
      id: `feed-${index}`,
      timeMs: eventTimeFromIndex(index, input.feed.length, durationMs),
      title: "Race Update",
      detail: line,
      severity: "info",
    });
  });

  participants.forEach((participant) => {
    participant.incidents.slice(0, 2).forEach((incident, index) => {
      events.push({
        id: `${participant.id}:incident:${index}`,
        timeMs: round(durationMs * clamp(0.28 + stableUnitSeed(`${participant.id}:incident:${index}`) * 0.5, 0.12, 0.92)),
        title: participant.name,
        detail: incident,
        severity: "warning",
      });
    });

    participant.pitWindows.slice(0, 2).forEach((windowRatio, index) => {
      events.push({
        id: `${participant.id}:pit:${index}`,
        timeMs: round(durationMs * windowRatio),
        title: "Pit Window",
        detail: `${participant.name} preparing pit cycle.`,
        severity: "info",
      });
    });
  });

  events.push({
    id: "event-finish",
    timeMs: durationMs,
    title: "Chequered Flag",
    detail: `${input.sessionLabel} finished.`,
    severity: "critical",
  });

  events.sort((a, b) => a.timeMs - b.timeMs || a.id.localeCompare(b.id));

  return {
    sessionLabel: input.sessionLabel,
    trackType: input.trackType,
    weatherSensitivity: input.weatherSensitivity,
    durationMs,
    totalLaps,
    participants,
    events,
  };
}

function stintProgress(progress: number, targetProgress: number, pitWindows: number[]) {
  const boundaries = [0, ...pitWindows, targetProgress];
  let segmentStart = 0;
  let segmentEnd = targetProgress;

  for (let index = 0; index < boundaries.length - 1; index += 1) {
    const start = boundaries[index];
    const end = boundaries[index + 1];
    if (progress >= start && progress <= end) {
      segmentStart = start;
      segmentEnd = end;
      break;
    }
  }

  const range = Math.max(0.02, segmentEnd - segmentStart);
  return clamp((progress - segmentStart) / range, 0, 1);
}

export function snapshotRaceBroadcast(
  scenario: RaceBroadcastScenario,
  elapsedMs: number,
): RaceBroadcastSnapshot {
  const now = clamp(round(elapsedMs), 0, scenario.durationMs);
  const raceProgress = scenario.durationMs > 0 ? now / scenario.durationMs : 0;

  const rows = scenario.participants.map((participant) => {
    const seedBase = `${participant.id}:${participant.teamId ?? "independent"}`;
    const sinusWave =
      Math.sin(raceProgress * 24 + stableUnitSeed(`${seedBase}:wave`) * Math.PI * 2) * 0.0045;
    const variation = (stableUnitSeed(`${seedBase}:variation`) - 0.5) * 0.009;
    const baseProgress =
      raceProgress * participant.paceFactor + participant.startBias + sinusWave + variation;

    let pitNow = false;
    let pitPenalty = 0;
    for (const windowRatio of participant.pitWindows) {
      const centerMs = windowRatio * scenario.durationMs;
      const halfWindow = participant.pitDurationMs / 2;
      const distance = Math.abs(now - centerMs);
      if (distance <= halfWindow) {
        pitNow = true;
        pitPenalty += (1 - distance / halfWindow) * 0.045;
      } else if (now > centerMs) {
        pitPenalty += 0.022;
      }
    }

    const rawProgress = baseProgress - pitPenalty;
    const progress = clamp(rawProgress, 0, participant.targetProgress);

    let status: "RUNNING" | "FINISHED" | "DNF" = "RUNNING";
    if (participant.status === "DNF" && progress >= participant.targetProgress) {
      status = "DNF";
    } else if (participant.status === "FINISHED" && progress >= 1) {
      status = "FINISHED";
    }

    const lap = clamp(Math.floor(progress * scenario.totalLaps) + 1, 1, scenario.totalLaps);
    const stint = stintProgress(progress, participant.targetProgress, participant.pitWindows);
    const tyrePct = pitNow
      ? 100
      : clamp(round(100 - stint * 88 + (stableUnitSeed(`${seedBase}:tyre`) - 0.5) * 6), 1, 100);
    const fuelPct = pitNow
      ? 100
      : clamp(round(100 - stint * 94 + (stableUnitSeed(`${seedBase}:fuel`) - 0.5) * 5), 1, 100);

    return {
      id: participant.id,
      name: participant.name,
      countryCode: participant.countryCode,
      teamId: participant.teamId,
      teamName: participant.teamName,
      teamLogoUrl: participant.teamLogoUrl,
      teamPrimaryColor: participant.teamPrimaryColor,
      teamSecondaryColor: participant.teamSecondaryColor,
      teamAccentColor: participant.teamAccentColor,
      imageUrl: participant.imageUrl,
      position: 0,
      progress,
      gapMs: 0,
      lap,
      tyrePct,
      fuelPct,
      pitNow,
      status,
      isManagedTeam: participant.isManagedTeam,
    } satisfies RaceBroadcastSnapshotRow;
  });

  rows.sort((a, b) => {
    if (b.progress !== a.progress) return b.progress - a.progress;
    const pa = scenario.participants.find((participant) => participant.id === a.id);
    const pb = scenario.participants.find((participant) => participant.id === b.id);
    const byFinal = (pa?.finalPosition ?? 999) - (pb?.finalPosition ?? 999);
    if (byFinal !== 0) return byFinal;
    return a.name.localeCompare(b.name);
  });

  const leaderProgress = rows[0]?.progress ?? 0;
  rows.forEach((row, index) => {
    row.position = index + 1;
    row.gapMs = index === 0 ? 0 : round((leaderProgress - row.progress) * scenario.durationMs * 0.92);
  });

  return {
    elapsedMs: now,
    durationMs: scenario.durationMs,
    progress: scenario.durationMs > 0 ? now / scenario.durationMs : 0,
    totalLaps: scenario.totalLaps,
    rows,
  };
}
