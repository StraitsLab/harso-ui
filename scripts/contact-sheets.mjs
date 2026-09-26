#!/usr/bin/env node
// Contact sheets for the catalogue: shoots #/catalogue/<vertical> in light and in dark, full page, to
//   $HARSO_SHEETS_DIR (default /Volumes/MainData/AgentTools/hermes/evidence/studio/sheets)/catalogue-<vertical>-light.png|-dark.png
// Starts its own Vite server on a free port; needs Google Chrome (Playwright channel "chrome").
// Usage: node scripts/contact-sheets.mjs <vertical|all>
// Exit 1 when a vertical is unknown, a page logs a console error, or a vertical draws no examples.
import { mkdirSync, readFileSync, realpathSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { createServer } from "vite";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = process.env.HARSO_SHEETS_DIR ?? "/Volumes/MainData/AgentTools/hermes/evidence/studio/sheets";
const { verticals } = JSON.parse(readFileSync(resolve(ROOT, "catalogue/index.json"), "utf8"));

const arg = process.argv[2];
const chosen = arg === "all" ? verticals : [arg];
if (!arg || chosen.some(vertical => !verticals.includes(vertical))) {
  console.error(`usage: node scripts/contact-sheets.mjs <${verticals.join("|")}|all>`);
  process.exit(1);
}

mkdirSync(OUT, { recursive: true });
const server = await createServer({ root: ROOT, configFile: resolve(ROOT, "vite.config.ts"), logLevel: "error", server: { host: "127.0.0.1", port: 0, fs: { allow: [ROOT, realpathSync(resolve(ROOT, "node_modules"))] } } });
// Lane worktrees share one node_modules through a symlink; Vite would refuse the fonts behind it.
await server.listen();
const base = server.resolvedUrls.local[0];
const browser = await chromium.launch({ channel: "chrome" });
let failures = 0;
try {
  for (const vertical of chosen) {
    for (const mode of ["light", "dark"]) {
      const page = await browser.newPage({ viewport: { width: 1760, height: 1000 }, colorScheme: mode, reducedMotion: "reduce" });
      page.setDefaultTimeout(120_000); // the first load compiles the whole preview; shared hosts are slow
      const errors = [];
      // The gallery has no favicon; any other console error (a failed request included) fails the sheet.
      const favicon = message => message.location().url.endsWith("/favicon.ico");
      page.on("console", message => { if (message.type() === "error" && !favicon(message)) errors.push(message.text()); });
      page.on("pageerror", error => errors.push(error.message));
      await page.goto(`${base}#/catalogue/${vertical}?mode=${mode}`);
      await page.locator(`[data-testid=catalogue][data-vertical=${vertical}] .hkl-cat-example`).first().waitFor();
      await page.evaluate(() => document.fonts.ready);
      const drawn = await page.locator(".hkl-cat-example").count();
      const path = `${OUT}/catalogue-${vertical}-${mode}.png`;
      await page.screenshot({ path, fullPage: true, animations: "disabled" });
      await page.close();
      if (errors.length || !drawn) failures += 1;
      console.log(`${path}  ${drawn} examples${errors.length ? `  CONSOLE ERRORS: ${errors.join(" | ").slice(0, 300)}` : ""}`);
    }
  }
} finally {
  await browser.close();
  await server.close();
}
process.exit(failures ? 1 : 0);
