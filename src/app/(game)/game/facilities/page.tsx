import { FacilitiesCenter } from "@/components/game/facilities-center";
import { PageHeader } from "@/components/common/page-header";
import { getEngineeringCenterView } from "@/server/queries/engineering";

export default async function FacilitiesPage() {
  const view = await getEngineeringCenterView();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Infrastructure"
        title="Facilities"
        description="Upgrade HQ and technical departments to accelerate development and protect race reliability."
        badge={`${view.context.categoryCode} · ${view.context.teamName}`}
      />

      <FacilitiesCenter view={view} />
    </div>
  );
}
