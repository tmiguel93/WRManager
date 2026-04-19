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
  { href: "/game/sponsors", label: "Sponsors", icon: "Handshake" },
  { href: "/game/car-development", label: "Car Development", icon: "Wrench" },
  { href: "/game/facilities", label: "Facilities", icon: "Building2" },
  { href: "/game/weekend-rules", label: "Weekend Rules", icon: "ListChecks" },
  { href: "/game/practice", label: "Practice", icon: "FlaskConical" },
  { href: "/game/qualifying", label: "Qualifying", icon: "Timer" },
  { href: "/game/race-control", label: "Race Control", icon: "Flag" },
  { href: "/game/newsroom", label: "Inbox & News", icon: "Newspaper" },
  { href: "/game/global-hub", label: "Global Hub", icon: "Globe2" },
  { href: "/game/save-center", label: "Save Center", icon: "Save" },
];

export const SECONDARY_NAV: NavItemDefinition[] = [
  { href: "/game/assets", label: "Asset Registry", icon: "Image" },
];
