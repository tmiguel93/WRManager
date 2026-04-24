"use client";

import { useMemo, useState, useTransition, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

import { EntityAvatar } from "@/components/common/entity-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TeamLogoMark } from "@/components/common/team-logo-mark";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { createTeamTheme } from "@/lib/team-theme";
import { cn } from "@/lib/utils";
import { formatCompactMoney } from "@/lib/format";
import { finalizeOnboardingAction, submitOnboardingProposalAction } from "@/app/career/onboarding/actions";

interface DriverMarketRow {
  id: string;
  displayName: string;
  countryCode: string;
  imageUrl: string | null;
  overall: number;
  potential: number;
  salary: number;
  marketValue: number;
  currentCategory: { code: string } | null;
  traits: Array<{ trait: { name: string } }>;
}

interface StaffMarketRow {
  id: string;
  name: string;
  role: string;
  specialty: string;
  countryCode: string;
  imageUrl: string | null;
  reputation: number;
  salary: number;
  currentCategory: { code: string } | null;
  traits: Array<{ trait: { name: string } }>;
}

interface SignedDriverRow {
  id: string;
  role: string;
  annualSalary: number;
  driver: {
    id: string;
    displayName: string;
    countryCode: string;
    imageUrl: string | null;
    overall: number;
    potential: number;
    morale: number;
  };
}

interface SignedStaffRow {
  id: string;
  role: string;
  annualSalary: number;
  staff: {
    id: string;
    name: string;
    countryCode: string;
    imageUrl: string | null;
    reputation: number;
    specialty: string;
  };
}

interface MyTeamOnboardingProps {
  careerId: string;
  managerProfileCode: string;
  team: {
    id: string;
    name: string;
    shortName: string;
    countryCode: string;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string | null;
    logoUrl: string | null;
    budget: number;
  };
  category: {
    code: string;
    name: string;
    tier: number;
  };
  cashBalance: number;
  lineup: {
    activeDriverCount: number;
    activeStaffCount: number;
    coreRolesMissing: string[];
    minimumReady: boolean;
    payroll: number;
    drivers: SignedDriverRow[];
    staff: SignedStaffRow[];
  };
  market: {
    drivers: DriverMarketRow[];
    staff: StaffMarketRow[];
  };
}

type TargetType = "DRIVER" | "STAFF";

interface NegotiationTarget {
  targetType: TargetType;
  targetId: string;
  name: string;
  baseSalary: number;
  suggestedRole: string;
}

const managerHintByProfile: Record<string, string> = {
  NEGOCIADOR: "Negotiator profile: stronger deal leverage in contract talks.",
  ESTRATEGISTA: "Strategist profile: balanced deal quality and operational consistency.",
  ENGENHEIRO: "Engineer profile: stronger technical upside, weaker star appeal.",
  VISIONARIO: "Visionary profile: long-term upside and ambitious project narrative.",
  FORMADOR: "Mentor profile: stronger growth appeal for young talent.",
  COMERCIAL: "Commercial profile: sponsorship and salary flexibility edge.",
  MOTIVADOR: "Motivator profile: morale and acceptance probability boost.",
  DIRETOR_GLOBAL: "Global Director profile: broad ecosystem influence and flexibility.",
};

const requirementLabel: Record<string, string> = {
  DRIVERS_2: "2 signed drivers",
  TECHNICAL_LEADERSHIP: "technical leadership",
  STRATEGY_LEADERSHIP: "strategy leadership",
};

export function MyTeamOnboarding({
  careerId,
  managerProfileCode,
  team,
  category,
  cashBalance,
  lineup,
  market,
}: MyTeamOnboardingProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [target, setTarget] = useState<NegotiationTarget | null>(null);
  const [role, setRole] = useState("Race Driver");
  const [annualSalary, setAnnualSalary] = useState(0);
  const [bonus, setBonus] = useState(250_000);
  const [durationYears, setDurationYears] = useState(2);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [teamLogoUrl, setTeamLogoUrl] = useState(team.logoUrl);

  const palette = useMemo(
    () => createTeamTheme({ primary: team.primaryColor, secondary: team.secondaryColor, accent: team.accentColor }),
    [team.accentColor, team.primaryColor, team.secondaryColor],
  );

  const lockedReason = useMemo(() => {
    if (lineup.activeDriverCount < 2 && lineup.coreRolesMissing.length > 0) {
      return "Sign at least 2 drivers and complete the core staff roles before launch.";
    }
    if (lineup.activeDriverCount < 2) {
      return "Sign at least 2 race drivers before launch.";
    }
    if (lineup.coreRolesMissing.length > 0) {
      const labels = lineup.coreRolesMissing.map((code) => requirementLabel[code] ?? code);
      return `Core roles missing: ${labels.join(", ")}.`;
    }
    return null;
  }, [lineup.activeDriverCount, lineup.coreRolesMissing]);

  function openDriverNegotiation(driver: DriverMarketRow) {
    setTarget({
      targetType: "DRIVER",
      targetId: driver.id,
      name: driver.displayName,
      baseSalary: driver.salary,
      suggestedRole: lineup.activeDriverCount === 0 ? "Lead Driver" : "Race Driver",
    });
    setRole(lineup.activeDriverCount === 0 ? "Lead Driver" : "Race Driver");
    setAnnualSalary(driver.salary);
    setBonus(Math.round(driver.salary * 0.12));
    setDurationYears(2);
    setDialogOpen(true);
  }

  async function handleLogoUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    event.currentTarget.value = "";
    if (!file) return;

    setIsUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("careerId", careerId);
      formData.append("logo", file);

      const response = await fetch("/api/team-logo/upload", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as {
        ok: boolean;
        message: string;
        logoUrl?: string;
      };

      if (!response.ok || !payload.ok || !payload.logoUrl) {
        toast.error(payload.message || "Could not upload team logo.");
        return;
      }

      setTeamLogoUrl(payload.logoUrl);
      toast.success(payload.message || "Team logo updated.");
      router.refresh();
    } catch {
      toast.error("Could not upload team logo.");
    } finally {
      setIsUploadingLogo(false);
    }
  }

  function openStaffNegotiation(staff: StaffMarketRow) {
    setTarget({
      targetType: "STAFF",
      targetId: staff.id,
      name: staff.name,
      baseSalary: staff.salary,
      suggestedRole: staff.role,
    });
    setRole(staff.role);
    setAnnualSalary(staff.salary);
    setBonus(Math.round(staff.salary * 0.08));
    setDurationYears(2);
    setDialogOpen(true);
  }

  function submitProposal() {
    if (!target) return;

    startTransition(async () => {
      const result = await submitOnboardingProposalAction({
        careerId,
        targetType: target.targetType,
        targetId: target.targetId,
        role,
        annualSalary,
        bonus,
        durationYears,
      });

      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      if (result.status === "ACCEPTED") {
        toast.success(result.message);
      } else if (result.status === "COUNTER") {
        toast.warning(result.message);
      } else {
        toast.error(result.message);
      }

      setDialogOpen(false);
      router.refresh();
    });
  }

  function finalizeOnboarding() {
    startTransition(async () => {
      const result = await finalizeOnboardingAction({ careerId });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      router.push(result.nextPath ?? "/game/hq");
      router.refresh();
    });
  }

  return (
    <div className="space-y-7">
      <Card className="premium-card overflow-hidden">
        <div
          className="h-2"
          style={{
            background: `linear-gradient(90deg, ${palette.primary} 0%, ${palette.secondary} 52%, ${palette.accent} 100%)`,
          }}
        />
        <CardHeader>
          <CardTitle className="font-heading text-2xl">Founding Lineup Negotiation</CardTitle>
          <CardDescription>
            Build your initial roster before entering HQ. Your team launches only after minimum lineup requirements are met.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Team</p>
            <p className="mt-2 text-base font-semibold">{team.name}</p>
            <p className="text-xs text-muted-foreground">{category.code} - Tier {category.tier}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Available Cash</p>
            <p className="mt-2 text-base font-semibold text-emerald-100">{formatCompactMoney(cashBalance)}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Current Payroll</p>
            <p className="mt-2 text-base font-semibold">{formatCompactMoney(lineup.payroll)}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Manager Profile Impact</p>
            <p className="mt-2 text-xs text-muted-foreground">
              {managerHintByProfile[managerProfileCode] ?? "Balanced contract approach for debut season."}
            </p>
          </div>
          <div className="team-soft-surface rounded-2xl border bg-white/5 p-4 md:col-span-2 xl:col-span-4">
            <div className="flex flex-wrap items-center gap-4">
              <TeamLogoMark name={team.name} logoUrl={teamLogoUrl} className="h-20 w-28" priority />
              <div className="min-w-[220px] flex-1">
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Team Branding</p>
                <p className="mt-1 text-sm text-foreground">
                  Upload a PNG logo now and keep this identity across dashboard, standings, race control and cards.
                </p>
                <div className="mt-2 flex gap-2">
                  <span className="h-3 w-8 rounded-full border border-white/25" style={{ backgroundColor: "var(--team-primary)" }} />
                  <span className="h-3 w-8 rounded-full border border-white/25" style={{ backgroundColor: "var(--team-secondary)" }} />
                  <span className="h-3 w-8 rounded-full border border-white/25" style={{ backgroundColor: "var(--team-accent)" }} />
                </div>
              </div>
              <label className={cn("inline-flex", isUploadingLogo && "pointer-events-none opacity-75")}>
                <input
                  type="file"
                  accept="image/png"
                  className="sr-only"
                  onChange={handleLogoUpload}
                  disabled={isUploadingLogo}
                />
                <span className="inline-flex h-10 cursor-pointer items-center rounded-xl border border-white/20 bg-white/10 px-4 text-sm font-medium transition hover:bg-white/15">
                  {isUploadingLogo ? "Uploading..." : "Upload Team Logo (PNG)"}
                </span>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl">Signed Drivers</CardTitle>
            <CardDescription>
              Required minimum: 2 active race drivers. Current: {lineup.activeDriverCount}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {lineup.drivers.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-center gap-3">
                  <EntityAvatar
                    entityType="DRIVER"
                    name={entry.driver.displayName}
                    countryCode={entry.driver.countryCode}
                    imageUrl={entry.driver.imageUrl}
                  />
                  <div>
                    <p className="text-sm font-medium">{entry.driver.displayName}</p>
                    <p className="text-xs text-muted-foreground">
                      {entry.role} - OVR {entry.driver.overall} / POT {entry.driver.potential}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-cyan-100">{formatCompactMoney(entry.annualSalary)}</p>
              </div>
            ))}
            {lineup.drivers.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-muted-foreground">
                No signed drivers yet.
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl">Signed Staff</CardTitle>
            <CardDescription>
              Core roles required: Technical Director and Head of Strategy.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {lineup.staff.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-center gap-3">
                  <EntityAvatar
                    entityType="STAFF"
                    name={entry.staff.name}
                    countryCode={entry.staff.countryCode}
                    imageUrl={entry.staff.imageUrl}
                  />
                  <div>
                    <p className="text-sm font-medium">{entry.staff.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {entry.role} - REP {entry.staff.reputation}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-cyan-100">{formatCompactMoney(entry.annualSalary)}</p>
              </div>
            ))}
            {lineup.staff.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-muted-foreground">
                No signed staff yet.
              </div>
            ) : null}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl">Driver Market</CardTitle>
            <CardDescription>Free agents ready for immediate contract negotiation.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {market.drivers.slice(0, 14).map((driver) => (
              <div key={driver.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-center gap-3">
                  <EntityAvatar
                    entityType="DRIVER"
                    name={driver.displayName}
                    countryCode={driver.countryCode}
                    imageUrl={driver.imageUrl}
                  />
                  <div>
                    <p className="text-sm font-medium">{driver.displayName}</p>
                    <p className="text-xs text-muted-foreground">
                      {driver.currentCategory?.code ?? "OPEN"} - {driver.traits[0]?.trait.name ?? "No highlighted trait"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      OVR {driver.overall} / POT {driver.potential} - {formatCompactMoney(driver.salary)}
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="primary" onClick={() => openDriverNegotiation(driver)} disabled={isPending}>
                  Approach
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl">Staff Market</CardTitle>
            <CardDescription>Recruit technical and strategic leaders for launch.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {market.staff.slice(0, 14).map((staff) => (
              <div key={staff.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-center gap-3">
                  <EntityAvatar
                    entityType="STAFF"
                    name={staff.name}
                    countryCode={staff.countryCode}
                    imageUrl={staff.imageUrl}
                  />
                  <div>
                    <p className="text-sm font-medium">{staff.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {staff.role} - {staff.specialty}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      REP {staff.reputation} - {formatCompactMoney(staff.salary)}
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="primary" onClick={() => openStaffNegotiation(staff)} disabled={isPending}>
                  Approach
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <Card className="premium-card border-cyan-300/25">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <p className="text-sm font-medium">Launch Checklist</p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <Badge className={cn(
                "rounded-full",
                lineup.activeDriverCount >= 2
                  ? "border border-emerald-300/30 bg-emerald-500/10 text-emerald-100"
                  : "border border-amber-300/40 bg-amber-500/10 text-amber-100",
              )}>
                Drivers: {lineup.activeDriverCount}/2
              </Badge>
              <Badge className={cn(
                "rounded-full",
                lineup.coreRolesMissing.length === 0
                  ? "border border-emerald-300/30 bg-emerald-500/10 text-emerald-100"
                  : "border border-amber-300/40 bg-amber-500/10 text-amber-100",
              )}>
                Core Staff: {lineup.coreRolesMissing.length === 0 ? "Complete" : "Pending"}
              </Badge>
            </div>
            {lockedReason ? <p className="mt-2 text-xs text-amber-100/85">{lockedReason}</p> : null}
          </div>
          <Button
            variant="premium"
            className="h-10 rounded-2xl px-5"
            disabled={isPending || !lineup.minimumReady}
            onClick={finalizeOnboarding}
          >
            <Sparkles className="mr-2 size-4" />
            Finalize Team Foundation
          </Button>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="border-white/20 bg-[#070d1c] text-foreground">
          <DialogHeader>
            <DialogTitle>Negotiation Proposal</DialogTitle>
            <DialogDescription>
              Offer terms for {target?.name}. You can tune salary, bonus, duration and role before submission.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="grid gap-2">
              <label className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Role</label>
              <Input value={role} onChange={(event) => setRole(event.target.value)} className="h-10 border-white/20" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <label className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Annual Salary</label>
                <Input
                  type="number"
                  value={annualSalary}
                  onChange={(event) => setAnnualSalary(Number(event.target.value))}
                  className="h-10 border-white/20"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Signing Bonus</label>
                <Input
                  type="number"
                  value={bonus}
                  onChange={(event) => setBonus(Number(event.target.value))}
                  className="h-10 border-white/20"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <label className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Contract Duration (years)</label>
              <Input
                type="number"
                min={1}
                max={5}
                value={durationYears}
                onChange={(event) => setDurationYears(Number(event.target.value))}
                className="h-10 border-white/20"
              />
            </div>
            <div className="rounded-xl border border-cyan-300/25 bg-cyan-500/10 p-3 text-xs text-cyan-100">
              Estimated immediate cost: {formatCompactMoney(Math.round(annualSalary * 0.12 + bonus))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button variant="premium" onClick={submitProposal} disabled={isPending || !target}>
              {isPending ? "Sending..." : "Send Proposal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
