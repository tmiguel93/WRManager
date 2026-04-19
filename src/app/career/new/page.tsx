import Link from "next/link";
import { Clock3, PlayCircle } from "lucide-react";

import { NewCareerWizard } from "@/features/career/components/new-career-wizard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CountryFlag } from "@/components/common/country-flag";
import { listCareerSaves, getCareerSetupData } from "@/server/queries/career";
import { formatCompactMoney } from "@/lib/format";
import { getServerTranslator } from "@/i18n/server";

export default async function NewCareerPage() {
  const [{ t }, setupData, careers] = await Promise.all([
    getServerTranslator(),
    getCareerSetupData(),
    listCareerSaves(),
  ]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_6%,_rgba(14,165,233,0.16),_transparent_28%),radial-gradient(circle_at_84%_14%,_rgba(250,204,21,0.12),_transparent_32%),linear-gradient(160deg,rgba(5,8,18,0.94)_0%,rgba(2,6,23,0.98)_58%)]" />
      <main className="relative z-10 mx-auto w-full max-w-7xl px-6 py-10 md:px-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Badge className="rounded-full border border-white/20 bg-white/5 text-cyan-100">
              WORLD MOTORSPORT MANAGER
            </Badge>
            <h1 className="mt-4 font-heading text-4xl text-white md:text-5xl">{t("career.title")}</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">{t("career.subtitle")}</p>
          </div>
          <Link href="/">
            <Button variant="ghost" className="rounded-2xl border border-white/20 text-white">
              Main Menu
            </Button>
          </Link>
        </header>

        {careers.length > 0 ? (
          <section className="mt-8">
            <Card className="premium-card">
              <CardHeader>
                <CardTitle className="font-heading text-xl">Recent Career Saves</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {careers.map((career) => (
                  <div key={career.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm font-semibold">{career.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {career.mode.replaceAll("_", " ")} - {career.selectedCategory?.code ?? "N/A"}
                    </p>
                    {career.selectedTeam ? (
                      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                        <CountryFlag countryCode={career.selectedTeam.countryCode} className="h-4 w-6" />
                        {career.selectedTeam.name}
                      </div>
                    ) : null}
                    <p className="mt-2 text-sm text-cyan-100">{formatCompactMoney(career.cashBalance)}</p>
                    <Link href={`/career/select/${career.id}`} className="mt-3 inline-flex">
                      <Button variant="secondary" className="h-8 rounded-xl border border-white/15 bg-white/10 text-white">
                        <PlayCircle className="mr-1 size-4" />
                        Continue
                      </Button>
                    </Link>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>
        ) : null}

        <section className="mt-8">
          <NewCareerWizard
            categories={setupData.categories}
            teams={setupData.teams}
            suppliers={setupData.suppliers}
          />
        </section>

        <footer className="mt-10 flex items-center gap-2 text-xs text-muted-foreground">
          <Clock3 className="size-3.5" />
          Structured save progression with autosave support.
        </footer>
      </main>
    </div>
  );
}
