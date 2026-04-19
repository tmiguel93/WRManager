import type { NavItemDefinition } from "@/domain/models/core";

export const PRIMARY_NAV: NavItemDefinition[] = [
  { href: "/game/hq", labelKey: "nav.dashboard", icon: "LayoutDashboard" },
  { href: "/game/calendar", labelKey: "nav.calendar", icon: "CalendarRange" },
  { href: "/game/standings", labelKey: "nav.standings", icon: "Trophy" },
  { href: "/game/drivers", labelKey: "nav.drivers", icon: "UsersRound" },
  { href: "/game/staff", labelKey: "nav.staff", icon: "BriefcaseBusiness" },
  { href: "/game/teams", labelKey: "nav.teams", icon: "Shield" },
  { href: "/game/scouting", labelKey: "nav.scouting", icon: "Radar" },
  { href: "/game/suppliers", labelKey: "nav.suppliers", icon: "Factory" },
  { href: "/game/sponsors", labelKey: "nav.sponsors", icon: "Handshake" },
  { href: "/game/car-development", labelKey: "nav.carDevelopment", icon: "Wrench" },
  { href: "/game/facilities", labelKey: "nav.facilities", icon: "Building2" },
  { href: "/game/weekend-rules", labelKey: "nav.weekendRules", icon: "ListChecks" },
  { href: "/game/practice", labelKey: "nav.practice", icon: "FlaskConical" },
  { href: "/game/qualifying", labelKey: "nav.qualifying", icon: "Timer" },
  { href: "/game/race-control", labelKey: "nav.raceControl", icon: "Flag" },
  { href: "/game/newsroom", labelKey: "nav.newsroom", icon: "Newspaper" },
  { href: "/game/global-hub", labelKey: "nav.globalHub", icon: "Globe2" },
  { href: "/game/save-center", labelKey: "nav.saveCenter", icon: "Save" },
];

export const SECONDARY_NAV: NavItemDefinition[] = [
  { href: "/game/assets", labelKey: "nav.assets", icon: "Image" },
];
