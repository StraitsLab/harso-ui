// Shoot every catalog family in the gallery at desktop (light/dark) and phone (dark). Usage: node scripts/audit-shoot.cjs [id,id,...]
// Needs the gallery on 4194. Output dir: $HARSO_AUDIT_OUT (default /tmp/harso-e/shots).
// Emits /tmp/harso-e/shots/index.json with per-shot facts (overflow, page errors, preview size).
const { chromium } = require("playwright");
const fs = require("node:fs");
const path = require("node:path");
const OUT = process.env.HARSO_AUDIT_OUT || "/tmp/harso-e/shots";
const catalog = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "src", "catalog.json"), "utf8"));
const only = process.argv[2] ? new Set(process.argv[2].split(",")) : null;
const ids = catalog.components.map(c => c.id).filter(id => !only || only.has(id) || only.has(id.split(":")[1]));
const modes = [["desktop-light", 1440, 900, "light"], ["desktop-dark", 1440, 900, "dark"], ["phone-dark", 390, 844, "dark"]];
(async () => {
  const browser = await chromium.launch({ channel: "chrome" });
  const index = [];
  for (const [mode, w, h, appearance] of modes) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: appearance, reducedMotion: "reduce" });
    const page = await ctx.newPage();
    const errors = []; page.on("pageerror", e => errors.push(String(e.message).slice(0, 120)));
    for (const id of ids) {
      const slug = id.replace(":", "-");
      try {
        await page.goto(`http://127.0.0.1:4194/#${id}`, { waitUntil: "domcontentloaded" });
        await page.waitForTimeout(250);
        await page.selectOption("#library-appearance", appearance).catch(() => {});
        await page.waitForTimeout(900);
        const facts = await page.evaluate(() => {
          const frame = document.querySelector(".hkl-preview-frame") || document.querySelector("main");
          const r = frame?.getBoundingClientRect();
          const overflow = document.documentElement.scrollWidth > innerWidth + 1;
          const empty = !frame || frame.textContent.trim().length < 3;
          return { frame: r ? [Math.round(r.width), Math.round(r.height)] : null, overflow, empty, title: document.querySelector("main h1")?.textContent?.trim().slice(0, 60) };
        });
        const target = page.locator(".hkl-preview-frame").first();
        const shot = `${OUT}/${slug}--${mode}.png`;
        if (await target.count()) await target.screenshot({ path: shot, animations: "disabled" }); else await page.screenshot({ path: shot });
        index.push({ id, mode, path: shot, ...facts, errors: errors.splice(0) });
      } catch (e) { index.push({ id, mode, error: String(e.message).slice(0, 160) }); }
    }
    await ctx.close();
  }
  await browser.close();
  fs.mkdirSync(OUT, { recursive: true }); fs.writeFileSync(`${OUT}/index.json`, JSON.stringify(index, null, 1));
  const bad = index.filter(i => i.error || i.overflow || i.empty || (i.errors && i.errors.length));
  console.log(`shots ${index.length}; flagged ${bad.length}`);
  for (const b of bad.slice(0, 40)) console.log(JSON.stringify(b).slice(0, 200));
})();
