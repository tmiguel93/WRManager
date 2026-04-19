import { expect, test } from "@playwright/test";

test("race control screen renders core controls", async ({ page }) => {
  await page.goto("/game/race-control");
  await expect(page.getByRole("heading", { name: "Race Control" })).toBeVisible();
  await expect(page.getByText("Race Control Strategy")).toBeVisible();
});

