import { test, expect } from "@playwright/test";

// Pricing page fetches /user/quota which returns 401 when not logged in,
// triggering a redirect to /signin. We intercept the API call to prevent this.
async function gotoPricing(page: any) {
  // Mock the quota API to return free plan (prevent 401 redirect)
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
    await expect(page.getByText("Free").first()).toBeVisible();
    await expect(page.getByText("Starter").first()).toBeVisible();
    await expect(page.getByText("Pro").first()).toBeVisible();
    await expect(page.getByText("Studio").first()).toBeVisible();
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

  test("shows credit cost breakdown", async ({ page }) => {
    await gotoPricing(page);
    await page.evaluate(() => window.scrollTo(0, 800));
    await expect(page.getByText(/How credits (work|are spent)|Cómo se gastan/i)).toBeVisible({ timeout: 5000 });
  });

  test("FAQ items expand on click", async ({ page }) => {
    await gotoPricing(page);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    const faqButton = page.getByText(/How do credits work|Cómo funcionan los créditos/i);
    await faqButton.click();
    await expect(page.getByText(/base cost|coste base/i)).toBeVisible();
  });

  test("checkout buttons exist for paid plans", async ({ page }) => {
    await gotoPricing(page);
    const starterBtn = page.locator("button", { hasText: /Elegir Starter|Choose Starter/i });
    await expect(starterBtn).toBeVisible();
  });

  test("redirects to signin when not logged in and clicking checkout", async ({ page }) => {
    await gotoPricing(page);
    const starterBtn = page.locator("button", { hasText: /Elegir Starter|Choose Starter/i });
    await starterBtn.click();
    await page.waitForURL(/signin/, { timeout: 10000 });
  });
});
