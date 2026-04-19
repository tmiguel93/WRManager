import { describe, expect, it } from "vitest";

import { calculateSponsorOffer, calculateSupplierOffer } from "@/domain/rules/commercial-deals";

describe("calculateSupplierOffer", () => {
  it("applies manager discount for negociador profile", () => {
    const negociador = calculateSupplierOffer({
      supplierType: "ENGINE",
      baseCost: 18_000_000,
      supplierPrestige: 88,
      teamReputation: 84,
      managerProfileCode: "NEGOCIADOR",
      termYears: 2,
    });

    const estrategista = calculateSupplierOffer({
      supplierType: "ENGINE",
      baseCost: 18_000_000,
      supplierPrestige: 88,
      teamReputation: 84,
      managerProfileCode: "ESTRATEGISTA",
      termYears: 2,
    });

    expect(negociador.annualCost).toBeLessThan(estrategista.annualCost);
    expect(negociador.signingFee).toBeLessThan(estrategista.signingFee);
  });
});

describe("calculateSponsorOffer", () => {
  it("rewards aggressive objective with higher fixed value", () => {
    const safe = calculateSponsorOffer({
      baseValue: 16_000_000,
      sponsorConfidence: 74,
      teamReputation: 82,
      managerProfileCode: "COMERCIAL",
      objectiveRisk: "SAFE",
      teamCountryCode: "US",
      sponsorCountryCode: "US",
    });

    const aggressive = calculateSponsorOffer({
      baseValue: 16_000_000,
      sponsorConfidence: 74,
      teamReputation: 82,
      managerProfileCode: "COMERCIAL",
      objectiveRisk: "AGGRESSIVE",
      teamCountryCode: "US",
      sponsorCountryCode: "US",
    });

    expect(aggressive.fixedValue).toBeGreaterThan(safe.fixedValue);
    expect(aggressive.reputationalRisk).toBeGreaterThan(safe.reputationalRisk);
  });
});
