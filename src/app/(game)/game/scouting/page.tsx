import Link from "next/link";

import { EntityAvatar } from "@/components/common/entity-avatar";
import { PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { calculateScoutingScore } from "@/domain/rules/scouting-score";
import { formatAge, formatCompactMoney } from "@/lib/format";
import { getActiveCareerContext } from "@/server/queries/career";
import { getScoutingBoard } from "@/server/queries/roster";

export default async function ScoutingPage() {
  const activeCareer = await getActiveCareerContext();
  const board = await getScoutingBoard(activeCareer.categoryCode).catch(() => ({
    freeAgents: [],
    highPotential: [],
    roleGaps: [],
  }));

  const freeAgentBoard = board.freeAgents.map((driver) => ({
    ...driver,
    scoutingScore: calculateScoutingScore({
      overall: driver.overall,
      potential: driver.potential,
      reputation: driver.reputation,
      morale: driver.morale,
      age: formatAge(driver.birthDate),
      traitCodes: driver.traits.map((trait) => trait.trait.code),
      targetCategoryCode: activeCareer.categoryCode,
      currentCategoryCode: driver.currentCategory?.code,
    }),
  }));

  const breakoutTargets = board.highPotential.map((driver) => ({
    ...driver,
    scoutingScore: calculateScoutingScore({
      overall: driver.overall,
      potential: driver.potential,
      reputation: driver.reputation,
      morale: driver.morale,
      age: formatAge(driver.birthDate),
      traitCodes: driver.traits.map((trait) => trait.trait.code),
      targetCategoryCode: activeCareer.categoryCode,
      currentCategoryCode: driver.currentCategory?.code,
    }),
  }));

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Talent Intelligence"
        title="Scouting Center"
        description="Unified scouting board for free agents, breakout prospects and staff opportunities across the global ecosystem."
        badge={activeCareer.categoryCode}
      />

      <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl">Top Free Agents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {freeAgentBoard.slice(0, 10).map((driver) => (
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
                      {driver.currentCategory?.code ?? "OPEN"} - Age {formatAge(driver.birthDate)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className="rounded-full border border-cyan-300/35 bg-cyan-500/10 text-cyan-100 text-xs">
                    Score {driver.scoutingScore}
                  </Badge>
                  <p className="mt-1 text-xs text-muted-foreground">
                    OVR {driver.overall} / POT {driver.potential}
                  </p>
                </div>
              </Link>
            ))}
            {freeAgentBoard.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-muted-foreground">
                No free-agent board data available.
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl">Staff Opportunities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {board.roleGaps.slice(0, 10).map((member) => (
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
            {board.roleGaps.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-muted-foreground">
                No staff opportunities in the current market.
              </div>
            ) : null}
          </CardContent>
        </Card>
      </section>

      <Card className="premium-card">
        <CardHeader>
          <CardTitle className="font-heading text-xl">Breakout Targets</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {breakoutTargets.slice(0, 12).map((driver) => (
            <Link
              key={driver.id}
              href={`/game/drivers/${driver.id}`}
              className="rounded-2xl border border-white/10 bg-white/5 p-3 transition hover:bg-white/10"
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
                    {driver.currentTeam?.name ?? "Open market"} - {driver.currentCategory?.code ?? "OPEN"}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs">
                <span>Score {driver.scoutingScore}</span>
                <span>{formatCompactMoney(driver.marketValue)}</span>
              </div>
              <div className="mt-2 flex gap-2 text-xs text-muted-foreground">
                <span>OVR {driver.overall}</span>
                <span>POT {driver.potential}</span>
                <span>Age {formatAge(driver.birthDate)}</span>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
