import { describe, expect, it } from "vitest";

import { canonicalFullName, canonicalKey, canonicalText } from "@/lib/canonical";

describe("canonical helpers", () => {
  it("normalizes accents and punctuation", () => {
    expect(canonicalText(" Frédéric Vasseur ")).toBe("frederic vasseur");
    expect(canonicalText("Team---WRT")).toBe("team wrt");
  });

  it("creates deterministic keys", () => {
    const key = canonicalKey([" Fórmula 2 ", "Theo Pourchaire"]);
    expect(key).toBe("formula 2::theo pourchaire");
  });

  it("joins first and last names", () => {
    expect(canonicalFullName("Mick", "Schumacher")).toBe("mick schumacher");
  });
});
