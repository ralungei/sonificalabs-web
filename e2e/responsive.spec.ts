import { test, expect } from "@playwright/test";

test.describe("Responsive layout", () => {
  test("mobile: shows prompt form", async ({ page, isMobile }) => {
    test.skip(!isMobile, "Mobile only");
    await page.goto("/");
    await expect(page.locator("textarea")).toBeVisible();
  });

  test("mobile: shows mobile demo section", async ({ page, isMobile }) => {
    test.skip(!isMobile, "Mobile only");
    await page.goto("/");
    // Mobile "listen examples" section
    await expect(page.getByText(/Escucha ejemplos|Listen to examples/i)).toBeVisible({ timeout: 10000 });
  });

  test("mobile: pricing page shows all plans", async ({ page, isMobile }) => {
    test.skip(!isMobile, "Mobile only");
    await page.route("**/user/quota", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ plan: "free", remaining: 20, creditsUsed: 0, creditsLimit: 20 }),
      });
    });
    await page.goto("/pricing");
    await expect(page.getByText("Free").first()).toBeVisible();
    await expect(page.getByText("Studio").first()).toBeVisible();
  });

  test("desktop: hero section renders with demos", async ({ page, isMobile }) => {
    test.skip(!!isMobile, "Desktop only");
    await page.goto("/");
    // Wait for animation
    await page.waitForTimeout(2000);
    await expect(page.getByText("True Crime").first()).toBeVisible();
    await expect(page.getByText("ASMR").first()).toBeVisible();
  });
});
