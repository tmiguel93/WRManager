import { DriverComparePanel } from "@/components/game/driver-compare-panel";
import { DriversDataTable } from "@/components/game/drivers-data-table";
import { PageHeader } from "@/components/common/page-header";
import { formatAge } from "@/lib/format";
import { getDriversDirectory } from "@/server/queries/roster";
import type { DriverRow } from "@/components/game/drivers-data-table";

export default async function DriversPage() {
  const drivers = await getDriversDirectory().catch(() => []);

  const tableRows: DriverRow[] = drivers.map((driver) => {
    const status: DriverRow["status"] = driver.currentTeam ? "CONTRACTED" : "FREE_AGENT";
    return {
      id: driver.id,
      name: driver.displayName,
      countryCode: driver.countryCode,
      category: driver.currentCategory?.code ?? "N/A",
      team: driver.currentTeam?.name ?? "Free Agent",
      overall: driver.overall,
      potential: driver.potential,
      reputation: driver.reputation,
      marketValue: driver.marketValue,
      primaryTrait: driver.traits[0]?.trait.name ?? "No primary trait",
      age: formatAge(driver.birthDate),
      status,
      imageUrl: driver.imageUrl,
    };
  });

  const compareRows = drivers.slice(0, 24).map((driver) => ({
    id: driver.id,
    name: driver.displayName,
    countryCode: driver.countryCode,
    imageUrl: driver.imageUrl,
    overall: driver.overall,
    potential: driver.potential,
    reputation: driver.reputation,
    team: driver.currentTeam?.name ?? "Free Agent",
    category: driver.currentCategory?.code ?? "N/A",
  }));

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Talent Database"
        title="Global Drivers"
        description="Real multi-series roster with contracts, attributes and quick compare for transfer planning."
      />
      <DriverComparePanel drivers={compareRows} />
      <DriversDataTable data={tableRows} />
    </div>
  );
}
