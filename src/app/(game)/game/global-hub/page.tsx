import { PageHeader } from "@/components/common/page-header";
import { GlobalMotorsportHubCenter } from "@/components/game/global-motorsport-hub-center";
import { getGlobalMotorsportHubView } from "@/server/queries/motorsport-world";

export default async function GlobalHubPage() {
  const view = await getGlobalMotorsportHubView();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="World Ecosystem"
        title="Global Motorsport Hub"
        description="Track every category in parallel with global headlines, transfer radar, regulation watch and recent results."
        badge={view.referenceDateIso}
      />

      <GlobalMotorsportHubCenter view={view} />
    </div>
  );
}
