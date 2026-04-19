import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { EntityAvatar } from "@/components/common/entity-avatar";
import { PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatMoney } from "@/lib/format";
import { getStaffDetail } from "@/server/queries/roster";

interface StaffDetailPageProps {
  params: Promise<{ staffId: string }>;
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

export default async function StaffDetailPage({ params }: StaffDetailPageProps) {
  const { staffId } = await params;
  const staff = await getStaffDetail(staffId);

  if (!staff) {
    notFound();
  }

  const attributes = toAttributeRows(staff.attributes);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          render={<Link href="/game/staff" className="border border-white/10 bg-white/5 hover:bg-white/10" />}
        >
          <ArrowLeft className="mr-1 size-3.5" />
          Back to Staff
        </Button>
      </div>

      <PageHeader
        eyebrow="Staff Detail"
        title={staff.name}
        description="Detailed operational profile with role fit, trait stack and contract timeline."
        badge={`${staff.currentCategory?.code ?? "OPEN"} - REP ${staff.reputation}`}
      />

      <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="premium-card">
          <CardContent className="pt-5">
            <div className="flex flex-wrap items-start gap-4">
              <EntityAvatar
                entityType="STAFF"
                name={staff.name}
                countryCode={staff.countryCode}
                imageUrl={staff.imageUrl}
                className="[&_.size-12]:size-20"
              />
              <div className="space-y-2">
                <p className="text-lg font-semibold">{staff.name}</p>
                <p className="text-sm text-muted-foreground">{staff.role}</p>
                <p className="text-sm text-muted-foreground">
                  {staff.currentTeam?.name ?? "Independent consultant"} - {staff.specialty}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge className="rounded-full border border-white/15 bg-white/10 text-xs">
                    Personality {staff.personality}
                  </Badge>
                  <Badge className="rounded-full border border-cyan-300/35 bg-cyan-500/10 text-cyan-100 text-xs">
                    Salary {formatMoney(staff.salary)}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl">Traits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {staff.traits.map((traitLink) => (
              <div key={traitLink.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <p className="text-sm font-medium">{traitLink.trait.name}</p>
                <p className="text-xs text-muted-foreground">{traitLink.trait.description}</p>
              </div>
            ))}
            {staff.traits.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-muted-foreground">
                No registered staff traits.
              </div>
            ) : null}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl">Operational Attributes</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {attributes.map((attribute) => (
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
            {staff.contracts.map((contract) => (
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
            {staff.contracts.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-muted-foreground">
                No contract history available.
              </div>
            ) : null}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
