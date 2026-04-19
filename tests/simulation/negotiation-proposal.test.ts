import { describe, expect, it } from "vitest";

import {
  calculateSigningCost,
  resolveProposalOutcome,
} from "@/domain/rules/negotiation-proposal";

describe("negotiation proposal rules", () => {
  it("computes signing cost from salary and bonus", () => {
    expect(calculateSigningCost(2_000_000, 250_000)).toBe(490_000);
  });

  it("resolves accepted outcome at acceptance threshold", () => {
    const outcome = resolveProposalOutcome(76, { acceptAt: 76, counterAt: 60 });
    expect(outcome).toBe("ACCEPTED");
  });

  it("resolves counter outcome between thresholds", () => {
    const outcome = resolveProposalOutcome(63, { acceptAt: 76, counterAt: 60 });
    expect(outcome).toBe("COUNTER");
  });

  it("resolves rejected outcome below counter threshold", () => {
    const outcome = resolveProposalOutcome(52, { acceptAt: 76, counterAt: 60 });
    expect(outcome).toBe("REJECTED");
  });
});
