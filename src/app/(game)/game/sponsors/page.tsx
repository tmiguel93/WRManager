import { PageHeader } from "@/components/common/page-header";
import { SponsorMarketplace } from "@/components/game/sponsor-marketplace";
import { getSponsorsMarketplaceView } from "@/server/queries/commercial";

export default async function SponsorsPage() {
  const view = await getSponsorsMarketplaceView();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Commercial Hub"
        title="Sponsors & Objectives"
        description="Build your sponsor portfolio with risk-based target packages, signing advances and confidence management."
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
