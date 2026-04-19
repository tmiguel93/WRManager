import { ModulePreviewPanel } from "@/components/game/module-preview-panel";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getNewsroomView } from "@/server/queries/world";

export default async function NewsroomPage() {
  const news = await getNewsroomView().catch(() => []);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Media & Inbox"
        title="Newsroom"
        description="Fluxo de notícias e rumores carregado do banco para sustentar a sensação de paddock vivo."
      />

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl">Latest Headlines</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {news.map((item) => (
              <div key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  {item.categoryCode} • Importance {item.importance}
                </p>
                <p className="mt-1 text-base font-medium text-foreground">{item.title}</p>
                <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <ModulePreviewPanel
          title="Global Motorsport Hub"
          description="A camada de ecossistema mundial está preparada no schema para rumores, transferências e narrativas sistêmicas."
          status="Module 11 expansion target"
        />
      </div>
    </div>
  );
}
