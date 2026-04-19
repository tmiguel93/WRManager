"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Clock3, Download, HardDrive, Save, Trash2 } from "lucide-react";

import { KpiCard } from "@/components/common/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCompactMoney, formatDate } from "@/lib/format";
import type { SaveCenterView } from "@/features/save-system/types";
import {
  createManualSaveAction,
  deleteSaveSlotAction,
  loadSaveSlotAction,
  quickAutoSaveAction,
} from "@/app/(game)/game/save-center/actions";

interface SaveCenterPanelProps {
  view: SaveCenterView;
}

function formatDateTime(iso: string) {
  const date = new Date(iso);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function SaveCenterPanel({ view }: SaveCenterPanelProps) {
  const [isPending, startTransition] = useTransition();
  const [manualName, setManualName] = useState("");

  function handleManualSave() {
    startTransition(async () => {
      const result = await createManualSaveAction({ name: manualName.trim() || undefined });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      setManualName("");
      toast.success(result.message);
    });
  }

  function handleQuickAutosave() {
    startTransition(async () => {
      const result = await quickAutoSaveAction();
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
    });
  }

  function handleLoad(saveSlotId: string) {
    startTransition(async () => {
      const result = await loadSaveSlotAction({ saveSlotId });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
    });
  }

  function handleDelete(saveSlotId: string) {
    startTransition(async () => {
      const result = await deleteSaveSlotAction({ saveSlotId });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
    });
  }

  const manualCount = view.slots.filter((slot) => slot.manual).length;
  const autoCount = view.slots.filter((slot) => !slot.manual).length;
  const latestSlot = view.slots[0] ?? null;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Manual Saves"
          value={`${manualCount}`}
          delta={manualCount * 6 - 12}
          icon={<Save className="size-4" />}
        />
        <KpiCard
          label="Autosave Slots"
          value={`${autoCount}`}
          delta={autoCount * 5 - 8}
          icon={<Clock3 className="size-4" />}
        />
        <KpiCard
          label="Career Cash"
          value={formatCompactMoney(view.cashBalance)}
          delta={(view.cashBalance - 20_000_000) / 1_200_000}
          icon={<HardDrive className="size-4" />}
        />
        <KpiCard
          label="Latest Save"
          value={latestSlot ? formatDate(latestSlot.updatedAtIso.slice(0, 10)) : "None"}
          delta={latestSlot ? 8 : -10}
          icon={<Download className="size-4" />}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl">Create Save</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Manual save name</p>
              <Input
                value={manualName}
                onChange={(event) => setManualName(event.target.value)}
                placeholder="Manual Save - Strategy checkpoint"
                maxLength={80}
                className="border-white/20 bg-background/40"
                disabled={!view.canSave || isPending}
              />
              <p className="text-xs text-muted-foreground">
                Empty name uses a timestamped default.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <Button
                variant="primary"
                className="w-full"
                onClick={handleManualSave}
                disabled={!view.canSave || isPending}
              >
                Create Manual Save
              </Button>
              <Button
                variant="secondary"
                className="w-full"
                onClick={handleQuickAutosave}
                disabled={!view.canSave || isPending}
              >
                Force Autosave
              </Button>
            </div>
            <div className="rounded-2xl border border-cyan-300/25 bg-cyan-500/10 p-3 text-xs text-cyan-100">
              Autosave also runs after key management actions such as weekend simulation and major deals.
            </div>
          </CardContent>
        </Card>

        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl">Restore Policy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Loading a slot restores the stored snapshot for career economy, session progression, results and standings.
            </p>
            <p>
              This allows rollback to a previous strategic state for testing decisions.
            </p>
            <p>
              Manual slots are kept up to 12 per career and autosaves up to 5.
            </p>
            <div className="rounded-2xl border border-amber-300/25 bg-amber-500/10 p-3 text-xs text-amber-100">
              Loading a save replaces current progress in the same career timeline.
            </div>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl">Save Slots</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Type</TableHead>
                    <TableHead className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Name</TableHead>
                    <TableHead className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Updated</TableHead>
                    <TableHead className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Season</TableHead>
                    <TableHead className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Cash</TableHead>
                    <TableHead className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {view.slots.map((slot) => (
                    <TableRow key={slot.id} className="border-white/10 hover:bg-white/5">
                      <TableCell>
                        <Badge
                          className={
                            slot.manual
                              ? "rounded-full border border-cyan-300/35 bg-cyan-500/10 text-cyan-100"
                              : "rounded-full border border-emerald-300/35 bg-emerald-500/10 text-emerald-100"
                          }
                        >
                          {slot.manual ? "MANUAL" : "AUTO"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-medium">{slot.name}</p>
                        <p className="text-xs text-muted-foreground">
                          v{slot.snapshotVersion} - {slot.snapshotLabel}
                        </p>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatDateTime(slot.updatedAtIso)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {slot.seasonYear ? `${slot.seasonYear} · R${slot.currentRound ?? "-"}` : "N/A"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {typeof slot.cashBalance === "number" ? formatCompactMoney(slot.cashBalance) : "N/A"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="border border-white/15 bg-white/5"
                            onClick={() => handleLoad(slot.id)}
                            disabled={isPending || !view.canSave}
                          >
                            Load
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            className="inline-flex items-center gap-1"
                            onClick={() => handleDelete(slot.id)}
                            disabled={isPending || !view.canSave}
                          >
                            <Trash2 className="size-3.5" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {view.slots.length === 0 ? (
              <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-muted-foreground">
                No save slots yet for this career.
              </div>
            ) : null}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
