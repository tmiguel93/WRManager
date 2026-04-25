import { SessionType } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { isRoundClosingRaceSession } from "@/domain/rules/season-progress";

describe("isRoundClosingRaceSession", () => {
  it("closes the round on the final competitive session, including stage formats", () => {
    const weekendSessions = [
      { sessionType: SessionType.PRACTICE, orderIndex: 1 },
      { sessionType: SessionType.QUALIFYING, orderIndex: 2 },
      { sessionType: SessionType.STAGE, orderIndex: 3 },
      { sessionType: SessionType.STAGE, orderIndex: 4 },
    ];

    expect(
      isRoundClosingRaceSession({
        sessionType: SessionType.STAGE,
        orderIndex: 3,
        weekendSessions,
      }),
    ).toBe(false);

    expect(
      isRoundClosingRaceSession({
        sessionType: SessionType.STAGE,
        orderIndex: 4,
        weekendSessions,
      }),
    ).toBe(true);
  });
});
