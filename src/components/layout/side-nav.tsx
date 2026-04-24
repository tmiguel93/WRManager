"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  BriefcaseBusiness,
  CalendarRange,
  Factory,
  Flag,
  FlaskConical,
  Globe2,
  Handshake,
  Image,
  LayoutDashboard,
  ListChecks,
  Newspaper,
  Radar,
  Shield,
  Save,
  Timer,
  Trophy,
  UsersRound,
  Wrench,
} from "lucide-react";

import { PRIMARY_NAV, SECONDARY_NAV } from "@/config/navigation";
import { cn } from "@/lib/utils";
import type { NavItemDefinition } from "@/domain/models/core";
import { useI18n } from "@/i18n/client";

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
  Wrench,
  Building2,
  ListChecks,
  FlaskConical,
  Timer,
  Flag,
  Newspaper,
  Globe2,
  Save,
  Image,
};

function NavLink({ item, compact = false }: { item: NavItemDefinition; compact?: boolean }) {
  const pathname = usePathname();
  const { t } = useI18n();
  const isActive = pathname === item.href;
  const Icon = iconMap[item.icon as keyof typeof iconMap] ?? LayoutDashboard;
  const label = t(item.labelKey, item.labelKey);

  return (
    <Link
      href={item.href}
      className={cn(
        "group relative flex items-center gap-3 rounded-2xl border px-3 py-2 transition-all duration-200",
        isActive
          ? "team-outline bg-white/10 team-accent-text"
          : "border-transparent text-muted-foreground hover:border-white/10 hover:bg-white/5 hover:text-foreground",
      )}
      title={compact ? label : undefined}
    >
      <Icon className="size-4 shrink-0" />
      <span className={cn("truncate text-sm font-medium", compact && "hidden")}>{label}</span>
      {isActive ? (
        <span
          className="absolute right-2 h-2 w-2 rounded-full"
          style={{ backgroundColor: "color-mix(in oklab, var(--team-accent) 74%, white 14%)" }}
        />
      ) : null}
    </Link>
  );
}

export function SideNav() {
  const { t } = useI18n();

  return (
    <aside className="hidden w-[272px] shrink-0 border-r border-white/10 bg-[#050914]/90 p-4 backdrop-blur-xl lg:flex lg:flex-col">
      <div className="team-gradient rounded-3xl border border-white/10 p-4">
        <p className="team-accent-text text-xs uppercase tracking-[0.2em]">World Motorsport Manager</p>
        <h2 className="mt-3 font-heading text-xl font-semibold tracking-tight text-white">{t("nav.commandCenter")}</h2>
        <p className="mt-2 text-xs text-muted-foreground">{t("nav.tagline")}</p>
      </div>

      <nav className="mt-6 space-y-1.5">
        {PRIMARY_NAV.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </nav>

      <div className="mt-8 border-t border-white/10 pt-4">
        <p className="mb-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">{t("nav.operations")}</p>
        <div className="space-y-1.5">
          {SECONDARY_NAV.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </div>
      </div>

      <div className="mt-auto rounded-3xl border border-emerald-300/20 bg-emerald-400/5 p-4">
        <p className="text-xs uppercase tracking-[0.16em] text-emerald-100/80">World Feed</p>
        <p className="mt-2 text-sm font-medium text-emerald-50">Career expansion</p>
        <p className="mt-1 text-xs text-emerald-100/70">Track your climb through categories and contracts.</p>
      </div>
    </aside>
  );
}
