import { expect, test } from "@playwright/test";

test("a landing direciona para o configurador", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /uma cadeira começa pela pessoa/i })).toBeVisible();
  await page.getByRole("link", { name: /iniciar configuração/i }).click();
  await expect(page).toHaveURL(/\/configurar$/);
  await expect(page.getByRole("heading", { name: /ajuste ao seu corpo/i })).toBeVisible();
});
