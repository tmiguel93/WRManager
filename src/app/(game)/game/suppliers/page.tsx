import { PageHeader } from "@/components/common/page-header";
import { SupplierMarketplace } from "@/components/game/supplier-marketplace";
import { getServerTranslator } from "@/i18n/server";
import { getSupplierMarketplaceView } from "@/server/queries/commercial";

export default async function SuppliersPage() {
  const { t } = await getServerTranslator();
  const view = await getSupplierMarketplaceView();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={t("commercial.partnershipEyebrow", "Partnership Network")}
        title={t("commercial.suppliersTitle", "Suppliers Marketplace")}
        description={t(
          "commercial.suppliersDescription",
          "Negotiate supplier contracts with category compatibility, confidence envelope and financial impact on your active career.",
        )}
      />
      <SupplierMarketplace
        context={{
          teamName: view.context.teamName,
          cashBalance: view.context.cashBalance,
          managerProfileCode: view.context.managerProfileCode,
        }}
        activeContracts={view.activeContracts.map((contract) => ({
          id: contract.id,
          annualCost: contract.annualCost,
          endDateIso: contract.endDate.toISOString().slice(0, 10),
          supplier: contract.supplier,
        }))}
        suppliers={view.suppliers}
      />
    </div>
  );
}
