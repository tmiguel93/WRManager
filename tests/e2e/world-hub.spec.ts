import { expect, test } from "@playwright/test";

test("newsroom and global hub screens render", async ({ page }) => {
  await page.goto("/game/newsroom");
  await expect(page.getByRole("heading", { name: "Newsroom" })).toBeVisible();
  await expect(page.getByText("Team Inbox")).toBeVisible();

  await page.goto("/game/global-hub");
  await expect(page.getByRole("heading", { name: "Global Motorsport Hub" })).toBeVisible();
  await expect(page.getByText("Category Pulse")).toBeVisible();
});
