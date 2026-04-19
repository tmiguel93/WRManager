import { Trophy } from "lucide-react";

import { ModulePreviewPanel } from "@/components/game/module-preview-panel";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const seededStandings = [
  { series: "Formula 1", leader: "A. Verstappen", points: 0 },
  { series: "Formula 2", leader: "T. Martins", points: 0 },
  { series: "INDYCAR", leader: "A. Palou", points: 0 },
  { series: "NASCAR Cup", leader: "W. Byron", points: 0 },
  { series: "WEC Hypercar", leader: "A. Fuoco", points: 0 },
];

export default function StandingsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Competitive Map"
        title="Standings & Championship Logic"
        description="Tabela de pontuação preparada para múltiplos sistemas por categoria via WeekendRuleSets."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading text-xl">
              <Trophy className="size-4 text-amber-300" /> Season Zero Snapshot
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {seededStandings.map((entry) => (
              <div key={entry.series} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                <div>
                  <p className="text-sm font-medium">{entry.series}</p>
                  <p className="text-xs text-muted-foreground">{entry.leader}</p>
                </div>
                <p className="text-sm font-semibold">{entry.points} pts</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <ModulePreviewPanel
          title="Ruleset-ready standings engine"
          description="Cada campeonato terá cálculo isolado de pontos, critérios de desempate e formatos sprint/stage/feature."
          status="Module 7 target prepared in data layer"
        />
      </div>
    </div>
  );
}
