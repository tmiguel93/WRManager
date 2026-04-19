import type { NavItemDefinition } from "@/domain/models/core";

export const PRIMARY_NAV: NavItemDefinition[] = [
  { href: "/game/hq", label: "Dashboard HQ", icon: "LayoutDashboard" },
  { href: "/game/calendar", label: "Calendar", icon: "CalendarRange" },
  { href: "/game/standings", label: "Standings", icon: "Trophy" },
  { href: "/game/drivers", label: "Drivers", icon: "UsersRound" },
  { href: "/game/staff", label: "Staff", icon: "BriefcaseBusiness" },
  { href: "/game/teams", label: "Teams", icon: "Shield" },
  { href: "/game/scouting", label: "Scouting", icon: "Radar" },
  { href: "/game/suppliers", label: "Suppliers", icon: "Factory" },
  { href: "/game/newsroom", label: "Inbox & News", icon: "Newspaper" },
];

export const SECONDARY_NAV: NavItemDefinition[] = [
  { href: "/game/assets", label: "Asset Registry", icon: "Image" },
];
