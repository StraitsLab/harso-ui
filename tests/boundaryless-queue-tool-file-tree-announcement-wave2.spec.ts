import { expect, test } from "@playwright/test";

for (const [mode, width, appearance] of [["desktop-light", 1440, "light"], ["desktop-dark", 1440, "dark"], ["phone-dark", 390, "dark"]] as const) {
  test(`wave2 ai alignment ${mode}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ colorScheme: appearance, reducedMotion: "reduce" });
    const visit = async (id: string) => {
      await page.goto(`/#${id}`);
      await page.locator("#library-appearance").selectOption(appearance);
      await expect(page.getByTestId("live-example")).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    };
    await visit("vercel:queue");
    for (const item of await page.locator(".hk-queue-item").all()) {
      const offset = await item.evaluate(el => el.querySelector(".hk-queue-indicator")!.getBoundingClientRect().top - el.querySelector(".hk-queue-item-content")!.getBoundingClientRect().top);
      expect(Math.abs(offset)).toBeLessThanOrEqual(4);
    }
    await expect(page.locator(".hk-queue-chevron")).toBeVisible();
    await page.getByRole("button", { name: "Complete Review the brief" }).click();
    await expect(page.getByRole("button", { name: "Reopen Review the brief" })).toBeVisible();

    await visit("vercel:tool");
    const badge = page.locator(".hk-tool .hk-badge");
    await expect(badge).toHaveAttribute("data-status-icon", "true");
    expect(await badge.evaluate(el => getComputedStyle(el, "::before").display)).toBe("none");
    await expect(badge.locator("span")).toHaveCSS("width", "16px");
    await expect(badge).toContainText("Running");

    await visit("vercel:file-tree");
    const columns = async (name: string) => page.getByRole("button", { name, exact: true }).evaluate(el => [el.querySelector(".hk-file-tree-icon")!.getBoundingClientRect().x, el.querySelector(".hk-file-tree-name")!.getBoundingClientRect().x]);
    expect(await columns("README.md")).toEqual(await columns("src"));
    expect(await columns("conversation.tsx")).toEqual(await columns("components"));
    expect(await columns("conversation.tsx")).toEqual(await columns("empty"));
    await page.getByRole("button", { name: "conversation.tsx", exact: true }).click();
    await expect(page.getByRole("button", { name: "conversation.tsx", exact: true })).toHaveAttribute("aria-current", "true");

    await visit("boardui:announcement");
    const fallback = page.locator(".hk-announcement-copy").filter({ hasText: "A title is sometimes enough." });
    await expect(fallback).toHaveCSS("display", "grid");
    expect(await fallback.evaluate(el => { const s = getComputedStyle(el, "::before"); return [s.gridColumnStart, s.gridRowStart, s.marginBottom, s.alignSelf]; })).toEqual(["1", "1", "0px", "center"]);
    await page.getByRole("button", { name: "Dismiss A little more room to think." }).click();
    await expect(page.getByRole("heading", { name: "A title is sometimes enough." })).toBeVisible();
  });
}
