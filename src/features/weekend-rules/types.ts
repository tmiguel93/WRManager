import type { TrackType } from "@/domain/models/core";

export type WeekendSessionType =
  | "PRACTICE"
  | "QUALIFYING"
  | "SPRINT"
  | "FEATURE"
  | "STAGE"
  | "RACE"
  | "HYPERPOLE";

export interface WeekendSessionTemplate {
  token: string;
  label: string;
  orderIndex: number;
  sessionType: WeekendSessionType;
  phase: "PRACTICE" | "QUALIFYING" | "RACE" | "SPECIAL";
  pointsEligible: boolean;
  durationMinutes: number;
  details: string | null;
}

export interface WeekendRuleSetRuntime {
  id: string;
  code: string;
  name: string;
  categoryCode: string;
  categoryName: string;
  qualifyingFormat: string;
  hasSprint: boolean;
  hasFeature: boolean;
  hasStages: boolean;
  enduranceFlags: boolean;
  weatherSensitivity: number;
  parcFerme: boolean;
  safetyCarBehavior: string;
  sessionOrder: string[];
  pointSystem: Record<string, unknown>;
  tireRules: Record<string, unknown>;
  fuelRules: Record<string, unknown>;
  requiredPitRules: Record<string, unknown> | null;
  manufacturerRules: Record<string, unknown> | null;
  defaultTrackSessions: WeekendSessionTemplate[];
}

export interface WeekendTrackPreview {
  trackType: TrackType;
  label: string;
  sessions: WeekendSessionTemplate[];
}

export interface WeekendRuleCategoryOption {
  id: string;
  code: string;
  name: string;
  discipline: string;
  tier: number;
}

export interface WeekendRulesCenterView {
  categories: WeekendRuleCategoryOption[];
  selectedCategory: WeekendRuleCategoryOption;
  seasonYear: number;
  activeRuleSet: WeekendRuleSetRuntime | null;
  availableRuleSets: WeekendRuleSetRuntime[];
  trackPreviews: WeekendTrackPreview[];
  nextEvent: {
    id: string;
    round: number;
    name: string;
    circuitName: string;
    countryCode: string;
    trackType: TrackType;
    startDateIso: string;
    hasGeneratedWeekend: boolean;
  } | null;
  generatedWeekends: Array<{
    id: string;
    eventName: string;
    round: number;
    ruleSetCode: string;
    sessionsCount: number;
    generatedAtIso: string;
  }>;
}
