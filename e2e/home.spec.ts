import { test, expect } from "@playwright/test";

test.describe("Home page", () => {
  test("renders hero text and form", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/Produce (tu siguiente|your next)/i)).toBeVisible();
    const textarea = page.locator("textarea");
    await expect(textarea).toBeVisible();
  });

  test("shows demo circles on desktop", async ({ page, isMobile }) => {
    test.skip(!!isMobile, "Demo circles hidden on mobile");
    await page.goto("/");
    await expect(page.getByText("True Crime").first()).toBeVisible();
  });

  test("shows tagline", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/Real voices .+ Professional mix|Voces reales .+ Mezcla profesional/i).first()).toBeVisible();
  });

  test("shows CTA section on scroll", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(page.getByText(/Pruébalo ahora|Try it now/i)).toBeVisible({ timeout: 5000 });
  });

  test("footer shows copyright", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(page.getByText("© 2026 SonificaLabs")).toBeVisible();
  });

  test("prompt form shows type/duration/characters controls", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/Type|Tipo/i).first()).toBeVisible();
    await expect(page.getByText(/Duration|Duración/i).first()).toBeVisible();
    await expect(page.getByText(/Characters|Personajes/i).first()).toBeVisible();
  });
});
