"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { negotiateSupplierDealAction } from "@/app/(game)/game/suppliers/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useI18n } from "@/i18n/client";
import { formatCompactMoney } from "@/lib/format";

interface SupplierOfferRow {
  id: string;
  type: string;
  name: string;
  performance: number;
  reliability: number;
  efficiency: number;
  drivability: number;
  baseCost: number;
  countryCode: string;
  categories: Array<{ category: { code: string } }>;
  preview: {
    annualCost: number;
    signingFee: number;
    negotiationConfidence: number;
    termYears: number;
  };
  currentTypeContract: {
    id: string;
    annualCost: number;
    supplier: { name: string };
  } | null;
  isCurrentSupplier: boolean;
}

interface ActiveSupplierContractRow {
  id: string;
  annualCost: number;
  endDateIso: string;
  supplier: {
    name: string;
    type: string;
    performance: number;
    reliability: number;
    efficiency: number;
  };
}

interface SupplierMarketplaceProps {
  context: {
    teamName: string;
    cashBalance: number;
    managerProfileCode: string;
  };
  activeContracts: ActiveSupplierContractRow[];
  suppliers: SupplierOfferRow[];
}

export function SupplierMarketplace({ context, activeContracts, suppliers }: SupplierMarketplaceProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [termBySupplier, setTermBySupplier] = useState<Record<string, number>>({});
  const { t } = useI18n();

  const types = useMemo(() => {
    return ["ALL", ...new Set(suppliers.map((supplier) => supplier.type))];
  }, [suppliers]);

  const filteredSuppliers = useMemo(() => {
    const term = search.trim().toLowerCase();

    return suppliers.filter((supplier) => {
      const typeMatch = selectedType === "ALL" || supplier.type === selectedType;
      const textMatch =
        term.length === 0 ||
        supplier.name.toLowerCase().includes(term) ||
        supplier.type.toLowerCase().includes(term) ||
        supplier.categories.some((category) => category.category.code.toLowerCase().includes(term));

      return typeMatch && textMatch;
    });
  }, [search, selectedType, suppliers]);

  function negotiateDeal(supplierId: string) {
    const termYears = termBySupplier[supplierId] ?? 2;
    startTransition(async () => {
      const result = await negotiateSupplierDealAction({
        supplierId,
        termYears,
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
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Managed Team</p>
            <p className="mt-2 text-lg font-semibold">{context.teamName}</p>
            <p className="text-xs text-muted-foreground">{context.managerProfileCode}</p>
          </CardContent>
        </Card>
        <Card className="premium-card">
          <CardContent className="pt-5">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
              {t("commercial.cashBalance", "Cash Balance")}
            </p>
            <p className="mt-2 text-lg font-semibold text-cyan-100">{formatCompactMoney(context.cashBalance)}</p>
          </CardContent>
        </Card>
        <Card className="premium-card">
          <CardContent className="pt-5">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
              {t("commercial.activeSupplierDeals", "Active Supplier Deals")}
            </p>
            <p className="mt-2 text-lg font-semibold">{activeContracts.length}</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl">
              {t("commercial.currentSupplierContracts", "Current Supplier Contracts")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeContracts.map((contract) => (
              <div key={contract.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold">{contract.supplier.name}</p>
                  <Badge className="rounded-full border border-white/15 bg-white/10 text-xs">{contract.supplier.type}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Annual cost {formatCompactMoney(contract.annualCost)} - Ends {contract.endDateIso}
                </p>
                <div className="mt-3 space-y-2">
                  <div>
                    <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                      <span>Performance</span>
                      <span>{contract.supplier.performance}</span>
                    </div>
                    <Progress value={contract.supplier.performance} />
                  </div>
                  <div>
                    <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                      <span>Reliability</span>
                      <span>{contract.supplier.reliability}</span>
                    </div>
                    <Progress value={contract.supplier.reliability} />
                  </div>
                </div>
              </div>
            ))}
            {activeContracts.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-muted-foreground">
                {t("commercial.noActiveSupplierContracts", "No active supplier contracts found for this team.")}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl">{t("commercial.marketplaceFilters", "Marketplace Filters")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder={t("commercial.searchSupplierPlaceholder", "Search supplier or category")}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-10 border-white/20 bg-background/40"
            />
            <select
              value={selectedType}
              onChange={(event) => setSelectedType(event.target.value)}
              className="h-10 w-full rounded-xl border border-white/20 bg-background/40 px-3 text-sm text-foreground"
            >
              {types.map((type) => (
                <option key={type} value={type}>
                  {type === "ALL" ? t("commercial.allSupplierTypes", "All supplier types") : type}
                </option>
              ))}
            </select>
            <Badge className="rounded-full border border-cyan-300/35 bg-cyan-500/10 text-cyan-100">
              {t("commercial.suppliersAvailable", "{count} suppliers available", {
                count: filteredSuppliers.length,
              })}
            </Badge>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredSuppliers.map((supplier) => (
          <Card key={supplier.id} className="premium-card">
            <CardHeader className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="font-heading text-lg">{supplier.name}</CardTitle>
                <Badge className="rounded-full border border-white/15 bg-white/10 text-xs">{supplier.type}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {supplier.categories.map((category) => category.category.code).join(", ")}
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Performance</span>
                  <span>{supplier.performance}</span>
                </div>
                <Progress value={supplier.performance} />
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Reliability</span>
                  <span>{supplier.reliability}</span>
                </div>
                <Progress value={supplier.reliability} />
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Efficiency</span>
                  <span>{supplier.efficiency}</span>
                </div>
                <Progress value={supplier.efficiency} />
              </div>
              <div className="rounded-2xl border border-cyan-300/20 bg-cyan-500/10 p-3 text-xs">
                <p className="text-cyan-100">Estimated annual deal {formatCompactMoney(supplier.preview.annualCost)}</p>
                <p className="mt-1 text-cyan-100/80">Signing fee {formatCompactMoney(supplier.preview.signingFee)}</p>
                <p className="mt-1 text-cyan-100/80">Negotiation confidence {supplier.preview.negotiationConfidence}%</p>
              </div>

              {supplier.currentTypeContract ? (
                <Badge className="rounded-full border border-amber-300/35 bg-amber-400/10 text-amber-100">
                  Replaces {supplier.currentTypeContract.supplier.name}
                </Badge>
              ) : null}
              {supplier.isCurrentSupplier ? (
                <Badge className="rounded-full border border-emerald-300/35 bg-emerald-500/10 text-emerald-100">
                  {t("commercial.activeSupplier", "Active supplier")}
                </Badge>
              ) : null}

              <div className="flex items-center gap-2">
                <select
                  value={termBySupplier[supplier.id] ?? 2}
                  onChange={(event) =>
                    setTermBySupplier((current) => ({
                      ...current,
                      [supplier.id]: Number(event.target.value),
                    }))
                  }
                  className="h-9 rounded-xl border border-white/20 bg-background/40 px-2 text-xs text-foreground"
                >
                  <option value={1}>1 year</option>
                  <option value={2}>2 years</option>
                  <option value={3}>3 years</option>
                </select>
                <Button
                  variant="premium"
                  size="sm"
                  className="h-9 flex-1"
                  disabled={isPending || supplier.isCurrentSupplier}
                  onClick={() => negotiateDeal(supplier.id)}
                >
                  {supplier.isCurrentSupplier
                    ? t("commercial.currentDeal", "Current Deal")
                    : t("commercial.negotiateDeal", "Negotiate Deal")}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
