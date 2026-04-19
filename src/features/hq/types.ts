export type AlertSeverity = "LOW" | "MEDIUM" | "HIGH";

export interface HqAlert {
  id: string;
  severity: AlertSeverity;
  title: string;
  message: string;
}

export interface HqKpis {
  cashBalance: number;
  monthlyBurnRate: number;
  morale: number;
  competitiveIndex: number;
  developmentPace: number;
}

export interface HqCashPoint {
  label: string;
  balance: number;
  delta: number;
}

export interface HqEvolutionPoint {
  label: string;
  reputation: number;
  performance: number;
  facilities: number;
}

export interface HqAgendaItem {
  id: string;
  round: number;
  name: string;
  circuitName: string;
  countryCode: string;
  startDateIso: string;
  daysUntil: number;
}

export interface HqDriverPulse {
  id: string;
  name: string;
  countryCode: string;
  overall: number;
  morale: number;
  potential: number;
  imageUrl: string | null;
}

export interface HqNextEvent {
  round: number;
  name: string;
  circuitName: string;
  countryCode: string;
  startDateIso: string;
}

export interface HqDashboardSnapshot {
  kpis: HqKpis;
  alerts: HqAlert[];
  nextEvent: HqNextEvent | null;
  agenda: HqAgendaItem[];
  cashFlow: HqCashPoint[];
  evolution: HqEvolutionPoint[];
  driverPulse: HqDriverPulse[];
  priorities: string[];
  foundationSummary: {
    foundedAtIso: string | null;
    initialCost: number;
    morale: number;
    mediaExpectation: string;
    strengths: string[];
    weaknesses: string[];
    contractsClosed: {
      drivers: number;
      staff: number;
    };
  } | null;
}
