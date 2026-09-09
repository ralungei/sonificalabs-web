/**
 * Captures marketing screenshots + the OG image from the live site.
 *
 * Uses Playwright (already a dev dependency for e2e) — no separate
 * puppeteer/Chromium install. Default locale is English at the root
 * (/en no longer resolves since the localePrefix flip).
 *
 * Run: npm run screenshots
 */
import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = resolve(__dirname, "..", "public");
const SCREENSHOTS_DIR = resolve(PUBLIC_DIR, "screenshots");

const SITE = process.env.SITE_URL ?? "https://sonificalabs.com";
const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 390, height: 844 };
const OG = { width: 1200, height: 630 };

async function capture(page, viewport, url, outPath, opts = {}) {
  await page.setViewportSize(viewport);
  await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 });
  await page.evaluate(() => document.fonts.ready);

  if (opts.scrollToSelector) {
    await page.evaluate((selector) => {
      const target = document.querySelector(selector);
      if (target) {
        const rect = target.getBoundingClientRect();
        window.scrollTo({ top: rect.top + window.scrollY - 40, behavior: "instant" });
      }
    }, opts.scrollToSelector);
    await page.waitForTimeout(1000);
  }

  await page.screenshot({
    path: outPath,
    type: outPath.endsWith(".jpg") ? "jpeg" : "png",
    ...(outPath.endsWith(".jpg") ? { quality: 90 } : {}),
    fullPage: false,
  });
  console.log(`✔ ${outPath.replace(PUBLIC_DIR + "/", "")}  (${url})`);
}

async function main() {
  await mkdir(SCREENSHOTS_DIR, { recursive: true });

  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({ deviceScaleFactor: 2 });
    const page = await context.newPage();

    await capture(page, DESKTOP, `${SITE}/`, resolve(SCREENSHOTS_DIR, "hero.jpg"));
    await capture(page, DESKTOP, `${SITE}/#como-funciona`, resolve(SCREENSHOTS_DIR, "pipeline.jpg"), { scrollToSelector: "#como-funciona" });
    await capture(page, DESKTOP, `${SITE}/examples`, resolve(SCREENSHOTS_DIR, "examples.jpg"));
    await capture(page, MOBILE, `${SITE}/`, resolve(SCREENSHOTS_DIR, "mobile.jpg"));

    // OG image at native 1200x630 as compressed JPEG — social crawlers
    // (WhatsApp ~300-600KB cap) silently drop oversized preview images.
    const ogContext = await browser.newContext({ deviceScaleFactor: 1 });
    const ogPage = await ogContext.newPage();
    await capture(ogPage, OG, `${SITE}/`, resolve(PUBLIC_DIR, "og-image.jpg"));
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
