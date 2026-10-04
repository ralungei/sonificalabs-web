import { test, expect } from "@playwright/test";

test.describe("Sign in page", () => {
  test("renders the card with the Google button", async ({ page }) => {
    await page.goto("/signin");
    await expect(page.locator("h1")).toContainText(/Sign in and create your|Entra y crea tu/i);
    await expect(page.getByRole("button", { name: /Continue with Google|Continuar con Google/i })).toBeEnabled();
  });

  test("the wordmark takes you back home", async ({ page }) => {
    await page.goto("/signin");
    await page.getByRole("link", { name: /Back to SonificaLabs|Volver a SonificaLabs/i }).click();
    await page.waitForURL((url) => /^\/(en|es)?\/?$/.test(url.pathname), { timeout: 10000 });
  });

  test("links to the terms and the privacy policy", async ({ page }) => {
    await page.goto("/signin");
    await expect(page.getByRole("link", { name: /terms of use|términos de uso/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /privacy policy|política de privacidad/i })).toBeVisible();
  });

  test("shows error message for OAuthAccountNotLinked", async ({ page }) => {
    await page.goto("/signin?error=OAuthAccountNotLinked");
    await expect(page.getByText(/already registered|ya está registrado/i)).toBeVisible();
  });
});
