"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { HqEvolutionPoint } from "@/features/hq/types";

interface HqEvolutionChartProps {
  data: HqEvolutionPoint[];
}

export function HqEvolutionChart({ data }: HqEvolutionChartProps) {
  return (
    <div className="h-64 w-full min-w-0">
      <ResponsiveContainer width="100%" height={256}>
        <LineChart data={data} margin={{ left: 0, right: 8, top: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="4 4" stroke="rgba(148,163,184,0.18)" />
          <XAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis
            domain={[40, 100]}
            tick={{ fill: "#94a3b8", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: "rgba(2,6,23,0.92)",
              border: "1px solid rgba(34,211,238,0.25)",
              borderRadius: 12,
              color: "#e2e8f0",
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line type="monotone" dataKey="performance" stroke="#22d3ee" strokeWidth={2} dot={false} name="Car Perf" />
          <Line type="monotone" dataKey="reputation" stroke="#facc15" strokeWidth={2} dot={false} name="Reputation" />
          <Line type="monotone" dataKey="facilities" stroke="#4ade80" strokeWidth={2} dot={false} name="Facilities" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
