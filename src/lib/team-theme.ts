export interface TeamThemeInput {
  primary?: string | null;
  secondary?: string | null;
  accent?: string | null;
}

export interface TeamThemePalette {
  primary: string;
  secondary: string;
  accent: string;
  onPrimary: "#0b1020" | "#f8fafc";
  onSecondary: "#0b1020" | "#f8fafc";
}

const DEFAULT_PRIMARY = "#0ea5e9";
const DEFAULT_SECONDARY = "#facc15";
const DEFAULT_ACCENT = "#22d3ee";

function clamp(value: number, min = 0, max = 255) {
  return Math.max(min, Math.min(max, value));
}

function toHex(value: number) {
  return clamp(Math.round(value)).toString(16).padStart(2, "0");
}

export function normalizeHexColor(value: string | null | undefined, fallback: string): string {
  if (!value) return fallback;
  const normalized = value.trim().toLowerCase();

  if (/^#[0-9a-f]{6}$/.test(normalized)) {
    return normalized;
  }

  if (/^#[0-9a-f]{3}$/.test(normalized)) {
    const r = normalized[1];
    const g = normalized[2];
    const b = normalized[3];
    return `#${r}${r}${g}${g}${b}${b}`;
  }

  return fallback;
}

function parseHex(hex: string) {
  const safe = normalizeHexColor(hex, "#000000");
  return {
    r: Number.parseInt(safe.slice(1, 3), 16),
    g: Number.parseInt(safe.slice(3, 5), 16),
    b: Number.parseInt(safe.slice(5, 7), 16),
  };
}

function relativeLuminance(hex: string) {
  const rgb = parseHex(hex);
  const channels = [rgb.r, rgb.g, rgb.b].map((value) => {
    const unit = value / 255;
    return unit <= 0.03928 ? unit / 12.92 : ((unit + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(a: string, b: string) {
  const l1 = relativeLuminance(a);
  const l2 = relativeLuminance(b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function colorDistance(a: string, b: string) {
  const left = parseHex(a);
  const right = parseHex(b);
  return Math.sqrt((left.r - right.r) ** 2 + (left.g - right.g) ** 2 + (left.b - right.b) ** 2);
}

function adjustColor(hex: string, amount: number) {
  const parsed = parseHex(hex);
  return `#${toHex(parsed.r + amount)}${toHex(parsed.g + amount)}${toHex(parsed.b + amount)}`;
}

function ensureReadablePair(primary: string, secondary: string) {
  if (colorDistance(primary, secondary) >= 54) {
    return { primary, secondary };
  }

  const lighter = adjustColor(secondary, 38);
  if (colorDistance(primary, lighter) >= 54) {
    return { primary, secondary: lighter };
  }

  return { primary, secondary: adjustColor(secondary, -52) };
}

function readableTextColor(background: string): "#0b1020" | "#f8fafc" {
  const darkContrast = contrastRatio(background, "#0b1020");
  const lightContrast = contrastRatio(background, "#f8fafc");
  return darkContrast >= lightContrast ? "#0b1020" : "#f8fafc";
}

export function createTeamTheme(input: TeamThemeInput): TeamThemePalette {
  const primary = normalizeHexColor(input.primary, DEFAULT_PRIMARY);
  const secondaryRaw = normalizeHexColor(input.secondary, DEFAULT_SECONDARY);
  const accentRaw = normalizeHexColor(input.accent, DEFAULT_ACCENT);

  const pair = ensureReadablePair(primary, secondaryRaw);
  const accent = colorDistance(accentRaw, pair.primary) < 30 ? adjustColor(accentRaw, 42) : accentRaw;

  return {
    primary: pair.primary,
    secondary: pair.secondary,
    accent,
    onPrimary: readableTextColor(pair.primary),
    onSecondary: readableTextColor(pair.secondary),
  };
}
