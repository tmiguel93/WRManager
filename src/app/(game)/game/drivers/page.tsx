import { DriverComparePanel } from "@/components/game/driver-compare-panel";
import { DriversDataTable } from "@/components/game/drivers-data-table";
import { PageHeader } from "@/components/common/page-header";
import { getServerTranslator } from "@/i18n/server";
import { formatAge } from "@/lib/format";
import { getDriversDirectory } from "@/server/queries/roster";
import type { DriverRow } from "@/components/game/drivers-data-table";

export default async function DriversPage() {
  const { t } = await getServerTranslator();
  const drivers = await getDriversDirectory().catch(() => []);

  const tableRows: DriverRow[] = drivers.map((driver) => {
    const status: DriverRow["status"] = driver.currentTeam ? "CONTRACTED" : "FREE_AGENT";
    return {
      id: driver.id,
      name: driver.displayName,
      countryCode: driver.countryCode,
      category: driver.currentCategory?.code ?? "N/A",
      team: driver.currentTeam?.name ?? t("common.freeAgent"),
      overall: driver.overall,
      potential: driver.potential,
      reputation: driver.reputation,
      marketValue: driver.marketValue,
      primaryTrait: driver.traits[0]?.trait.name ?? t("drivers.noTrait"),
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
    team: driver.currentTeam?.name ?? t("common.freeAgent"),
    category: driver.currentCategory?.code ?? "N/A",
  }));

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={t("drivers.pageEyebrow")}
        title={t("drivers.pageTitle")}
        description={t("drivers.pageDescription")}
      />
      <DriverComparePanel drivers={compareRows} />
      <DriversDataTable data={tableRows} />
    </div>
  );
}
