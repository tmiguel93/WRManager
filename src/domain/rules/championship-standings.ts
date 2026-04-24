interface DriverStandingInput {
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

interface TeamStandingInput {
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

interface ManufacturerStandingInput {
  manufacturerName: string;
  points: number;
  wins: number;
}

export function rankDriverStandings(rows: DriverStandingInput[]) {
  return [...rows]
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (b.podiums !== a.podiums) return b.podiums - a.podiums;
      return b.poles - a.poles;
    })
    .map((row, index) => ({
      ...row,
      position: index + 1,
    }));
}

export function rankTeamStandings(rows: TeamStandingInput[]) {
  return [...rows]
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.wins !== a.wins) return b.wins - a.wins;
      return b.podiums - a.podiums;
    })
    .map((row, index) => ({
      ...row,
      position: index + 1,
    }));
}

export function rankManufacturerStandings(rows: ManufacturerStandingInput[]) {
  return [...rows]
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return b.wins - a.wins;
    })
    .map((row, index) => ({
      ...row,
      position: index + 1,
    }));
}
