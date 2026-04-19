import { expect, test } from "@playwright/test";

test("landing renders and navigates to HQ", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("WORLD MOTORSPORT MANAGER")).toBeVisible();
  await page.getByRole("link", { name: "Enter Command Center" }).click();
  await expect(page.getByRole("heading", { name: "Dashboard HQ" })).toBeVisible();
});
