export type Discipline =
  | "OPEN_WHEEL"
  | "STOCK_CAR"
  | "ENDURANCE"
  | "GT"
  | "FEEDER";

export type TrackType =
  | "STREET"
  | "ROAD"
  | "OVAL_SHORT"
  | "OVAL_INTERMEDIATE"
  | "SUPERSPEEDWAY"
  | "TECHNICAL"
  | "HIGH_SPEED"
  | "ENDURANCE"
  | "MIXED";

export type SupplierType =
  | "ENGINE"
  | "TIRE"
  | "BRAKE"
  | "SUSPENSION"
  | "TRANSMISSION"
  | "FUEL"
  | "ELECTRONICS"
  | "AERO"
  | "CHASSIS"
  | "PIT_EQUIPMENT"
  | "TELEMETRY";

export type CareerMode = "TEAM_PRINCIPAL" | "MY_TEAM" | "GLOBAL";

export type ManagerProfileCode =
  | "NEGOCIADOR"
  | "ESTRATEGISTA"
  | "ENGENHEIRO"
  | "VISIONARIO"
  | "FORMADOR"
  | "COMERCIAL"
  | "MOTIVADOR"
  | "DIRETOR_GLOBAL";

export type EntityType =
  | "DRIVER"
  | "TEAM"
  | "STAFF"
  | "SUPPLIER"
  | "SPONSOR"
  | "CIRCUIT";

export interface ManagerProfileDefinition {
  code: ManagerProfileCode;
  name: string;
  style: string;
  bonuses: string[];
  penalties: string[];
}

export interface NavItemDefinition {
  href: string;
  labelKey: string;
  icon: string;
}

export interface WeekendRuleSetDefinition {
  code: string;
  name: string;
  qualiFormat: string;
  hasSprint: boolean;
  hasFeature?: boolean;
  hasStages: boolean;
  endurance: boolean;
  weatherSensitivity: number;
  sessions: string[];
  parcFerme?: boolean;
  safetyCarBehavior?: string;
  pointSystem?: Record<string, unknown>;
  tireRules?: Record<string, unknown>;
  fuelRules?: Record<string, unknown>;
  requiredPitRules?: Record<string, unknown> | null;
  manufacturerRules?: Record<string, unknown> | null;
}
