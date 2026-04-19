import { CountryFlag } from "@/components/common/country-flag";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { getCalendarView } from "@/server/queries/world";

export default async function CalendarPage() {
  const events = await getCalendarView().catch(() => []);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Season Flow"
        title="Global Calendar"
        description="Calendário unificado multi-série com rounds preparados para as próximas fases de simulação."
      />

      <div className="grid gap-3">
        {events.map((event) => (
          <Card key={event.id} className="premium-card">
            <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
              <div className="min-w-[160px]">
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  Round {event.round} • {event.category.code}
                </p>
                <p className="font-heading text-lg text-foreground">{event.name}</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CountryFlag countryCode={event.countryCode} className="h-4 w-6" />
                {event.circuitName}
              </div>
              <div className="text-sm font-medium text-foreground">
                {event.startDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
