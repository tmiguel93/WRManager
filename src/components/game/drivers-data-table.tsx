"use client";

import * as React from "react";
import Link from "next/link";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type ColumnDef,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";

import { EntityAvatar } from "@/components/common/entity-avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCompactMoney } from "@/lib/format";

export interface DriverRow {
  id: string;
  name: string;
  countryCode: string;
  category: string;
  team: string;
  overall: number;
  potential: number;
  reputation: number;
  marketValue: number;
  primaryTrait: string;
  age: number;
  status: "CONTRACTED" | "FREE_AGENT";
  imageUrl?: string | null;
}

const columns: ColumnDef<DriverRow>[] = [
  {
    accessorKey: "name",
    header: "Driver",
    cell: ({ row }) => (
      <Link href={`/game/drivers/${row.original.id}`} className="group flex items-center gap-3">
        <EntityAvatar
          entityType="DRIVER"
          name={row.original.name}
          countryCode={row.original.countryCode}
          imageUrl={row.original.imageUrl}
          className="shrink-0"
        />
        <div>
          <p className="text-sm font-medium group-hover:text-cyan-100">{row.original.name}</p>
          <p className="text-xs text-muted-foreground">{row.original.primaryTrait}</p>
        </div>
      </Link>
    ),
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => (
      <Badge className="rounded-full border border-white/15 bg-white/10 text-xs">{row.original.category}</Badge>
    ),
  },
  { accessorKey: "team", header: "Team" },
  { accessorKey: "age", header: "Age" },
  { accessorKey: "overall", header: "OVR" },
  { accessorKey: "potential", header: "POT" },
  { accessorKey: "reputation", header: "REP" },
  {
    accessorKey: "marketValue",
    header: "Value",
    cell: ({ row }) => <span className="text-xs text-cyan-100">{formatCompactMoney(row.original.marketValue)}</span>,
  },
];

export function DriversDataTable({ data }: { data: DriverRow[] }) {
  const [sorting, setSorting] = React.useState<SortingState>([{ id: "overall", desc: true }]);
  const [search, setSearch] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState("ALL");
  const [countryFilter, setCountryFilter] = React.useState("ALL");
  const [statusFilter, setStatusFilter] = React.useState("ALL");
  const [minPotential, setMinPotential] = React.useState(0);
  const [maxAge, setMaxAge] = React.useState(50);

  const categories = React.useMemo(
    () => ["ALL", ...new Set(data.map((driver) => driver.category).sort((a, b) => a.localeCompare(b)))],
    [data],
  );
  const countries = React.useMemo(
    () => ["ALL", ...new Set(data.map((driver) => driver.countryCode).sort((a, b) => a.localeCompare(b)))],
    [data],
  );

  const filteredData = React.useMemo(() => {
    const term = search.trim().toLowerCase();

    return data.filter((driver) => {
      if (term) {
        const matchesSearch =
          driver.name.toLowerCase().includes(term) ||
          driver.team.toLowerCase().includes(term) ||
          driver.category.toLowerCase().includes(term);
        if (!matchesSearch) return false;
      }

      if (categoryFilter !== "ALL" && driver.category !== categoryFilter) return false;
      if (countryFilter !== "ALL" && driver.countryCode !== countryFilter) return false;
      if (statusFilter !== "ALL" && driver.status !== statusFilter) return false;
      if (driver.potential < minPotential) return false;
      if (driver.age > maxAge) return false;

      return true;
    });
  }, [data, search, categoryFilter, countryFilter, statusFilter, minPotential, maxAge]);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 xl:grid-cols-6">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search driver, team or category"
          className="h-10 border-white/20 bg-background/40 xl:col-span-2"
        />

        <select
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
          className="h-10 rounded-xl border border-white/20 bg-background/40 px-2 text-xs text-foreground"
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {category === "ALL" ? "All categories" : category}
            </option>
          ))}
        </select>

        <select
          value={countryFilter}
          onChange={(event) => setCountryFilter(event.target.value)}
          className="h-10 rounded-xl border border-white/20 bg-background/40 px-2 text-xs text-foreground"
        >
          {countries.map((country) => (
            <option key={country} value={country}>
              {country === "ALL" ? "All countries" : country}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="h-10 rounded-xl border border-white/20 bg-background/40 px-2 text-xs text-foreground"
        >
          <option value="ALL">All status</option>
          <option value="CONTRACTED">Contracted</option>
          <option value="FREE_AGENT">Free agent</option>
        </select>

        <Badge className="h-10 justify-center rounded-full border border-cyan-300/35 bg-cyan-500/10 text-cyan-100">
          {filteredData.length} listed
        </Badge>

        <div className="xl:col-span-3">
          <label className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Min potential: {minPotential}</label>
          <input
            type="range"
            min={0}
            max={99}
            value={minPotential}
            onChange={(event) => setMinPotential(Number(event.target.value))}
            className="mt-1 w-full"
          />
        </div>

        <div className="xl:col-span-3">
          <label className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Max age: {maxAge}</label>
          <input
            type="range"
            min={16}
            max={45}
            value={maxAge}
            onChange={(event) => setMaxAge(Number(event.target.value))}
            className="mt-1 w-full"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-card/60">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-white/10 hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} className="border-white/10 hover:bg-white/5">
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
