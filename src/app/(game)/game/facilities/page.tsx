import { FacilitiesCenter } from "@/components/game/facilities-center";
import { PageHeader } from "@/components/common/page-header";
import { getServerTranslator } from "@/i18n/server";
import { getEngineeringCenterView } from "@/server/queries/engineering";

export default async function FacilitiesPage() {
  const { t } = await getServerTranslator();
  const view = await getEngineeringCenterView();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={t("facilities.eyebrow")}
        title={t("facilities.title")}
        description={t("facilities.description")}
        badge={`${view.context.categoryCode} · ${view.context.teamName}`}
      />

      <FacilitiesCenter view={view} />
    </div>
  );
}
