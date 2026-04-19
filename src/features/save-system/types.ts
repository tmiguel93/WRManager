import type { CareerMode, SeasonStatus } from "@prisma/client";

export interface SaveSlotSummary {
  id: string;
  name: string;
  manual: boolean;
  createdAtIso: string;
  updatedAtIso: string;
  snapshotVersion: number;
  snapshotLabel: string;
  seasonYear: number | null;
  currentRound: number | null;
  cashBalance: number | null;
}

export interface SaveCenterView {
  careerId: string | null;
  careerName: string;
  categoryCode: string;
  currentDateIso: string;
  cashBalance: number;
  canSave: boolean;
  slots: SaveSlotSummary[];
}

export interface CareerSnapshotV2 {
  version: 2;
  savedAtIso: string;
  trigger: "MANUAL" | "AUTO";
  label: string;
  career: {
    id: string;
    name: string;
    mode: CareerMode;
    managerProfileCode: string;
    currentSeasonYear: number;
    selectedCategoryId: string | null;
    selectedTeamId: string | null;
    cashBalance: number;
    reputation: number;
  };
  season:
    | {
        id: string;
        categoryId: string;
        year: number;
        status: SeasonStatus;
        currentRound: number;
      }
    | null;
  sessions: Array<{
    id: string;
    completed: boolean;
    startedAtIso: string | null;
    finishedAtIso: string | null;
  }>;
  sessionTeamStates: Array<{
    sessionId: string;
    teamId: string;
    setupConfidence: number;
    trackKnowledge: number;
    practiceDelta: number;
    notes: unknown;
  }>;
  qualifyingResults: Array<{
    sessionId: string;
    driverId: string;
    position: number;
    bestLapMs: number;
    gapMs: number | null;
    tyreCompound: string | null;
  }>;
  raceResults: Array<{
    sessionId: string;
    driverId: string;
    position: number;
    points: number;
    lapsCompleted: number;
    totalTimeMs: number | null;
    status: string;
    pitStops: number;
    incidents: unknown;
  }>;
  standings: {
    drivers: Array<{
      driverId: string;
      points: number;
      wins: number;
      podiums: number;
      poles: number;
    }>;
    teams: Array<{
      teamId: string;
      points: number;
      wins: number;
      podiums: number;
    }>;
    manufacturers: Array<{
      manufacturerName: string;
      points: number;
      wins: number;
    }>;
  };
  transactions: Array<{
    careerId: string | null;
    teamId: string | null;
    kind: string;
    amount: number;
    description: string;
    occurredAtIso: string;
  }>;
}
