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
    await expect(page.getByText("Produce tu siguiente")).toBeVisible();
    await expect(page.getByText(/Voces reales .+ Mezcla profesional/i).first()).toBeVisible();
  });

  test("English locale renders English text", async ({ page }) => {
    await page.goto("/en");
    await expect(page.getByText("Produce your next")).toBeVisible();
  });

  test("Spanish pricing page", async ({ page }) => {
    await mockQuotaApi(page);
    await page.goto("/es/pricing");
    await expect(page.locator("h1", { hasText: "Precios" })).toBeVisible();
    await expect(page.getByText("Empezar gratis").first()).toBeVisible();
  });

  test("English pricing page", async ({ page }) => {
    await mockQuotaApi(page);
    await page.goto("/en/pricing");
    await expect(page.locator("h1", { hasText: "Pricing" })).toBeVisible();
    await expect(page.getByText("Start free").first()).toBeVisible();
  });

  test("Spanish signin page", async ({ page }) => {
    await page.goto("/es/signin");
    await expect(page.getByText("Continuar con")).toBeVisible();
    await expect(page.getByText("Volver a SonificaLabs")).toBeVisible();
  });

  test("English signin page", async ({ page }) => {
    await page.goto("/en/signin");
    await expect(page.getByText(/Continue with/i)).toBeVisible();
    await expect(page.getByText("Back to SonificaLabs")).toBeVisible();
  });
});
