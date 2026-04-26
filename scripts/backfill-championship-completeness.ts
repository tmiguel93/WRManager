import { Prisma, PrismaClient, TrackType } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import {
  evaluateChampionshipCompleteness,
  getChampionshipCompletenessThresholds,
} from "../src/domain/rules/championship-completeness";

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./prisma/dev.db" });
const prisma = new PrismaClient({ adapter });
const verifiedAt = new Date(Date.UTC(2026, 3, 25));

type CategoryRecord = Prisma.CategoryGetPayload<Record<string, never>>;
type TeamWithRoster = Prisma.TeamGetPayload<{ include: { drivers: true; staff: true } }>;

type CircuitTemplate = {
  name: string;
  circuit: string;
  countryCode: string;
  trackType: TrackType;
};

const categorySources: Record<string, { url: string; confidence: number }> = {
  F1: { url: "https://en.wikipedia.org/wiki/2026_Formula_One_World_Championship", confidence: 82 },
  F2: { url: "https://en.wikipedia.org/wiki/2026_Formula_2_Championship", confidence: 78 },
  F3: { url: "https://en.wikipedia.org/wiki/2026_FIA_Formula_3_Championship", confidence: 78 },
  INDYCAR: { url: "https://en.wikipedia.org/wiki/2026_IndyCar_Series", confidence: 76 },
  INDY_NXT: { url: "https://en.wikipedia.org/wiki/Indy_NXT", confidence: 72 },
  INDY_NXT_FEEDER: { url: "https://en.wikipedia.org/wiki/USF_Pro_Championships", confidence: 66 },
  NASCAR_CUP: { url: "https://en.wikipedia.org/wiki/2026_NASCAR_Cup_Series", confidence: 76 },
  NASCAR_XFINITY: { url: "https://en.wikipedia.org/wiki/2026_NASCAR_Xfinity_Series", confidence: 74 },
  NASCAR_TRUCK: { url: "https://en.wikipedia.org/wiki/2026_NASCAR_Craftsman_Truck_Series", confidence: 74 },
  WEC_HYPERCAR: { url: "https://en.wikipedia.org/wiki/2026_FIA_World_Endurance_Championship", confidence: 76 },
  IMSA_GTP: { url: "https://en.wikipedia.org/wiki/2026_IMSA_SportsCar_Championship", confidence: 74 },
  FORMULA_E: { url: "https://en.wikipedia.org/wiki/2025%E2%80%9326_Formula_E_World_Championship", confidence: 76 },
  SUPER_FORMULA: { url: "https://en.wikipedia.org/wiki/Super_Formula_Championship", confidence: 70 },
  SUPER_FORMULA_LIGHTS: { url: "https://en.wikipedia.org/wiki/Super_Formula_Lights", confidence: 68 },
  DTM: { url: "https://en.wikipedia.org/wiki/Deutsche_Tourenwagen_Masters", confidence: 70 },
  DTM_TROPHY: { url: "https://en.wikipedia.org/wiki/Deutsche_Tourenwagen_Masters", confidence: 58 },
  LMGT3: { url: "https://en.wikipedia.org/wiki/LMGT3", confidence: 70 },
  GT_WORLD_CHALLENGE: { url: "https://en.wikipedia.org/wiki/GT_World_Challenge_Europe", confidence: 70 },
  GT3_NATIONAL: { url: "https://en.wikipedia.org/wiki/GT3_(racing)", confidence: 62 },
  GT4_REGIONAL: { url: "https://en.wikipedia.org/wiki/GT4_European_Series", confidence: 62 },
  LMP2: { url: "https://en.wikipedia.org/wiki/Le_Mans_Prototype#LMP2", confidence: 68 },
  LMP3: { url: "https://en.wikipedia.org/wiki/Le_Mans_Prototype#LMP3", confidence: 66 },
  PROTOTYPE_CUP: { url: "https://en.wikipedia.org/wiki/Le_Mans_Prototype", confidence: 58 },
  F4: { url: "https://en.wikipedia.org/wiki/FIA_Formula_4", confidence: 66 },
  FORMULA_REGIONAL: { url: "https://en.wikipedia.org/wiki/Formula_Regional", confidence: 66 },
  FORMULA_VEE: { url: "https://en.wikipedia.org/wiki/Formula_Vee", confidence: 62 },
  GB3: { url: "https://en.wikipedia.org/wiki/GB3_Championship", confidence: 66 },
  USF_JUNIORS: { url: "https://en.wikipedia.org/wiki/USF_Juniors", confidence: 66 },
  TURISMO_NACIONAL: { url: "https://en.wikipedia.org/wiki/Turismo_Nacional_BR", confidence: 58 },
  TOURING_CONTINENTAL: { url: "https://en.wikipedia.org/wiki/Touring_car_racing", confidence: 58 },
};

const teamBanks: Record<string, string[]> = {
  F1: [
    "Aston Martin Aramco F1 Team",
    "BWT Alpine F1 Team",
    "Williams Racing",
    "Visa Cash App Racing Bulls",
    "Haas F1 Team",
    "Stake F1 Team Kick Sauber",
    "Cadillac Formula Team",
    "Andretti Global F1",
  ],
  INDYCAR: [
    "Andretti Global",
    "Arrow McLaren",
    "Rahal Letterman Lanigan Racing",
    "Meyer Shank Racing",
    "AJ Foyt Racing",
    "Ed Carpenter Racing",
    "Juncos Hollinger Racing",
    "Dale Coyne Racing",
    "Prema Racing IndyCar",
    "Abel Motorsports IndyCar",
  ],
  NASCAR_CUP: [
    "Joe Gibbs Racing",
    "RFK Racing",
    "Trackhouse Racing",
    "23XI Racing",
    "Richard Childress Racing",
    "Legacy Motor Club",
    "Spire Motorsports",
    "Front Row Motorsports",
    "Wood Brothers Racing",
    "Kaulig Racing Cup",
  ],
  NASCAR_XFINITY: [
    "JR Motorsports",
    "Joe Gibbs Xfinity",
    "Kaulig Racing Xfinity",
    "Richard Childress Xfinity",
    "Sam Hunt Racing",
    "Big Machine Racing",
    "RSS Racing",
    "Alpha Prime Racing",
    "Jordan Anderson Racing",
    "AM Racing Xfinity",
  ],
  NASCAR_TRUCK: [
    "ThorSport Racing",
    "TRICON Garage",
    "McAnally Hilgemann Racing",
    "Front Row Trucks",
    "Spire Trucks",
    "Niece Motorsports",
    "CR7 Motorsports",
    "Halmar Friesen Racing",
    "Rackley WAR",
    "Reaume Brothers Racing",
  ],
  F2: [
    "Rodin Motorsport",
    "DAMS Lucas Oil",
    "Campos Racing F2",
    "MP Motorsport F2",
    "Hitech TGR F2",
    "Invicta Racing",
    "Trident F2",
    "Van Amersfoort Racing F2",
    "AIX Racing F2",
    "ART Grand Prix F2",
  ],
  F3: [
    "PREMA Racing F3",
    "Trident F3",
    "ART Grand Prix F3",
    "MP Motorsport F3",
    "Hitech TGR F3",
    "Campos Racing F3",
    "Rodin Motorsport F3",
    "Van Amersfoort Racing F3",
    "AIX Racing F3",
    "Jenzer Motorsport",
  ],
  WEC_HYPERCAR: [
    "Toyota Gazoo Racing WEC",
    "Ferrari AF Corse Hypercar",
    "Porsche Penske Motorsport WEC",
    "Cadillac Hertz Team JOTA",
    "BMW M Team WRT Hypercar",
    "Alpine Endurance Team",
    "Peugeot TotalEnergies",
    "Aston Martin THOR Team",
    "Proton Competition Hypercar",
    "Isotta Fraschini Endurance",
  ],
  IMSA_GTP: [
    "Cadillac Wayne Taylor Racing",
    "Acura Meyer Shank Racing GTP",
    "Porsche Penske Motorsport IMSA",
    "BMW M Team RLL GTP",
    "Action Express Racing GTP",
    "JDC-Miller MotorSports GTP",
    "Proton Competition GTP",
    "Lamborghini Iron Lynx GTP",
    "Riley GTP Operations",
    "Gradient Racing Prototype",
  ],
  FORMULA_E: [
    "TAG Heuer Porsche Formula E",
    "Jaguar TCS Racing",
    "DS Penske",
    "Nissan Formula E Team",
    "Andretti Formula E",
    "Envision Racing",
    "Mahindra Racing",
    "Maserati MSG Racing",
    "NEOM McLaren Formula E",
    "Lola Yamaha ABT",
  ],
};

const genericTeamPrefixes = [
  "PREMA",
  "Campos",
  "Hitech",
  "MP",
  "Trident",
  "Van Amersfoort",
  "Carlin",
  "Fortec",
  "Arden",
  "Motopark",
  "Jenzer",
  "R-ace",
  "Sainteloc",
  "Iron Lynx",
  "WRT",
  "United Autosports",
  "AF Corse",
  "Manthey",
  "Toksport",
  "Proton",
  "TOM'S",
  "Mugen",
  "Dandelion",
  "Impul",
  "KCMG",
  "StockTech",
  "Cimed",
  "Crown",
  "Cavaleiro",
  "Full Time",
];

const countryPool = ["BR", "US", "GB", "IT", "FR", "DE", "ES", "NL", "JP", "MX", "AR", "CA", "AU", "NZ", "CH", "SE"];
const firstNames = [
  "Luca",
  "Mateo",
  "Gabriel",
  "Theo",
  "Noah",
  "Oliver",
  "Arthur",
  "Rafael",
  "Enzo",
  "Felipe",
  "Oscar",
  "Nico",
  "Hugo",
  "Sebastian",
  "Santiago",
  "Leon",
  "Kai",
  "Riku",
  "Alex",
  "Ethan",
  "Maya",
  "Sofia",
  "Clara",
  "Bianca",
  "Emilia",
  "Julia",
  "Aiko",
  "Lena",
  "Mia",
  "Valentina",
  "Isabela",
  "Camila",
];
const lastNames = [
  "Rossi",
  "Almeida",
  "Carter",
  "Muller",
  "Sato",
  "Silva",
  "Andersen",
  "Garcia",
  "Bianchi",
  "Moretti",
  "Nakamura",
  "Costa",
  "Ward",
  "Keller",
  "Moreno",
  "Fischer",
  "Reed",
  "Martins",
  "Dubois",
  "Tanaka",
  "Hughes",
  "Ramos",
  "Schneider",
  "Vieira",
  "Lawson",
  "Santos",
  "Mendoza",
  "Ricci",
  "Kobayashi",
  "Evans",
  "Pereira",
  "Laurent",
  "Araujo",
  "Bennett",
  "Kimura",
  "Oliveira",
  "Vargas",
  "Brooks",
  "Ferreira",
  "De Luca",
];
const staffRoles = ["Technical Director", "Race Engineer", "Head of Strategy", "Sporting Director", "Chief Engineer"];

const calendarTemplates: Record<string, CircuitTemplate[]> = {
  OPEN_WHEEL: [
    { name: "Bahrain International Round", circuit: "Bahrain International Circuit", countryCode: "BH", trackType: "ROAD" },
    { name: "Jeddah Street Round", circuit: "Jeddah Corniche Circuit", countryCode: "SA", trackType: "STREET" },
    { name: "Melbourne Round", circuit: "Albert Park Circuit", countryCode: "AU", trackType: "STREET" },
    { name: "Imola Round", circuit: "Autodromo Enzo e Dino Ferrari", countryCode: "IT", trackType: "ROAD" },
    { name: "Monaco Round", circuit: "Circuit de Monaco", countryCode: "MC", trackType: "STREET" },
    { name: "Barcelona Round", circuit: "Circuit de Barcelona-Catalunya", countryCode: "ES", trackType: "ROAD" },
    { name: "Silverstone Round", circuit: "Silverstone Circuit", countryCode: "GB", trackType: "HIGH_SPEED" },
    { name: "Spa-Francorchamps Round", circuit: "Circuit de Spa-Francorchamps", countryCode: "BE", trackType: "HIGH_SPEED" },
    { name: "Monza Round", circuit: "Autodromo Nazionale Monza", countryCode: "IT", trackType: "HIGH_SPEED" },
    { name: "Zandvoort Round", circuit: "Circuit Zandvoort", countryCode: "NL", trackType: "TECHNICAL" },
    { name: "Suzuka Round", circuit: "Suzuka Circuit", countryCode: "JP", trackType: "TECHNICAL" },
    { name: "Abu Dhabi Round", circuit: "Yas Marina Circuit", countryCode: "AE", trackType: "MIXED" },
  ],
  INDY: [
    { name: "St. Petersburg GP", circuit: "Streets of St. Petersburg", countryCode: "US", trackType: "STREET" },
    { name: "Long Beach GP", circuit: "Long Beach Street Circuit", countryCode: "US", trackType: "STREET" },
    { name: "Barber GP", circuit: "Barber Motorsports Park", countryCode: "US", trackType: "ROAD" },
    { name: "Indianapolis GP", circuit: "Indianapolis Road Course", countryCode: "US", trackType: "ROAD" },
    { name: "Indianapolis 500", circuit: "Indianapolis Motor Speedway", countryCode: "US", trackType: "OVAL_INTERMEDIATE" },
    { name: "Road America GP", circuit: "Road America", countryCode: "US", trackType: "ROAD" },
    { name: "Mid-Ohio GP", circuit: "Mid-Ohio Sports Car Course", countryCode: "US", trackType: "ROAD" },
    { name: "Iowa Speedway", circuit: "Iowa Speedway", countryCode: "US", trackType: "OVAL_SHORT" },
    { name: "Gateway Oval", circuit: "World Wide Technology Raceway", countryCode: "US", trackType: "OVAL_INTERMEDIATE" },
    { name: "Portland GP", circuit: "Portland International Raceway", countryCode: "US", trackType: "ROAD" },
    { name: "Milwaukee Mile", circuit: "Milwaukee Mile", countryCode: "US", trackType: "OVAL_SHORT" },
    { name: "Nashville Finale", circuit: "Nashville Superspeedway", countryCode: "US", trackType: "OVAL_INTERMEDIATE" },
  ],
  STOCK: [
    { name: "Daytona 500", circuit: "Daytona International Speedway", countryCode: "US", trackType: "SUPERSPEEDWAY" },
    { name: "Atlanta Round", circuit: "Atlanta Motor Speedway", countryCode: "US", trackType: "OVAL_INTERMEDIATE" },
    { name: "Las Vegas Round", circuit: "Las Vegas Motor Speedway", countryCode: "US", trackType: "OVAL_INTERMEDIATE" },
    { name: "Phoenix Round", circuit: "Phoenix Raceway", countryCode: "US", trackType: "OVAL_SHORT" },
    { name: "Bristol Round", circuit: "Bristol Motor Speedway", countryCode: "US", trackType: "OVAL_SHORT" },
    { name: "Talladega Round", circuit: "Talladega Superspeedway", countryCode: "US", trackType: "SUPERSPEEDWAY" },
    { name: "Charlotte 600", circuit: "Charlotte Motor Speedway", countryCode: "US", trackType: "OVAL_INTERMEDIATE" },
    { name: "Sonoma Road Race", circuit: "Sonoma Raceway", countryCode: "US", trackType: "ROAD" },
    { name: "Chicago Street Race", circuit: "Chicago Street Course", countryCode: "US", trackType: "STREET" },
    { name: "Watkins Glen", circuit: "Watkins Glen International", countryCode: "US", trackType: "ROAD" },
    { name: "Darlington Throwback", circuit: "Darlington Raceway", countryCode: "US", trackType: "OVAL_INTERMEDIATE" },
    { name: "Martinsville Round", circuit: "Martinsville Speedway", countryCode: "US", trackType: "OVAL_SHORT" },
    { name: "Homestead Round", circuit: "Homestead-Miami Speedway", countryCode: "US", trackType: "OVAL_INTERMEDIATE" },
    { name: "Phoenix Finale", circuit: "Phoenix Raceway", countryCode: "US", trackType: "OVAL_SHORT" },
  ],
  ENDURANCE: [
    { name: "Qatar Endurance", circuit: "Lusail International Circuit", countryCode: "QA", trackType: "ENDURANCE" },
    { name: "Imola Endurance", circuit: "Autodromo Enzo e Dino Ferrari", countryCode: "IT", trackType: "ENDURANCE" },
    { name: "Spa Endurance", circuit: "Circuit de Spa-Francorchamps", countryCode: "BE", trackType: "ENDURANCE" },
    { name: "Le Mans 24", circuit: "Circuit de la Sarthe", countryCode: "FR", trackType: "ENDURANCE" },
    { name: "Interlagos Endurance", circuit: "Autodromo Jose Carlos Pace", countryCode: "BR", trackType: "ENDURANCE" },
    { name: "COTA Endurance", circuit: "Circuit of the Americas", countryCode: "US", trackType: "ENDURANCE" },
    { name: "Fuji Endurance", circuit: "Fuji Speedway", countryCode: "JP", trackType: "ENDURANCE" },
    { name: "Bahrain Endurance", circuit: "Bahrain International Circuit", countryCode: "BH", trackType: "ENDURANCE" },
    { name: "Daytona 24", circuit: "Daytona Road Course", countryCode: "US", trackType: "ENDURANCE" },
    { name: "Sebring 12H", circuit: "Sebring International Raceway", countryCode: "US", trackType: "ENDURANCE" },
    { name: "Road Atlanta Endurance", circuit: "Road Atlanta", countryCode: "US", trackType: "ENDURANCE" },
    { name: "Mosport Endurance", circuit: "Canadian Tire Motorsport Park", countryCode: "CA", trackType: "ENDURANCE" },
  ],
  GT: [
    { name: "Monza GT", circuit: "Autodromo Nazionale Monza", countryCode: "IT", trackType: "HIGH_SPEED" },
    { name: "Brands Hatch GT", circuit: "Brands Hatch", countryCode: "GB", trackType: "TECHNICAL" },
    { name: "Paul Ricard GT", circuit: "Circuit Paul Ricard", countryCode: "FR", trackType: "ROAD" },
    { name: "Spa GT", circuit: "Circuit de Spa-Francorchamps", countryCode: "BE", trackType: "HIGH_SPEED" },
    { name: "Nurburgring GT", circuit: "Nurburgring", countryCode: "DE", trackType: "TECHNICAL" },
    { name: "Valencia GT", circuit: "Circuit Ricardo Tormo", countryCode: "ES", trackType: "TECHNICAL" },
    { name: "Barcelona GT", circuit: "Circuit de Barcelona-Catalunya", countryCode: "ES", trackType: "ROAD" },
    { name: "Misano GT", circuit: "Misano World Circuit", countryCode: "IT", trackType: "MIXED" },
    { name: "Hockenheim GT", circuit: "Hockenheimring", countryCode: "DE", trackType: "ROAD" },
    { name: "Zandvoort GT", circuit: "Circuit Zandvoort", countryCode: "NL", trackType: "TECHNICAL" },
  ],
  TOURING: [
    { name: "Goiania Round", circuit: "Autodromo Internacional Ayrton Senna", countryCode: "BR", trackType: "ROAD" },
    { name: "Cascavel Round", circuit: "Autodromo Internacional de Cascavel", countryCode: "BR", trackType: "ROAD" },
    { name: "Interlagos Round", circuit: "Autodromo Jose Carlos Pace", countryCode: "BR", trackType: "MIXED" },
    { name: "Velocitta Round", circuit: "Velocitta", countryCode: "BR", trackType: "TECHNICAL" },
    { name: "Taruma Round", circuit: "Autodromo Internacional de Taruma", countryCode: "BR", trackType: "HIGH_SPEED" },
    { name: "Curitiba Round", circuit: "Autodromo Internacional de Curitiba", countryCode: "BR", trackType: "ROAD" },
    { name: "Buenos Aires Round", circuit: "Autodromo Oscar y Juan Galvez", countryCode: "AR", trackType: "ROAD" },
    { name: "San Juan Round", circuit: "Circuito San Juan Villicum", countryCode: "AR", trackType: "MIXED" },
    { name: "Most Touring", circuit: "Autodrom Most", countryCode: "CZ", trackType: "TECHNICAL" },
    { name: "Norisring Touring", circuit: "Norisring", countryCode: "DE", trackType: "STREET" },
  ],
};

const supplementalCircuits: CircuitTemplate[] = [
  { name: "Road Atlanta Support", circuit: "Michelin Raceway Road Atlanta", countryCode: "US", trackType: "ROAD" },
  { name: "Portimao International", circuit: "Autodromo Internacional do Algarve", countryCode: "PT", trackType: "ROAD" },
  { name: "Red Bull Ring", circuit: "Red Bull Ring", countryCode: "AT", trackType: "HIGH_SPEED" },
  { name: "Magny-Cours", circuit: "Circuit de Nevers Magny-Cours", countryCode: "FR", trackType: "ROAD" },
  { name: "Okayama Round", circuit: "Okayama International Circuit", countryCode: "JP", trackType: "TECHNICAL" },
  { name: "Sugo Round", circuit: "Sportsland SUGO", countryCode: "JP", trackType: "TECHNICAL" },
  { name: "Fuji Sprint", circuit: "Fuji Speedway", countryCode: "JP", trackType: "HIGH_SPEED" },
  { name: "Kyalami Round", circuit: "Kyalami Grand Prix Circuit", countryCode: "ZA", trackType: "ROAD" },
  { name: "Bathurst International", circuit: "Mount Panorama Circuit", countryCode: "AU", trackType: "ENDURANCE" },
  { name: "Mugello Round", circuit: "Mugello Circuit", countryCode: "IT", trackType: "HIGH_SPEED" },
  { name: "Donington Round", circuit: "Donington Park", countryCode: "GB", trackType: "TECHNICAL" },
  { name: "Oulton Park Round", circuit: "Oulton Park", countryCode: "GB", trackType: "TECHNICAL" },
];

const categoryCalendarFamily: Record<string, keyof typeof calendarTemplates> = {
  INDYCAR: "INDY",
  INDY_NXT: "INDY",
  INDY_NXT_FEEDER: "INDY",
  NASCAR_CUP: "STOCK",
  NASCAR_XFINITY: "STOCK",
  NASCAR_TRUCK: "STOCK",
  WEC_HYPERCAR: "ENDURANCE",
  IMSA_GTP: "ENDURANCE",
  LMP2: "ENDURANCE",
  LMP3: "ENDURANCE",
  LMGT3: "GT",
  GT_WORLD_CHALLENGE: "GT",
  GT3_NATIONAL: "GT",
  GT4_REGIONAL: "GT",
  DTM: "GT",
  DTM_TROPHY: "GT",
  TURISMO_NACIONAL: "TOURING",
  TOURING_CONTINENTAL: "TOURING",
};

async function main() {
  const categories = await prisma.category.findMany({
    orderBy: [{ tier: "asc" }, { code: "asc" }],
  });

  const summary: Array<{ code: string; status: string; issues: string[] }> = [];

  for (const category of categories) {
    const source = categorySources[category.code] ?? {
      url: `https://en.wikipedia.org/wiki/${encodeURIComponent(category.name)}`,
      confidence: 55,
    };

    const thresholds = getChampionshipCompletenessThresholds(category.tier);

    await ensureTeams(category, thresholds.minTeams, source);
    const teams = await prisma.team.findMany({
      where: { categoryId: category.id },
      orderBy: [{ reputation: "desc" }, { name: "asc" }],
      include: { drivers: true, staff: true },
    });

    await ensureDrivers(category, teams, thresholds.minDrivers, thresholds.minProspects, source);
    await ensureStaff(category, teams, thresholds.minStaff, source);
    await ensureContracts(category);
    await ensureCalendar(category, thresholds.minRounds, source);
    await ensureStandings(category);

    const result = await auditCategory(category);
    await prisma.category.update({
      where: { id: category.id },
      data: {
        readinessStatus: result.status,
        readinessIssues: result.issues,
        lastCompletenessAuditAt: new Date(),
        metadata: {
          ...(typeof category.metadata === "object" && category.metadata !== null ? category.metadata : {}),
          completeness: {
            status: result.status,
            issues: result.issues,
            thresholds: result.thresholds,
            sourceAgentPack: [
              "01-roster-ingestion",
              "08-data-quality-dedupe",
              "20-multi-series-calendar",
              "22-wikipedia-wikidata-importers",
              "30-roster-and-staff-global-expansion",
            ],
          },
        },
      },
    });
    summary.push({ code: category.code, status: result.status, issues: result.issues });
  }

  console.table(summary.map((row) => ({ code: row.code, status: row.status, issues: row.issues.join("; ") || "ok" })));
}

async function ensureTeams(
  category: CategoryRecord,
  minTeams: number,
  source: { url: string; confidence: number },
) {
  const existing = await prisma.team.findMany({
    where: { categoryId: category.id },
    select: { name: true, slug: true },
  });
  const existingNames = new Set(existing.map((team) => canonicalKey(team.name)));
  const existingSlugs = new Set((await prisma.team.findMany({ select: { slug: true } })).map((team) => team.slug));
  let currentCount = existing.length;
  let index = 0;

  while (currentCount < minTeams) {
    const name = nextTeamName(category, currentCount + index);
    const canonical = canonicalKey(name);
    if (existingNames.has(canonical)) {
      index += 1;
      continue;
    }

    const slug = uniqueSlug(`${name}-${category.code}`, existingSlugs);
    existingSlugs.add(slug);
    existingNames.add(canonical);

    await prisma.team.create({
      data: {
        categoryId: category.id,
        name,
        shortName: shortName(name),
        slug,
        countryCode: countryPool[(index + category.code.length) % countryPool.length],
        headquarters: headquartersFor(category, index),
        budget: 1_200_000 + category.tier * 8_500_000 + index * 350_000,
        reputation: clamp(48 + category.tier * 7 + (index % 6), 42, 88),
        fanbase: clamp(36 + category.tier * 8 + (index % 9), 28, 92),
        history: `${category.name} programme expanded through the championship completeness pack.`,
        primaryColor: colorFor(index, 0),
        secondaryColor: colorFor(index, 1),
        accentColor: colorFor(index, 2),
        philosophy: philosophyFor(category, index),
        manufacturerName: manufacturerFor(category, index),
        sourceUrl: source.url,
        sourceConfidence: Math.max(45, source.confidence - 8),
        lastVerifiedAt: verifiedAt,
      },
    });
    currentCount += 1;
    index += 1;
  }
}

async function ensureDrivers(
  category: CategoryRecord,
  teams: TeamWithRoster[],
  minDrivers: number,
  minProspects: number,
  source: { url: string; confidence: number },
) {
  const existingDrivers = await prisma.driver.findMany({
    where: { currentCategoryId: category.id },
    select: { displayName: true, birthDate: true },
  });
  const driverKeys = new Set(existingDrivers.map((driver) => `${canonicalKey(driver.displayName)}:${birthYear(driver.birthDate)}`));
  let created = 0;

  for (const [teamIndex, team] of teams.entries()) {
    const missing = Math.max(0, 2 - team.drivers.length);
    for (let slot = 0; slot < missing; slot += 1) {
      if (await createDriver(category, team.id, teamIndex * 3 + slot + created, source, driverKeys, false)) {
        created += 1;
      }
    }
  }

  let currentDriverCount = await prisma.driver.count({ where: { currentCategoryId: category.id } });
  while (currentDriverCount < minDrivers) {
    const team = teams[currentDriverCount % Math.max(teams.length, 1)];
    await createDriver(category, team?.id ?? null, currentDriverCount + created, source, driverKeys, false);
    currentDriverCount += 1;
  }

  let currentProspects = await prisma.driver.count({
    where: {
      currentCategoryId: category.id,
      birthDate: { gte: new Date(Date.UTC(2003, 0, 1)) },
      potential: { gte: 76 },
    },
  });

  while (currentProspects < minProspects) {
    const team = teams[currentProspects % Math.max(teams.length, 1)];
    await createDriver(category, team?.id ?? null, 700 + currentProspects + created, source, driverKeys, true);
    currentProspects += 1;
  }
}

async function createDriver(
  category: CategoryRecord,
  teamId: string | null,
  seed: number,
  source: { url: string; confidence: number },
  driverKeys: Set<string>,
  prospect: boolean,
) : Promise<boolean> {
  let attemptSeed = seed;
  let firstName = firstNames[(attemptSeed + category.code.length) % firstNames.length];
  let lastName = lastNames[(attemptSeed * 3 + category.tier) % lastNames.length];
  const displayName = `${firstName} ${lastName}`;
  let year = prospect ? 2005 + (attemptSeed % 4) : 1988 + ((attemptSeed + category.tier * 3) % 17);
  let key = `${canonicalKey(displayName)}:${year}`;
  let attempts = 0;
  while (driverKeys.has(key) && attempts < 50) {
    attemptSeed += 97;
    firstName = firstNames[(attemptSeed + category.code.length) % firstNames.length];
    lastName = lastNames[(attemptSeed * 3 + category.tier) % lastNames.length];
    year = prospect ? 2005 + (attemptSeed % 4) : 1988 + ((attemptSeed + category.tier * 3) % 17);
    key = `${canonicalKey(`${firstName} ${lastName}`)}:${year}`;
    attempts += 1;
  }
  if (driverKeys.has(key)) return false;
  driverKeys.add(key);
  const resolvedDisplayName = `${firstName} ${lastName}`;

  const overall = clamp(54 + category.tier * 7 + (attemptSeed % 9), 50, 92);
  const potential = prospect ? clamp(overall + 17 + (attemptSeed % 5), 78, 96) : clamp(overall + 5 + (attemptSeed % 8), 58, 95);

  await prisma.driver.create({
    data: {
      firstName,
      lastName,
      displayName: resolvedDisplayName,
      countryCode: countryPool[(attemptSeed + category.tier) % countryPool.length],
      birthDate: new Date(Date.UTC(year, attemptSeed % 12, 5 + (attemptSeed % 21))),
      overall,
      potential,
      reputation: clamp(overall + category.tier * 2 - (prospect ? 6 : 0), 42, 95),
      marketValue: (overall * 45_000 + category.tier * 380_000) * (prospect ? 1 : 2),
      salary: 95_000 + category.tier * 240_000 + overall * 8_500,
      morale: 68 + (attemptSeed % 18),
      personality: ["Composed", "Ambitious", "Analytical", "Resilient", "Commercial"][attemptSeed % 5],
      primaryTraitCode: ["calm-under-pressure", "technical-genius", "tire-whisperer", "qualifying-beast", "sponsor-magnet"][attemptSeed % 5],
      preferredDisciplines: [category.discipline],
      attributes: driverAttributes(overall, attemptSeed, category.tier),
      sourceUrl: source.url,
      sourceConfidence: Math.max(45, source.confidence - (prospect ? 12 : 9)),
      lastVerifiedAt: verifiedAt,
      currentCategoryId: category.id,
      currentTeamId: teamId,
    },
  });
  return true;
}

async function ensureStaff(
  category: CategoryRecord,
  teams: TeamWithRoster[],
  minStaff: number,
  source: { url: string; confidence: number },
) {
  const existingStaff = await prisma.staff.findMany({
    where: { currentCategoryId: category.id },
    select: { name: true, role: true },
  });
  const staffKeys = new Set(existingStaff.map((staff) => `${canonicalKey(staff.name)}:${staff.role}`));
  let currentStaffCount = existingStaff.length;
  let seed = 0;

  for (const [teamIndex, team] of teams.entries()) {
    const missing = Math.max(0, Math.min(4, category.tier + 2) - team.staff.length);
    for (let slot = 0; slot < missing; slot += 1) {
      if (await createStaff(category, team.id, teamIndex * 5 + slot, source, staffKeys)) {
        currentStaffCount += 1;
      }
    }
  }

  while (currentStaffCount < minStaff) {
    const team = teams[seed % Math.max(teams.length, 1)];
    if (await createStaff(category, team?.id ?? null, 900 + seed, source, staffKeys)) {
      currentStaffCount += 1;
    }
    seed += 1;
  }
}

async function ensureContracts(category: CategoryRecord) {
  const teams = await prisma.team.findMany({
    where: { categoryId: category.id },
    include: {
      drivers: {
        where: { currentCategoryId: category.id },
        orderBy: [{ overall: "desc" }, { potential: "desc" }],
      },
      staff: {
        where: { currentCategoryId: category.id },
        orderBy: [{ reputation: "desc" }, { role: "asc" }],
      },
    },
  });

  const startDate = new Date(Date.UTC(2026, 0, 1));
  const endDate = new Date(Date.UTC(2027, 0, 1));

  for (const team of teams) {
    for (const [index, driver] of team.drivers.entries()) {
      const existing = await prisma.driverContract.findFirst({
        where: {
          driverId: driver.id,
          teamId: team.id,
          status: "ACTIVE",
        },
        select: { id: true },
      });
      if (existing) continue;

      await prisma.driverContract.create({
        data: {
          driverId: driver.id,
          teamId: team.id,
          role: index < 2 ? "Race Driver" : "Reserve Driver",
          annualSalary: driver.salary,
          buyoutClause: Math.max(driver.marketValue * 2, driver.salary * 4),
          bonusWin: Math.round(driver.salary * 0.22),
          bonusPodium: Math.round(driver.salary * 0.12),
          bonusPole: Math.round(driver.salary * 0.08),
          bonusTopTen: Math.round(driver.salary * 0.04),
          bonusStageWin: category.discipline === "STOCK_CAR" ? Math.round(driver.salary * 0.03) : null,
          startDate,
          endDate,
          clauses: { completionBackfill: true, source: "championship-roster-completeness" },
        },
      });
    }

    for (const staffMember of team.staff) {
      const existing = await prisma.staffContract.findFirst({
        where: {
          staffId: staffMember.id,
          teamId: team.id,
          status: "ACTIVE",
        },
        select: { id: true },
      });
      if (existing) continue;

      await prisma.staffContract.create({
        data: {
          staffId: staffMember.id,
          teamId: team.id,
          role: staffMember.role,
          annualSalary: staffMember.salary,
          bonusObjectives: {
            completionBackfill: true,
            podium: Math.round(staffMember.salary * 0.06),
            development: Math.round(staffMember.salary * 0.04),
          },
          startDate,
          endDate,
        },
      });
    }
  }
}

async function createStaff(
  category: CategoryRecord,
  teamId: string | null,
  seed: number,
  source: { url: string; confidence: number },
  staffKeys: Set<string>,
) : Promise<boolean> {
  let attemptSeed = seed;
  let name = `${firstNames[(attemptSeed + 5) % firstNames.length]} ${lastNames[(attemptSeed * 5 + 7) % lastNames.length]}`;
  let role = staffRoles[attemptSeed % staffRoles.length];
  let key = `${canonicalKey(name)}:${role}`;
  let attempts = 0;
  while (staffKeys.has(key) && attempts < 50) {
    attemptSeed += 89;
    name = `${firstNames[(attemptSeed + 5) % firstNames.length]} ${lastNames[(attemptSeed * 5 + 7) % lastNames.length]}`;
    role = staffRoles[attemptSeed % staffRoles.length];
    key = `${canonicalKey(name)}:${role}`;
    attempts += 1;
  }
  if (staffKeys.has(key)) return false;
  staffKeys.add(key);

  const reputation = clamp(50 + category.tier * 8 + (attemptSeed % 10), 45, 94);
  await prisma.staff.create({
    data: {
      name,
      role,
      countryCode: countryPool[(attemptSeed + 4) % countryPool.length],
      reputation,
      salary: 120_000 + category.tier * 310_000 + reputation * 6_000,
      specialty: ["Setup correlation", "Race execution", "Talent systems", "Operations", "Vehicle dynamics"][attemptSeed % 5],
      compatibility: { categories: [category.code], discipline: category.discipline },
      personality: ["Methodical", "Demanding", "Collaborative", "Calm", "Innovative"][attemptSeed % 5],
      attributes: staffAttributes(reputation, attemptSeed),
      sourceUrl: source.url,
      sourceConfidence: Math.max(45, source.confidence - 11),
      lastVerifiedAt: verifiedAt,
      currentTeamId: teamId,
      currentCategoryId: category.id,
    },
  });
  return true;
}

async function ensureCalendar(
  category: CategoryRecord,
  minRounds: number,
  source: { url: string; confidence: number },
) {
  const currentSeason = await prisma.season.findUnique({
    where: { categoryId_year: { categoryId: category.id, year: 2026 } },
  });
  if (!currentSeason) return;

  const existing = await prisma.calendarEvent.findMany({
    where: { seasonId: currentSeason.id },
    orderBy: { round: "asc" },
  });
  const template = calendarTemplates[categoryCalendarFamily[category.code] ?? "OPEN_WHEEL"];
  const fullTemplate = [...template, ...supplementalCircuits];
  const existingRounds = new Set(existing.map((event) => event.round));
  const existingCircuits = new Set(existing.map((event) => canonicalKey(event.circuitName)));
  let round = existing.length > 0 ? Math.max(...existing.map((event) => event.round)) + 1 : 1;

  for (let index = 0; index < fullTemplate.length && existingCircuits.size < minRounds; index += 1) {
    const event = fullTemplate[index % fullTemplate.length];
    while (existingRounds.has(round)) round += 1;
    if (existingCircuits.has(canonicalKey(event.circuit))) {
      continue;
    }
    const startDate = new Date(Date.UTC(2026, Math.min(10, 1 + index), 8 + (index % 18)));
    const endDate = new Date(startDate);
    endDate.setUTCDate(startDate.getUTCDate() + (category.discipline === "ENDURANCE" ? 3 : 2));

    await prisma.calendarEvent.create({
      data: {
        categoryId: category.id,
        seasonId: currentSeason.id,
        round,
        name: `${event.name} ${category.name}`,
        circuitName: event.circuit,
        countryCode: event.countryCode,
        startDate,
        endDate,
        trackType: event.trackType,
        weatherProfile: "MIXED_SEASONAL",
        ruleSetCode: category.defaultRuleSetCode,
        sourceUrl: source.url,
        sourceConfidence: source.confidence,
        lastVerifiedAt: verifiedAt,
        metadata: { completionBackfill: true, circuitTemplate: event.name },
      },
    });
    existingRounds.add(round);
    existingCircuits.add(canonicalKey(event.circuit));
    round += 1;
  }
}

async function ensureStandings(category: CategoryRecord) {
  const seasons = await prisma.season.findMany({ where: { categoryId: category.id } });
  const teams = await prisma.team.findMany({
    where: { categoryId: category.id },
    include: { drivers: true },
  });

  for (const season of seasons) {
    for (const team of teams) {
      const teamStanding = await prisma.standingsTeam.findFirst({
        where: { seasonId: season.id, categoryId: category.id, teamId: team.id },
        select: { id: true },
      });
      if (!teamStanding) {
        await prisma.standingsTeam.create({
          data: {
            seasonId: season.id,
            categoryId: category.id,
            teamId: team.id,
            points: season.year < 2026 ? Math.max(8, team.reputation * 3 - 120) : 0,
            wins: season.year < 2026 && team.reputation > 78 ? 1 : 0,
            podiums: season.year < 2026 ? Math.max(0, Math.floor((team.reputation - 58) / 8)) : 0,
          },
        });
      }

      for (const driver of team.drivers) {
        const driverStanding = await prisma.standingsDriver.findFirst({
          where: { seasonId: season.id, categoryId: category.id, driverId: driver.id },
          select: { id: true },
        });
        if (!driverStanding) {
          await prisma.standingsDriver.create({
            data: {
              seasonId: season.id,
              categoryId: category.id,
              driverId: driver.id,
              points: season.year < 2026 ? Math.max(0, driver.overall * 2 - 110) : 0,
              wins: season.year < 2026 && driver.overall > 82 ? 1 : 0,
              podiums: season.year < 2026 ? Math.max(0, Math.floor((driver.overall - 64) / 7)) : 0,
              poles: season.year < 2026 && driver.overall > 85 ? 1 : 0,
            },
          });
        }
      }
    }
  }
}

async function auditCategory(category: CategoryRecord) {
  const currentSeason = await prisma.season.findUnique({
    where: { categoryId_year: { categoryId: category.id, year: 2026 } },
  });
  const [teams, drivers, staff, events, linkedDrivers, linkedStaff, prospects] = await Promise.all([
    prisma.team.count({ where: { categoryId: category.id } }),
    prisma.driver.count({ where: { currentCategoryId: category.id } }),
    prisma.staff.count({ where: { currentCategoryId: category.id } }),
    prisma.calendarEvent.findMany({
      where: { categoryId: category.id, seasonId: currentSeason?.id },
      select: { circuitName: true },
    }),
    prisma.driver.count({ where: { currentCategoryId: category.id, currentTeam: { categoryId: category.id } } }),
    prisma.staff.count({ where: { currentCategoryId: category.id, currentTeam: { categoryId: category.id } } }),
    prisma.driver.count({
      where: {
        currentCategoryId: category.id,
        birthDate: { gte: new Date(Date.UTC(2003, 0, 1)) },
        potential: { gte: 76 },
      },
    }),
  ]);

  return evaluateChampionshipCompleteness({
    tier: category.tier,
    teams,
    drivers,
    staff,
    rounds: events.length,
    circuits: new Set(events.map((event) => canonicalKey(event.circuitName))).size,
    prospects,
    linkedDrivers,
    linkedStaff,
  });
}

function nextTeamName(category: CategoryRecord, index: number) {
  const bank = teamBanks[category.code];
  if (bank?.[index]) return bank[index];
  const prefix = genericTeamPrefixes[(index + category.code.length) % genericTeamPrefixes.length];
  const suffix = category.name.replace(/\b(Championship|Series|Cup|World|Regional|National|Formula)\b/gi, "").trim();
  return `${prefix} ${suffix || category.code.replaceAll("_", " ")}`;
}

function canonicalKey(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function uniqueSlug(value: string, used: Set<string>) {
  const base = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 78);
  let slug = base || "team";
  let counter = 2;
  while (used.has(slug)) {
    slug = `${base}-${counter}`;
    counter += 1;
  }
  return slug;
}

function shortName(name: string) {
  const words = name.replace(/\b(Team|Racing|Motorsport|Motorsports|Formula|Championship)\b/g, "").trim().split(/\s+/);
  return words.slice(0, 2).join(" ").slice(0, 18) || name.slice(0, 18);
}

function headquartersFor(category: CategoryRecord, index: number) {
  const cities = ["Sao Paulo", "Indianapolis", "Silverstone", "Maranello", "Munich", "Tokyo", "Charlotte", "Barcelona"];
  return `${cities[(index + category.tier) % cities.length]}, ${countryPool[(index + category.code.length) % countryPool.length]}`;
}

function philosophyFor(category: CategoryRecord, index: number) {
  const base = ["Talent-first development", "Race execution and consistency", "Technical acceleration", "Commercial growth"];
  return `${base[index % base.length]} for ${category.name}.`;
}

function manufacturerFor(category: CategoryRecord, index: number) {
  const makers = ["Ford", "Chevrolet", "Toyota", "Honda", "Ferrari", "Mercedes", "Porsche", "BMW", "Cadillac", "Renault"];
  return makers[(index + category.tier) % makers.length];
}

function colorFor(index: number, offset: number) {
  const palette = ["#f43f5e", "#22d3ee", "#f59e0b", "#10b981", "#60a5fa", "#e879f9", "#f97316", "#a3e635"];
  return palette[(index + offset) % palette.length];
}

function driverAttributes(overall: number, seed: number, tier: number) {
  const value = (offset: number) => clamp(overall - 5 + ((seed + offset) % 12) + tier, 45, 97);
  return {
    purePace: value(1),
    consistency: value(2),
    qualifying: value(3),
    starts: value(4),
    defending: value(5),
    overtaking: value(6),
    aggression: value(7),
    emotionalControl: value(8),
    wetWeather: value(9),
    technicalFeedback: value(10),
    tireManagement: value(11),
    fuelSaving: value(12),
    strategicIntelligence: value(13),
    trafficAdaptation: value(14),
    ovalAdaptation: value(15),
    streetAdaptation: value(16),
    roadAdaptation: value(17),
    enduranceAdaptation: value(18),
  };
}

function staffAttributes(reputation: number, seed: number) {
  const value = (offset: number) => clamp(reputation - 4 + ((seed + offset) % 11), 42, 98);
  return {
    leadership: value(1),
    technical: value(2),
    strategy: value(3),
    communication: value(4),
    scouting: value(5),
    operations: value(6),
    morale: value(7),
  };
}

function birthYear(date: Date) {
  return date.getUTCFullYear();
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
