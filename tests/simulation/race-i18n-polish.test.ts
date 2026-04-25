import { describe, expect, it } from "vitest";

import { messages } from "@/i18n/messages";

const locales = ["pt-BR", "en", "es"] as const;

describe("race polish i18n coverage", () => {
  it("exposes raceCenter and raceViewer dictionaries for all supported locales", () => {
    for (const locale of locales) {
      const dict = messages[locale] as Record<string, unknown>;
      expect(dict.raceCenter).toBeTruthy();
      expect(dict.raceViewer).toBeTruthy();
    }
  });

  it("contains critical live viewer keys in all locales", () => {
    for (const locale of locales) {
      const dict = messages[locale] as Record<string, Record<string, string>>;
      const viewer = dict.raceViewer;

      expect(viewer.title).toBeTruthy();
      expect(viewer.empty).toBeTruthy();
      expect(viewer.play).toBeTruthy();
      expect(viewer.pause).toBeTruthy();
      expect(viewer.trackMap).toBeTruthy();
      expect(viewer.ticker).toBeTruthy();
      expect(viewer.leader).toBeTruthy();
    }
  });
});
