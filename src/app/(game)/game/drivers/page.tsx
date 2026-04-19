import { DriversDataTable } from "@/components/game/drivers-data-table";
import { PageHeader } from "@/components/common/page-header";
import { getDriversView } from "@/server/queries/world";

export default async function DriversPage() {
  const drivers = await getDriversView().catch(() => []);
  const tableRows = drivers.map((driver) => ({
    id: driver.id,
    name: driver.displayName,
    countryCode: driver.countryCode,
    category: driver.currentCategory?.code ?? "N/A",
    team: driver.currentTeam?.name ?? "Free Agent",
    overall: driver.overall,
    potential: driver.potential,
    reputation: driver.reputation,
  }));

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Talent Database"
        title="Global Drivers"
        description="Banco multi-série com atributos, reputação e base de progressão para transferências de carreira."
      />
      <DriversDataTable data={tableRows} />
    </div>
  );
}
