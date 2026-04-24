import { expect, test } from "@playwright/test";

test("new career wizard exposes module 2 core screens", async ({ page }) => {
  await page.goto("/career/new");

  await expect(page.getByText(/New Career|Nova Carreira|Nueva Carrera/i).first()).toBeVisible();
  await page.getByPlaceholder("Dynasty 2026").fill("Module 2 Validation");
  await page.locator("form").getByRole("button", { name: /Next|Proximo|Pr[oó]ximo|Siguiente/i }).click();

  await expect(page.getByText(/Category Selection|Selecao de Categoria|Seleccion de Categoria/i).first()).toBeVisible();
  await page.locator("form").getByRole("button", { name: /Next|Proximo|Pr[oó]ximo|Siguiente/i }).click();

  await expect(
    page.getByText(/Team Selection|My Team Creator|Equipe \/ My Team|Equipo \/ My Team/i).first(),
  ).toBeVisible();
});
