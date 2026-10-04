import { test, expect } from "@playwright/test";

test.describe("Responsive layout", () => {
  for (const path of ["/", "/pricing", "/examples", "/about", "/signin"]) {
    test(`no horizontal scroll on ${path}`, async ({ page }) => {
      await page.route("**/user/quota", (route) => route.fulfill({ status: 200, contentType: "application/json", body: "{}" }));
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }

  test("mobile: the demo bubbles sit in a row under the box", async ({ page, isMobile }) => {
    test.skip(!isMobile, "Mobile only");
    await page.goto("/");
    await expect(page.locator("textarea")).toBeVisible();
    await expect(page.getByRole("button", { name: /Listen to Ad|Escuchar Anuncio/i }).last()).toBeVisible();
  });
});
