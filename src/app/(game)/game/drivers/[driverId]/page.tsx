import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Trophy } from "lucide-react";

import { EntityAvatar } from "@/components/common/entity-avatar";
import { PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatAge, formatCompactMoney, formatMoney } from "@/lib/format";
import { getDriverDetail } from "@/server/queries/roster";

interface DriverDetailPageProps {
  params: Promise<{ driverId: string }>;
}

function toAttributeRows(attributes: unknown) {
  if (!attributes || typeof attributes !== "object" || Array.isArray(attributes)) {
    return [];
  }

  return Object.entries(attributes)
    .filter((entry): entry is [string, number] => typeof entry[1] === "number")
    .map(([key, value]) => ({
      key,
      label: key
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (char) => char.toUpperCase()),
      value,
    }))
    .sort((a, b) => b.value - a.value);
}

export default async function DriverDetailPage({ params }: DriverDetailPageProps) {
  const { driverId } = await params;
  const driver = await getDriverDetail(driverId);

  if (!driver) {
    notFound();
  }

  const attributeRows = toAttributeRows(driver.attributes);
  const primaryTrait = driver.traits.find((trait) => trait.isPrimary)?.trait ?? driver.traits[0]?.trait;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          render={<Link href="/game/drivers" className="border border-white/10 bg-white/5 hover:bg-white/10" />}
        >
          <ArrowLeft className="mr-1 size-3.5" />
          Back to Drivers
        </Button>
      </div>

      <PageHeader
        eyebrow="Driver Detail"
        title={driver.displayName}
        description="Comprehensive profile with real-world identity, trait stack and active contract history."
        badge={`${driver.currentCategory?.code ?? "FREE AGENT"} - OVR ${driver.overall}`}
      />

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="premium-card">
          <CardContent className="pt-5">
            <div className="flex flex-wrap items-start gap-4">
              <EntityAvatar
                entityType="DRIVER"
                name={driver.displayName}
                countryCode={driver.countryCode}
                imageUrl={driver.imageUrl}
                className="[&_.size-12]:size-20"
              />
              <div className="space-y-2">
                <p className="text-lg font-semibold">{driver.displayName}</p>
                <p className="text-sm text-muted-foreground">
                  {driver.currentTeam?.name ?? "Free Agent"} - {driver.currentCategory?.name ?? "Open Market"}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge className="rounded-full border border-white/15 bg-white/10 text-xs">
                    Age {formatAge(driver.birthDate)}
                  </Badge>
                  <Badge className="rounded-full border border-cyan-300/35 bg-cyan-500/10 text-cyan-100 text-xs">
                    Potential {driver.potential}
                  </Badge>
                  <Badge className="rounded-full border border-emerald-300/35 bg-emerald-500/10 text-emerald-100 text-xs">
                    Morale {driver.morale}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <p className="text-xs text-muted-foreground">Market Value</p>
                <p className="text-lg font-semibold">{formatCompactMoney(driver.marketValue)}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <p className="text-xs text-muted-foreground">Base Salary</p>
                <p className="text-lg font-semibold">{formatCompactMoney(driver.salary)}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <p className="text-xs text-muted-foreground">Global Reputation</p>
                <p className="text-lg font-semibold">{driver.reputation}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl">Trait & Identity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-2xl border border-cyan-300/20 bg-cyan-500/10 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-cyan-100/80">Primary Trait</p>
              <p className="mt-1 text-sm font-semibold text-cyan-50">{primaryTrait?.name ?? "No primary trait"}</p>
              <p className="mt-1 text-xs text-cyan-100/70">{driver.personality}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {driver.traits.map((traitLink) => (
                <Badge
                  key={traitLink.id}
                  className="rounded-full border border-white/15 bg-white/10 text-xs text-foreground"
                >
                  {traitLink.trait.name}
                </Badge>
              ))}
              {driver.traits.length === 0 ? (
                <Badge className="rounded-full border border-white/15 bg-white/10 text-xs text-muted-foreground">
                  No registered traits
                </Badge>
              ) : null}
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-muted-foreground">
              Preferred disciplines: {Array.isArray(driver.preferredDisciplines) ? driver.preferredDisciplines.join(", ") : "N/A"}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl">Attribute Matrix</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {attributeRows.map((attribute) => (
              <div key={attribute.key} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span>{attribute.label}</span>
                  <span className="font-semibold">{attribute.value}</span>
                </div>
                <Progress value={attribute.value} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl">Contract Ledger</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {driver.contracts.map((contract) => (
              <div key={contract.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">{contract.team.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {contract.role} - {contract.team.category.code}
                    </p>
                  </div>
                  <Badge className="rounded-full border border-white/15 bg-white/10 text-xs">{contract.status}</Badge>
                </div>
                <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                  <p>Salary: {formatMoney(contract.annualSalary)}</p>
                  <p>
                    Term: {contract.startDate.toISOString().slice(0, 10)} to {contract.endDate.toISOString().slice(0, 10)}
                  </p>
                </div>
              </div>
            ))}
            {driver.contracts.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-muted-foreground">
                No active contract registered.
              </div>
            ) : null}
          </CardContent>
        </Card>
      </section>

      <Card className="premium-card">
        <CardHeader>
          <CardTitle className="font-heading text-xl">Scouting Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <p className="text-xs text-muted-foreground">Short-term impact</p>
            <p className="mt-1 text-lg font-semibold">{driver.overall >= 86 ? "Title-level" : "Development candidate"}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <p className="text-xs text-muted-foreground">Long-term ceiling</p>
            <p className="mt-1 text-lg font-semibold">{driver.potential >= 92 ? "Elite potential" : "Solid growth profile"}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <p className="text-xs text-muted-foreground">Commercial value</p>
            <p className="mt-1 flex items-center gap-2 text-lg font-semibold">
              <Trophy className="size-4 text-amber-300" />
              Reputation {driver.reputation}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
