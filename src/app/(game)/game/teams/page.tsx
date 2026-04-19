import { AssetImage } from "@/components/common/asset-image";
import { EntityAvatar } from "@/components/common/entity-avatar";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCompactMoney } from "@/lib/format";
import { getTeamsView } from "@/server/queries/world";

export default async function TeamsPage() {
  const teams = await getTeamsView().catch(() => []);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Constructors"
        title="Teams Registry"
        description="Estrutura pronta para equipes reais e customizadas, com placeholders premium e vínculo com categorias."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {teams.map((team) => (
          <Card key={team.id} className="premium-card overflow-hidden">
            <div className="relative h-28">
              <AssetImage entityType="TEAM" name={team.name} src={team.logoUrl} className="h-full rounded-none border-none" />
            </div>
            <CardHeader>
              <CardTitle className="font-heading text-xl">{team.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                {team.category.code} • Reputation {team.reputation}
              </p>
              <p className="text-sm text-muted-foreground">{team.headquarters}</p>
              <p className="text-sm font-medium text-foreground">{formatCompactMoney(team.budget)}</p>
              <div className="flex items-center gap-2">
                {team.drivers.map((driver) => (
                  <EntityAvatar
                    key={driver.id}
                    entityType="DRIVER"
                    name={driver.displayName}
                    countryCode={driver.countryCode}
                    imageUrl={driver.imageUrl}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
