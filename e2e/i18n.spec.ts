import { test, expect } from "@playwright/test";

async function mockQuotaApi(page: any) {
  await page.route("**/user/quota", (route: any) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ plan: "free", remaining: 20, creditsUsed: 0, creditsLimit: 20 }),
    });
  });
}

test.describe("Internationalization", () => {
  test("Spanish locale renders Spanish text", async ({ page }) => {
    await page.goto("/es");
    await expect(page.locator("h1")).toContainText("Convierte tu texto en");
    await expect(page.getByRole("button", { name: "Crear audio" }).first()).toBeVisible();
  });

  test("English locale renders English text", async ({ page }) => {
    await page.goto("/en");
    await expect(page.locator("h1")).toContainText("Turn your text into");
  });

  test("Spanish pricing page", async ({ page }) => {
    await mockQuotaApi(page);
    await page.goto("/es/pricing");
    await expect(page.locator("h1")).toContainText("Un plan para cada");
    await expect(page.getByText("Empezar gratis").first()).toBeVisible();
  });

  test("English pricing page", async ({ page }) => {
    await mockQuotaApi(page);
    await page.goto("/en/pricing");
    await expect(page.locator("h1")).toContainText("A plan for every");
    await expect(page.getByText("Start free").first()).toBeVisible();
  });

  test("Spanish signin page", async ({ page }) => {
    await page.goto("/es/signin");
    await expect(page.getByRole("button", { name: "Continuar con Google" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Volver a SonificaLabs" })).toBeVisible();
  });

  test("English signin page", async ({ page }) => {
    await page.goto("/en/signin");
    await expect(page.getByRole("button", { name: "Continue with Google" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Back to SonificaLabs" })).toBeVisible();
  });
});
