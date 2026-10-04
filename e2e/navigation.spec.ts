import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("desktop header shows the wordmark and the main links", async ({ page, isMobile }) => {
    test.skip(!!isMobile, "Links live in the menu on mobile");
    await page.goto("/");
    await expect(page.getByRole("link", { name: "sonificalabs" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /^(Examples|Ejemplos)$/ }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /^(Who we are|Quiénes somos)$/ }).first()).toBeVisible();
  });

  test("the footer pricing link opens the pricing page", async ({ page }) => {
    await page.route("**/user/quota", (route) => route.fulfill({ status: 200, contentType: "application/json", body: "{}" }));
    await page.goto("/");
    await page.locator("footer").getByRole("link", { name: /^(Pricing|Precios)$/ }).click();
    await page.waitForURL(/pricing/, { timeout: 10000 });
    await expect(page.getByText("Studio").first()).toBeVisible();
  });

  test("desktop sign in link goes to the signin page", async ({ page, isMobile }) => {
    test.skip(!!isMobile, "Sign in lives in the menu on mobile");
    await page.goto("/");
    await page.getByRole("link", { name: /^(Sign in|Entrar)$/ }).first().click();
    await page.waitForURL(/signin/, { timeout: 10000 });
  });

  test("mobile menu opens with the links and sign in", async ({ page, isMobile }) => {
    test.skip(!isMobile, "Mobile only");
    await page.goto("/");
    await page.getByRole("button", { name: /^(Menu|Menú)$/ }).click();
    await expect(page.getByRole("link", { name: /^(Pricing|Precios)$/ }).last()).toBeVisible();
    await expect(page.getByRole("link", { name: /^(Sign in|Entrar)$/ }).last()).toBeVisible();
  });

  test("the discover link points at the first section", async ({ page, isMobile }) => {
    test.skip(!!isMobile, "Hidden on small screens");
    await page.goto("/");
    await expect(page.getByRole("link", { name: /See how it works|Descubre cómo funciona/i })).toHaveAttribute("href", "#cap-problema");
  });
});
