export const realTeamsSeed = [
  ["F1", "Red Bull Racing", "RBR", "AT", "Milton Keynes", 240_000_000, 93, "#1e40af", "#dc2626"],
  ["F1", "Scuderia Ferrari", "FER", "IT", "Maranello", 235_000_000, 92, "#dc2626", "#f59e0b"],
  ["F1", "Mercedes-AMG Petronas", "MER", "DE", "Brackley", 228_000_000, 90, "#06b6d4", "#94a3b8"],
  ["F1", "McLaren Formula 1 Team", "MCL", "GB", "Woking", 220_000_000, 89, "#f97316", "#60a5fa"],
  ["F2", "PREMA Racing", "PRM", "IT", "Vicenza", 58_000_000, 72, "#ef4444", "#f8fafc"],
  ["F2", "ART Grand Prix", "ART", "FR", "Villeneuve-la-Guyard", 56_000_000, 70, "#1d4ed8", "#f8fafc"],
  ["INDYCAR", "Team Penske IndyCar", "PEN", "US", "Mooresville", 112_000_000, 84, "#f8fafc", "#1f2937"],
  ["INDYCAR", "Chip Ganassi Racing", "CGR", "US", "Indianapolis", 108_000_000, 83, "#ef4444", "#f8fafc"],
  ["NASCAR_CUP", "Hendrick Motorsports", "HMS", "US", "Concord", 122_000_000, 86, "#1d4ed8", "#f8fafc"],
  ["NASCAR_CUP", "Team Penske NASCAR", "TPN", "US", "Mooresville", 118_000_000, 85, "#f8fafc", "#ef4444"],
  ["NASCAR_XFINITY", "JR Motorsports", "JRM", "US", "Mooresville", 70_000_000, 76, "#1d4ed8", "#f8fafc"],
  ["NASCAR_XFINITY", "Joe Gibbs Racing Xfinity", "JGX", "US", "Huntersville", 68_000_000, 74, "#ef4444", "#f8fafc"],
  ["NASCAR_TRUCK", "ThorSport Racing", "TSR", "US", "Sandusky", 52_000_000, 67, "#facc15", "#1f2937"],
  ["NASCAR_TRUCK", "Front Row Motorsports Truck", "FRM", "US", "Mooresville", 49_000_000, 65, "#60a5fa", "#f8fafc"],
  ["WEC_HYPERCAR", "Toyota Gazoo Racing Hypercar", "TGR", "JP", "Cologne", 176_000_000, 88, "#ef4444", "#f8fafc"],
  ["WEC_HYPERCAR", "Ferrari AF Corse Hypercar", "AFC", "IT", "Piacenza", 172_000_000, 87, "#dc2626", "#f8fafc"],
  ["LMGT3", "Team WRT LMGT3", "WRT", "BE", "Bierset", 84_000_000, 76, "#2563eb", "#f8fafc"],
  ["LMGT3", "Iron Dames LMGT3", "IRD", "IT", "Maranello", 79_000_000, 74, "#f472b6", "#f8fafc"],
] as const;

export interface RealDriverSeed {
  firstName: string;
  lastName: string;
  displayName: string;
  countryCode: string;
  birthDateIso: string;
  categoryCode: string;
  teamName: string | null;
  overall: number;
  potential: number;
  reputation: number;
  marketValue: number;
  salary: number;
  morale: number;
  personality: string;
  primaryTraitCode: string;
  portraitSlug: string;
  wikipediaTitle: string;
}

export const realDriverSeeds: RealDriverSeed[] = [
  { firstName: "Max", lastName: "Verstappen", displayName: "Max Verstappen", countryCode: "NL", birthDateIso: "1997-09-30", categoryCode: "F1", teamName: "Red Bull Racing", overall: 96, potential: 98, reputation: 97, marketValue: 92_000_000, salary: 45_000_000, morale: 88, personality: "Aggressive", primaryTraitCode: "AGGRESSIVE_CLOSER", portraitSlug: "max-verstappen", wikipediaTitle: "Max Verstappen" },
  { firstName: "Sergio", lastName: "Perez", displayName: "Sergio Perez", countryCode: "MX", birthDateIso: "1990-01-26", categoryCode: "F1", teamName: "Red Bull Racing", overall: 86, potential: 88, reputation: 90, marketValue: 36_000_000, salary: 18_000_000, morale: 76, personality: "Calm", primaryTraitCode: "TIRE_WHISPERER", portraitSlug: "sergio-perez", wikipediaTitle: "Sergio Perez" },
  { firstName: "Charles", lastName: "Leclerc", displayName: "Charles Leclerc", countryCode: "MC", birthDateIso: "1997-10-16", categoryCode: "F1", teamName: "Scuderia Ferrari", overall: 93, potential: 96, reputation: 94, marketValue: 78_000_000, salary: 32_000_000, morale: 85, personality: "Analytical", primaryTraitCode: "QUALI_BEAST", portraitSlug: "charles-leclerc", wikipediaTitle: "Charles Leclerc" },
  { firstName: "Lewis", lastName: "Hamilton", displayName: "Lewis Hamilton", countryCode: "GB", birthDateIso: "1985-01-07", categoryCode: "F1", teamName: "Scuderia Ferrari", overall: 92, potential: 93, reputation: 99, marketValue: 65_000_000, salary: 55_000_000, morale: 84, personality: "Leader", primaryTraitCode: "CALM_UNDER_PRESSURE", portraitSlug: "lewis-hamilton", wikipediaTitle: "Lewis Hamilton" },
  { firstName: "George", lastName: "Russell", displayName: "George Russell", countryCode: "GB", birthDateIso: "1998-02-15", categoryCode: "F1", teamName: "Mercedes-AMG Petronas", overall: 90, potential: 94, reputation: 90, marketValue: 59_000_000, salary: 24_000_000, morale: 82, personality: "Analytical", primaryTraitCode: "TEAM_LEADER", portraitSlug: "george-russell", wikipediaTitle: "George Russell (racing driver)" },
  { firstName: "Andrea Kimi", lastName: "Antonelli", displayName: "Kimi Antonelli", countryCode: "IT", birthDateIso: "2006-08-25", categoryCode: "F1", teamName: "Mercedes-AMG Petronas", overall: 82, potential: 96, reputation: 76, marketValue: 28_000_000, salary: 9_000_000, morale: 79, personality: "Rookie", primaryTraitCode: "TECHNICAL_GENIUS", portraitSlug: "kimi-antonelli", wikipediaTitle: "Andrea Kimi Antonelli" },
  { firstName: "Lando", lastName: "Norris", displayName: "Lando Norris", countryCode: "GB", birthDateIso: "1999-11-13", categoryCode: "F1", teamName: "McLaren Formula 1 Team", overall: 92, potential: 95, reputation: 92, marketValue: 71_000_000, salary: 28_000_000, morale: 87, personality: "Calm", primaryTraitCode: "QUALI_BEAST", portraitSlug: "lando-norris", wikipediaTitle: "Lando Norris" },
  { firstName: "Oscar", lastName: "Piastri", displayName: "Oscar Piastri", countryCode: "AU", birthDateIso: "2001-04-06", categoryCode: "F1", teamName: "McLaren Formula 1 Team", overall: 89, potential: 95, reputation: 86, marketValue: 54_000_000, salary: 19_000_000, morale: 84, personality: "Analytical", primaryTraitCode: "CALM_UNDER_PRESSURE", portraitSlug: "oscar-piastri", wikipediaTitle: "Oscar Piastri" },

  { firstName: "Oliver", lastName: "Bearman", displayName: "Oliver Bearman", countryCode: "GB", birthDateIso: "2005-05-08", categoryCode: "F2", teamName: "PREMA Racing", overall: 81, potential: 93, reputation: 78, marketValue: 18_000_000, salary: 3_400_000, morale: 80, personality: "Rookie", primaryTraitCode: "AGGRESSIVE_CLOSER", portraitSlug: "oliver-bearman", wikipediaTitle: "Oliver Bearman" },
  { firstName: "Gabriele", lastName: "Mini", displayName: "Gabriele Mini", countryCode: "IT", birthDateIso: "2005-03-20", categoryCode: "F2", teamName: "PREMA Racing", overall: 78, potential: 90, reputation: 72, marketValue: 12_000_000, salary: 2_100_000, morale: 75, personality: "Rookie", primaryTraitCode: "QUALI_BEAST", portraitSlug: "gabriele-mini", wikipediaTitle: "Gabriele Mini" },
  { firstName: "Victor", lastName: "Martins", displayName: "Victor Martins", countryCode: "FR", birthDateIso: "2001-06-16", categoryCode: "F2", teamName: "ART Grand Prix", overall: 80, potential: 89, reputation: 74, marketValue: 14_000_000, salary: 2_400_000, morale: 77, personality: "Aggressive", primaryTraitCode: "QUALI_BEAST", portraitSlug: "victor-martins", wikipediaTitle: "Victor Martins" },
  { firstName: "Theo", lastName: "Pourchaire", displayName: "Theo Pourchaire", countryCode: "FR", birthDateIso: "2003-08-20", categoryCode: "F2", teamName: "ART Grand Prix", overall: 82, potential: 90, reputation: 79, marketValue: 17_000_000, salary: 3_100_000, morale: 78, personality: "Analytical", primaryTraitCode: "TEAM_LEADER", portraitSlug: "theo-pourchaire", wikipediaTitle: "Theo Pourchaire" },

  { firstName: "Josef", lastName: "Newgarden", displayName: "Josef Newgarden", countryCode: "US", birthDateIso: "1990-12-22", categoryCode: "INDYCAR", teamName: "Team Penske IndyCar", overall: 90, potential: 91, reputation: 91, marketValue: 36_000_000, salary: 12_000_000, morale: 84, personality: "Aggressive", primaryTraitCode: "OVAL_SPECIALIST", portraitSlug: "josef-newgarden", wikipediaTitle: "Josef Newgarden" },
  { firstName: "Will", lastName: "Power", displayName: "Will Power", countryCode: "AU", birthDateIso: "1981-03-01", categoryCode: "INDYCAR", teamName: "Team Penske IndyCar", overall: 87, potential: 88, reputation: 92, marketValue: 22_000_000, salary: 9_500_000, morale: 81, personality: "Calm", primaryTraitCode: "QUALI_BEAST", portraitSlug: "will-power", wikipediaTitle: "Will Power" },
  { firstName: "Alex", lastName: "Palou", displayName: "Alex Palou", countryCode: "ES", birthDateIso: "1997-04-01", categoryCode: "INDYCAR", teamName: "Chip Ganassi Racing", overall: 91, potential: 94, reputation: 90, marketValue: 39_000_000, salary: 13_000_000, morale: 86, personality: "Analytical", primaryTraitCode: "TEAM_LEADER", portraitSlug: "alex-palou", wikipediaTitle: "Alex Palou" },
  { firstName: "Scott", lastName: "Dixon", displayName: "Scott Dixon", countryCode: "NZ", birthDateIso: "1980-07-22", categoryCode: "INDYCAR", teamName: "Chip Ganassi Racing", overall: 88, potential: 89, reputation: 95, marketValue: 26_000_000, salary: 10_500_000, morale: 83, personality: "Calm", primaryTraitCode: "TIRE_WHISPERER", portraitSlug: "scott-dixon", wikipediaTitle: "Scott Dixon" },

  { firstName: "Kyle", lastName: "Larson", displayName: "Kyle Larson", countryCode: "US", birthDateIso: "1992-07-31", categoryCode: "NASCAR_CUP", teamName: "Hendrick Motorsports", overall: 91, potential: 92, reputation: 91, marketValue: 33_000_000, salary: 11_000_000, morale: 85, personality: "Aggressive", primaryTraitCode: "OVAL_SPECIALIST", portraitSlug: "kyle-larson", wikipediaTitle: "Kyle Larson" },
  { firstName: "Chase", lastName: "Elliott", displayName: "Chase Elliott", countryCode: "US", birthDateIso: "1995-11-28", categoryCode: "NASCAR_CUP", teamName: "Hendrick Motorsports", overall: 89, potential: 92, reputation: 90, marketValue: 28_000_000, salary: 9_000_000, morale: 82, personality: "Calm", primaryTraitCode: "CALM_UNDER_PRESSURE", portraitSlug: "chase-elliott", wikipediaTitle: "Chase Elliott" },
  { firstName: "Ryan", lastName: "Blaney", displayName: "Ryan Blaney", countryCode: "US", birthDateIso: "1993-12-31", categoryCode: "NASCAR_CUP", teamName: "Team Penske NASCAR", overall: 88, potential: 90, reputation: 86, marketValue: 26_000_000, salary: 8_000_000, morale: 82, personality: "Calm", primaryTraitCode: "OVAL_SPECIALIST", portraitSlug: "ryan-blaney", wikipediaTitle: "Ryan Blaney" },
  { firstName: "Joey", lastName: "Logano", displayName: "Joey Logano", countryCode: "US", birthDateIso: "1990-05-24", categoryCode: "NASCAR_CUP", teamName: "Team Penske NASCAR", overall: 89, potential: 90, reputation: 92, marketValue: 28_000_000, salary: 9_500_000, morale: 83, personality: "Leader", primaryTraitCode: "AGGRESSIVE_CLOSER", portraitSlug: "joey-logano", wikipediaTitle: "Joey Logano" },

  { firstName: "Justin", lastName: "Allgaier", displayName: "Justin Allgaier", countryCode: "US", birthDateIso: "1986-06-06", categoryCode: "NASCAR_XFINITY", teamName: "JR Motorsports", overall: 82, potential: 83, reputation: 80, marketValue: 10_500_000, salary: 3_700_000, morale: 79, personality: "Calm", primaryTraitCode: "OVAL_SPECIALIST", portraitSlug: "justin-allgaier", wikipediaTitle: "Justin Allgaier" },
  { firstName: "Sam", lastName: "Mayer", displayName: "Sam Mayer", countryCode: "US", birthDateIso: "2003-06-26", categoryCode: "NASCAR_XFINITY", teamName: "JR Motorsports", overall: 78, potential: 87, reputation: 70, marketValue: 8_000_000, salary: 2_600_000, morale: 76, personality: "Rookie", primaryTraitCode: "AGGRESSIVE_CLOSER", portraitSlug: "sam-mayer", wikipediaTitle: "Sam Mayer" },
  { firstName: "Brandon", lastName: "Jones", displayName: "Brandon Jones", countryCode: "US", birthDateIso: "1997-02-18", categoryCode: "NASCAR_XFINITY", teamName: "Joe Gibbs Racing Xfinity", overall: 77, potential: 83, reputation: 72, marketValue: 7_500_000, salary: 2_400_000, morale: 74, personality: "Calm", primaryTraitCode: "CALM_UNDER_PRESSURE", portraitSlug: "brandon-jones", wikipediaTitle: "Brandon Jones (racing driver)" },
  { firstName: "John Hunter", lastName: "Nemechek", displayName: "John Hunter Nemechek", countryCode: "US", birthDateIso: "1997-06-11", categoryCode: "NASCAR_XFINITY", teamName: "Joe Gibbs Racing Xfinity", overall: 80, potential: 87, reputation: 78, marketValue: 9_200_000, salary: 2_900_000, morale: 79, personality: "Aggressive", primaryTraitCode: "OVAL_SPECIALIST", portraitSlug: "john-hunter-nemechek", wikipediaTitle: "John Hunter Nemechek" },

  { firstName: "Matt", lastName: "Crafton", displayName: "Matt Crafton", countryCode: "US", birthDateIso: "1976-06-11", categoryCode: "NASCAR_TRUCK", teamName: "ThorSport Racing", overall: 80, potential: 82, reputation: 82, marketValue: 7_900_000, salary: 2_500_000, morale: 78, personality: "Calm", primaryTraitCode: "OVAL_SPECIALIST", portraitSlug: "matt-crafton", wikipediaTitle: "Matt Crafton" },
  { firstName: "Ty", lastName: "Majeski", displayName: "Ty Majeski", countryCode: "US", birthDateIso: "1994-08-25", categoryCode: "NASCAR_TRUCK", teamName: "ThorSport Racing", overall: 79, potential: 83, reputation: 74, marketValue: 7_100_000, salary: 2_200_000, morale: 77, personality: "Analytical", primaryTraitCode: "CALM_UNDER_PRESSURE", portraitSlug: "ty-majeski", wikipediaTitle: "Ty Majeski" },
  { firstName: "Layne", lastName: "Riggs", displayName: "Layne Riggs", countryCode: "US", birthDateIso: "2002-06-03", categoryCode: "NASCAR_TRUCK", teamName: "Front Row Motorsports Truck", overall: 76, potential: 87, reputation: 68, marketValue: 6_700_000, salary: 1_900_000, morale: 75, personality: "Rookie", primaryTraitCode: "AGGRESSIVE_CLOSER", portraitSlug: "layne-riggs", wikipediaTitle: "Layne Riggs" },
  { firstName: "Zane", lastName: "Smith", displayName: "Zane Smith", countryCode: "US", birthDateIso: "1999-06-09", categoryCode: "NASCAR_TRUCK", teamName: "Front Row Motorsports Truck", overall: 81, potential: 88, reputation: 78, marketValue: 9_800_000, salary: 3_100_000, morale: 79, personality: "Aggressive", primaryTraitCode: "OVAL_SPECIALIST", portraitSlug: "zane-smith", wikipediaTitle: "Zane Smith" },

  { firstName: "Kamui", lastName: "Kobayashi", displayName: "Kamui Kobayashi", countryCode: "JP", birthDateIso: "1986-09-13", categoryCode: "WEC_HYPERCAR", teamName: "Toyota Gazoo Racing Hypercar", overall: 87, potential: 88, reputation: 90, marketValue: 20_000_000, salary: 8_400_000, morale: 82, personality: "Leader", primaryTraitCode: "ENDURANCE_BRAIN", portraitSlug: "kamui-kobayashi", wikipediaTitle: "Kamui Kobayashi" },
  { firstName: "Mike", lastName: "Conway", displayName: "Mike Conway", countryCode: "GB", birthDateIso: "1983-08-19", categoryCode: "WEC_HYPERCAR", teamName: "Toyota Gazoo Racing Hypercar", overall: 85, potential: 86, reputation: 84, marketValue: 15_000_000, salary: 6_200_000, morale: 80, personality: "Calm", primaryTraitCode: "ENDURANCE_BRAIN", portraitSlug: "mike-conway", wikipediaTitle: "Mike Conway" },
  { firstName: "Antonio", lastName: "Fuoco", displayName: "Antonio Fuoco", countryCode: "IT", birthDateIso: "1996-05-20", categoryCode: "WEC_HYPERCAR", teamName: "Ferrari AF Corse Hypercar", overall: 84, potential: 88, reputation: 82, marketValue: 14_500_000, salary: 5_900_000, morale: 81, personality: "Analytical", primaryTraitCode: "ENDURANCE_BRAIN", portraitSlug: "antonio-fuoco", wikipediaTitle: "Antonio Fuoco" },
  { firstName: "Alessandro", lastName: "Pier Guidi", displayName: "Alessandro Pier Guidi", countryCode: "IT", birthDateIso: "1983-12-18", categoryCode: "WEC_HYPERCAR", teamName: "Ferrari AF Corse Hypercar", overall: 85, potential: 86, reputation: 85, marketValue: 14_800_000, salary: 6_000_000, morale: 80, personality: "Calm", primaryTraitCode: "ENDURANCE_BRAIN", portraitSlug: "alessandro-pier-guidi", wikipediaTitle: "Alessandro Pier Guidi" },

  { firstName: "Valentino", lastName: "Rossi", displayName: "Valentino Rossi", countryCode: "IT", birthDateIso: "1979-02-16", categoryCode: "LMGT3", teamName: "Team WRT LMGT3", overall: 82, potential: 84, reputation: 98, marketValue: 18_500_000, salary: 7_000_000, morale: 86, personality: "Leader", primaryTraitCode: "SPONSOR_MAGNET", portraitSlug: "valentino-rossi", wikipediaTitle: "Valentino Rossi" },
  { firstName: "Ahmad", lastName: "Al Harthy", displayName: "Ahmad Al Harthy", countryCode: "OM", birthDateIso: "1981-12-28", categoryCode: "LMGT3", teamName: "Team WRT LMGT3", overall: 76, potential: 78, reputation: 74, marketValue: 6_900_000, salary: 2_100_000, morale: 73, personality: "Calm", primaryTraitCode: "CALM_UNDER_PRESSURE", portraitSlug: "ahmad-al-harthy", wikipediaTitle: "Ahmad Al Harthy" },
  { firstName: "Rahel", lastName: "Frey", displayName: "Rahel Frey", countryCode: "CH", birthDateIso: "1986-02-23", categoryCode: "LMGT3", teamName: "Iron Dames LMGT3", overall: 79, potential: 81, reputation: 80, marketValue: 8_200_000, salary: 2_500_000, morale: 79, personality: "Leader", primaryTraitCode: "ENDURANCE_BRAIN", portraitSlug: "rahel-frey", wikipediaTitle: "Rahel Frey" },
  { firstName: "Michelle", lastName: "Gatting", displayName: "Michelle Gatting", countryCode: "DK", birthDateIso: "1993-12-18", categoryCode: "LMGT3", teamName: "Iron Dames LMGT3", overall: 78, potential: 83, reputation: 76, marketValue: 7_800_000, salary: 2_300_000, morale: 78, personality: "Aggressive", primaryTraitCode: "ENDURANCE_BRAIN", portraitSlug: "michelle-gatting", wikipediaTitle: "Michelle Gatting" },

  { firstName: "Mick", lastName: "Schumacher", displayName: "Mick Schumacher", countryCode: "DE", birthDateIso: "1999-03-22", categoryCode: "F1", teamName: null, overall: 79, potential: 88, reputation: 80, marketValue: 12_500_000, salary: 3_200_000, morale: 71, personality: "Analytical", primaryTraitCode: "TEAM_LEADER", portraitSlug: "mick-schumacher", wikipediaTitle: "Mick Schumacher" },
  { firstName: "Felipe", lastName: "Drugovich", displayName: "Felipe Drugovich", countryCode: "BR", birthDateIso: "2000-05-23", categoryCode: "F1", teamName: null, overall: 77, potential: 88, reputation: 73, marketValue: 10_000_000, salary: 2_700_000, morale: 74, personality: "Rookie", primaryTraitCode: "RAIN_MASTER", portraitSlug: "felipe-drugovich", wikipediaTitle: "Felipe Drugovich" },
  { firstName: "Robert", lastName: "Shwartzman", displayName: "Robert Shwartzman", countryCode: "IL", birthDateIso: "1999-09-16", categoryCode: "WEC_HYPERCAR", teamName: null, overall: 78, potential: 86, reputation: 75, marketValue: 9_300_000, salary: 2_900_000, morale: 73, personality: "Analytical", primaryTraitCode: "QUALI_BEAST", portraitSlug: "robert-shwartzman", wikipediaTitle: "Robert Shwartzman" },
  { firstName: "Colton", lastName: "Herta", displayName: "Colton Herta", countryCode: "US", birthDateIso: "2000-03-30", categoryCode: "INDYCAR", teamName: null, overall: 83, potential: 90, reputation: 81, marketValue: 15_500_000, salary: 4_500_000, morale: 77, personality: "Aggressive", primaryTraitCode: "AGGRESSIVE_CLOSER", portraitSlug: "colton-herta", wikipediaTitle: "Colton Herta" },
];

export interface RealStaffSeed {
  name: string;
  role: string;
  countryCode: string;
  specialty: string;
  teamName: string | null;
  categoryCode: string;
  reputation: number;
  salary: number;
  personality: string;
  portraitSlug: string;
  wikipediaTitle: string;
}

export const realStaffSeeds: RealStaffSeed[] = [
  { name: "Christian Horner", role: "Sporting Director", countryCode: "GB", specialty: "Leadership", teamName: "Red Bull Racing", categoryCode: "F1", reputation: 92, salary: 12_000_000, personality: "Driven", portraitSlug: "christian-horner", wikipediaTitle: "Christian Horner" },
  { name: "Frederic Vasseur", role: "Sporting Director", countryCode: "FR", specialty: "Operations", teamName: "Scuderia Ferrari", categoryCode: "F1", reputation: 88, salary: 10_500_000, personality: "Calm", portraitSlug: "frederic-vasseur", wikipediaTitle: "FrÃ©dÃ©ric Vasseur" },
  { name: "Toto Wolff", role: "Sporting Director", countryCode: "AT", specialty: "Leadership", teamName: "Mercedes-AMG Petronas", categoryCode: "F1", reputation: 94, salary: 13_500_000, personality: "Driven", portraitSlug: "toto-wolff", wikipediaTitle: "Toto Wolff" },
  { name: "Andrea Stella", role: "Head of Strategy", countryCode: "IT", specialty: "Strategy", teamName: "McLaren Formula 1 Team", categoryCode: "F1", reputation: 86, salary: 8_000_000, personality: "Analytical", portraitSlug: "andrea-stella", wikipediaTitle: "Andrea Stella (engineer)" },
  { name: "Helmut Marko", role: "Technical Director", countryCode: "AT", specialty: "Talent Program", teamName: "Red Bull Racing", categoryCode: "F1", reputation: 90, salary: 9_500_000, personality: "Driven", portraitSlug: "helmut-marko", wikipediaTitle: "Helmut Marko" },
  { name: "James Allison", role: "Technical Director", countryCode: "GB", specialty: "Aero", teamName: "Mercedes-AMG Petronas", categoryCode: "F1", reputation: 91, salary: 11_200_000, personality: "Analytical", portraitSlug: "james-allison", wikipediaTitle: "James Allison (motorsport)" },
  { name: "Zak Brown", role: "Sporting Director", countryCode: "US", specialty: "Commercial", teamName: "McLaren Formula 1 Team", categoryCode: "F1", reputation: 87, salary: 9_200_000, personality: "Leader", portraitSlug: "zak-brown", wikipediaTitle: "Zak Brown" },
  { name: "Oliver Oakes", role: "Academy Director", countryCode: "GB", specialty: "Driver Development", teamName: "PREMA Racing", categoryCode: "F2", reputation: 82, salary: 3_900_000, personality: "Driven", portraitSlug: "oliver-oakes", wikipediaTitle: "Oliver Oakes" },
  { name: "Jean Todt", role: "Sporting Director", countryCode: "FR", specialty: "Operations", teamName: "ART Grand Prix", categoryCode: "F2", reputation: 89, salary: 4_600_000, personality: "Calm", portraitSlug: "jean-todt", wikipediaTitle: "Jean Todt" },
  { name: "Roger Penske", role: "Sporting Director", countryCode: "US", specialty: "Leadership", teamName: "Team Penske IndyCar", categoryCode: "INDYCAR", reputation: 93, salary: 10_000_000, personality: "Leader", portraitSlug: "roger-penske", wikipediaTitle: "Roger Penske" },
  { name: "Chip Ganassi", role: "Sporting Director", countryCode: "US", specialty: "Race Execution", teamName: "Chip Ganassi Racing", categoryCode: "INDYCAR", reputation: 89, salary: 8_300_000, personality: "Driven", portraitSlug: "chip-ganassi", wikipediaTitle: "Chip Ganassi" },
  { name: "Rick Hendrick", role: "Sporting Director", countryCode: "US", specialty: "Organization", teamName: "Hendrick Motorsports", categoryCode: "NASCAR_CUP", reputation: 90, salary: 7_800_000, personality: "Leader", portraitSlug: "rick-hendrick", wikipediaTitle: "Rick Hendrick" },
  { name: "Brad Keselowski", role: "Head of Strategy", countryCode: "US", specialty: "Pit Wall", teamName: "Team Penske NASCAR", categoryCode: "NASCAR_CUP", reputation: 84, salary: 5_100_000, personality: "Analytical", portraitSlug: "brad-keselowski", wikipediaTitle: "Brad Keselowski" },
  { name: "Kelley Earnhardt Miller", role: "Sporting Director", countryCode: "US", specialty: "Operations", teamName: "JR Motorsports", categoryCode: "NASCAR_XFINITY", reputation: 82, salary: 4_200_000, personality: "Leader", portraitSlug: "kelley-earnhardt-miller", wikipediaTitle: "Kelley Earnhardt Miller" },
  { name: "Joe Gibbs", role: "Sporting Director", countryCode: "US", specialty: "Leadership", teamName: "Joe Gibbs Racing Xfinity", categoryCode: "NASCAR_XFINITY", reputation: 89, salary: 6_300_000, personality: "Driven", portraitSlug: "joe-gibbs", wikipediaTitle: "Joe Gibbs" },
  { name: "Tony Stewart", role: "Pit Crew Chief", countryCode: "US", specialty: "Pit Stops", teamName: "ThorSport Racing", categoryCode: "NASCAR_TRUCK", reputation: 86, salary: 4_600_000, personality: "Aggressive", portraitSlug: "tony-stewart", wikipediaTitle: "Tony Stewart" },
  { name: "Jim France", role: "Sporting Director", countryCode: "US", specialty: "Program Management", teamName: "Front Row Motorsports Truck", categoryCode: "NASCAR_TRUCK", reputation: 79, salary: 3_300_000, personality: "Leader", portraitSlug: "jim-france", wikipediaTitle: "Jim France" },
  { name: "Mattia Binotto", role: "Technical Director", countryCode: "IT", specialty: "Endurance Engineering", teamName: "Toyota Gazoo Racing Hypercar", categoryCode: "WEC_HYPERCAR", reputation: 86, salary: 6_100_000, personality: "Analytical", portraitSlug: "mattia-binotto", wikipediaTitle: "Mattia Binotto" },
  { name: "Andreas Seidl", role: "Sporting Director", countryCode: "DE", specialty: "Endurance Operations", teamName: "Ferrari AF Corse Hypercar", categoryCode: "WEC_HYPERCAR", reputation: 85, salary: 5_000_000, personality: "Driven", portraitSlug: "andreas-seidl", wikipediaTitle: "Andreas Seidl" },
  { name: "Tom Kristensen", role: "Sporting Director", countryCode: "DK", specialty: "GT Program", teamName: "Team WRT LMGT3", categoryCode: "LMGT3", reputation: 88, salary: 4_000_000, personality: "Calm", portraitSlug: "tom-kristensen", wikipediaTitle: "Tom Kristensen" },
  { name: "Susie Wolff", role: "Academy Director", countryCode: "GB", specialty: "Talent Program", teamName: "Iron Dames LMGT3", categoryCode: "LMGT3", reputation: 84, salary: 3_900_000, personality: "Leader", portraitSlug: "susie-wolff", wikipediaTitle: "Susie Wolff" },
  { name: "Adrian Newey", role: "Technical Director", countryCode: "GB", specialty: "Aero", teamName: null, categoryCode: "F1", reputation: 98, salary: 18_000_000, personality: "Analytical", portraitSlug: "adrian-newey", wikipediaTitle: "Adrian Newey" },
];

