"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { negotiateSponsorDealAction } from "@/app/(game)/game/suppliers/actions";
import type { SponsorObjectiveRisk } from "@/domain/rules/commercial-deals";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatCompactMoney } from "@/lib/format";
import { useI18n } from "@/i18n/client";

interface ActiveSponsorContractRow {
  id: string;
  fixedValue: number;
  confidence: number;
  endDateIso: string;
  sponsor: {
    name: string;
    countryCode: string;
    industry: string;
    brandColor: string;
  };
}

interface SponsorOfferRow {
  id: string;
  name: string;
  countryCode: string;
  industry: string;
  confidence: number;
  baseValue: number;
  brandColor: string;
  isActiveWithTeam: boolean;
  preview: {
    fixedValue: number;
    signingAdvance: number;
    confidence: number;
    reputationalRisk: number;
  };
}

interface SponsorMarketplaceProps {
  context: {
    teamName: string;
    cashBalance: number;
    managerProfileCode: string;
  };
  activeContracts: ActiveSponsorContractRow[];
  sponsors: SponsorOfferRow[];
}

const objectiveOptions: Array<{ value: SponsorObjectiveRisk; label: string }> = [
  { value: "SAFE", label: "Safe Targets" },
  { value: "BALANCED", label: "Balanced Targets" },
  { value: "AGGRESSIVE", label: "Aggressive Targets" },
];

export function SponsorMarketplace({ context, activeContracts, sponsors }: SponsorMarketplaceProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [riskBySponsor, setRiskBySponsor] = useState<Record<string, SponsorObjectiveRisk>>({});
  const { t } = useI18n();

  const filteredSponsors = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return sponsors;
    }

    return sponsors.filter((sponsor) => {
      return (
        sponsor.name.toLowerCase().includes(term) ||
        sponsor.industry.toLowerCase().includes(term) ||
        sponsor.countryCode.toLowerCase().includes(term)
      );
    });
  }, [search, sponsors]);

  function negotiateSponsor(sponsorId: string) {
    const objectiveRisk = riskBySponsor[sponsorId] ?? "BALANCED";
    startTransition(async () => {
      const result = await negotiateSponsorDealAction({
        sponsorId,
        objectiveRisk,
      });

      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <Card className="premium-card">
          <CardContent className="pt-5">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
              {t("commercial.managedTeam", "Managed Team")}
            </p>
            <p className="mt-2 text-lg font-semibold">{context.teamName}</p>
            <p className="text-xs text-muted-foreground">{context.managerProfileCode}</p>
          </CardContent>
        </Card>
        <Card className="premium-card">
          <CardContent className="pt-5">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
              {t("commercial.cashBalance", "Cash Balance")}
            </p>
            <p className="mt-2 text-lg font-semibold text-emerald-100">{formatCompactMoney(context.cashBalance)}</p>
          </CardContent>
        </Card>
        <Card className="premium-card">
          <CardContent className="pt-5">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
              {t("commercial.activeSponsorDeals", "Active Sponsor Deals")}
            </p>
            <p className="mt-2 text-lg font-semibold">{activeContracts.length}</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl">
              {t("commercial.currentSponsorPortfolio", "Current Sponsor Portfolio")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeContracts.map((contract) => (
              <div key={contract.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold">{contract.sponsor.name}</p>
                  <Badge className="rounded-full border border-white/15 bg-white/10 text-xs">{contract.sponsor.industry}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Fixed value {formatCompactMoney(contract.fixedValue)} - confidence {contract.confidence}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Ends {contract.endDateIso}</p>
                <div
                  className="mt-2 h-1.5 rounded-full"
                  style={{ background: `linear-gradient(90deg, #0b1220 0%, ${contract.sponsor.brandColor} 100%)` }}
                />
              </div>
            ))}
            {activeContracts.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-muted-foreground">
                {t("commercial.noActiveSponsorContracts", "No active sponsor contracts found for this team.")}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl">{t("commercial.searchSponsors", "Search Sponsors")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder={t("commercial.searchSponsorPlaceholder", "Search sponsor, industry or country")}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-10 border-white/20 bg-background/40"
            />
            <Badge className="rounded-full border border-cyan-300/35 bg-cyan-500/10 text-cyan-100">
              {t("commercial.sponsorOpportunities", "{count} sponsor opportunities", {
                count: filteredSponsors.length,
              })}
            </Badge>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredSponsors.map((sponsor) => (
          <Card key={sponsor.id} className="premium-card">
            <CardHeader className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="font-heading text-lg">{sponsor.name}</CardTitle>
                <Badge className="rounded-full border border-white/15 bg-white/10 text-xs">{sponsor.countryCode}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">{sponsor.industry}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div
                className="h-2 rounded-full"
                style={{ background: `linear-gradient(90deg, rgba(11,18,32,0.85) 0%, #${sponsor.brandColor} 100%)` }}
              />
              <div className="rounded-2xl border border-emerald-300/20 bg-emerald-500/10 p-3 text-xs">
                <p className="text-emerald-100">Fixed value {formatCompactMoney(sponsor.preview.fixedValue)}</p>
                <p className="mt-1 text-emerald-100/80">Signing advance {formatCompactMoney(sponsor.preview.signingAdvance)}</p>
                <p className="mt-1 text-emerald-100/80">
                  Confidence {sponsor.preview.confidence} - Risk {sponsor.preview.reputationalRisk}
                </p>
              </div>
              {sponsor.isActiveWithTeam ? (
                <Badge className="rounded-full border border-emerald-300/35 bg-emerald-500/10 text-emerald-100">
                  {t("sponsors.alreadyActive", "Already active")}
                </Badge>
              ) : null}
              <div className="flex items-center gap-2">
                <select
                  value={riskBySponsor[sponsor.id] ?? "BALANCED"}
                  onChange={(event) =>
                    setRiskBySponsor((current) => ({
                      ...current,
                      [sponsor.id]: event.target.value as SponsorObjectiveRisk,
                    }))
                  }
                  className="h-9 rounded-xl border border-white/20 bg-background/40 px-2 text-xs text-foreground"
                >
                  {objectiveOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <Button
                  variant="premium"
                  size="sm"
                  className="h-9 flex-1"
                  disabled={isPending || sponsor.isActiveWithTeam}
                  onClick={() => negotiateSponsor(sponsor.id)}
                >
                  {sponsor.isActiveWithTeam
                    ? t("sponsors.alreadyActive", "Already active")
                    : t("sponsors.negotiate", "Negotiate")}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
