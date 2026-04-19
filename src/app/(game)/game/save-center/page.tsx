import Link from "next/link";

import { PageHeader } from "@/components/common/page-header";
import { SaveCenterPanel } from "@/components/game/save-center-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSaveCenterView } from "@/server/queries/save-system";

export default async function SaveCenterPage() {
  const view = await getSaveCenterView();

  if (!view.canSave) {
    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow="Persistence"
          title="Save Center"
          description="Create a career first to unlock manual saves and autosave checkpoints."
        />
        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl">No Active Career</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Save and load are available once a career is selected in the command center.
            </p>
            <Button render={<Link href="/career/new" />} variant="primary">
              Create New Career
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Persistence"
        title="Save Center"
        description="Manage manual save slots, load previous checkpoints and monitor autosave state."
        badge={`${view.categoryCode} · ${view.currentDateIso}`}
      />
      <SaveCenterPanel view={view} />
    </div>
  );
}
