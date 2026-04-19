import { describe, expect, it } from "vitest";

import { evaluateSponsorContractGuard } from "@/domain/rules/sponsor-contracts";

describe("sponsor contract guard", () => {
  it("blocks duplicate sponsor contracts", () => {
    const guard = evaluateSponsorContractGuard({
      sponsorId: "s1",
      activeSponsorIds: ["s1", "s2"],
    });

    expect(guard.allowed).toBe(false);
    expect(guard.reason).toBe("DUPLICATE_SPONSOR");
  });

  it("blocks when sponsor slots are full", () => {
    const guard = evaluateSponsorContractGuard({
      sponsorId: "s4",
      activeSponsorIds: ["s1", "s2", "s3"],
      maxActiveContracts: 3,
    });

    expect(guard.allowed).toBe(false);
    expect(guard.reason).toBe("SLOTS_FULL");
  });

  it("allows new sponsor when capacity exists and no duplicate", () => {
    const guard = evaluateSponsorContractGuard({
      sponsorId: "s3",
      activeSponsorIds: ["s1", "s2"],
      maxActiveContracts: 3,
    });

    expect(guard.allowed).toBe(true);
    expect(guard.reason).toBeUndefined();
  });
});
