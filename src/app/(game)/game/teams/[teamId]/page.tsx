import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { AssetImage } from "@/components/common/asset-image";
import { EntityAvatar } from "@/components/common/entity-avatar";
import { PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCompactMoney, formatMoney } from "@/lib/format";
import { getTeamDetail } from "@/server/queries/roster";

interface TeamDetailPageProps {
  params: Promise<{ teamId: string }>;
}

export default async function TeamDetailPage({ params }: TeamDetailPageProps) {
  const { teamId } = await params;
  const team = await getTeamDetail(teamId);

  if (!team) {
    notFound();
  }

  const latestCar = team.cars[0];

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          render={<Link href="/game/teams" className="border border-white/10 bg-white/5 hover:bg-white/10" />}
        >
          <ArrowLeft className="mr-1 size-3.5" />
          Back to Teams
        </Button>
      </div>

      <PageHeader
        eyebrow="Team Detail"
        title={team.name}
        description="Complete team dossier with active lineup, staff hierarchy, suppliers, sponsors and facilities."
        badge={`${team.category.code} - REP ${team.reputation}`}
      />

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="premium-card overflow-hidden">
          <div className="relative h-44">
            <AssetImage entityType="TEAM" name={team.name} src={team.logoUrl} className="h-full rounded-none border-none" />
          </div>
          <CardContent className="space-y-4 pt-5">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <p className="text-xs text-muted-foreground">Budget</p>
                <p className="text-lg font-semibold">{formatCompactMoney(team.budget)}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <p className="text-xs text-muted-foreground">Fanbase</p>
                <p className="text-lg font-semibold">{team.fanbase}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <p className="text-xs text-muted-foreground">Headquarters</p>
                <p className="text-sm font-semibold">{team.headquarters}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{team.history}</p>
          </CardContent>
        </Card>

        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl">Lineup Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {team.drivers.map((driver) => (
              <Link
                key={driver.id}
                href={`/game/drivers/${driver.id}`}
                className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 transition hover:bg-white/10"
              >
                <div className="flex items-center gap-3">
                  <EntityAvatar
                    entityType="DRIVER"
                    name={driver.displayName}
                    countryCode={driver.countryCode}
                    imageUrl={driver.imageUrl}
                  />
                  <div>
                    <p className="text-sm font-medium">{driver.displayName}</p>
                    <p className="text-xs text-muted-foreground">
                      {driver.contracts[0]?.role ?? "No active role"} - OVR {driver.overall}
                    </p>
                  </div>
                </div>
                <Badge className="rounded-full border border-cyan-300/35 bg-cyan-500/10 text-cyan-100 text-xs">
                  POT {driver.potential}
                </Badge>
              </Link>
            ))}
            {team.drivers.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-muted-foreground">
                No registered driver lineup.
              </div>
            ) : null}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl">Staff Hierarchy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {team.staff.map((member) => (
              <Link
                key={member.id}
                href={`/game/staff/${member.id}`}
                className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 transition hover:bg-white/10"
              >
                <div className="flex items-center gap-3">
                  <EntityAvatar
                    entityType="STAFF"
                    name={member.name}
                    countryCode={member.countryCode}
                    imageUrl={member.imageUrl}
                  />
                  <div>
                    <p className="text-sm font-medium">{member.name}</p>
                    <p className="text-xs text-muted-foreground">{member.role}</p>
                  </div>
                </div>
                <Badge className="rounded-full border border-white/15 bg-white/10 text-xs">REP {member.reputation}</Badge>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl">Active Contracts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {team.supplierContracts.map((contract) => (
              <div key={contract.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{contract.supplier.name}</p>
                  <Badge className="rounded-full border border-white/15 bg-white/10 text-xs">{contract.supplier.type}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Annual cost {formatCompactMoney(contract.annualCost)} - PERF {contract.supplier.performance}
                </p>
              </div>
            ))}
            {team.sponsorContracts.map((contract) => (
              <div key={contract.id} className="rounded-2xl border border-emerald-300/20 bg-emerald-500/10 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-emerald-100">{contract.sponsor.name}</p>
                  <Badge className="rounded-full border border-emerald-300/35 bg-emerald-500/15 text-emerald-100 text-xs">
                    Sponsor
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-emerald-100/80">
                  Fixed value {formatCompactMoney(contract.fixedValue)} - confidence {contract.confidence}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl">Facilities Snapshot</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {team.facilities.map((facility) => (
              <div key={facility.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span>{facility.facility.name}</span>
                  <span>L{facility.level}</span>
                </div>
                <Progress value={facility.condition} />
                <p className="mt-2 text-xs text-muted-foreground">{facility.facility.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl">Current Car</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {latestCar ? (
              <>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <p className="text-sm font-semibold">{latestCar.modelName}</p>
                  <p className="text-xs text-muted-foreground">Season {latestCar.seasonYear}</p>
                </div>
                <div className="grid gap-2 text-xs">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-2">Base performance: {latestCar.basePerformance}</div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-2">Reliability: {latestCar.reliability}</div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-2">Weight: {latestCar.weight}kg</div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-2">Downforce: {latestCar.downforce}</div>
                </div>
                <div className="space-y-2">
                  {latestCar.specs.map((spec) => (
                    <div key={spec.id} className="rounded-xl border border-white/10 bg-white/5 p-2 text-xs">
                      {spec.key}: {spec.value} {spec.unit}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-muted-foreground">
                No car specification data yet.
              </div>
            )}

            {team.teamHistories[0] ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-muted-foreground">
                Last season ({team.teamHistories[0].seasonYear}): {team.teamHistories[0].wins} wins,{" "}
                {team.teamHistories[0].podiums} podiums, {team.teamHistories[0].points} points.
              </div>
            ) : null}

            <div className="rounded-2xl border border-cyan-300/20 bg-cyan-500/10 p-3 text-xs text-cyan-100">
              Program philosophy: {team.philosophy}
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-muted-foreground">
              Annual payroll baseline: {formatMoney(team.drivers.reduce((total, driver) => total + driver.salary, 0))}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
