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

  const filteredData = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return data;
    return data.filter((member) => {
      return (
        member.name.toLowerCase().includes(term) ||
        member.team.toLowerCase().includes(term) ||
        member.role.toLowerCase().includes(term)
      );
    });
  }, [data, search]);

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
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search staff, role or team"
          className="h-10 max-w-md border-white/20 bg-background/40"
        />
        <Badge className="rounded-full border border-cyan-300/35 bg-cyan-500/10 text-cyan-100">
          {filteredData.length} staff listed
        </Badge>
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
