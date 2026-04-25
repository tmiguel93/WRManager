import { PageHeader } from "@/components/common/page-header";
import { CarDevelopmentCenter } from "@/components/game/car-development-center";
import { getServerTranslator } from "@/i18n/server";
import { getEngineeringCenterView } from "@/server/queries/engineering";

export default async function CarDevelopmentPage() {
  const { t } = await getServerTranslator();
  const view = await getEngineeringCenterView();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={t("engineering.eyebrow")}
        title={t("engineering.title")}
        description={t("engineering.description")}
        badge={`${view.context.categoryCode} · ${view.context.teamName}`}
      />

      <CarDevelopmentCenter view={view} />
    </div>
  );
}
