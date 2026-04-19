"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { CarFront, CheckCircle2, ChevronLeft, ChevronRight, Crown, Shield, Sparkles } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { CountryFlag } from "@/components/common/country-flag";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MANAGER_PROFILES } from "@/config/manager-profiles";
import { formatCompactMoney } from "@/lib/format";
import type {
  CareerSetupCategory,
  CareerSetupSupplier,
  CareerSetupTeam,
} from "@/features/career/types";
import { createCareerSchema, type CreateCareerInput } from "@/features/career/schema";
import { createCareerAction } from "@/app/career/new/actions";
import { cn } from "@/lib/utils";

interface NewCareerWizardProps {
  categories: CareerSetupCategory[];
  teams: CareerSetupTeam[];
  suppliers: CareerSetupSupplier[];
}

const STEPS = [
  "New Career",
  "Category Selection",
  "Team Selection / My Team Creator",
  "Review & Launch",
] as const;

export function NewCareerWizard({ categories, teams, suppliers }: NewCareerWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isPending, startTransition] = useTransition();

  const form = useForm<CreateCareerInput>({
    resolver: zodResolver(createCareerSchema),
    defaultValues: {
      careerName: "Road to Glory",
      mode: "TEAM_PRINCIPAL",
      managerProfileCode: "ESTRATEGISTA",
      categoryId: categories[0]?.id ?? "",
      myTeamPrimaryColor: "#0ea5e9",
      myTeamSecondaryColor: "#facc15",
      requestedBudget: 75_000_000,
    },
  });

  const selectedCategoryId = form.watch("categoryId");
  const selectedMode = form.watch("mode");
  const selectedTeamId = form.watch("selectedTeamId");
  const selectedManagerProfile = form.watch("managerProfileCode");
  const careerName = form.watch("careerName");
  const myTeamName = form.watch("myTeamName");

  const filteredTeams = useMemo(
    () => teams.filter((team) => team.categoryId === selectedCategoryId),
    [teams, selectedCategoryId],
  );

  const compatibleEngineSuppliers = useMemo(
    () =>
      suppliers.filter((supplier) =>
        supplier.compatibleCategoryIds.includes(selectedCategoryId),
      ),
    [suppliers, selectedCategoryId],
  );

  const selectedTeamName =
    teams.find((team) => team.id === selectedTeamId)?.name ?? "Independent Start";

  async function handleNextStep() {
    if (step === 1) {
      const ok = await form.trigger(["careerName", "mode", "managerProfileCode"]);
      if (!ok) return;
    }

    if (step === 2) {
      const ok = await form.trigger(["categoryId"]);
      if (!ok) return;
      form.setValue("selectedTeamId", undefined);
      form.setValue("startingSupplierId", undefined);
    }

    if (step === 3) {
      if (selectedMode === "TEAM_PRINCIPAL") {
        const ok = await form.trigger(["selectedTeamId"]);
        if (!ok) return;
      }
      if (selectedMode === "MY_TEAM") {
        const ok = await form.trigger([
          "myTeamName",
          "myTeamShortName",
          "myTeamCountryCode",
          "myTeamHeadquarters",
          "myTeamPhilosophy",
          "startingSupplierId",
          "requestedBudget",
        ]);
        if (!ok) return;
      }
    }

    setStep((current) => Math.min(STEPS.length, current + 1));
  }

  function handlePreviousStep() {
    setStep((current) => Math.max(1, current - 1));
  }

  function submitCareer(values: CreateCareerInput) {
    startTransition(async () => {
      const result = await createCareerAction(values);
      if (!result.ok || !result.careerId) {
        toast.error(result.message);
        return;
      }
      toast.success("Career launched. Welcome to the paddock.");
      router.push(`/game/hq?careerId=${result.careerId}`);
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-3 md:grid-cols-4">
        {STEPS.map((stepLabel, index) => {
          const isCurrent = step === index + 1;
          const isCompleted = step > index + 1;
          return (
            <div
              key={stepLabel}
              className={cn(
                "rounded-2xl border p-3 text-xs transition-colors",
                isCurrent
                  ? "border-cyan-300/60 bg-cyan-500/15 text-cyan-100"
                  : "border-white/10 bg-white/5 text-muted-foreground",
              )}
            >
              <p className="uppercase tracking-[0.16em]">Step {index + 1}</p>
              <p className="mt-2 font-medium text-sm">{stepLabel}</p>
              {isCompleted ? <CheckCircle2 className="mt-2 size-4 text-emerald-300" /> : null}
            </div>
          );
        })}
      </section>

      <form onSubmit={form.handleSubmit(submitCareer)} className="space-y-8">
        {step === 1 ? (
          <Card className="premium-card">
            <CardHeader>
              <CardTitle className="font-heading text-2xl">New Career</CardTitle>
              <CardDescription>
                Defina identidade da carreira, modo e perfil de gestão.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Career Name</label>
                  <Input
                    value={form.watch("careerName") ?? ""}
                    onChange={(event) => form.setValue("careerName", event.target.value, { shouldValidate: true })}
                    placeholder="Dynasty 2026"
                  />
                  <p className="text-xs text-rose-300">{form.formState.errors.careerName?.message}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Career Mode</label>
                  <Select
                    value={form.watch("mode")}
                    onValueChange={(value) =>
                      form.setValue("mode", value as CreateCareerInput["mode"], {
                        shouldValidate: true,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TEAM_PRINCIPAL">Team Principal Career</SelectItem>
                      <SelectItem value="MY_TEAM">Create Your Team</SelectItem>
                      <SelectItem value="GLOBAL">Global Career Mode</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium">Manager Profile</label>
                <div className="grid gap-3">
                  {MANAGER_PROFILES.map((profile) => (
                    <button
                      key={profile.code}
                      type="button"
                      className={cn(
                        "rounded-2xl border p-3 text-left transition-colors",
                        selectedManagerProfile === profile.code
                          ? "border-cyan-300/70 bg-cyan-500/15"
                          : "border-white/10 bg-white/5 hover:border-white/20",
                      )}
                      onClick={() =>
                        form.setValue("managerProfileCode", profile.code, { shouldValidate: true })
                      }
                    >
                      <p className="text-sm font-semibold">{profile.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{profile.style}</p>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {step === 2 ? (
          <Card className="premium-card">
            <CardHeader>
              <CardTitle className="font-heading text-2xl">Category Selection</CardTitle>
              <CardDescription>
                Escolha a série onde seu programa começa.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {categories.map((category) => {
                const selected = selectedCategoryId === category.id;
                return (
                  <button
                    key={category.id}
                    type="button"
                    className={cn(
                      "rounded-2xl border p-4 text-left transition-colors",
                      selected
                        ? "border-cyan-300/60 bg-cyan-500/15"
                        : "border-white/10 bg-white/5 hover:border-white/20",
                    )}
                    onClick={() => form.setValue("categoryId", category.id, { shouldValidate: true })}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{category.name}</p>
                      <Badge className="border border-white/15 bg-white/10">{category.code}</Badge>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {category.discipline.replaceAll("_", " ")} • Tier {category.tier}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Teams: {category.teamsCount} • Region: {category.region}
                    </p>
                  </button>
                );
              })}
            </CardContent>
          </Card>
        ) : null}

        {step === 3 ? (
          <Card className="premium-card">
            <CardHeader>
              <CardTitle className="font-heading text-2xl">
                {selectedMode === "MY_TEAM" ? "My Team Creator" : "Team Selection"}
              </CardTitle>
              <CardDescription>
                {selectedMode === "MY_TEAM"
                  ? "Construa sua equipe do zero com identidade, orçamento e fornecedor base."
                  : "Selecione uma equipe existente para assumir o comando."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {selectedMode !== "MY_TEAM" ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {filteredTeams.map((team) => {
                    const selected = selectedTeamId === team.id;
                    return (
                      <button
                        key={team.id}
                        type="button"
                        className={cn(
                          "rounded-2xl border p-4 text-left transition-colors",
                          selected
                            ? "border-cyan-300/60 bg-cyan-500/15"
                            : "border-white/10 bg-white/5 hover:border-white/20",
                        )}
                        onClick={() => form.setValue("selectedTeamId", team.id, { shouldValidate: true })}
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-semibold">{team.name}</p>
                          <Badge className="border border-white/15 bg-white/10">{team.categoryCode}</Badge>
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                          <CountryFlag countryCode={team.countryCode} className="h-4 w-6" />
                          {team.countryCode}
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">
                          Budget {formatCompactMoney(team.budget)} • Reputation {team.reputation}
                        </p>
                        <div className="mt-3 h-2 rounded-full" style={{ background: `linear-gradient(90deg, ${team.primaryColor}, ${team.secondaryColor})` }} />
                      </button>
                    );
                  })}

                  {selectedMode === "GLOBAL" ? (
                    <button
                      type="button"
                      className={cn(
                        "rounded-2xl border p-4 text-left transition-colors",
                        !selectedTeamId
                          ? "border-amber-300/60 bg-amber-400/10"
                          : "border-white/10 bg-white/5 hover:border-white/20",
                      )}
                      onClick={() => form.setValue("selectedTeamId", undefined)}
                    >
                      <p className="font-semibold">Start as Independent Director</p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Begin without controlling a team immediately and observe the ecosystem.
                      </p>
                    </button>
                  ) : null}
                </div>
              ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Team Name</label>
                    <Input
                      value={form.watch("myTeamName") ?? ""}
                      onChange={(event) => form.setValue("myTeamName", event.target.value, { shouldValidate: true })}
                      placeholder="Apex Quantum GP"
                    />
                    <p className="text-xs text-rose-300">{form.formState.errors.myTeamName?.message}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Short Name</label>
                    <Input
                      value={form.watch("myTeamShortName") ?? ""}
                      onChange={(event) => form.setValue("myTeamShortName", event.target.value, { shouldValidate: true })}
                      placeholder="AQG"
                    />
                    <p className="text-xs text-rose-300">{form.formState.errors.myTeamShortName?.message}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Country Code (ISO)</label>
                    <Input
                      value={form.watch("myTeamCountryCode") ?? ""}
                      onChange={(event) => form.setValue("myTeamCountryCode", event.target.value.toUpperCase(), { shouldValidate: true })}
                      placeholder="US"
                      maxLength={2}
                    />
                    <p className="text-xs text-rose-300">{form.formState.errors.myTeamCountryCode?.message}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Headquarters</label>
                    <Input
                      value={form.watch("myTeamHeadquarters") ?? ""}
                      onChange={(event) => form.setValue("myTeamHeadquarters", event.target.value, { shouldValidate: true })}
                      placeholder="Silverstone"
                    />
                    <p className="text-xs text-rose-300">{form.formState.errors.myTeamHeadquarters?.message}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Primary Color</label>
                    <Input
                      type="color"
                      value={form.watch("myTeamPrimaryColor") ?? "#0ea5e9"}
                      onChange={(event) => form.setValue("myTeamPrimaryColor", event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Secondary Color</label>
                    <Input
                      type="color"
                      value={form.watch("myTeamSecondaryColor") ?? "#facc15"}
                      onChange={(event) => form.setValue("myTeamSecondaryColor", event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Starting Budget</label>
                    <Input
                      type="number"
                      min={25_000_000}
                      max={150_000_000}
                      value={form.watch("requestedBudget") ?? 75_000_000}
                      onChange={(event) =>
                        form.setValue("requestedBudget", Number(event.target.value), {
                          shouldValidate: true,
                        })
                      }
                    />
                    <p className="text-xs text-rose-300">{form.formState.errors.requestedBudget?.message}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Starting Power Unit Supplier</label>
                    <Select
                      value={form.watch("startingSupplierId")}
                      onValueChange={(value) =>
                        form.setValue("startingSupplierId", value ?? undefined, { shouldValidate: true })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose supplier" />
                      </SelectTrigger>
                      <SelectContent>
                        {compatibleEngineSuppliers.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id}>
                            {supplier.name} • PERF {supplier.performance}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-rose-300">{form.formState.errors.startingSupplierId?.message}</p>
                  </div>
                  <div className="space-y-2 lg:col-span-2">
                    <label className="text-sm font-medium">Team Philosophy</label>
                    <Textarea
                      rows={4}
                      value={form.watch("myTeamPhilosophy") ?? ""}
                      onChange={(event) => form.setValue("myTeamPhilosophy", event.target.value, { shouldValidate: true })}
                      placeholder="Long-run technical excellence with rookie development focus."
                    />
                    <p className="text-xs text-rose-300">{form.formState.errors.myTeamPhilosophy?.message}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : null}

        {step === 4 ? (
          <Card className="premium-card">
            <CardHeader>
              <CardTitle className="font-heading text-2xl">Review & Launch</CardTitle>
              <CardDescription>
                Valide os parâmetros da carreira antes de iniciar a temporada.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Career</p>
                <p className="mt-2 text-lg font-semibold">{careerName}</p>
                <p className="text-sm text-muted-foreground">{selectedMode.replaceAll("_", " ")}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Manager Profile</p>
                <p className="mt-2 text-lg font-semibold">
                  {MANAGER_PROFILES.find((profile) => profile.code === selectedManagerProfile)?.name}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Category Selection</p>
                <p className="mt-2 text-lg font-semibold">
                  {categories.find((category) => category.id === selectedCategoryId)?.name}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  {selectedMode === "MY_TEAM" ? "My Team Creator" : "Team Selection"}
                </p>
                <p className="mt-2 text-lg font-semibold">
                  {selectedMode === "MY_TEAM" ? myTeamName : selectedTeamName}
                </p>
              </div>
              {selectedMode === "MY_TEAM" ? (
                <div className="rounded-2xl border border-cyan-300/35 bg-cyan-500/10 p-4 md:col-span-2">
                  <p className="text-xs uppercase tracking-[0.14em] text-cyan-100/80">Launch Package</p>
                  <p className="mt-2 text-sm text-cyan-50">
                    Inclui equipe criada, lineup inicial de pilotos/staff, contratos de fornecedor e save inicial.
                  </p>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ) : null}

        <div className="flex flex-wrap justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={handlePreviousStep}
            disabled={step === 1 || isPending}
            className="rounded-2xl border border-white/15"
          >
            <ChevronLeft className="mr-1 size-4" />
            Back
          </Button>

          {step < STEPS.length ? (
            <Button
              type="button"
              variant="primary"
              className="rounded-2xl px-6"
              onClick={handleNextStep}
            >
              Next
              <ChevronRight className="ml-1 size-4" />
            </Button>
          ) : (
            <Button type="submit" variant="premium" className="rounded-2xl px-6" disabled={isPending}>
              <Sparkles className="mr-2 size-4" />
              {isPending ? "Launching..." : "Launch Career"}
            </Button>
          )}
        </div>
      </form>

      <section className="grid gap-3 md:grid-cols-3">
        <Card className="premium-card border-cyan-300/20">
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Team Principal</p>
            <p className="mt-2 flex items-center gap-2 text-sm"><Crown className="size-4 text-amber-200" /> Assume an existing real team.</p>
          </CardContent>
        </Card>
        <Card className="premium-card border-emerald-300/20">
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">My Team</p>
            <p className="mt-2 flex items-center gap-2 text-sm"><CarFront className="size-4 text-emerald-200" /> Build a custom organization from zero.</p>
          </CardContent>
        </Card>
        <Card className="premium-card border-violet-300/20">
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Global Mode</p>
            <p className="mt-2 flex items-center gap-2 text-sm"><Shield className="size-4 text-violet-200" /> Start with broad ecosystem control.</p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
