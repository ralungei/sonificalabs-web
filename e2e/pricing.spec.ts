import { test, expect } from "@playwright/test";

// The pricing page asks /user/quota; mock it so the page renders the
// signed-out state without a backend.
async function gotoPricing(page: any) {
  await page.route("**/user/quota", (route: any) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ plan: "free", remaining: 20, creditsUsed: 0, creditsLimit: 20 }),
    });
  });
  await page.goto("/pricing");
}

test.describe("Pricing page", () => {
  test("renders all four plan cards", async ({ page }) => {
    await gotoPricing(page);
    for (const plan of ["Free", "Starter", "Pro", "Studio"]) {
      await expect(page.getByText(plan, { exact: true }).first()).toBeVisible();
    }
  });

  test("shows correct prices", async ({ page }) => {
    await gotoPricing(page);
    await expect(page.getByText("9.99").first()).toBeVisible();
    await expect(page.getByText("29.99").first()).toBeVisible();
    await expect(page.getByText("59.99").first()).toBeVisible();
  });

  test("shows Pro badge as Popular", async ({ page }) => {
    await gotoPricing(page);
    await expect(page.getByText("Popular")).toBeVisible();
  });

  test("signed out, the free plan is not marked as the current one", async ({ page }) => {
    await gotoPricing(page);
    await expect(page.getByText(/^(Current plan|Plan actual)$/)).toHaveCount(0);
  });

  test("shows the credit cost breakdown", async ({ page }) => {
    await gotoPricing(page);
    await expect(page.getByText(/How credits are spent|Cómo se gastan los créditos/i)).toBeVisible({ timeout: 5000 });
  });

  test("FAQ items expand on click", async ({ page }) => {
    await gotoPricing(page);
    await page.getByRole("button", { name: /How do credits work|Cómo funcionan los créditos/i }).click();
    await expect(page.getByText(/2-minute blocks|bloques de 2 minutos/i).first()).toBeVisible();
  });

  test("redirects to signin when not logged in and clicking checkout", async ({ page }) => {
    await gotoPricing(page);
    await page.getByRole("button", { name: /Choose Starter|Elegir Starter/i }).click();
    await page.waitForURL(/signin/, { timeout: 10000 });
  });
});
