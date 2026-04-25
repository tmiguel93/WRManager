import Link from "next/link";

import { AssetImage } from "@/components/common/asset-image";
import { EntityAvatar } from "@/components/common/entity-avatar";
import { PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getServerTranslator } from "@/i18n/server";
import { formatCompactMoney } from "@/lib/format";
import { getTeamsDirectory } from "@/server/queries/roster";

export default async function TeamsPage() {
  const { t } = await getServerTranslator();
  const teams = await getTeamsDirectory().catch(() => []);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={t("teams.eyebrow")}
        title={t("teams.title")}
        description={t("teams.description")}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {teams.map((team) => (
          <Card key={team.id} className="premium-card overflow-hidden">
            <div className="relative h-28">
              <AssetImage entityType="TEAM" name={team.name} src={team.logoUrl} className="h-full rounded-none border-none" />
            </div>
            <CardHeader className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <CardTitle className="font-heading text-xl">{team.name}</CardTitle>
                <Badge className="rounded-full border border-white/15 bg-white/10 text-xs">{team.category.code}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{team.headquarters}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl border border-white/10 bg-white/5 p-2">
                  <p className="text-muted-foreground">{t("common.budget")}</p>
                  <p className="font-semibold text-cyan-100">{formatCompactMoney(team.budget)}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-2">
                  <p className="text-muted-foreground">{t("common.reputation")}</p>
                  <p className="font-semibold">{team.reputation}</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{t("common.drivers")}</p>
                <div className="flex flex-wrap gap-2">
                  {team.drivers.slice(0, 3).map((driver) => (
                    <EntityAvatar
                      key={driver.id}
                      entityType="DRIVER"
                      name={driver.displayName}
                      countryCode={driver.countryCode}
                      imageUrl={driver.imageUrl}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{t("teams.staffLeads")}</p>
                <div className="space-y-1 text-xs text-muted-foreground">
                  {team.staff.map((member) => (
                    <p key={member.id}>
                      {member.role}: <span className="text-foreground">{member.name}</span>
                    </p>
                  ))}
                  {team.staff.length === 0 ? <p>{t("teams.staffPending")}</p> : null}
                </div>
              </div>

              <Link
                href={`/game/teams/${team.id}`}
                className="inline-flex w-full items-center justify-center rounded-xl border border-cyan-300/35 bg-cyan-500/10 px-3 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-500/20"
              >
                {t("teams.openDetail")}
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
