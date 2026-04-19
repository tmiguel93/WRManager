import { PageHeader } from "@/components/common/page-header";
import { ScoutingBoard } from "@/components/game/scouting-board";
import { calculateScoutingScore } from "@/domain/rules/scouting-score";
import { formatAge } from "@/lib/format";
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
    id: driver.id,
    displayName: driver.displayName,
    countryCode: driver.countryCode,
    imageUrl: driver.imageUrl,
    currentCategoryCode: driver.currentCategory?.code ?? "OPEN",
    currentTeamName: driver.currentTeam?.name ?? "Open market",
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
    overall: driver.overall,
    potential: driver.potential,
    marketValue: driver.marketValue,
    salary: driver.salary,
    primaryTraitName: driver.traits[0]?.trait.name ?? "No highlighted trait",
  }));

  const breakoutTargets = board.highPotential.map((driver) => ({
    id: driver.id,
    displayName: driver.displayName,
    countryCode: driver.countryCode,
    imageUrl: driver.imageUrl,
    currentCategoryCode: driver.currentCategory?.code ?? "OPEN",
    currentTeamName: driver.currentTeam?.name ?? "Open market",
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
    overall: driver.overall,
    potential: driver.potential,
    marketValue: driver.marketValue,
    salary: driver.salary,
    primaryTraitName: driver.traits[0]?.trait.name ?? "No highlighted trait",
  }));

  const staffMarket = board.roleGaps.map((member) => ({
    id: member.id,
    name: member.name,
    role: member.role,
    specialty: member.specialty,
    countryCode: member.countryCode,
    imageUrl: member.imageUrl,
    reputation: member.reputation,
    salary: member.salary,
  }));

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Talent Intelligence"
        title="Scouting Center"
        description="Unified scouting board with live proposal flow for drivers and staff across the global ecosystem."
        badge={activeCareer.categoryCode}
      />

      <ScoutingBoard
        freeAgents={freeAgentBoard}
        breakoutTargets={breakoutTargets}
        staffMarket={staffMarket}
      />
    </div>
  );
}
