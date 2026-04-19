"use client";

import * as React from "react";

import { EntityAvatar } from "@/components/common/entity-avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface CompareDriver {
  id: string;
  name: string;
  countryCode: string;
  imageUrl?: string | null;
  overall: number;
  potential: number;
  reputation: number;
  team: string;
  category: string;
}

function CompareCard({ label, driver }: { label: string; driver: CompareDriver | null }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      {driver ? (
        <div className="mt-3 space-y-3">
          <div className="flex items-center gap-3">
            <EntityAvatar
              entityType="DRIVER"
              name={driver.name}
              countryCode={driver.countryCode}
              imageUrl={driver.imageUrl}
            />
            <div>
              <p className="text-sm font-medium">{driver.name}</p>
              <p className="text-xs text-muted-foreground">
                {driver.team} - {driver.category}
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <div>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span>Overall</span>
                <span>{driver.overall}</span>
              </div>
              <Progress value={driver.overall} />
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span>Potential</span>
                <span>{driver.potential}</span>
              </div>
              <Progress value={driver.potential} />
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span>Reputation</span>
                <span>{driver.reputation}</span>
              </div>
              <Progress value={driver.reputation} />
            </div>
          </div>
        </div>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">Select a driver.</p>
      )}
    </div>
  );
}

export function DriverComparePanel({ drivers }: { drivers: CompareDriver[] }) {
  const [leftId, setLeftId] = React.useState(drivers[0]?.id ?? "");
  const [rightId, setRightId] = React.useState(drivers[1]?.id ?? "");

  const leftDriver = React.useMemo(() => drivers.find((driver) => driver.id === leftId) ?? null, [drivers, leftId]);
  const rightDriver = React.useMemo(
    () => drivers.find((driver) => driver.id === rightId) ?? null,
    [drivers, rightId],
  );

  const leftAdvantage =
    leftDriver && rightDriver
      ? leftDriver.overall + leftDriver.potential + leftDriver.reputation -
        (rightDriver.overall + rightDriver.potential + rightDriver.reputation)
      : 0;

  return (
    <Card className="premium-card">
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="font-heading text-xl">Quick Compare</CardTitle>
          {leftDriver && rightDriver ? (
            <Badge className="rounded-full border border-cyan-300/35 bg-cyan-500/10 text-cyan-100">
              Delta {leftAdvantage > 0 ? "+" : ""}
              {leftAdvantage}
            </Badge>
          ) : null}
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <select
            value={leftId}
            onChange={(event) => setLeftId(event.target.value)}
            className="h-10 rounded-xl border border-white/20 bg-background/40 px-3 text-sm text-foreground"
          >
            {drivers.map((driver) => (
              <option key={driver.id} value={driver.id}>
                {driver.name}
              </option>
            ))}
          </select>
          <select
            value={rightId}
            onChange={(event) => setRightId(event.target.value)}
            className="h-10 rounded-xl border border-white/20 bg-background/40 px-3 text-sm text-foreground"
          >
            {drivers.map((driver) => (
              <option key={driver.id} value={driver.id}>
                {driver.name}
              </option>
            ))}
          </select>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <CompareCard label="Driver A" driver={leftDriver} />
        <CompareCard label="Driver B" driver={rightDriver} />
      </CardContent>
    </Card>
  );
}
