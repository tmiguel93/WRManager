import { expect, test } from "@playwright/test";

test("save center screen renders", async ({ page }) => {
  await page.goto("/game/save-center");
  await expect(page.getByRole("heading", { name: "Save Center" })).toBeVisible();
});
