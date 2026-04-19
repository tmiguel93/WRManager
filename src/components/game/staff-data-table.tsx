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

export interface StaffRow {
  id: string;
  name: string;
  role: string;
  specialty: string;
  countryCode: string;
  category: string;
  team: string;
  reputation: number;
  salary: number;
  imageUrl?: string | null;
}

const columns: ColumnDef<StaffRow>[] = [
  {
    accessorKey: "name",
    header: "Staff Member",
    cell: ({ row }) => (
      <Link href={`/game/staff/${row.original.id}`} className="group flex items-center gap-3">
        <EntityAvatar
          entityType="STAFF"
          name={row.original.name}
          countryCode={row.original.countryCode}
          imageUrl={row.original.imageUrl}
        />
        <div>
          <p className="text-sm font-medium group-hover:text-cyan-100">{row.original.name}</p>
          <p className="text-xs text-muted-foreground">{row.original.role}</p>
        </div>
      </Link>
    ),
  },
  { accessorKey: "team", header: "Team" },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => (
      <Badge className="rounded-full border border-white/15 bg-white/10 text-xs">{row.original.category}</Badge>
    ),
  },
  { accessorKey: "specialty", header: "Specialty" },
  { accessorKey: "reputation", header: "REP" },
  {
    accessorKey: "salary",
    header: "Salary",
    cell: ({ row }) => <span className="text-xs text-cyan-100">{formatCompactMoney(row.original.salary)}</span>,
  },
];

export function StaffDataTable({ data }: { data: StaffRow[] }) {
  const [sorting, setSorting] = React.useState<SortingState>([{ id: "reputation", desc: true }]);
  const [search, setSearch] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState("ALL");
  const [categoryFilter, setCategoryFilter] = React.useState("ALL");
  const [countryFilter, setCountryFilter] = React.useState("ALL");
  const [minReputation, setMinReputation] = React.useState(0);
  const [maxSalary, setMaxSalary] = React.useState(25_000_000);

  const roles = React.useMemo(
    () => ["ALL", ...new Set(data.map((item) => item.role).sort((a, b) => a.localeCompare(b)))],
    [data],
  );
  const categories = React.useMemo(
    () => ["ALL", ...new Set(data.map((item) => item.category).sort((a, b) => a.localeCompare(b)))],
    [data],
  );
  const countries = React.useMemo(
    () => ["ALL", ...new Set(data.map((item) => item.countryCode).sort((a, b) => a.localeCompare(b)))],
    [data],
  );

  const filteredData = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    return data.filter((member) => {
      if (term) {
        const matchesSearch =
          member.name.toLowerCase().includes(term) ||
          member.team.toLowerCase().includes(term) ||
          member.role.toLowerCase().includes(term) ||
          member.specialty.toLowerCase().includes(term);
        if (!matchesSearch) return false;
      }

      if (roleFilter !== "ALL" && member.role !== roleFilter) return false;
      if (categoryFilter !== "ALL" && member.category !== categoryFilter) return false;
      if (countryFilter !== "ALL" && member.countryCode !== countryFilter) return false;
      if (member.reputation < minReputation) return false;
      if (member.salary > maxSalary) return false;

      return true;
    });
  }, [data, search, roleFilter, categoryFilter, countryFilter, minReputation, maxSalary]);

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
          placeholder="Search staff, role or specialty"
          className="h-10 border-white/20 bg-background/40 xl:col-span-2"
        />

        <select
          value={roleFilter}
          onChange={(event) => setRoleFilter(event.target.value)}
          className="h-10 rounded-xl border border-white/20 bg-background/40 px-2 text-xs text-foreground"
        >
          {roles.map((role) => (
            <option key={role} value={role}>
              {role === "ALL" ? "All roles" : role}
            </option>
          ))}
        </select>

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

        <Badge className="h-10 justify-center rounded-full border border-cyan-300/35 bg-cyan-500/10 text-cyan-100">
          {filteredData.length} staff listed
        </Badge>

        <div className="xl:col-span-3">
          <label className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Min reputation: {minReputation}</label>
          <input
            type="range"
            min={0}
            max={99}
            value={minReputation}
            onChange={(event) => setMinReputation(Number(event.target.value))}
            className="mt-1 w-full"
          />
        </div>

        <div className="xl:col-span-3">
          <label className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Max salary: {formatCompactMoney(maxSalary)}</label>
          <input
            type="range"
            min={500_000}
            max={25_000_000}
            step={250_000}
            value={maxSalary}
            onChange={(event) => setMaxSalary(Number(event.target.value))}
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
