import { describe, expect, it } from "vitest";

import { getEntityInitials, getEntityPlaceholderSvg, resolveAssetUrl } from "@/lib/assets";

describe("asset helpers", () => {
  it("creates initials with two tokens", () => {
    expect(getEntityInitials("Luca Bianchi")).toBe("LB");
    expect(getEntityInitials("Scuderia Aurora")).toBe("SA");
  });

  it("returns placeholder SVG data URI", () => {
    const svg = getEntityPlaceholderSvg("TEAM", "Scuderia Aurora");
    expect(svg.startsWith("data:image/svg+xml;utf8,")).toBe(true);
  });

  it("resolves fallback when URL is empty", () => {
    expect(resolveAssetUrl(null, "fallback")).toBe("fallback");
    expect(resolveAssetUrl("real-url", "fallback")).toBe("real-url");
  });
});
