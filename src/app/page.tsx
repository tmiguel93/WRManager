import Link from "next/link";
import { ArrowRight, GaugeCircle, Globe2, Orbit, Radar } from "lucide-react";

import { LanguageSelector } from "@/components/common/language-selector";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getServerTranslator } from "@/i18n/server";
import { getLandingSnapshot } from "@/server/queries/landing";

export default async function Home() {
  const { t } = await getServerTranslator();
  const snapshot = await getLandingSnapshot().catch(() => ({
    categoryCount: 0,
    teamCount: 0,
    driverCount: 0,
    supplierCount: 0,
    sponsorCount: 0,
  }));

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_10%,_rgba(56,189,248,0.18),_transparent_32%),radial-gradient(circle_at_82%_18%,_rgba(250,204,21,0.13),_transparent_30%),linear-gradient(160deg,rgba(5,8,18,0.9)_0%,rgba(2,6,23,0.98)_56%)]" />
      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 pb-12 pt-10 md:px-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <Badge className="rounded-full border border-white/20 bg-white/5 px-4 py-1 text-xs tracking-[0.16em] text-cyan-100">
            WORLD MOTORSPORT MANAGER
          </Badge>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <LanguageSelector />
            <Link href="/game/hq">
              <Button variant="secondary" className="rounded-full border border-white/20 bg-white/10 text-white">
                {t("landing.continueCareer", "Continue Career")}
              </Button>
            </Link>
          </div>
        </header>

        <section className="mt-16 grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-8">
            <div className="space-y-5">
              <h1 className="max-w-3xl font-heading text-4xl leading-tight tracking-tight text-white md:text-6xl">
                {t("landing.heroTitle", "Build a global racing empire across Formula, Indy, NASCAR and Endurance.")}
              </h1>
              <p className="max-w-2xl text-lg text-slate-200/85">
                {t(
                  "landing.heroDescription",
                  "Manage drivers, staff, suppliers, sponsors, race weekends and long-term progression through a living motorsport ecosystem.",
                )}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/career/new">
                <Button variant="premium" className="rounded-2xl px-6 py-6 text-base font-semibold">
                  {t("landing.startNewCareer", "Start New Career")}
                </Button>
              </Link>
              <Link href="/game/hq">
                <Button className="premium-button-glow rounded-2xl bg-cyan-300 px-6 py-6 text-base font-semibold text-slate-900 hover:bg-cyan-200">
                  {t("landing.enterCommandCenter", "Enter Command Center")} <ArrowRight className="ml-2 size-4" />
                </Button>
              </Link>
            </div>
          </div>

          <Card className="premium-card border-white/15 bg-slate-950/55">
            <CardHeader>
              <CardTitle className="font-heading text-xl text-white">{t("landing.worldSnapshot", "World Snapshot")}</CardTitle>
              <CardDescription>
                {t("landing.worldSnapshotDescription", "Current game database overview for your save universe.")}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-muted-foreground">{t("landing.categories", "Categories")}</p>
                <p className="text-2xl font-semibold text-white">{snapshot.categoryCount}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-muted-foreground">{t("landing.teams", "Teams")}</p>
                <p className="text-2xl font-semibold text-white">{snapshot.teamCount}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-muted-foreground">{t("landing.drivers", "Drivers")}</p>
                <p className="text-2xl font-semibold text-white">{snapshot.driverCount}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-muted-foreground">{t("landing.suppliers", "Suppliers")}</p>
                <p className="text-2xl font-semibold text-white">{snapshot.supplierCount}</p>
              </div>
              <div className="col-span-2 rounded-2xl border border-amber-300/30 bg-amber-400/10 p-4">
                <p className="text-muted-foreground">{t("landing.sponsors", "Sponsors")}</p>
                <p className="text-2xl font-semibold text-amber-100">{snapshot.sponsorCount}</p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="mt-14 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="premium-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Orbit className="size-4 text-cyan-300" /> {t("landing.featureMultiCategoryTitle", "Multi-Category Career")}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {t(
                "landing.featureMultiCategory",
                "Multiple motorsport disciplines with category-specific weekend formats and progression tiers.",
              )}
            </CardContent>
          </Card>
          <Card className="premium-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <GaugeCircle className="size-4 text-emerald-300" /> {t("landing.featureLiveSimulationTitle", "Live Simulation")}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {t(
                "landing.featureLiveSimulation",
                "Session-by-session simulation with strategy inputs, reliability dynamics and standings impact.",
              )}
            </CardContent>
          </Card>
          <Card className="premium-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Globe2 className="size-4 text-amber-200" /> {t("landing.featureLivingEcosystemTitle", "Living Ecosystem")}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {t(
                "landing.featureLivingEcosystem",
                "Drivers, staff, suppliers and sponsors evolve with contracts, reputation and market movement.",
              )}
            </CardContent>
          </Card>
          <Card className="premium-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Radar className="size-4 text-violet-200" /> {t("landing.featurePremiumUiTitle", "Premium UI Experience")}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {t(
                "landing.featurePremiumUi",
                "Refined visuals, team themes and responsive management flows for long campaign sessions.",
              )}
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
