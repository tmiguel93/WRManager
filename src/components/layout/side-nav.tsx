"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BriefcaseBusiness,
  CalendarRange,
  Factory,
  Handshake,
  Image,
  LayoutDashboard,
  Newspaper,
  Radar,
  Shield,
  Trophy,
  UsersRound,
} from "lucide-react";

import { PRIMARY_NAV, SECONDARY_NAV } from "@/config/navigation";
import { cn } from "@/lib/utils";
import type { NavItemDefinition } from "@/domain/models/core";

const iconMap = {
  LayoutDashboard,
  CalendarRange,
  Trophy,
  UsersRound,
  BriefcaseBusiness,
  Shield,
  Radar,
  Factory,
  Handshake,
  Newspaper,
  Image,
};

function NavLink({ item, compact = false }: { item: NavItemDefinition; compact?: boolean }) {
  const pathname = usePathname();
  const isActive = pathname === item.href;
  const Icon = iconMap[item.icon as keyof typeof iconMap] ?? LayoutDashboard;

  return (
    <Link
      href={item.href}
      className={cn(
        "group relative flex items-center gap-3 rounded-2xl border px-3 py-2 transition-all duration-200",
        isActive
          ? "border-cyan-300/60 bg-cyan-400/10 text-cyan-100"
          : "border-transparent text-muted-foreground hover:border-white/10 hover:bg-white/5 hover:text-foreground",
      )}
      title={compact ? item.label : undefined}
    >
      <Icon className="size-4 shrink-0" />
      <span className={cn("truncate text-sm font-medium", compact && "hidden")}>{item.label}</span>
      {isActive ? <span className="absolute right-2 h-2 w-2 rounded-full bg-cyan-300" /> : null}
    </Link>
  );
}

export function SideNav() {
  return (
    <aside className="hidden w-[272px] shrink-0 border-r border-white/10 bg-[#050914]/90 p-4 backdrop-blur-xl lg:flex lg:flex-col">
      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-300/20 via-blue-400/10 to-transparent p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-100/80">World Motorsport Manager</p>
        <h2 className="mt-3 font-heading text-xl font-semibold tracking-tight text-white">Command Center</h2>
        <p className="mt-2 text-xs text-cyan-50/80">Build a global motorsport powerhouse.</p>
      </div>

      <nav className="mt-6 space-y-1.5">
        {PRIMARY_NAV.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </nav>

      <div className="mt-8 border-t border-white/10 pt-4">
        <p className="mb-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">Operations</p>
        <div className="space-y-1.5">
          {SECONDARY_NAV.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </div>
      </div>

      <div className="mt-auto rounded-3xl border border-emerald-300/20 bg-emerald-400/5 p-4">
        <p className="text-xs uppercase tracking-[0.16em] text-emerald-100/80">Module 5</p>
        <p className="mt-2 text-sm font-medium text-emerald-50">Commercial ops live</p>
        <p className="mt-1 text-xs text-emerald-100/70">
          Supplier marketplace, sponsor deals, objectives and contract negotiations active.
        </p>
      </div>
    </aside>
  );
}
