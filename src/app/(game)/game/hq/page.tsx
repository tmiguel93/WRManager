import { Activity, BriefcaseBusiness, CarFront, Wallet } from "lucide-react";

import { EntityAvatar } from "@/components/common/entity-avatar";
import { KpiCard } from "@/components/common/kpi-card";
import { PageHeader } from "@/components/common/page-header";
import { CountryFlag } from "@/components/common/country-flag";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCompactMoney } from "@/lib/format";
import { getActiveCareerContext } from "@/server/queries/career";
import { getDashboardSnapshot } from "@/server/queries/dashboard";

export default async function HqPage() {
  const [snapshot, activeCareer] = await Promise.all([
    getDashboardSnapshot().catch(() => ({
      teams: [],
      drivers: [],
      nextEvent: null,
      supplierContracts: [],
    })),
    getActiveCareerContext(),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Race Command"
        title="Dashboard HQ"
        description={`Central de decisão da carreira ${activeCareer.careerName} com visão financeira, técnica e esportiva em tempo real.`}
        badge={`${activeCareer.categoryCode} • ${activeCareer.teamName}`}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Cash Flow" value={formatCompactMoney(42_500_000)} delta={8.4} icon={<Wallet className="size-4" />} />
        <KpiCard label="Competitive Index" value="82/100" delta={3.2} icon={<Activity className="size-4" />} />
        <KpiCard label="Supplier Strength" value="A-" delta={2.1} icon={<BriefcaseBusiness className="size-4" />} />
        <KpiCard label="Car Package" value="P3 Potential" delta={1.7} icon={<CarFront className="size-4" />} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.3fr_1fr]">
        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl">Top Drivers by Overall</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {snapshot.drivers.map((driver, index) => (
              <div
                key={driver.id}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="w-5 text-xs text-muted-foreground">{index + 1}</span>
                  <EntityAvatar
                    entityType="DRIVER"
                    name={driver.displayName}
                    countryCode={driver.countryCode}
                    imageUrl={driver.imageUrl}
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">{driver.displayName}</p>
                    <p className="text-xs text-muted-foreground">{driver.currentTeam?.name ?? "Free Agent"}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-cyan-100">{driver.overall}</p>
                  <p className="text-xs text-muted-foreground">POT {driver.potential}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl">Next Race Weekend</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {snapshot.nextEvent ? (
              <div className="space-y-3 rounded-2xl border border-cyan-300/20 bg-cyan-500/10 p-4">
                <Badge className="rounded-full border border-cyan-300/40 bg-cyan-300/10 text-cyan-100">
                  Round {snapshot.nextEvent.round} • {snapshot.nextEvent.category.code}
                </Badge>
                <p className="font-heading text-lg text-foreground">{snapshot.nextEvent.name}</p>
                <p className="text-sm text-muted-foreground">{snapshot.nextEvent.circuitName}</p>
                <div className="flex items-center gap-2 text-sm">
                  <CountryFlag countryCode={snapshot.nextEvent.countryCode} className="h-4 w-6" />
                  <span className="text-muted-foreground">
                    {snapshot.nextEvent.startDate.toLocaleDateString("en-US")}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No scheduled event loaded.</p>
            )}

            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">High-cost contracts</p>
              {snapshot.supplierContracts.map((contract) => (
                <div key={contract.id} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                  <p className="text-sm font-medium">{contract.team.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {contract.supplier.name} • {formatCompactMoney(contract.annualCost)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {snapshot.teams.map((team) => (
          <Card key={team.id} className="premium-card">
            <CardContent className="flex items-center justify-between p-4">
              <div className="space-y-1">
                <p className="text-sm font-semibold">{team.name}</p>
                <p className="text-xs text-muted-foreground">
                  {team.category.code} • Reputation {team.reputation}
                </p>
              </div>
              <div className="text-right">
                <CountryFlag countryCode={team.countryCode} className="ml-auto h-4 w-6" />
                <p className="mt-2 text-xs text-muted-foreground">{formatCompactMoney(team.budget)}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
