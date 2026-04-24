export interface ChampionshipCategoryOption {
  id: string;
  code: string;
  name: string;
  discipline: string;
  tier: number;
}

export interface ChampionshipEventRow {
  id: string;
  round: number;
  name: string;
  circuitName: string;
  countryCode: string;
  trackType: string;
  startDateIso: string;
  endDateIso: string;
  daysUntil: number;
  weatherProfile: string;
}

export interface ChampionshipCalendarOverviewRow {
  categoryCode: string;
  categoryName: string;
  status: string;
  currentRound: number;
  totalRounds: number;
  nextEvent: {
    name: string;
    startDateIso: string;
    countryCode: string;
  } | null;
}

export interface ChampionshipDriverStandingRow {
  position: number;
  driverId: string;
  name: string;
  countryCode: string;
  points: number;
  wins: number;
  podiums: number;
  poles: number;
  teamName: string;
  imageUrl: string | null;
}

export interface ChampionshipTeamStandingRow {
  position: number;
  teamId: string;
  name: string;
  countryCode: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string | null;
  points: number;
  wins: number;
  podiums: number;
  isManagedTeam: boolean;
}

export interface ChampionshipManufacturerStandingRow {
  position: number;
  manufacturerName: string;
  points: number;
  wins: number;
}

export interface ChampionshipSeasonHistory {
  seasonYear: number;
  status: string;
  topDriver: ChampionshipDriverStandingRow | null;
  topTeam: ChampionshipTeamStandingRow | null;
  topManufacturer: ChampionshipManufacturerStandingRow | null;
}

export interface ChampionshipCalendarView {
  selectedCategory: ChampionshipCategoryOption;
  categories: ChampionshipCategoryOption[];
  seasonYear: number;
  seasonStatus: string;
  currentRound: number;
  totalRounds: number;
  events: ChampionshipEventRow[];
  globalOverview: ChampionshipCalendarOverviewRow[];
}

export interface ChampionshipStandingsView {
  selectedCategory: ChampionshipCategoryOption;
  categories: ChampionshipCategoryOption[];
  managedTeamId: string | null;
  seasonYear: number;
  seasonStatus: string;
  drivers: ChampionshipDriverStandingRow[];
  teams: ChampionshipTeamStandingRow[];
  manufacturers: ChampionshipManufacturerStandingRow[];
  history: ChampionshipSeasonHistory | null;
}
