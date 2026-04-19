import { promises as fs } from "node:fs";
import path from "node:path";

import { PrismaClient, type Discipline, type SupplierType, type TrackType } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import {
  realDriverSeeds,
  realStaffSeeds,
  realTeamsSeed,
  type RealDriverSeed,
  type RealStaffSeed,
} from "./seed-data/real-world";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
});

const prisma = new PrismaClient({ adapter });

type CategorySeed = {
  code: string;
  name: string;
  discipline: Discipline;
  tier: number;
  region: string;
  defaultRuleSetCode: string;
  fantasyModeAllowed: boolean;
  isFeeder: boolean;
};

type PortraitManifest = {
  drivers?: Record<string, string>;
  staff?: Record<string, string>;
};

function clamp(value: number, min = 45, max = 99) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function buildDriverAttributes(driver: RealDriverSeed) {
  const base = driver.overall;
  const categoryBias: Record<string, Partial<Record<string, number>>> = {
    F1: { qualifying: 2, technicalFeedback: 2, strategyIQ: 2 },
    F2: { qualifying: 1, overtaking: 2, emotionalControl: -1 },
    INDYCAR: { ovalAdaptation: 6, fuelSaving: 3, trafficAdaptation: 2 },
    NASCAR_CUP: { ovalAdaptation: 8, defense: 3, aggression: 4 },
    NASCAR_XFINITY: { ovalAdaptation: 7, aggression: 3, overtaking: 2 },
    NASCAR_TRUCK: { ovalAdaptation: 8, aggression: 4, consistency: -1 },
    WEC_HYPERCAR: { enduranceAdaptation: 8, consistency: 4, tireManagement: 3, fuelSaving: 3 },
    LMGT3: { enduranceAdaptation: 7, consistency: 3, wetWeather: 2 },
  };

  const traitBias: Record<string, Partial<Record<string, number>>> = {
    QUALI_BEAST: { qualifying: 6 },
    TIRE_WHISPERER: { tireManagement: 6, consistency: 2 },
    RAIN_MASTER: { wetWeather: 8 },
    OVAL_SPECIALIST: { ovalAdaptation: 10 },
    ENDURANCE_BRAIN: { enduranceAdaptation: 8, fuelSaving: 4 },
    AGGRESSIVE_CLOSER: { overtaking: 6, aggression: 6 },
    CALM_UNDER_PRESSURE: { emotionalControl: 7, consistency: 3 },
    TEAM_LEADER: { strategyIQ: 5, technicalFeedback: 4 },
    TECHNICAL_GENIUS: { technicalFeedback: 7 },
    SPONSOR_MAGNET: { emotionalControl: 3, consistency: 2 },
  };

  const cBias = categoryBias[driver.categoryCode] ?? {};
  const tBias = traitBias[driver.primaryTraitCode] ?? {};

  function score(key: string, delta: number) {
    return clamp(base + delta + (cBias[key] ?? 0) + (tBias[key] ?? 0));
  }

  return {
    purePace: score("purePace", 0),
    consistency: score("consistency", -3),
    qualifying: score("qualifying", 1),
    launch: score("launch", -4),
    defense: score("defense", -2),
    overtaking: score("overtaking", -1),
    aggression: score("aggression", -6),
    emotionalControl: score("emotionalControl", -3),
    wetWeather: score("wetWeather", -4),
    technicalFeedback: score("technicalFeedback", -1),
    tireManagement: score("tireManagement", -2),
    fuelSaving: score("fuelSaving", -3),
    strategyIQ: score("strategyIQ", -2),
    trafficAdaptation: score("trafficAdaptation", -2),
    ovalAdaptation: score("ovalAdaptation", -8),
    streetAdaptation: score("streetAdaptation", -2),
    roadCourseAdaptation: score("roadCourseAdaptation", -1),
    enduranceAdaptation: score("enduranceAdaptation", -6),
  };
}

function buildStaffAttributes(staff: RealStaffSeed) {
  const base = staff.reputation;
  const roleBoost: Record<string, Partial<Record<string, number>>> = {
    "Technical Director": { upgradeEfficiency: 8, setupQuality: 5 },
    "Head of Strategy": { setupQuality: 6, scoutingDepth: 2, pitStopExecution: 3 },
    "Pit Crew Chief": { pitStopExecution: 9, degradationControl: 2 },
    "Academy Director": { scoutingDepth: 8, talentRetention: 7 },
    "Sporting Director": { talentRetention: 8, setupQuality: 4 },
  };

  const specialtyBoost: Partial<Record<string, Partial<Record<string, number>>>> = {
    Aero: { upgradeEfficiency: 7 },
    Leadership: { talentRetention: 6 },
    Strategy: { setupQuality: 5, pitStopExecution: 3 },
    Operations: { pitStopExecution: 4, talentRetention: 3 },
    "Driver Development": { scoutingDepth: 6, talentRetention: 6 },
    "Junior Program": { scoutingDepth: 7, talentRetention: 5 },
    "Race Strategy": { setupQuality: 4, pitStopExecution: 4 },
    "Program Management": { upgradeEfficiency: 3, talentRetention: 4 },
    "Endurance Engineering": { degradationControl: 7, setupQuality: 4 },
  };

  const role = roleBoost[staff.role] ?? {};
  const specialty = specialtyBoost[staff.specialty] ?? {};

  function score(key: string, delta: number) {
    return clamp(base + delta + (role[key] ?? 0) + (specialty[key] ?? 0));
  }

  return {
    pitStopExecution: score("pitStopExecution", -14),
    setupQuality: score("setupQuality", -12),
    degradationControl: score("degradationControl", -13),
    scoutingDepth: score("scoutingDepth", -15),
    upgradeEfficiency: score("upgradeEfficiency", -11),
    talentRetention: score("talentRetention", -10),
  };
}

function staffTraitCodeFromProfile(staff: RealStaffSeed) {
  if (staff.role === "Pit Crew Chief") return "PIT_WALL_GURU";
  if (staff.specialty.includes("Aero") || staff.name === "Adrian Newey") return "AERO_VISIONARY";
  if (staff.role === "Academy Director") return "TALENT_DEVELOPER";
  if (staff.role === "Head of Strategy") return "DATA_STRATEGIST";
  if (staff.specialty.includes("Finance") || staff.specialty.includes("Program")) return "COST_CONTROLLER";
  return "LOCKER_ROOM_LEADER";
}

function teamSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function loadPortraitManifest(): Promise<PortraitManifest | null> {
  const manifestPath = path.resolve(process.cwd(), "prisma", "seed-data", "portrait-manifest.json");

  try {
    const raw = await fs.readFile(manifestPath, "utf8");
    return JSON.parse(raw) as PortraitManifest;
  } catch {
    return null;
  }
}

const categorySeeds: CategorySeed[] = [
  {
    code: "F1",
    name: "Formula 1",
    discipline: "OPEN_WHEEL",
    tier: 1,
    region: "Global",
    defaultRuleSetCode: "RULESET_F1_2026",
    fantasyModeAllowed: true,
    isFeeder: false,
  },
  {
    code: "F2",
    name: "Formula 2",
    discipline: "FEEDER",
    tier: 2,
    region: "Global",
    defaultRuleSetCode: "RULESET_F2_2026",
    fantasyModeAllowed: false,
    isFeeder: true,
  },
  {
    code: "INDYCAR",
    name: "INDYCAR Series",
    discipline: "OPEN_WHEEL",
    tier: 1,
    region: "North America",
    defaultRuleSetCode: "RULESET_INDY_2026",
    fantasyModeAllowed: true,
    isFeeder: false,
  },
  {
    code: "NASCAR_CUP",
    name: "NASCAR Cup",
    discipline: "STOCK_CAR",
    tier: 1,
    region: "North America",
    defaultRuleSetCode: "RULESET_CUP_2026",
    fantasyModeAllowed: true,
    isFeeder: false,
  },
  {
    code: "NASCAR_XFINITY",
    name: "NASCAR Xfinity",
    discipline: "STOCK_CAR",
    tier: 2,
    region: "North America",
    defaultRuleSetCode: "RULESET_XFINITY_2026",
    fantasyModeAllowed: true,
    isFeeder: true,
  },
  {
    code: "NASCAR_TRUCK",
    name: "NASCAR Craftsman Truck",
    discipline: "STOCK_CAR",
    tier: 3,
    region: "North America",
    defaultRuleSetCode: "RULESET_TRUCK_2026",
    fantasyModeAllowed: true,
    isFeeder: true,
  },
  {
    code: "WEC_HYPERCAR",
    name: "FIA WEC Hypercar",
    discipline: "ENDURANCE",
    tier: 1,
    region: "Global",
    defaultRuleSetCode: "RULESET_WEC_2026",
    fantasyModeAllowed: true,
    isFeeder: false,
  },
  {
    code: "LMGT3",
    name: "LMGT3",
    discipline: "GT",
    tier: 2,
    region: "Global",
    defaultRuleSetCode: "RULESET_GT3_2026",
    fantasyModeAllowed: true,
    isFeeder: false,
  },
];

const ruleSets = [
  {
    code: "RULESET_F1_2026",
    categoryCode: "F1",
    name: "Formula 1 2026",
    qualifyingFormat: "Q1-Q2-Q3",
    hasSprint: true,
    hasFeature: false,
    hasStages: false,
    enduranceFlags: false,
    weatherSensitivity: 88,
    safetyCarBehavior: "SAFETY_CAR_FULL",
    parcFerme: true,
    sessionOrder: ["FP1", "FP2", "FP3", "Q1", "Q2", "Q3", "RACE"],
    pointSystem: { race: [25, 18, 15, 12, 10, 8, 6, 4, 2, 1], fastestLapBonus: 1 },
    tireRules: { compounds: ["SOFT", "MEDIUM", "HARD", "INTER", "WET"], mandatoryCompounds: 2 },
    fuelRules: { refuelAllowed: false, maxFuelKg: 110 },
    requiredPitRules: { minStops: 1 },
    manufacturerRules: { maxEnginePool: 4 },
  },
  {
    code: "RULESET_F2_2026",
    categoryCode: "F2",
    name: "Formula 2 2026",
    qualifyingFormat: "Single session",
    hasSprint: true,
    hasFeature: true,
    hasStages: false,
    enduranceFlags: false,
    weatherSensitivity: 76,
    safetyCarBehavior: "SAFETY_CAR_AND_VSC",
    parcFerme: true,
    sessionOrder: ["PRACTICE", "QUALIFYING", "SPRINT", "FEATURE"],
    pointSystem: { sprint: [10, 8, 6, 5, 4, 3, 2, 1], feature: [25, 18, 15, 12, 10, 8, 6, 4, 2, 1] },
    tireRules: { compounds: ["PRIME", "OPTION", "WET"], reverseGrid: 10 },
    fuelRules: { refuelAllowed: false },
    requiredPitRules: { featureMinStops: 1 },
    manufacturerRules: { singleChassis: true },
  },
  {
    code: "RULESET_INDY_2026",
    categoryCode: "INDYCAR",
    name: "INDYCAR 2026",
    qualifyingFormat: "Track-dependent rounds",
    hasSprint: false,
    hasFeature: false,
    hasStages: false,
    enduranceFlags: false,
    weatherSensitivity: 72,
    safetyCarBehavior: "FULL_COURSE_YELLOW",
    parcFerme: false,
    sessionOrder: ["PRACTICE_1", "PRACTICE_2", "QUALIFYING", "WARMUP", "RACE"],
    pointSystem: { race: [50, 40, 35, 32, 30, 28, 26, 24, 22, 20] },
    tireRules: { compounds: ["PRIMARY", "ALTERNATE", "WET"] },
    fuelRules: { refuelAllowed: true, fuelSaveMeta: true },
    requiredPitRules: { unrestrictedStops: true },
    manufacturerRules: { approvedManufacturers: ["Honda", "Chevrolet"] },
  },
  {
    code: "RULESET_CUP_2026",
    categoryCode: "NASCAR_CUP",
    name: "NASCAR Cup 2026",
    qualifyingFormat: "Single lap",
    hasSprint: false,
    hasFeature: false,
    hasStages: true,
    enduranceFlags: false,
    weatherSensitivity: 34,
    safetyCarBehavior: "CAUTION_AND_RESTARTS",
    parcFerme: false,
    sessionOrder: ["PRACTICE", "QUALIFYING", "STAGE_1", "STAGE_2", "RACE_FINAL_STAGE"],
    pointSystem: { raceWin: 40, stageWin: 10, stageTop10: [10, 9, 8, 7, 6, 5, 4, 3, 2, 1] },
    tireRules: { compounds: ["PRIMARY"] },
    fuelRules: { refuelAllowed: true },
    requiredPitRules: { pitRoadSpeedPenalty: true },
    manufacturerRules: { approvedManufacturers: ["Ford", "Chevrolet", "Toyota"] },
  },
  {
    code: "RULESET_XFINITY_2026",
    categoryCode: "NASCAR_XFINITY",
    name: "NASCAR Xfinity 2026",
    qualifyingFormat: "Single lap",
    hasSprint: false,
    hasFeature: false,
    hasStages: true,
    enduranceFlags: false,
    weatherSensitivity: 30,
    safetyCarBehavior: "CAUTION_AND_RESTARTS",
    parcFerme: false,
    sessionOrder: ["PRACTICE", "QUALIFYING", "STAGE_1", "STAGE_2", "RACE_FINAL_STAGE"],
    pointSystem: { raceWin: 40, stageWin: 10 },
    tireRules: { compounds: ["PRIMARY"] },
    fuelRules: { refuelAllowed: true },
    requiredPitRules: { greenWhiteChecker: true },
    manufacturerRules: { approvedManufacturers: ["Ford", "Chevrolet", "Toyota"] },
  },
  {
    code: "RULESET_TRUCK_2026",
    categoryCode: "NASCAR_TRUCK",
    name: "NASCAR Truck 2026",
    qualifyingFormat: "Single lap",
    hasSprint: false,
    hasFeature: false,
    hasStages: true,
    enduranceFlags: false,
    weatherSensitivity: 28,
    safetyCarBehavior: "CAUTION_AND_RESTARTS",
    parcFerme: false,
    sessionOrder: ["PRACTICE", "QUALIFYING", "STAGE_1", "STAGE_2", "RACE_FINAL_STAGE"],
    pointSystem: { raceWin: 40, stageWin: 10 },
    tireRules: { compounds: ["PRIMARY"] },
    fuelRules: { refuelAllowed: true },
    requiredPitRules: { pitLaneViolations: true },
    manufacturerRules: { approvedManufacturers: ["Ford", "Chevrolet", "Toyota"] },
  },
  {
    code: "RULESET_WEC_2026",
    categoryCode: "WEC_HYPERCAR",
    name: "WEC Hypercar 2026",
    qualifyingFormat: "Qualifying + Hyperpole",
    hasSprint: false,
    hasFeature: false,
    hasStages: false,
    enduranceFlags: true,
    weatherSensitivity: 90,
    safetyCarBehavior: "FULL_COURSE_YELLOW_AND_SLOW_ZONE",
    parcFerme: false,
    sessionOrder: ["FP1", "FP2", "FP3", "QUALIFYING", "HYPERPOLE", "RACE_ENDURANCE"],
    pointSystem: { race: [38, 27, 23, 18, 15, 12, 9, 6, 3, 1] },
    tireRules: { compounds: ["MEDIUM", "HARD", "WET"], longRunStability: true },
    fuelRules: { refuelAllowed: true, energyManagement: true },
    requiredPitRules: { minDriverRotation: 2, nightPhase: true },
    manufacturerRules: { approvedManufacturers: ["Ferrari", "Toyota", "Cadillac", "Porsche", "BMW", "Peugeot"] },
  },
  {
    code: "RULESET_GT3_2026",
    categoryCode: "LMGT3",
    name: "LMGT3 2026",
    qualifyingFormat: "Standard + Hyperpole",
    hasSprint: false,
    hasFeature: false,
    hasStages: false,
    enduranceFlags: true,
    weatherSensitivity: 84,
    safetyCarBehavior: "FULL_COURSE_YELLOW",
    parcFerme: false,
    sessionOrder: ["PRACTICE", "QUALIFYING", "HYPERPOLE", "RACE_ENDURANCE"],
    pointSystem: { race: [25, 18, 15, 12, 10, 8, 6, 4, 2, 1] },
    tireRules: { compounds: ["MEDIUM", "HARD", "WET"] },
    fuelRules: { refuelAllowed: true },
    requiredPitRules: { minStops: 2 },
    manufacturerRules: { balanceOfPerformance: true },
  },
];

const teamsSeed = realTeamsSeed;

const driverTraitsSeed = [
  ["QUALI_BEAST", "Qualifying Beast"],
  ["TIRE_WHISPERER", "Tire Whisperer"],
  ["RAIN_MASTER", "Rain Master"],
  ["OVAL_SPECIALIST", "Oval Specialist"],
  ["ENDURANCE_BRAIN", "Endurance Brain"],
  ["AGGRESSIVE_CLOSER", "Aggressive Closer"],
  ["CALM_UNDER_PRESSURE", "Calm Under Pressure"],
  ["TEAM_LEADER", "Team Leader"],
  ["TECHNICAL_GENIUS", "Technical Genius"],
  ["SPONSOR_MAGNET", "Sponsor Magnet"],
] as const;

const staffTraitsSeed = [
  ["PIT_WALL_GURU", "Pit Wall Guru"],
  ["AERO_VISIONARY", "Aero Visionary"],
  ["DATA_STRATEGIST", "Data Strategist"],
  ["TALENT_DEVELOPER", "Talent Developer"],
  ["COST_CONTROLLER", "Cost Controller"],
  ["LOCKER_ROOM_LEADER", "Locker Room Leader"],
] as const;

const supplierSeed = [
  ["ENGINE", "Ford", "US", 14_500_000, 82, 88, 74, 78, 84, 6_300_000, 72, 65],
  ["ENGINE", "Chevrolet", "US", 15_200_000, 86, 85, 72, 77, 83, 6_800_000, 74, 63],
  ["ENGINE", "Ferrari", "IT", 21_300_000, 93, 79, 81, 74, 93, 8_600_000, 91, 88],
  ["ENGINE", "Mercedes", "DE", 20_600_000, 90, 88, 90, 85, 91, 8_200_000, 88, 86],
  ["ENGINE", "Honda", "JP", 17_900_000, 88, 84, 87, 90, 86, 7_500_000, 79, 74],
  ["ENGINE", "Toyota", "JP", 18_400_000, 84, 92, 89, 82, 85, 7_800_000, 80, 72],
  ["ENGINE", "Cadillac", "US", 16_300_000, 86, 90, 78, 76, 82, 7_100_000, 76, 68],
  ["ENGINE", "Porsche", "DE", 19_100_000, 87, 91, 88, 83, 89, 7_900_000, 87, 82],
  ["ENGINE", "BMW", "DE", 17_600_000, 85, 85, 82, 80, 87, 7_200_000, 77, 70],
  ["ENGINE", "Audi", "DE", 18_200_000, 86, 86, 83, 79, 88, 7_300_000, 78, 71],
  ["ENGINE", "Alpine", "FR", 16_900_000, 83, 80, 78, 76, 84, 6_900_000, 69, 62],
  ["ENGINE", "Peugeot", "FR", 17_400_000, 88, 77, 79, 73, 90, 7_400_000, 73, 66],
  ["ENGINE", "Genesis", "KR", 16_500_000, 82, 84, 80, 77, 83, 6_950_000, 68, 58],
  ["ENGINE", "Lexus", "JP", 16_100_000, 81, 86, 82, 78, 82, 6_720_000, 67, 57],
  ["ENGINE", "Aston Martin", "GB", 18_000_000, 86, 82, 80, 79, 88, 7_450_000, 84, 77],
  ["ENGINE", "McLaren Applied Systems", "GB", 15_000_000, 79, 83, 91, 89, 82, 6_100_000, 74, 80],
  ["TIRE", "Pirelli", "IT", 8_900_000, 89, 72, 74, 0, 82, 2_100_000, 84, 74],
  ["TIRE", "Goodyear", "US", 7_400_000, 80, 86, 76, 0, 78, 1_900_000, 72, 63],
  ["TIRE", "Firestone", "US", 7_600_000, 82, 84, 78, 0, 79, 1_950_000, 73, 62],
  ["TIRE", "Michelin", "FR", 8_100_000, 86, 90, 81, 0, 85, 2_100_000, 86, 79],
  ["TIRE", "Avon", "GB", 5_900_000, 74, 78, 70, 0, 68, 1_600_000, 58, 45],
  ["TIRE", "Dunlop", "GB", 6_700_000, 79, 82, 74, 0, 75, 1_760_000, 64, 56],
  ["TIRE", "Hankook", "KR", 6_500_000, 77, 81, 73, 0, 74, 1_720_000, 63, 54],
  ["TIRE", "Yokohama", "JP", 6_400_000, 78, 79, 72, 0, 73, 1_700_000, 62, 53],
  ["TIRE", "Continental", "DE", 6_800_000, 76, 85, 75, 0, 72, 1_790_000, 65, 57],
] as const;

const sponsorSeed = [
  ["Apex Energy", "US", "Energy Drink", 22_000_000, "06b6d4"],
  ["Vector Cloud", "GB", "Cloud Software", 18_000_000, "3b82f6"],
  ["Atlas Steel", "DE", "Industrial", 14_000_000, "94a3b8"],
  ["Sakura Mobility", "JP", "Mobility", 16_000_000, "f472b6"],
  ["NeonPay", "US", "Fintech", 13_500_000, "fbbf24"],
  ["Helios Fuel", "IT", "Fuel", 17_500_000, "fb923c"],
  ["Silver Arc Telecom", "FR", "Telecom", 12_800_000, "a78bfa"],
  ["Quantum Data Grid", "CA", "Analytics", 15_200_000, "22d3ee"],
] as const;

const eventsPerCategory: Record<string, { name: string; circuit: string; countryCode: string; trackType: TrackType }[]> =
  {
    F1: [
      { name: "Bahrain GP", circuit: "Sakhir", countryCode: "BH", trackType: "ROAD" },
      { name: "Saudi Arabian GP", circuit: "Jeddah", countryCode: "SA", trackType: "STREET" },
      { name: "Australian GP", circuit: "Melbourne", countryCode: "AU", trackType: "STREET" },
    ],
    F2: [
      { name: "Sakhir Round", circuit: "Sakhir", countryCode: "BH", trackType: "ROAD" },
      { name: "Jeddah Round", circuit: "Jeddah", countryCode: "SA", trackType: "STREET" },
      { name: "Imola Round", circuit: "Imola", countryCode: "IT", trackType: "ROAD" },
    ],
    INDYCAR: [
      { name: "St. Petersburg GP", circuit: "St. Petersburg", countryCode: "US", trackType: "STREET" },
      { name: "Long Beach GP", circuit: "Long Beach", countryCode: "US", trackType: "STREET" },
      { name: "Indianapolis 500", circuit: "Indianapolis Oval", countryCode: "US", trackType: "OVAL_INTERMEDIATE" },
    ],
    NASCAR_CUP: [
      { name: "Daytona 500", circuit: "Daytona", countryCode: "US", trackType: "SUPERSPEEDWAY" },
      { name: "Phoenix Race", circuit: "Phoenix", countryCode: "US", trackType: "OVAL_SHORT" },
      { name: "Las Vegas Race", circuit: "Las Vegas", countryCode: "US", trackType: "OVAL_INTERMEDIATE" },
    ],
    NASCAR_XFINITY: [
      { name: "Daytona Xfinity", circuit: "Daytona", countryCode: "US", trackType: "SUPERSPEEDWAY" },
      { name: "Atlanta Xfinity", circuit: "Atlanta", countryCode: "US", trackType: "OVAL_INTERMEDIATE" },
      { name: "Richmond Xfinity", circuit: "Richmond", countryCode: "US", trackType: "OVAL_SHORT" },
    ],
    NASCAR_TRUCK: [
      { name: "Daytona Truck", circuit: "Daytona", countryCode: "US", trackType: "SUPERSPEEDWAY" },
      { name: "Bristol Truck", circuit: "Bristol", countryCode: "US", trackType: "OVAL_SHORT" },
      { name: "Texas Truck", circuit: "Texas", countryCode: "US", trackType: "OVAL_INTERMEDIATE" },
    ],
    WEC_HYPERCAR: [
      { name: "Qatar 1812km", circuit: "Lusail", countryCode: "QA", trackType: "ENDURANCE" },
      { name: "6 Hours of Spa", circuit: "Spa-Francorchamps", countryCode: "BE", trackType: "ENDURANCE" },
      { name: "24 Hours of Le Mans", circuit: "Circuit de la Sarthe", countryCode: "FR", trackType: "ENDURANCE" },
    ],
    LMGT3: [
      { name: "Qatar LMGT3", circuit: "Lusail", countryCode: "QA", trackType: "ENDURANCE" },
      { name: "Spa LMGT3", circuit: "Spa-Francorchamps", countryCode: "BE", trackType: "ENDURANCE" },
      { name: "Le Mans LMGT3", circuit: "Circuit de la Sarthe", countryCode: "FR", trackType: "ENDURANCE" },
    ],
  };

async function seed() {
  const portraitManifest = await loadPortraitManifest();
  await prisma.qualifyingResult.deleteMany();
  await prisma.raceResult.deleteMany();
  await prisma.session.deleteMany();
  await prisma.raceWeekend.deleteMany();
  await prisma.standingsDriver.deleteMany();
  await prisma.standingsTeam.deleteMany();
  await prisma.standingsManufacturer.deleteMany();
  await prisma.teamFacility.deleteMany();
  await prisma.developmentProject.deleteMany();
  await prisma.carSpec.deleteMany();
  await prisma.car.deleteMany();
  await prisma.driverContract.deleteMany();
  await prisma.staffContract.deleteMany();
  await prisma.teamContract.deleteMany();
  await prisma.supplierContract.deleteMany();
  await prisma.sponsorContract.deleteMany();
  await prisma.driverTraitLink.deleteMany();
  await prisma.staffTraitLink.deleteMany();
  await prisma.teamHistory.deleteMany();
  await prisma.calendarEvent.deleteMany();
  await prisma.season.deleteMany();
  await prisma.ruleSet.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.staff.deleteMany();
  await prisma.team.deleteMany();
  await prisma.engineSupplier.deleteMany();
  await prisma.tireSupplier.deleteMany();
  await prisma.supplierCategory.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.sponsor.deleteMany();
  await prisma.facility.deleteMany();
  await prisma.driverTrait.deleteMany();
  await prisma.staffTrait.deleteMany();
  await prisma.newsItem.deleteMany();
  await prisma.rumor.deleteMany();
  await prisma.assetRegistry.deleteMany();
  await prisma.saveSlot.deleteMany();
  await prisma.career.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.category.deleteMany();

  const categoryMap = new Map<string, { id: string; defaultRuleSetCode: string }>();
  for (const category of categorySeeds) {
    const created = await prisma.category.create({
      data: {
        code: category.code,
        name: category.name,
        discipline: category.discipline,
        tier: category.tier,
        region: category.region,
        defaultRuleSetCode: category.defaultRuleSetCode,
        fantasyModeAllowed: category.fantasyModeAllowed,
        isFeeder: category.isFeeder,
      },
    });
    categoryMap.set(category.code, { id: created.id, defaultRuleSetCode: category.defaultRuleSetCode });
  }

  const ruleSetMap = new Map<string, string>();
  for (const ruleSet of ruleSets) {
    const category = categoryMap.get(ruleSet.categoryCode);
    if (!category) continue;

    const created = await prisma.ruleSet.create({
      data: {
        categoryId: category.id,
        code: ruleSet.code,
        name: ruleSet.name,
        sessionOrder: ruleSet.sessionOrder,
        pointSystem: ruleSet.pointSystem,
        tireRules: ruleSet.tireRules,
        fuelRules: ruleSet.fuelRules,
        parcFerme: ruleSet.parcFerme,
        safetyCarBehavior: ruleSet.safetyCarBehavior,
        weatherSensitivity: ruleSet.weatherSensitivity,
        qualifyingFormat: ruleSet.qualifyingFormat,
        hasSprint: ruleSet.hasSprint,
        hasFeature: ruleSet.hasFeature,
        hasStages: ruleSet.hasStages,
        enduranceFlags: ruleSet.enduranceFlags,
        requiredPitRules: ruleSet.requiredPitRules,
        manufacturerRules: ruleSet.manufacturerRules,
      },
    });
    ruleSetMap.set(ruleSet.code, created.id);
  }

  const seasonMap = new Map<string, string>();
  for (const category of categorySeeds) {
    const categoryId = categoryMap.get(category.code)?.id;
    if (!categoryId) continue;

    const season = await prisma.season.create({
      data: {
        categoryId,
        year: 2026,
        status: "PRESEASON",
      },
    });
    seasonMap.set(category.code, season.id);
  }

  for (const [categoryCode, events] of Object.entries(eventsPerCategory)) {
    const categoryId = categoryMap.get(categoryCode)?.id;
    const seasonId = seasonMap.get(categoryCode);
    if (!categoryId || !seasonId) continue;

    for (let index = 0; index < events.length; index += 1) {
      const event = events[index];
      const startDate = new Date(Date.UTC(2026, index + 2, 8 + index * 7));
      const endDate = new Date(Date.UTC(2026, index + 2, 10 + index * 7));
      await prisma.calendarEvent.create({
        data: {
          categoryId,
          seasonId,
          round: index + 1,
          name: event.name,
          circuitName: event.circuit,
          countryCode: event.countryCode,
          startDate,
          endDate,
          trackType: event.trackType,
          weatherProfile: "MIXED_SEASONAL",
          ruleSetCode: categorySeeds.find((c) => c.code === categoryCode)?.defaultRuleSetCode ?? "",
        },
      });
    }
  }

  const teamMap = new Map<string, string>();
  const teamNames = teamsSeed.map((team) => team[1]);
  for (const [categoryCode, name, shortName, countryCode, headquarters, budget, reputation, primaryColor, secondaryColor] of teamsSeed) {
    const categoryId = categoryMap.get(categoryCode)?.id;
    if (!categoryId) continue;

    const created = await prisma.team.create({
      data: {
        categoryId,
        name,
        shortName,
        slug: teamSlug(name),
        countryCode,
        headquarters,
        budget,
        reputation,
        fanbase: clamp(44 + Math.round(reputation / 1.25), 30, 99),
        history: `${name} enters 2026 with real-world operations baseline and long-term ambitions.`,
        primaryColor,
        secondaryColor,
        philosophy: "Performance-first program with sustainable growth and elite talent development.",
      },
    });
    teamMap.set(name, created.id);

    await prisma.teamHistory.create({
      data: {
        teamId: created.id,
        seasonYear: 2025,
        wins: Math.max(0, Math.floor((reputation - 75) / 3)),
        podiums: Math.max(0, Math.floor((reputation - 65) / 2)),
        poles: Math.max(0, Math.floor((reputation - 72) / 3)),
        points: Math.max(15, reputation * 4),
        summary: `${name} closed 2025 with competitive momentum and stable operations.`,
      },
    });
  }

  for (const [code, name] of driverTraitsSeed) {
    await prisma.driverTrait.create({
      data: {
        code,
        name,
        description: `${name} influences race outcomes and contract value.`,
        impact: { baseModifier: 4 },
      },
    });
  }

  for (const [code, name] of staffTraitsSeed) {
    await prisma.staffTrait.create({
      data: {
        code,
        name,
        description: `${name} increases operational efficiency and long-term execution quality.`,
        impact: { baseModifier: 4 },
      },
    });
  }

  const driverTraitMap = new Map((await prisma.driverTrait.findMany()).map((trait) => [trait.code, trait.id]));
  const staffTraitMap = new Map((await prisma.staffTrait.findMany()).map((trait) => [trait.code, trait.id]));
  const driversByTeam = new Map<string, { id: string; overall: number; salary: number }[]>();
  const staffByTeam = new Map<string, { id: string; salary: number; reputation: number; role: string }[]>();

  for (const driverSeed of realDriverSeeds) {
    const categoryId = categoryMap.get(driverSeed.categoryCode)?.id;
    if (!categoryId) continue;

    const teamId = driverSeed.teamName ? teamMap.get(driverSeed.teamName) ?? null : null;
    const imageUrl = portraitManifest?.drivers?.[driverSeed.portraitSlug] ?? null;

    const created = await prisma.driver.create({
      data: {
        firstName: driverSeed.firstName,
        lastName: driverSeed.lastName,
        displayName: driverSeed.displayName,
        countryCode: driverSeed.countryCode,
        birthDate: new Date(`${driverSeed.birthDateIso}T00:00:00.000Z`),
        imageUrl,
        overall: driverSeed.overall,
        potential: driverSeed.potential,
        reputation: driverSeed.reputation,
        marketValue: driverSeed.marketValue,
        salary: driverSeed.salary,
        morale: driverSeed.morale,
        personality: driverSeed.personality,
        primaryTraitCode: driverSeed.primaryTraitCode,
        preferredDisciplines: [driverSeed.categoryCode],
        attributes: buildDriverAttributes(driverSeed),
        currentCategoryId: categoryId,
        currentTeamId: teamId,
      },
    });

    const primaryTraitId = driverTraitMap.get(driverSeed.primaryTraitCode);
    if (primaryTraitId) {
      await prisma.driverTraitLink.create({
        data: {
          driverId: created.id,
          traitId: primaryTraitId,
          isPrimary: true,
        },
      });
    }

    if (teamId) {
      const list = driversByTeam.get(teamId) ?? [];
      list.push({ id: created.id, overall: created.overall, salary: created.salary });
      driversByTeam.set(teamId, list);
    }
  }

  for (const staffSeed of realStaffSeeds) {
    const categoryId = categoryMap.get(staffSeed.categoryCode)?.id;
    if (!categoryId) continue;

    const teamId = staffSeed.teamName ? teamMap.get(staffSeed.teamName) ?? null : null;
    const imageUrl = portraitManifest?.staff?.[staffSeed.portraitSlug] ?? null;

    const created = await prisma.staff.create({
      data: {
        name: staffSeed.name,
        role: staffSeed.role,
        countryCode: staffSeed.countryCode,
        imageUrl,
        reputation: staffSeed.reputation,
        salary: staffSeed.salary,
        specialty: staffSeed.specialty,
        compatibility: { categories: [staffSeed.categoryCode] },
        personality: staffSeed.personality,
        attributes: buildStaffAttributes(staffSeed),
        currentTeamId: teamId,
        currentCategoryId: categoryId,
      },
    });

    const traitCode = staffTraitCodeFromProfile(staffSeed);
    const traitId = staffTraitMap.get(traitCode);
    if (traitId) {
      await prisma.staffTraitLink.create({
        data: {
          staffId: created.id,
          traitId,
        },
      });
    }

    if (teamId) {
      const list = staffByTeam.get(teamId) ?? [];
      list.push({ id: created.id, salary: created.salary, reputation: created.reputation, role: created.role });
      staffByTeam.set(teamId, list);
    }
  }

  const supplierMap = new Map<string, string>();
  for (const [type, name, countryCode, baseCost, performance, reliability, efficiency, drivability, developmentCeiling, maintenanceCost, prestigeImpact, sponsorSynergy] of supplierSeed) {
    const created = await prisma.supplier.create({
      data: {
        type: type as SupplierType,
        name,
        countryCode,
        baseCost,
        performance,
        reliability,
        efficiency,
        drivability,
        developmentCeiling,
        maintenanceCost,
        prestigeImpact,
        sponsorSynergy,
        tags: { seeded: true },
      },
    });
    supplierMap.set(name, created.id);

    if (type === "ENGINE") {
      await prisma.engineSupplier.create({
        data: {
          supplierId: created.id,
          power: performance,
          torque: Math.min(99, performance + 2),
          thermalEfficiency: efficiency,
          hybridDeployment: Math.min(99, efficiency + 3),
          weight: 100 - Math.round((reliability + efficiency) / 4),
        },
      });
    }

    if (type === "TIRE") {
      await prisma.tireSupplier.create({
        data: {
          supplierId: created.id,
          peakGrip: performance,
          durability: reliability,
          thermalWindow: efficiency,
          wetPerformance: Math.min(99, reliability + 4),
          degradationCurve: 100 - reliability,
          consistency: Math.round((reliability + performance) / 2),
        },
      });
    }
  }

  const supplierCompatibility: Record<string, string[]> = {
    Ford: ["NASCAR_CUP", "NASCAR_XFINITY", "NASCAR_TRUCK"],
    Chevrolet: ["INDYCAR", "NASCAR_CUP", "NASCAR_XFINITY", "NASCAR_TRUCK"],
    Ferrari: ["F1", "WEC_HYPERCAR"],
    Mercedes: ["F1", "WEC_HYPERCAR"],
    Honda: ["F1", "INDYCAR"],
    Toyota: ["NASCAR_CUP", "NASCAR_XFINITY", "NASCAR_TRUCK", "WEC_HYPERCAR"],
    Cadillac: ["WEC_HYPERCAR"],
    Porsche: ["WEC_HYPERCAR", "LMGT3"],
    BMW: ["WEC_HYPERCAR", "LMGT3"],
    Audi: ["LMGT3"],
    Alpine: ["F1", "WEC_HYPERCAR"],
    Peugeot: ["WEC_HYPERCAR"],
    Genesis: ["LMGT3"],
    Lexus: ["LMGT3"],
    "Aston Martin": ["F1", "LMGT3"],
    "McLaren Applied Systems": ["F1", "F2", "INDYCAR"],
    Pirelli: ["F1", "F2"],
    Goodyear: ["NASCAR_CUP", "NASCAR_XFINITY", "NASCAR_TRUCK"],
    Firestone: ["INDYCAR"],
    Michelin: ["WEC_HYPERCAR", "LMGT3"],
    Avon: ["F2", "LMGT3"],
    Dunlop: ["LMGT3", "WEC_HYPERCAR"],
    Hankook: ["LMGT3"],
    Yokohama: ["LMGT3"],
    Continental: ["NASCAR_XFINITY", "NASCAR_TRUCK"],
  };

  for (const [supplierName, categoryCodes] of Object.entries(supplierCompatibility)) {
    const supplierId = supplierMap.get(supplierName);
    if (!supplierId) continue;

    for (const categoryCode of categoryCodes) {
      const categoryId = categoryMap.get(categoryCode)?.id;
      if (!categoryId) continue;
      await prisma.supplierCategory.create({
        data: {
          supplierId,
          categoryId,
        },
      });
    }
  }

  const sponsorMap = new Map<string, string>();
  for (const [name, countryCode, industry, baseValue, brandColor] of sponsorSeed) {
    const sponsor = await prisma.sponsor.create({
      data: {
        name,
        countryCode,
        industry,
        baseValue,
        confidence: 72,
        reputationRisk: 20,
        brandColor,
      },
    });
    sponsorMap.set(name, sponsor.id);
  }

  const facilityCodes = [
    ["HQ", "Headquarters", "Overall operations and executive capability", 4_500_000, 5],
    ["FACTORY", "Factory", "Manufacturing capacity and production speed", 6_000_000, 5],
    ["AERO", "Aero Department", "Aerodynamic simulation and tunnel workflow", 5_500_000, 5],
    ["SIM_CENTER", "Simulation Center", "Driver-in-loop and strategy simulation", 4_800_000, 5],
    ["DATA_CENTER", "Data Center", "Telemetry and analytics core", 4_200_000, 5],
    ["PIT_TRAINING", "Pit Crew Training", "Pit stop consistency and speed", 3_800_000, 5],
    ["YOUTH_ACADEMY", "Youth Academy", "Prospect development and scouting value", 3_600_000, 5],
  ] as const;

  const developmentSeedTemplates: Array<{
    templateCode: string;
    name: string;
    area: string;
    cost: number;
    durationWeeks: number;
    risk: number;
    expectedDelta: number;
    compatibleCategoryCodes: string[];
  }> = [
    {
      templateCode: "FRONT_WING_V2",
      name: "Front Wing Evolution",
      area: "FRONT_WING",
      cost: 6_400_000,
      durationWeeks: 6,
      risk: 26,
      expectedDelta: 3,
      compatibleCategoryCodes: ["F1", "F2", "INDYCAR", "WEC_HYPERCAR", "LMGT3"],
    },
    {
      templateCode: "REAR_WING_EFF",
      name: "Rear Wing Efficiency",
      area: "REAR_WING",
      cost: 6_100_000,
      durationWeeks: 6,
      risk: 24,
      expectedDelta: 3,
      compatibleCategoryCodes: ["F1", "F2", "INDYCAR", "WEC_HYPERCAR", "LMGT3"],
    },
    {
      templateCode: "UNDERFLOOR_LOAD",
      name: "Underfloor Load Package",
      area: "UNDERFLOOR",
      cost: 8_300_000,
      durationWeeks: 8,
      risk: 31,
      expectedDelta: 4,
      compatibleCategoryCodes: ["F1", "F2", "INDYCAR", "WEC_HYPERCAR", "LMGT3"],
    },
    {
      templateCode: "OVAL_SPECIALIST",
      name: "Oval Package",
      area: "OVAL_PACKAGE",
      cost: 6_300_000,
      durationWeeks: 6,
      risk: 27,
      expectedDelta: 3,
      compatibleCategoryCodes: ["INDYCAR", "NASCAR_CUP", "NASCAR_XFINITY", "NASCAR_TRUCK"],
    },
    {
      templateCode: "TIRE_USAGE_LONGRUN",
      name: "Tire Usage Package",
      area: "TIRE_USAGE_PACKAGE",
      cost: 5_200_000,
      durationWeeks: 5,
      risk: 21,
      expectedDelta: 2,
      compatibleCategoryCodes: ["F1", "F2", "INDYCAR", "NASCAR_CUP", "NASCAR_XFINITY", "NASCAR_TRUCK", "WEC_HYPERCAR", "LMGT3"],
    },
    {
      templateCode: "ENDURANCE_RELIABILITY",
      name: "Endurance Reliability Package",
      area: "ENDURANCE_RELIABILITY_PACKAGE",
      cost: 8_400_000,
      durationWeeks: 9,
      risk: 33,
      expectedDelta: 5,
      compatibleCategoryCodes: ["WEC_HYPERCAR", "LMGT3"],
    },
  ];

  const facilityMap = new Map<string, string>();
  for (const [code, name, description, baseCost, maxLevel] of facilityCodes) {
    const facility = await prisma.facility.create({
      data: { code, name, description, baseCost, maxLevel },
    });
    facilityMap.set(code, facility.id);
  }

  for (const [index, teamName] of teamNames.entries()) {
    const teamId = teamMap.get(teamName);
    if (!teamId) continue;

    for (const [facilityCode, facilityId] of facilityMap) {
      await prisma.teamFacility.create({
        data: {
          teamId,
          facilityId,
          level: 1 + ((index + facilityCode.length) % 3),
          condition: 70 + ((index * 7) % 26),
        },
      });
    }
  }

  for (const [index, team] of teamsSeed.entries()) {
    const teamId = teamMap.get(team[1]);
    const categoryId = categoryMap.get(team[0])?.id;
    if (!teamId || !categoryId) continue;

    const car = await prisma.car.create({
      data: {
        teamId,
        categoryId,
        modelName: `${team[2]}-26`,
        seasonYear: 2026,
        basePerformance: 68 + ((index * 3) % 25),
        reliability: 70 + ((index * 2) % 21),
        weight: 710 + (index % 38),
        downforce: 64 + ((index * 2) % 26),
        drag: 56 + ((index * 3) % 22),
      },
    });

    await prisma.carSpec.createMany({
      data: [
        { carId: car.id, key: "front_wing", value: 1 + (index % 10), unit: "tier", source: "seed" },
        { carId: car.id, key: "rear_wing", value: 1 + ((index + 2) % 10), unit: "tier", source: "seed" },
        { carId: car.id, key: "underfloor", value: 1 + ((index + 3) % 10), unit: "tier", source: "seed" },
      ],
    });

    const compatibleTemplates = developmentSeedTemplates.filter((template) =>
      template.compatibleCategoryCodes.includes(team[0]),
    );

    for (const [templateIndex, template] of compatibleTemplates.slice(0, 3).entries()) {
      const status = templateIndex === 0 ? "COMPLETED" : templateIndex === 1 ? "IN_PROGRESS" : "AVAILABLE";
      const startedAt =
        status === "IN_PROGRESS" || status === "COMPLETED"
          ? new Date(Date.UTC(2026, 0, 7 + (index % 18)))
          : null;
      const completedAt =
        status === "COMPLETED"
          ? new Date(Date.UTC(2026, 1, 6 + (index % 12)))
          : null;

      await prisma.developmentProject.create({
        data: {
          carId: car.id,
          categoryId,
          name: template.name,
          area: template.area,
          cost: template.cost + index * 55_000,
          durationWeeks: template.durationWeeks,
          risk: template.risk,
          expectedDelta: template.expectedDelta,
          hiddenVariance: ((index + templateIndex) % 5) - 2,
          status,
          startedAt,
          completedAt,
          compatibility: {
            templateCode: template.templateCode,
            compatibleCategoryCodes: template.compatibleCategoryCodes,
          },
        },
      });
    }
  }

  const engineByCategory: Record<string, string[]> = {
    F1: ["Ferrari", "Mercedes", "Honda", "Alpine"],
    F2: ["McLaren Applied Systems"],
    INDYCAR: ["Honda", "Chevrolet"],
    NASCAR_CUP: ["Ford", "Chevrolet", "Toyota"],
    NASCAR_XFINITY: ["Ford", "Chevrolet", "Toyota"],
    NASCAR_TRUCK: ["Ford", "Chevrolet", "Toyota"],
    WEC_HYPERCAR: ["Ferrari", "Toyota", "Cadillac", "Porsche", "BMW", "Peugeot"],
    LMGT3: ["Porsche", "BMW", "Audi", "Lexus", "Aston Martin", "Genesis"],
  };

  const tireByCategory: Record<string, string[]> = {
    F1: ["Pirelli"],
    F2: ["Pirelli", "Avon"],
    INDYCAR: ["Firestone"],
    NASCAR_CUP: ["Goodyear"],
    NASCAR_XFINITY: ["Goodyear", "Continental"],
    NASCAR_TRUCK: ["Goodyear", "Continental"],
    WEC_HYPERCAR: ["Michelin", "Dunlop"],
    LMGT3: ["Michelin", "Dunlop", "Hankook", "Yokohama"],
  };

  for (const [index, team] of teamsSeed.entries()) {
    const categoryCode = team[0];
    const teamId = teamMap.get(team[1]);
    if (!teamId) continue;

    const engines = engineByCategory[categoryCode] ?? [];
    const tires = tireByCategory[categoryCode] ?? [];
    const engineName = engines[index % engines.length];
    const tireName = tires[index % tires.length];
    const engineId = supplierMap.get(engineName);
    const tireId = supplierMap.get(tireName);

    if (engineId) {
      await prisma.supplierContract.create({
        data: {
          teamId,
          supplierId: engineId,
          startDate: new Date(Date.UTC(2026, 0, 1)),
          endDate: new Date(Date.UTC(2026, 11, 31)),
          annualCost: 12_000_000 + index * 300_000,
          clauses: { scope: "powertrain" },
        },
      });
    }
    if (tireId) {
      await prisma.supplierContract.create({
        data: {
          teamId,
          supplierId: tireId,
          startDate: new Date(Date.UTC(2026, 0, 1)),
          endDate: new Date(Date.UTC(2026, 11, 31)),
          annualCost: 6_000_000 + index * 180_000,
          clauses: { scope: "tires" },
        },
      });
    }
  }

  for (const [index, teamName] of teamNames.entries()) {
    const teamId = teamMap.get(teamName);
    const sponsor = sponsorSeed[index % sponsorSeed.length];
    const sponsorId = sponsorMap.get(sponsor[0]);
    if (!teamId || !sponsorId) continue;

    await prisma.sponsorContract.create({
      data: {
        sponsorId,
        teamId,
        startDate: new Date(Date.UTC(2026, 0, 1)),
        endDate: new Date(Date.UTC(2027, 0, 1)),
        fixedValue: sponsor[3] - 1_000_000 + index * 180_000,
        confidence: 72 + (index % 15),
        bonusTargets: { podium: 250_000, pole: 180_000, top10: 80_000 },
      },
    });
  }

  for (const [teamId, teamDrivers] of driversByTeam.entries()) {
    const sorted = [...teamDrivers].sort((a, b) => b.overall - a.overall);

    for (let index = 0; index < sorted.length; index += 1) {
      const driver = sorted[index];
      await prisma.driverContract.create({
        data: {
          driverId: driver.id,
          teamId,
          role: index === 0 ? "Lead Driver" : index === 1 ? "Race Driver" : "Reserve Driver",
          annualSalary: driver.salary,
          buyoutClause: driver.salary * 4,
          bonusWin: 220_000,
          bonusPodium: 120_000,
          bonusPole: 90_000,
          bonusTopTen: 40_000,
          bonusStageWin: 55_000,
          startDate: new Date(Date.UTC(2026, 0, 1)),
          endDate: new Date(Date.UTC(2027, 0, 1)),
          clauses: { optionYear: true, releaseNoticeDays: 30 },
        },
      });
    }
  }

  for (const [teamId, teamStaff] of staffByTeam.entries()) {
    const sorted = [...teamStaff].sort((a, b) => b.reputation - a.reputation);

    for (const member of sorted) {
      await prisma.staffContract.create({
        data: {
          staffId: member.id,
          teamId,
          role: member.role,
          annualSalary: member.salary,
          startDate: new Date(Date.UTC(2026, 0, 1)),
          endDate: new Date(Date.UTC(2028, 0, 1)),
          bonusObjectives: { championshipTop3: 300_000 },
        },
      });
    }
  }

  await prisma.newsItem.createMany({
    data: [
      {
        title: "Season 2026 world calendar confirmed",
        body: "All major categories finalized opening rounds with expanded technical directives.",
        categoryCode: "GLOBAL",
        importance: 76,
      },
      {
        title: "Engine supplier war intensifies in open-wheel paddock",
        body: "Manufacturers are pushing hybrid development ceilings for 2026 competitiveness.",
        categoryCode: "F1",
        importance: 81,
      },
      {
        title: "Endurance teams report stronger long-run reliability metrics",
        body: "WEC programs enter pre-season with improved thermal and energy management packages.",
        categoryCode: "WEC_HYPERCAR",
        importance: 72,
      },
    ],
  });

  await prisma.rumor.createMany({
    data: [
      {
        headline: "High-profile driver evaluating category switch",
        body: "A top open-wheel name is rumored to consider endurance opportunities after 2026.",
        categoryCode: "GLOBAL",
        credibility: 62,
      },
      {
        headline: "New sponsor expected to enter NASCAR support tiers",
        body: "Commercial scouts point to a major retail partner negotiating multi-team packages.",
        categoryCode: "NASCAR_XFINITY",
        credibility: 58,
      },
    ],
  });

  for (const team of await prisma.team.findMany()) {
    await prisma.assetRegistry.create({
      data: {
        entityType: "TEAM",
        entityId: team.id,
        assetType: "TEAM_LOGO",
        packSource: "builtin-seed",
        sourcePath: null,
        resolvedPath: null,
        isPlaceholder: true,
        approved: true,
      },
    });
  }

  for (const driver of await prisma.driver.findMany()) {
    await prisma.assetRegistry.create({
      data: {
        entityType: "DRIVER",
        entityId: driver.id,
        assetType: "DRIVER_PHOTO",
        packSource: "wikimedia-portrait-pack",
        sourcePath: driver.imageUrl,
        resolvedPath: driver.imageUrl,
        isPlaceholder: !driver.imageUrl,
        approved: Boolean(driver.imageUrl),
      },
    });
  }

  for (const staff of await prisma.staff.findMany()) {
    await prisma.assetRegistry.create({
      data: {
        entityType: "STAFF",
        entityId: staff.id,
        assetType: "GENERIC",
        packSource: "wikimedia-portrait-pack",
        sourcePath: staff.imageUrl,
        resolvedPath: staff.imageUrl,
        isPlaceholder: !staff.imageUrl,
        approved: Boolean(staff.imageUrl),
      },
    });
  }

  for (const supplier of await prisma.supplier.findMany({ take: 12 })) {
    await prisma.assetRegistry.create({
      data: {
        entityType: "SUPPLIER",
        entityId: supplier.id,
        assetType: "SUPPLIER_LOGO",
        packSource: "builtin-seed",
        sourcePath: null,
        resolvedPath: null,
        isPlaceholder: true,
        approved: true,
      },
    });
  }

  await prisma.profile.create({
    data: {
      displayName: "Commissioner",
      locale: "en-US",
      currency: "USD",
    },
  });
}

seed()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
