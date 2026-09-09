import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("navbar shows logo and links", async ({ page, isMobile }) => {
    test.skip(!!isMobile, "Nav links hidden on mobile");
    await page.goto("/");
    await expect(page.getByText("sonificalabs").first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Pricing|Precios/i })).toBeVisible();
  });

  test("pricing link navigates correctly", async ({ page, isMobile }) => {
    test.skip(!!isMobile, "Nav links hidden on mobile");
    await page.goto("/");
    await page.getByRole("link", { name: /Pricing|Precios/i }).click();
    await page.waitForURL(/pricing/, { timeout: 5000 });
    await expect(page.getByText("Free").first()).toBeVisible();
  });

  test("shows sign in button when not logged in", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /Sign in|Iniciar sesión/i })).toBeVisible();
  });

  test("sign in button navigates to signin page", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /Sign in|Iniciar sesión/i }).click();
    await page.waitForURL(/signin/, { timeout: 5000 });
  });

  test("how it works link scrolls to section", async ({ page, isMobile }) => {
    test.skip(!!isMobile, "Nav links hidden on mobile");
    await page.goto("/");
    const link = page.getByRole("link", { name: /How it works|Cómo funciona/i });
    await expect(link).toBeVisible();
  });
});
