import Link from "next/link";
import { Medal, Shield, Trophy } from "lucide-react";

import { CountryFlag } from "@/components/common/country-flag";
import { EntityAvatar } from "@/components/common/entity-avatar";
import { KpiCard } from "@/components/common/kpi-card";
import { PageHeader } from "@/components/common/page-header";
import { TeamLogoMark } from "@/components/common/team-logo-mark";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { getChampionshipStandingsView } from "@/server/queries/championship";

interface StandingsPageProps {
  searchParams: Promise<{ category?: string }>;
}

export default async function StandingsPage({ searchParams }: StandingsPageProps) {
  const { category } = await searchParams;
  const view = await getChampionshipStandingsView(category);

  if (!view) {
    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow="Competitive Map"
          title="Championship Standings"
          description="No standings data available for the current save context."
        />
      </div>
    );
  }

  const leaderDriver = view.drivers[0] ?? null;
  const leaderTeam = view.teams[0] ?? null;
  const leaderManufacturer = view.manufacturers[0] ?? null;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Competitive Map"
        title="Championship Standings"
        description="Live tables for drivers, teams and manufacturers with previous-season historical champions."
        badge={`${view.selectedCategory.code} · ${view.seasonYear}`}
      />

      <section className="flex flex-wrap gap-2">
        {view.categories.map((option) => {
          const isActive = option.code === view.selectedCategory.code;
          return (
            <Link
              key={option.code}
              href={`/game/standings?category=${option.code}`}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                isActive
                  ? "team-outline bg-white/10 team-accent-text"
                  : "border-white/15 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground",
              )}
            >
              {option.code}
            </Link>
          );
        })}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Season"
          value={`${view.seasonYear}`}
          delta={0}
          icon={<Trophy className="size-4" />}
        />
        <KpiCard
          label="Leader Points"
          value={`${leaderDriver?.points ?? 0}`}
          delta={(leaderDriver?.points ?? 0) - (view.drivers[1]?.points ?? 0)}
          icon={<Medal className="size-4" />}
        />
        <KpiCard
          label="Team Leader"
          value={leaderTeam ? `${leaderTeam.points} pts` : "N/A"}
          delta={(leaderTeam?.points ?? 0) - (view.teams[1]?.points ?? 0)}
          icon={<Shield className="size-4" />}
        />
        <KpiCard
          label="Manufacturer Leader"
          value={leaderManufacturer ? `${leaderManufacturer.points} pts` : "N/A"}
          delta={(leaderManufacturer?.points ?? 0) - (view.manufacturers[1]?.points ?? 0)}
          icon={<Trophy className="size-4" />}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl">Driver Championship</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Pos</TableHead>
                    <TableHead className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Driver</TableHead>
                    <TableHead className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Team</TableHead>
                    <TableHead className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Pts</TableHead>
                    <TableHead className="text-xs uppercase tracking-[0.14em] text-muted-foreground">W</TableHead>
                    <TableHead className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Pod</TableHead>
                    <TableHead className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Poles</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {view.drivers.map((row) => (
                    <TableRow key={row.driverId} className="border-white/10 hover:bg-white/5">
                      <TableCell className="font-semibold">{row.position}</TableCell>
                      <TableCell>
                        <Link href={`/game/drivers/${row.driverId}`} className="group flex items-center gap-2">
                          <EntityAvatar
                            entityType="DRIVER"
                            name={row.name}
                            countryCode={row.countryCode}
                            imageUrl={row.imageUrl}
                          />
                          <span className="text-sm group-hover:text-cyan-100">{row.name}</span>
                        </Link>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{row.teamName}</TableCell>
                      <TableCell className="font-semibold">{row.points}</TableCell>
                      <TableCell>{row.wins}</TableCell>
                      <TableCell>{row.podiums}</TableCell>
                      <TableCell>{row.poles}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl">Season History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {view.history ? (
              <>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    {view.history.seasonYear} · {view.history.status}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">Previous season champions</p>
                </div>
                <div className="rounded-2xl border border-amber-300/25 bg-amber-500/10 p-3">
                  <p className="text-xs text-amber-100/90">Driver Champion</p>
                  <p className="mt-1 text-sm font-semibold text-amber-100">
                    {view.history.topDriver ? `${view.history.topDriver.name} · ${view.history.topDriver.points} pts` : "N/A"}
                  </p>
                </div>
                <div className="rounded-2xl border border-cyan-300/25 bg-cyan-500/10 p-3">
                  <p className="text-xs text-cyan-100/90">Team Champion</p>
                  <p className="mt-1 text-sm font-semibold text-cyan-100">
                    {view.history.topTeam ? `${view.history.topTeam.name} · ${view.history.topTeam.points} pts` : "N/A"}
                  </p>
                </div>
                <div className="rounded-2xl border border-emerald-300/25 bg-emerald-500/10 p-3">
                  <p className="text-xs text-emerald-100/90">Manufacturer Champion</p>
                  <p className="mt-1 text-sm font-semibold text-emerald-100">
                    {view.history.topManufacturer
                      ? `${view.history.topManufacturer.manufacturerName} · ${view.history.topManufacturer.points} pts`
                      : "N/A"}
                  </p>
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-muted-foreground">
                Historical standings are not available yet for this category.
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl">Team Championship</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Pos</TableHead>
                    <TableHead className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Team</TableHead>
                    <TableHead className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Pts</TableHead>
                    <TableHead className="text-xs uppercase tracking-[0.14em] text-muted-foreground">W</TableHead>
                    <TableHead className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Pod</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {view.teams.map((row) => (
                    <TableRow
                      key={row.teamId}
                      className={cn(
                        "border-white/10 hover:bg-white/5",
                        row.isManagedTeam && "team-row-highlight",
                      )}
                    >
                      <TableCell className="font-semibold">{row.position}</TableCell>
                      <TableCell>
                        <Link href={`/game/teams/${row.teamId}`} className="inline-flex items-center gap-2">
                          <TeamLogoMark name={row.name} logoUrl={row.logoUrl} className="h-8 w-11 rounded-xl" />
                          <CountryFlag countryCode={row.countryCode} className="h-4 w-6" />
                          <div>
                            <span className="text-sm hover:text-cyan-100">{row.name}</span>
                            <div
                              className="mt-1 h-1 w-12 rounded-full"
                              style={{
                                background: `linear-gradient(90deg, ${row.primaryColor}, ${row.secondaryColor}, ${row.accentColor ?? row.secondaryColor})`,
                              }}
                            />
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell className="font-semibold">{row.points}</TableCell>
                      <TableCell>{row.wins}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{row.podiums}</span>
                          {row.isManagedTeam ? (
                            <Badge className="team-outline team-accent-text rounded-full border bg-white/10 text-[10px]">
                              Managed
                            </Badge>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl">Manufacturer Championship</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Pos</TableHead>
                    <TableHead className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Manufacturer</TableHead>
                    <TableHead className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Pts</TableHead>
                    <TableHead className="text-xs uppercase tracking-[0.14em] text-muted-foreground">W</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {view.manufacturers.map((row) => (
                    <TableRow key={row.manufacturerName} className="border-white/10 hover:bg-white/5">
                      <TableCell className="font-semibold">{row.position}</TableCell>
                      <TableCell className="text-sm">{row.manufacturerName}</TableCell>
                      <TableCell className="font-semibold">{row.points}</TableCell>
                      <TableCell>{row.wins}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
