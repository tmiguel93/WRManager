import type { CareerMode } from "@prisma/client";

export interface CareerSetupCategory {
  id: string;
  code: string;
  name: string;
  discipline: string;
  tier: number;
  region: string;
  fantasyModeAllowed: boolean;
  teamsCount: number;
}

export interface CareerSetupTeam {
  id: string;
  categoryId: string;
  categoryCode: string;
  name: string;
  shortName: string;
  countryCode: string;
  budget: number;
  reputation: number;
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string | null;
}

export interface CareerSetupSupplier {
  id: string;
  type: string;
  name: string;
  countryCode: string;
  baseCost: number;
  performance: number;
  reliability: number;
  compatibleCategoryIds: string[];
}

export interface CreatedCareerResult {
  careerId: string;
  mode: CareerMode;
  selectedTeamId: string | null;
  selectedCategoryId: string;
}
