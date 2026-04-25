import { describe, expect, it } from "vitest";

import { messages } from "@/i18n/messages";

const locales = ["pt-BR", "en", "es"] as const;
const requiredNamespaces = ["practice", "qualifying", "calendar"] as const;

describe("session and calendar i18n coverage", () => {
  it("contains required namespaces for all locales", () => {
    for (const locale of locales) {
      const dict = messages[locale] as Record<string, unknown>;
      for (const namespace of requiredNamespaces) {
        expect(dict[namespace]).toBeTruthy();
      }
    }
  });

  it("contains critical keys across all locales", () => {
    const keysByNamespace: Record<(typeof requiredNamespaces)[number], string[]> = {
      practice: ["kpiSessions", "weekendTitle", "runNext", "sessionsTitle", "feedbackTitle"],
      qualifying: ["kpiSessions", "controlTitle", "runSession", "leaderboardTitle", "noResult"],
      calendar: ["title", "description", "kpiProgress", "timeline", "nextFocus"],
    };

    for (const locale of locales) {
      const dict = messages[locale] as Record<string, Record<string, string>>;

      for (const namespace of requiredNamespaces) {
        const block = dict[namespace];
        for (const key of keysByNamespace[namespace]) {
          expect(block[key]).toBeTruthy();
        }
      }
    }
  });
});
