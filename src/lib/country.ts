const FALLBACK_COUNTRY = "US";

export function normalizeCountryCode(code: string | null | undefined) {
  if (!code) {
    return FALLBACK_COUNTRY;
  }

  const normalized = code.trim().toUpperCase();
  if (normalized.length !== 2) {
    return FALLBACK_COUNTRY;
  }

  return normalized;
}

export function countryCodeToRegionEmoji(code: string | null | undefined) {
  const normalized = normalizeCountryCode(code);
  return normalized.replace(/./g, (char) =>
    String.fromCodePoint(127397 + char.charCodeAt(0)),
  );
}
