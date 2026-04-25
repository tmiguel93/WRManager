export type CareerGateStatus = "UNLOCKED" | "NEAR" | "LOCKED";

export interface CategoryGateInput {
  code: string;
  name: string;
  discipline: string;
  tier: number;
  region: string;
  teamsCount: number;
  activeCategoryCode: string;
  activeTier: number;
  reputation: number;
  cashBalance: number;
  staffQuality: number;
  performanceScore: number;
}

export interface CategoryProgressNode {
  code: string;
  name: string;
  discipline: string;
  tier: number;
  region: string;
  teamsCount: number;
  status: CareerGateStatus;
  progressPercent: number;
  requiredReputation: number;
  requiredCash: number;
  requiredStaffQuality: number;
  requiredPerformance: number;
  missing: string[];
  isCurrent: boolean;
}

export interface CareerOpportunity {
  id: string;
  teamId: string;
  categoryId: string;
  teamName: string;
  categoryCode: string;
  categoryName: string;
  tier: number;
  countryCode: string;
  reputation: number;
  budget: number;
  invitationScore: number;
  status: "READY" | "WATCHLIST" | "LONG_TERM";
  reasonKey: string;
  persistedStatus: "WATCHLIST" | "ACCEPTED" | "DECLINED" | null;
}

export interface BoardObjective {
  id: string;
  titleKey: string;
  descriptionKey: string;
  progressPercent: number;
  priority: "HIGH" | "MEDIUM" | "LOW";
  persistedStatus: "ACTIVE" | "COMPLETED" | null;
  pinned: boolean;
}

export interface AcademyProspect {
  id: string;
  name: string;
  countryCode: string;
  age: number;
  categoryCode: string;
  teamName: string | null;
  overall: number;
  potential: number;
  fitScore: number;
  imageUrl: string | null;
  watchlistStatus: "WATCHLIST" | "ARCHIVED" | null;
}

export interface ChemistrySignal {
  id: string;
  labelKey: string;
  value: number;
  tone: "POSITIVE" | "NEUTRAL" | "WARNING";
  detailKey: string;
}

export interface AchievementTrack {
  id: string;
  titleKey: string;
  progressPercent: number;
  isComplete: boolean;
  detailKey: string;
  persistedStatus: "IN_PROGRESS" | "ACHIEVED" | null;
}

export interface MediaSignal {
  id: string;
  headline: string;
  categoryCode: string;
  score: number;
  type: "NEWS" | "RUMOR" | "PRESSURE";
}

export interface CareerIntelligenceView {
  activeCareer: {
    careerName: string;
    teamName: string;
    categoryCode: string;
    reputation: number;
    cashBalance: number;
    seasonPhase: string;
  };
  summary: {
    currentTier: number;
    nextTier: number | null;
    staffQuality: number;
    performanceScore: number;
    unlockedCategories: number;
    totalCategories: number;
    strongestGatePercent: number;
  };
  roadToTop: CategoryProgressNode[];
  opportunities: CareerOpportunity[];
  boardObjectives: BoardObjective[];
  academyProspects: AcademyProspect[];
  chemistry: ChemistrySignal[];
  achievements: AchievementTrack[];
  mediaSignals: MediaSignal[];
}
