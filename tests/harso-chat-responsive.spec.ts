import { expect, test } from "@playwright/test";
import { captureChat, expectTouchTargets, openChat } from "./helpers/harso-chat";

for (const width of [390, 1024, 1440]) for (const appearance of ["light", "dark"] as const) {
  test(`shell layout and alignment ${width} ${appearance}`, async ({ page }) => {
    const example = await openChat(page, "chat-shell", width, appearance);
    const shell = example.locator(".hkc-shell");
    const shellWidth = (await shell.boundingBox())!.width;
    await expect(shell).toHaveAttribute("data-layout", shellWidth <= 640 ? "phone" : shellWidth < 1024 ? "tablet" : "desktop");
    await captureChat(example, `shell-${width}-${appearance}`);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(await shell.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
    const transcript = example.locator(".hkc-thread-transcript");
    const edges = await transcript.evaluate(element => {
      const bounds = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return { left: bounds.left + parseFloat(style.paddingLeft), right: bounds.right - parseFloat(style.paddingRight) };
    });
    const user = await example.locator(".hkc-message-bubble").first().boundingBox();
    const assistant = await example.locator(".hkc-message--assistant .hkc-message-text").first().boundingBox();
    expect(user).not.toBeNull();
    expect(assistant).not.toBeNull();
    expect(Math.abs(user!.x + user!.width - edges.right)).toBeLessThanOrEqual(2);
    expect(Math.abs(assistant!.x - edges.left)).toBeLessThanOrEqual(2);
  });
}

for (const appearance of ["light", "dark"] as const) {
  test(`phone composer docking and touch targets ${appearance}`, async ({ page }) => {
    const example = await openChat(page, "chat-shell", 390, appearance);
    test.fixme(await example.getByLabel("Composer slot", { exact: true }).count() > 0, "Shell preview still has a Composer slot placeholder; awaiting lane 2 integration.");
    const dock = example.locator(".hkc-shell-composer");
    await dock.scrollIntoViewIfNeeded();
    const bounds = (await dock.boundingBox())!;
    expect(Math.abs(bounds.y + bounds.height - 900)).toBeLessThanOrEqual(24);
    await expectTouchTargets(dock);
    await expect(dock.locator("textarea")).toHaveCSS("font-size", "16px");
  });

  test(`phone drawer Escape restores trigger focus ${appearance}`, async ({ page }) => {
    const example = await openChat(page, "chat-shell", 390, appearance);
    const trigger = example.getByRole("button", { name: "Open conversations", exact: true });
    await trigger.click();
    const drawer = example.getByRole("dialog", { name: "Conversations", exact: true });
    await expect(drawer).toBeVisible();
    await expect(drawer.getByRole("button", { name: "Close conversations", exact: true })).toBeFocused();
    await expectTouchTargets(drawer);
    await captureChat(example, `drawer-390-${appearance}`);
    await page.keyboard.press("Escape");
    await expect(drawer).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  });
}
