import { test, expect } from "@playwright/test";

test.describe("Home page", () => {
  test("renders the hero title and the prompt box", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText(/Turn your text into|Convierte tu texto en/i);
    await expect(page.locator("textarea")).toBeVisible();
    await expect(page.getByRole("button", { name: /Create audio|Crear audio/i }).first()).toBeVisible();
  });

  test("shows the demo bubbles", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: /Listen to Ad|Escuchar Anuncio/i }).first()).toBeVisible();
  });

  test("the customize popover offers type, duration and characters", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Customize|Personalizar/i }).click();
    await expect(page.getByText(/^(Type|Tipo)$/i).first()).toBeVisible();
    await expect(page.getByText(/^(Duration|Duración)$/i).first()).toBeVisible();
    await expect(page.getByText(/^(Characters|Personajes)$/i).first()).toBeVisible();
  });

  test("a long paste becomes a card instead of flooding the box", async ({ page }) => {
    await page.goto("/");
    await page.locator("textarea").focus();
    await page.evaluate(() => {
      const dt = new DataTransfer();
      dt.setData("text", "Una línea de guion bastante larga. ".repeat(40));
      document.querySelector("textarea")!.dispatchEvent(new ClipboardEvent("paste", { clipboardData: dt, bubbles: true, cancelable: true }));
    });
    await expect(page.getByText(/^(PASTED|PEGADO)$/).first()).toBeVisible();
    await expect(page.locator("textarea")).toHaveValue("");
  });

  test("ends with the free first audio section and the footer", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(page.getByText(/Your first audio|Tu primer audio/i).first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("© 2026 SonificaLabs")).toBeVisible();
  });
});
