import { test, expect } from "@playwright/test";

test.describe("Sign in page", () => {
  test("renders login card with Google button", async ({ page }) => {
    await page.goto("/signin");
    await expect(page.getByText("sonificalabs").first()).toBeVisible();
    await expect(page.locator("button", { hasText: "Google" })).toBeVisible();
  });

  test("shows continue with divider", async ({ page }) => {
    await page.goto("/signin");
    await expect(page.getByText(/Continue with|Continuar con/i)).toBeVisible();
  });

  test("has back to home link that navigates", async ({ page }) => {
    await page.goto("/signin");
    const backLink = page.getByText(/Back to SonificaLabs|Volver a SonificaLabs/i);
    await expect(backLink).toBeVisible();
    await backLink.click();
    // May navigate to /en or / depending on locale
    await page.waitForURL(/^\/$|\/en\/?$|\/es\/?$/, { timeout: 5000 });
  });

  test("Google button is clickable", async ({ page }) => {
    await page.goto("/signin");
    const googleBtn = page.locator("button", { hasText: "Google" });
    await expect(googleBtn).toBeEnabled();
  });

  test("shows error message for OAuthAccountNotLinked", async ({ page }) => {
    await page.goto("/signin?error=OAuthAccountNotLinked");
    await expect(page.getByText(/already registered|ya esta registrado/i)).toBeVisible();
  });
});
