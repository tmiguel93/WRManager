import Link from "next/link";

import { PageHeader } from "@/components/common/page-header";
import { SaveCenterPanel } from "@/components/game/save-center-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getServerTranslator } from "@/i18n/server";
import { getSaveCenterView } from "@/server/queries/save-system";

export default async function SaveCenterPage() {
  const { t } = await getServerTranslator();
  const view = await getSaveCenterView();

  if (!view.canSave) {
    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow={t("saveCenter.eyebrow")}
          title={t("saveCenter.title")}
          description={t("saveCenter.description")}
        />
        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl">{t("race.noContext")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t("saveCenter.restoreP1")}
            </p>
            <Button render={<Link href="/career/new" />} variant="primary">
              {t("landing.startNewCareer")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={t("saveCenter.eyebrow")}
        title={t("saveCenter.title")}
        description={t("saveCenter.description")}
        badge={`${view.categoryCode} · ${view.currentDateIso}`}
      />
      <SaveCenterPanel view={view} />
    </div>
  );
}
