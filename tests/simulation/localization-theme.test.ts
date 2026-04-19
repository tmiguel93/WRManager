import { describe, expect, it } from "vitest";

import { normalizeLocale } from "@/i18n/config";
import { translate } from "@/i18n/translate";
import { createTeamTheme, normalizeHexColor } from "@/lib/team-theme";

describe("localization and team theme", () => {
  it("normalizes supported locales", () => {
    expect(normalizeLocale("pt")).toBe("pt-BR");
    expect(normalizeLocale("en-US")).toBe("en");
    expect(normalizeLocale("es-MX")).toBe("es");
  });

  it("returns translated labels for key navigation items", () => {
    expect(translate("pt-BR", "nav.drivers")).toBeTruthy();
    expect(translate("en", "nav.drivers")).toBe("Drivers");
    expect(translate("es", "nav.drivers")).toBeTruthy();
  });

  it("creates readable team palette and normalizes colors", () => {
    const palette = createTeamTheme({
      primary: "#09f",
      secondary: "#10a8b5",
      accent: "#12d5e5",
    });

    expect(normalizeHexColor("#09f", "#000000")).toBe("#0099ff");
    expect(palette.primary).toMatch(/^#[0-9a-f]{6}$/);
    expect(palette.secondary).toMatch(/^#[0-9a-f]{6}$/);
    expect(palette.onPrimary === "#0b1020" || palette.onPrimary === "#f8fafc").toBe(true);
  });
});
