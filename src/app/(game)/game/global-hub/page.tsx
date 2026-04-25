import { PageHeader } from "@/components/common/page-header";
import { GlobalMotorsportHubCenter } from "@/components/game/global-motorsport-hub-center";
import { getServerTranslator } from "@/i18n/server";
import { getGlobalMotorsportHubView } from "@/server/queries/motorsport-world";

export default async function GlobalHubPage() {
  const { t } = await getServerTranslator();
  const view = await getGlobalMotorsportHubView();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={t("globalHub.eyebrow")}
        title={t("globalHub.title")}
        description={t("globalHub.description")}
        badge={view.referenceDateIso}
      />

      <GlobalMotorsportHubCenter view={view} />
    </div>
  );
}
