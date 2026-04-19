export interface WorldCategoryOption {
  id: string;
  code: string;
  name: string;
  discipline: string;
  tier: number;
}

export type InboxPriority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export interface InboxItem {
  id: string;
  title: string;
  summary: string;
  priority: InboxPriority;
  source: string;
  actionHref: string;
  actionLabel: string;
}

export interface NewsHeadlineItem {
  id: string;
  title: string;
  body: string;
  categoryCode: string;
  importance: number;
  importanceLabel: string;
  publishedAtIso: string;
}

export interface RumorWireItem {
  id: string;
  headline: string;
  body: string;
  categoryCode: string;
  credibility: number;
  credibilityLabel: string;
  createdAtIso: string;
}

export interface TransferRumorItem {
  id: string;
  driverId: string;
  driverName: string;
  fromTeamName: string;
  toTeamName: string;
  categoryCode: string;
  rumorScore: number;
  credibility: number;
  headline: string;
  summary: string;
}

export interface NewsroomHubView {
  categories: WorldCategoryOption[];
  selectedCategory: WorldCategoryOption;
  seasonYear: number;
  nextEvent: {
    id: string;
    round: number;
    name: string;
    circuitName: string;
    countryCode: string;
    startDateIso: string;
    daysUntil: number;
    hasWeekend: boolean;
  } | null;
  inbox: InboxItem[];
  headlines: NewsHeadlineItem[];
  rumorWire: RumorWireItem[];
  transferRumors: TransferRumorItem[];
}

export interface GlobalCategoryPulse {
  categoryCode: string;
  categoryName: string;
  status: string;
  currentRound: number;
  totalRounds: number;
  nextEventName: string | null;
  nextEventDateIso: string | null;
}

export interface GlobalRecentResult {
  sessionId: string;
  categoryCode: string;
  eventName: string;
  round: number;
  sessionLabel: string;
  winnerDriverName: string;
  winnerTeamName: string;
  winnerTimeMs: number | null;
  podium: Array<{
    position: number;
    driverName: string;
    teamName: string;
    status: string;
  }>;
}

export interface HotDriverItem {
  driverId: string;
  name: string;
  countryCode: string;
  imageUrl: string | null;
  categoryCode: string;
  teamName: string;
  points: number;
  heatIndex: number;
}

export interface HotManufacturerItem {
  manufacturerName: string;
  categoryCode: string;
  points: number;
  wins: number;
  heatIndex: number;
}

export interface RegulationWatchItem {
  id: string;
  categoryCode: string;
  title: string;
  summary: string;
  impactScore: number;
}

export interface GlobalMotorsportHubView {
  referenceDateIso: string;
  categories: GlobalCategoryPulse[];
  worldHeadlines: NewsHeadlineItem[];
  rumorWire: RumorWireItem[];
  transferRumors: TransferRumorItem[];
  hotDrivers: HotDriverItem[];
  hotManufacturers: HotManufacturerItem[];
  regulationWatch: RegulationWatchItem[];
  recentResults: GlobalRecentResult[];
}
