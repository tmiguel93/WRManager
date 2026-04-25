"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { EntityAvatar } from "@/components/common/entity-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { submitScoutingProposalAction } from "@/app/(game)/game/scouting/actions";
import { useI18n } from "@/i18n/client";
import { formatCompactMoney } from "@/lib/format";

interface DriverRow {
  id: string;
  displayName: string;
  countryCode: string;
  imageUrl: string | null;
  currentCategoryCode: string;
  currentTeamName: string;
  scoutingScore: number;
  overall: number;
  potential: number;
  marketValue: number;
  salary: number;
  primaryTraitName: string;
}

interface StaffRow {
  id: string;
  name: string;
  countryCode: string;
  imageUrl: string | null;
  role: string;
  reputation: number;
  specialty: string;
  salary: number;
}

interface ScoutingBoardProps {
  freeAgents: DriverRow[];
  breakoutTargets: DriverRow[];
  staffMarket: StaffRow[];
}

type TargetState = {
  targetType: "DRIVER" | "STAFF";
  targetId: string;
  targetName: string;
};

export function ScoutingBoard({ freeAgents, breakoutTargets, staffMarket }: ScoutingBoardProps) {
  const { t } = useI18n();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [target, setTarget] = useState<TargetState | null>(null);
  const [role, setRole] = useState("Race Driver");
  const [annualSalary, setAnnualSalary] = useState(2_000_000);
  const [bonus, setBonus] = useState(250_000);
  const [durationYears, setDurationYears] = useState(2);

  function openDriverDialog(driver: DriverRow) {
    setTarget({ targetType: "DRIVER", targetId: driver.id, targetName: driver.displayName });
    setRole("Race Driver");
    setAnnualSalary(driver.salary);
    setBonus(Math.round(driver.salary * 0.12));
    setDurationYears(2);
    setDialogOpen(true);
  }

  function openStaffDialog(staff: StaffRow) {
    setTarget({ targetType: "STAFF", targetId: staff.id, targetName: staff.name });
    setRole(staff.role);
    setAnnualSalary(staff.salary);
    setBonus(Math.round(staff.salary * 0.08));
    setDurationYears(2);
    setDialogOpen(true);
  }

  function submitProposal() {
    if (!target) return;

    startTransition(async () => {
      const result = await submitScoutingProposalAction({
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

  return (
    <div className="space-y-8">
      <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl">{t("scouting.freeAgents", "Top Free Agents")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {freeAgents.slice(0, 12).map((driver) => (
              <div
                key={driver.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-3"
              >
                <Link href={`/game/drivers/${driver.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <EntityAvatar
                    entityType="DRIVER"
                    name={driver.displayName}
                    countryCode={driver.countryCode}
                    imageUrl={driver.imageUrl}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{driver.displayName}</p>
                    <p className="text-xs text-muted-foreground">
                      {driver.currentCategoryCode} - OVR {driver.overall} / POT {driver.potential}
                    </p>
                    <p className="text-xs text-muted-foreground">{driver.primaryTraitName}</p>
                  </div>
                </Link>
                <div className="flex items-center gap-2">
                  <Badge className="rounded-full border border-cyan-300/35 bg-cyan-500/10 text-cyan-100 text-xs">
                    {t("scouting.score", "Score")} {driver.scoutingScore}
                  </Badge>
                  <Button size="sm" variant="primary" disabled={isPending} onClick={() => openDriverDialog(driver)}>
                    {t("contracts.sendProposal", "Send proposal")}
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl">{t("scouting.staffOps", "Staff Opportunities")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {staffMarket.slice(0, 12).map((member) => (
              <div key={member.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                <Link href={`/game/staff/${member.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <EntityAvatar
                    entityType="STAFF"
                    name={member.name}
                    countryCode={member.countryCode}
                    imageUrl={member.imageUrl}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{member.name}</p>
                    <p className="text-xs text-muted-foreground">{member.role} - {member.specialty}</p>
                  </div>
                </Link>
                <div className="flex items-center gap-2">
                  <Badge className="rounded-full border border-white/15 bg-white/10 text-xs">REP {member.reputation}</Badge>
                  <Button size="sm" variant="primary" disabled={isPending} onClick={() => openStaffDialog(member)}>
                    {t("contracts.sendProposal", "Send proposal")}
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <Card className="premium-card">
        <CardHeader>
          <CardTitle className="font-heading text-xl">{t("scouting.breakout", "Breakout Targets")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {breakoutTargets.slice(0, 12).map((driver) => (
            <div key={driver.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <Link href={`/game/drivers/${driver.id}`} className="flex items-center gap-3">
                <EntityAvatar
                  entityType="DRIVER"
                  name={driver.displayName}
                  countryCode={driver.countryCode}
                  imageUrl={driver.imageUrl}
                />
                <div>
                  <p className="text-sm font-medium">{driver.displayName}</p>
                  <p className="text-xs text-muted-foreground">{driver.currentTeamName} - {driver.currentCategoryCode}</p>
                </div>
              </Link>
              <div className="mt-3 flex items-center justify-between text-xs">
                <span>{t("scouting.score", "Score")} {driver.scoutingScore}</span>
                <span>{formatCompactMoney(driver.marketValue)}</span>
              </div>
              <div className="mt-3">
                <Button size="sm" variant="secondary" className="w-full" onClick={() => openDriverDialog(driver)}>
                  {t("contracts.sendProposal", "Send proposal")}
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="border-white/20 bg-[#070d1c] text-foreground">
          <DialogHeader>
            <DialogTitle>{t("scouting.negotiationTitle", "Negotiation Proposal")}</DialogTitle>
            <DialogDescription>
              {t(
                "scouting.negotiationDesc",
                `Offer a contract to ${target?.targetName ?? "target"}. Responses may be accepted, rejected or counter-offered.`,
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid gap-2">
              <label className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{t("scouting.role", "Role")}</label>
              <Input value={role} onChange={(event) => setRole(event.target.value)} className="h-10 border-white/20" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <label className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{t("scouting.annualSalary", "Annual Salary")}</label>
                <Input
                  type="number"
                  value={annualSalary}
                  onChange={(event) => setAnnualSalary(Number(event.target.value))}
                  className="h-10 border-white/20"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{t("scouting.signingBonus", "Signing Bonus")}</label>
                <Input
                  type="number"
                  value={bonus}
                  onChange={(event) => setBonus(Number(event.target.value))}
                  className="h-10 border-white/20"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <label className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{t("scouting.duration", "Duration (years)")}</label>
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
              {t("scouting.estimatedCost", "Estimated immediate cost")}: {formatCompactMoney(Math.round(annualSalary * 0.12 + bonus))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)} disabled={isPending}>
              {t("scouting.cancel", "Cancel")}
            </Button>
            <Button variant="premium" onClick={submitProposal} disabled={isPending || !target}>
              {isPending ? t("scouting.sending", "Sending...") : t("contracts.sendProposal", "Send proposal")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
