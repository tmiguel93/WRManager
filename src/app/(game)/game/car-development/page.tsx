import { PageHeader } from "@/components/common/page-header";
import { CarDevelopmentCenter } from "@/components/game/car-development-center";
import { getEngineeringCenterView } from "@/server/queries/engineering";

export default async function CarDevelopmentPage() {
  const view = await getEngineeringCenterView();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Engineering"
        title="Car Development"
        description="Own the upgrade pipeline with project risk, duration and supplier-driven performance impact."
        badge={`${view.context.categoryCode} · ${view.context.teamName}`}
      />

      <CarDevelopmentCenter view={view} />
    </div>
  );
}
