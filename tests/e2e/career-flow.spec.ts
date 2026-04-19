import { expect, test } from "@playwright/test";

test("new career wizard exposes module 2 core screens", async ({ page }) => {
  await page.goto("/career/new");

  await expect(page.getByText("New Career").first()).toBeVisible();
  await page.getByPlaceholder("Dynasty 2026").fill("Module 2 Validation");
  await page.getByRole("button", { name: "Next", exact: true }).click();

  await expect(page.getByText("Category Selection").first()).toBeVisible();
  await page.getByRole("button", { name: "Next", exact: true }).click();

  await expect(
    page.getByText(/Team Selection|My Team Creator/).first(),
  ).toBeVisible();
});
