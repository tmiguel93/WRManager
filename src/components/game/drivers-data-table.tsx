"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type ColumnDef,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";

import { CountryFlag } from "@/components/common/country-flag";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export interface DriverRow {
  id: string;
  name: string;
  countryCode: string;
  category: string;
  team: string;
  overall: number;
  potential: number;
  reputation: number;
}

const columns: ColumnDef<DriverRow>[] = [
  {
    accessorKey: "name",
    header: "Driver",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <CountryFlag countryCode={row.original.countryCode} className="h-4 w-6" />
        <span className="font-medium">{row.original.name}</span>
      </div>
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
  { accessorKey: "overall", header: "OVR" },
  { accessorKey: "potential", header: "POT" },
  { accessorKey: "reputation", header: "REP" },
];

export function DriversDataTable({ data }: { data: DriverRow[] }) {
  const [sorting, setSorting] = React.useState<SortingState>([{ id: "overall", desc: true }]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-card/60">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="border-white/10 hover:bg-transparent">
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} className={cn("text-xs uppercase tracking-[0.14em] text-muted-foreground")}>
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
  );
}
