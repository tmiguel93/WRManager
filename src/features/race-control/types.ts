import type { TrackType } from "@/domain/models/core";

export interface RaceControlCategoryOption {
  id: string;
  code: string;
  name: string;
  discipline: string;
  tier: number;
}

export interface RaceSessionRow {
  id: string;
  orderIndex: number;
  label: string;
  sessionType: string;
  completed: boolean;
  weatherState: string;
}

export interface RaceGridRow {
  driverId: string;
  driverName: string;
  teamId: string | null;
  teamName: string;
  countryCode: string;
  imageUrl: string | null;
  startPosition: number;
  isManagedTeam: boolean;
}

export interface RaceLeaderboardRow {
  position: number;
  driverId: string;
  driverName: string;
  teamId: string | null;
  teamName: string;
  countryCode: string;
  imageUrl: string | null;
  status: string;
  points: number;
  gapMs: number | null;
  totalTimeMs: number | null;
  pitStops: number;
  lapsCompleted: number;
  incidents: string[];
  isManagedTeam: boolean;
}

export interface RaceSessionSummary {
  winnerName: string;
  winnerTeamName: string;
  winnerTimeMs: number | null;
  managedBestPosition: number | null;
  managedPoints: number;
  dnfs: number;
}

export interface RaceControlCenterView {
  categories: RaceControlCategoryOption[];
  selectedCategory: RaceControlCategoryOption;
  seasonYear: number;
  event: {
    id: string;
    round: number;
    name: string;
    circuitName: string;
    countryCode: string;
    trackType: TrackType;
    startDateIso: string;
    hasWeekend: boolean;
  } | null;
  raceWeekendId: string | null;
  weatherSensitivity: number;
  raceSessions: RaceSessionRow[];
  targetSession: RaceSessionRow | null;
  startingGrid: RaceGridRow[];
  leaderboard: RaceLeaderboardRow[];
  eventFeed: string[];
  summary: RaceSessionSummary | null;
}

export interface RaceSimulationResult {
  sessionId: string;
  entries: number;
  winnerName: string;
  managedBestPosition: number | null;
  managedPoints: number;
}

