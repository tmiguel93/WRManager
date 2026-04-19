"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { HqCashPoint } from "@/features/hq/types";

interface HqCashflowChartProps {
  data: HqCashPoint[];
}

export function HqCashflowChart({ data }: HqCashflowChartProps) {
  return (
    <div className="h-64 w-full min-w-0">
      <ResponsiveContainer width="100%" height={256}>
        <AreaChart data={data} margin={{ left: 0, right: 8, top: 10, bottom: 0 }}>
          <defs>
            <linearGradient id="cashGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.5} />
              <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="4 4" stroke="rgba(148,163,184,0.18)" />
          <XAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fill: "#94a3b8", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => `$${Math.round(value / 1_000_000)}M`}
          />
          <Tooltip
            cursor={{ stroke: "rgba(34,211,238,0.4)", strokeWidth: 1 }}
            contentStyle={{
              background: "rgba(2,6,23,0.92)",
              border: "1px solid rgba(34,211,238,0.25)",
              borderRadius: 12,
              color: "#e2e8f0",
            }}
            formatter={(value) => {
              const numeric = typeof value === "number" ? value : Number(value ?? 0);
              return [`$${numeric.toLocaleString("en-US")}`, "Balance"];
            }}
          />
          <Area
            type="monotone"
            dataKey="balance"
            stroke="#22d3ee"
            strokeWidth={2.2}
            fill="url(#cashGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
