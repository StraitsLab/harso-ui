import { expect, test, type Locator } from "@playwright/test";

async function captionGeometry(frame: Locator) {
  return frame.evaluate(element => {
    const bounds = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    const radius = Number.parseFloat(style.borderBottomLeftRadius);
    const caption = element.querySelector("figcaption")!;
    const text = caption.firstChild!;
    const inside = (horizontal: number, vertical: number) => {
      if (horizontal < 0 || vertical < 0 || horizontal > bounds.width || vertical > bounds.height) return false;
      const centerX = horizontal < radius ? radius : horizontal > bounds.width - radius ? bounds.width - radius : horizontal;
      const centerY = vertical < radius ? radius : vertical > bounds.height - radius ? bounds.height - radius : vertical;
      return Math.hypot(horizontal - centerX, vertical - centerY) <= radius + 0.1;
    };
    const clipped: { character: string; left: number; top: number; right: number; bottom: number }[] = [];
    for (let index = 0; index < text.textContent!.length; index++) {
      const character = text.textContent![index];
      if (!character.trim()) continue;
      const range = document.createRange();
      range.setStart(text, index);
      range.setEnd(text, index + 1);
      for (const rectangle of range.getClientRects()) {
        const left = rectangle.left - bounds.left;
        const right = rectangle.right - bounds.left;
        const top = rectangle.top - bounds.top;
        const bottom = rectangle.bottom - bounds.top;
        if (![[left, top], [right, top], [left, bottom], [right, bottom]].every(([horizontal, vertical]) => inside(horizontal, vertical))) clipped.push({ character, left, top, right, bottom });
      }
    }
    return { clipped, text: caption.textContent, width: bounds.width, scrollWidth: element.scrollWidth, radius: style.borderRadius, overflow: style.overflow, captionPadding: getComputedStyle(caption).padding };
  });
}

for (const appearance of ["light", "dark"]) for (const palette of ["clean", "cozy"]) for (const width of [390, 1440]) {
  test(`image frame caption retains glyphs and corners ${appearance}/${palette}/${width}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1040 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/#boardui:ai-image-generation");
    await page.getByLabel("Appearance", { exact: true }).selectOption(appearance);
    await page.getByLabel("Palette", { exact: true }).selectOption(palette);
    const frame = page.locator(".hk-image-generation-frame");
    const inspect = async (state: string) => {
      const geometry = await captionGeometry(frame);
      await testInfo.attach(`${state}-geometry`, { body: JSON.stringify(geometry, null, 2), contentType: "application/json" });
      await frame.screenshot({ path: testInfo.outputPath(`${state}.png`) });
      expect(geometry.clipped, `${state}: glyph bounds fit the rounded clip`).toEqual([]);
      expect(geometry.radius).toBe("18px");
      expect(geometry.overflow).toBe("hidden");
      expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.width + 1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      if (appearance === "light" && palette === "clean" && ["countdown", "stopped", "failed"].includes(state)) {
        const mutation = await page.addStyleTag({ content: ".hk-image-generation-frame figcaption { padding: 0 !important; }" });
        const mutated = await captionGeometry(frame);
        await testInfo.attach(`${state}-padding-removal`, { body: JSON.stringify(mutated, null, 2), contentType: "application/json" });
        await frame.screenshot({ path: testInfo.outputPath(`${state}-padding-removal.png`) });
        expect(mutated.clipped.length).toBeGreaterThan(0);
        await mutation.evaluate(element => element.parentNode?.removeChild(element));
        expect((await captionGeometry(frame)).clipped).toEqual([]);
      }
    };
    await expect.poll(() => frame.locator("img").evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
    await expect(frame.locator("img")).toHaveCSS("border-radius", "12px");
    await inspect("initial-image");
    const prompt = "Local visual countdown sample — a longer supplied caption that wraps naturally at narrow widths.";
    await page.getByRole("textbox", { name: "Describe your image" }).fill(prompt);
    await page.getByRole("button", { name: "Generate image", exact: true }).click();
    await expect(frame.getByText("Estimated 12 seconds remaining")).toBeVisible();
    await expect(frame.locator("figcaption")).toHaveText(prompt);
    await inspect("countdown");
    await page.getByRole("button", { name: "Stop generation", exact: true }).click();
    await expect(frame.getByRole("status")).toHaveText("Generation stopped");
    await inspect("stopped");
    await page.getByLabel("Image example state").selectOption("failed");
    await expect(frame.getByRole("alert")).toBeVisible();
    await inspect("failed");
    await frame.getByRole("button", { name: "Retry generation", exact: true }).click();
    for (const update of [1, 2, 3]) await page.getByRole("button", { name: "Advance image update", exact: true }).click();
    await expect.poll(() => frame.locator("img").evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
    await expect(frame.locator("img")).toHaveCSS("border-radius", "12px");
    await inspect("completed-image");
  });
}
