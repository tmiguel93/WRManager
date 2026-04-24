import { PageHeader } from "@/components/common/page-header";
import { SponsorMarketplace } from "@/components/game/sponsor-marketplace";
import { getServerTranslator } from "@/i18n/server";
import { getSponsorsMarketplaceView } from "@/server/queries/commercial";

export default async function SponsorsPage() {
  const { t } = await getServerTranslator();
  const view = await getSponsorsMarketplaceView();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={t("commercial.eyebrow", "Commercial Hub")}
        title={t("commercial.sponsorsTitle", "Sponsors & Objectives")}
        description={t(
          "commercial.sponsorsDescription",
          "Build your sponsor portfolio with risk-based target packages, signing advances and confidence management.",
        )}
      />
      <SponsorMarketplace
        context={{
          teamName: view.context.teamName,
          cashBalance: view.context.cashBalance,
          managerProfileCode: view.context.managerProfileCode,
        }}
        activeContracts={view.activeContracts.map((contract) => ({
          id: contract.id,
          fixedValue: contract.fixedValue,
          confidence: contract.confidence,
          endDateIso: contract.endDate.toISOString().slice(0, 10),
          sponsor: contract.sponsor,
        }))}
        sponsors={view.sponsors}
      />
    </div>
  );
}
