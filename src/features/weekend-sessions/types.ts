import type { TrackType } from "@/domain/models/core";

export interface WeekendCategoryOption {
  id: string;
  code: string;
  name: string;
  discipline: string;
  tier: number;
}

export interface PracticeSessionRow {
  id: string;
  tokenLabel: string;
  orderIndex: number;
  completed: boolean;
  weatherState: string;
  setupConfidence: number | null;
  trackKnowledge: number | null;
  paceDelta: number | null;
}

export interface PracticeCenterView {
  categories: WeekendCategoryOption[];
  selectedCategory: WeekendCategoryOption;
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
  practiceSessions: PracticeSessionRow[];
  teamLearning: {
    averageSetupConfidence: number;
    averageTrackKnowledge: number;
    averagePaceDelta: number;
    completedSessions: number;
  } | null;
  teamDrivers: Array<{
    id: string;
    name: string;
    countryCode: string;
    overall: number;
    imageUrl: string | null;
  }>;
}

export interface QualifyingSessionRow {
  id: string;
  label: string;
  orderIndex: number;
  completed: boolean;
  weatherState: string;
}

export interface QualifyingLeaderboardRow {
  position: number;
  driverId: string;
  name: string;
  countryCode: string;
  teamId: string | null;
  teamName: string;
  bestLapMs: number;
  gapMs: number;
  tyreCompound: string | null;
  isManagedTeam: boolean;
  imageUrl: string | null;
}

export interface QualifyingCenterView {
  categories: WeekendCategoryOption[];
  selectedCategory: WeekendCategoryOption;
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
  targetSession: QualifyingSessionRow | null;
  qualifyingSessions: QualifyingSessionRow[];
  leaderboard: QualifyingLeaderboardRow[];
  teamLearning: {
    setupConfidence: number;
    trackKnowledge: number;
  } | null;
}
