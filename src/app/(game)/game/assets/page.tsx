import { ShieldCheck } from "lucide-react";

import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAssetRegistryView } from "@/server/queries/world";

export default async function AssetsPage() {
  const entries = await getAssetRegistryView().catch(() => []);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Licensing Pipeline"
        title="Asset Registry"
        description="Sistema de assets com fallback premium e trilha segura para importação de material autorizado/licenciado."
      />

      <Card className="premium-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-heading text-xl">
            <ShieldCheck className="size-5 text-emerald-300" /> Compliance-first asset flow
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {entries.map((entry) => (
            <div key={entry.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <div>
                <p className="text-sm font-medium">
                  {entry.entityType} • {entry.assetType}
                </p>
                <p className="text-xs text-muted-foreground">
                  source: {entry.packSource} • entity: {entry.entityId}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={entry.approved ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-200"}>
                  {entry.approved ? "Approved" : "Pending"}
                </Badge>
                <Badge className={entry.isPlaceholder ? "bg-white/10 text-white" : "bg-cyan-500/20 text-cyan-100"}>
                  {entry.isPlaceholder ? "Placeholder" : "Licensed"}
                </Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
