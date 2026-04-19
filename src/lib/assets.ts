import type { EntityType } from "@/domain/models/core";

interface EntityTheme {
  background: string;
  foreground: string;
  accent: string;
}

const ENTITY_THEME: Record<EntityType, EntityTheme> = {
  DRIVER: {
    background: "#0f172a",
    foreground: "#d9f99d",
    accent: "#84cc16",
  },
  TEAM: {
    background: "#082f49",
    foreground: "#bae6fd",
    accent: "#0ea5e9",
  },
  STAFF: {
    background: "#3f0f46",
    foreground: "#f5d0fe",
    accent: "#d946ef",
  },
  SUPPLIER: {
    background: "#1f2937",
    foreground: "#cbd5e1",
    accent: "#94a3b8",
  },
  SPONSOR: {
    background: "#3f2f0f",
    foreground: "#fde68a",
    accent: "#f59e0b",
  },
  CIRCUIT: {
    background: "#0f3d2e",
    foreground: "#bbf7d0",
    accent: "#22c55e",
  },
};

function safeLabel(value: string) {
  return value.replace(/[^a-zA-Z0-9 ]/g, "").slice(0, 28);
}

export function getEntityInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function getEntityPlaceholderSvg(entityType: EntityType, name: string) {
  const theme = ENTITY_THEME[entityType];
  const initials = getEntityInitials(name);
  const label = safeLabel(name);

  return `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${theme.background}" />
          <stop offset="100%" stop-color="${theme.accent}" />
        </linearGradient>
      </defs>
      <rect width="960" height="540" rx="48" fill="url(#g)" />
      <rect x="44" y="44" width="872" height="452" rx="40" fill="rgba(15,23,42,0.22)" stroke="rgba(255,255,255,0.16)" />
      <text x="80" y="118" font-family="Arial, sans-serif" font-size="26" fill="${theme.foreground}" opacity="0.85">${label}</text>
      <text x="80" y="340" font-family="Arial, sans-serif" font-size="180" font-weight="700" fill="${theme.foreground}" opacity="0.9">${initials}</text>
      <text x="80" y="472" font-family="Arial, sans-serif" font-size="24" fill="${theme.foreground}" opacity="0.75">WORLD MOTORSPORT MANAGER</text>
    </svg>`,
  )}`;
}

export function resolveAssetUrl(assetUrl: string | null | undefined, fallbackUrl: string) {
  if (!assetUrl) {
    return fallbackUrl;
  }
  return assetUrl;
}
