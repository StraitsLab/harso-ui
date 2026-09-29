import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

for (const mode of ["light", "dark"]) for (const width of [420, 512]) {
  for (const missing of [false, true]) test(`View all ${mode} ${width} missing=${missing}`, async ({ page }) => {
    await page.goto(`/#/catalogue/shopping?mode=${mode}`);
    const selector = `[data-example="shop-running-shoes"] .hkl-cat-state${missing ? '[data-state="missing-photo"]' : ':not([data-state])'} .hkl-cat-frame[data-width="420"]`;
    const frame = page.locator(selector);
    await frame.evaluate((el, width) => { (el as HTMLElement).style.width = `${width}px`; }, width);
    await expect(frame.locator('.hkc-output-card-row')).toHaveCount(3);
    await expect(frame.locator('.hkc-output-thumb')).toHaveCount(missing ? 0 : 3);
    await frame.getByRole('button', { name: /View all/ }).click();
    const full = frame.getByRole('region', { name: /full answer$/ });
    const rows = full.locator('.hkc-output-card-rows');
    await expect(rows.locator('li')).toHaveCount(7);
    await expect(rows.locator('.hkc-output-thumb')).toHaveCount(missing ? 0 : 7);
    if (missing) {
      await expect(full.getByRole('button', { name: /^(List|Grid)$/ })).toHaveCount(0);
      await expect(rows).not.toHaveCSS('display', 'grid');
    } else {
      await expect(rows).toHaveAttribute('data-layout', 'grid');
      await expect(rows).toHaveCSS('display', 'grid');
      await expect(rows.locator('img')).toHaveCount(7);
      const boxes = await rows.locator('li').evaluateAll(items => items.map(el => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y }; }));
      expect(boxes[0].y).toBe(boxes[1].y);
      expect(boxes[1].x).toBeGreaterThan(boxes[0].x);
      expect(await frame.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
      expect((await new AxeBuilder({ page }).include(selector).analyze()).violations).toEqual([]);
      const list = full.getByRole('button', { name: 'List', exact: true });
      for (let i = 0; i < 5 && !(await list.evaluate(el => el === document.activeElement)); i++) await page.keyboard.press('Tab');
      await expect(list).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(rows).toHaveAttribute('data-layout', 'list');
      await expect(list).toHaveAttribute('aria-pressed', 'true');
      expect((await new AxeBuilder({ page }).include(selector).analyze()).violations).toEqual([]);
      await page.keyboard.press('Shift+Tab');
      await expect(full.getByRole('button', { name: 'Grid', exact: true })).toBeFocused();
      await page.keyboard.press('Space');
      await expect(rows).toHaveAttribute('data-layout', 'grid');
      await full.getByRole('button', { name: 'Show less' }).click();
      await frame.getByRole('button', { name: /View all/ }).click();
      await expect(frame.locator('.hkc-output-card-rows')).toHaveAttribute('data-layout', 'grid');
    }
    expect((await new AxeBuilder({ page }).include(selector).analyze()).violations).toEqual([]);
  });
}
