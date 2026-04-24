import { describe, expect, it } from "vitest";

import { toPublicErrorMessage } from "@/lib/public-error";

describe("public error mapper", () => {
  it("maps known internal budget errors to public message", () => {
    const message = toPublicErrorMessage(new Error("Insufficient budget for this proposal."), "Fallback");
    expect(message).toBe("Insufficient budget for this operation.");
  });

  it("returns fallback for unknown internal errors", () => {
    const message = toPublicErrorMessage(new Error("random unhandled detail"), "Fallback");
    expect(message).toBe("Fallback");
  });
});
