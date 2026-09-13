import { mkdir } from "node:fs/promises";
import { expect, test, type Locator, type Page } from "@playwright/test";

export const chatRoutes = ["chat-thread", "chat-composer", "chat-parts", "chat-shell", "chat-markdown"] as const;
export type ChatRoute = typeof chatRoutes[number];
const routeRoots: Record<ChatRoute, string> = {
  "chat-thread": ".hkc-thread",
  "chat-composer": ".hkc-composer-example",
  "chat-parts": ".hkc-chat-parts-example",
  "chat-shell": ".hkc-shell",
  "chat-markdown": ".hkc-chat-markdown-example",
};

export async function openChat(page: Page, route: ChatRoute, width = 1440, appearance: "light" | "dark" = "light") {
  await page.setViewportSize({ width, height: 900 });
  const viewport = width <= 640 ? "phone" : width <= 1024 ? "tablet" : "desktop";
  await page.goto(`/#harso:${route}?vw=${viewport}`);
  await expect(page.locator("vite-error-overlay")).toHaveCount(0);
  const example = page.getByTestId("live-example");
  await expect(example).toBeVisible();
  test.fixme(await example.locator('[class*="hkc-"]').count() === 0, `harso:${route} is not mounted in the gallery yet; awaiting route registration.`);
  await expect(example.locator(routeRoots[route])).toBeVisible();
  // Chat routes render as full-height app pages; their header (with the theme selects) is hidden below 640px.
  const appearanceSelect = page.getByLabel("Appearance", { exact: true });
  if (await appearanceSelect.isVisible()) {
    await appearanceSelect.selectOption(appearance);
    await page.getByLabel("Palette", { exact: true }).selectOption(width === 390 ? "clean" : "cozy");
  } else {
    await page.evaluate(([mode, palette]) => { const root = document.querySelector(".harso-kit"); root?.setAttribute("data-mode", mode); root?.setAttribute("data-palette", palette); }, [appearance, width === 390 ? "clean" : "cozy"] as const);
  }
  return example;
}

export async function sendMessage(example: Locator, text: string) {
  await example.locator("textarea").fill(text);
  await example.getByRole("button", { name: "Send", exact: true }).click();
}

export async function attachFile(page: Page, example: Locator, name = "lane-7.txt") {
  const chooser = page.waitForEvent("filechooser");
  await example.getByRole("button", { name: "Add attachment", exact: true }).click();
  await (await chooser).setFiles({ name, mimeType: "text/plain", buffer: Buffer.from("Local Playwright attachment fixture.") });
}

export async function expectTouchTargets(root: Locator) {
  const buttons = root.getByRole("button");
  expect(await buttons.count()).toBeGreaterThan(0);
  for (const button of await buttons.all()) {
    if (!await button.isVisible()) continue;
    const bounds = await button.boundingBox();
    expect(bounds?.width, await button.getAttribute("aria-label") ?? "button width").toBeGreaterThanOrEqual(44);
    expect(bounds?.height, "button height").toBeGreaterThanOrEqual(44);
  }
}

export async function captureChat(example: Locator, name: string) {
  await mkdir("/tmp/harso-a", { recursive: true });
  await example.screenshot({ path: `/tmp/harso-a/7-${name}.png`, animations: "disabled" });
}

/** The scripted adapter pauses on a terminal approval; approve it (if shown) so the run can complete. */
export async function settleRun(example: Locator) {
  const approve = example.getByRole("button", { name: "Approve", exact: true }).last();
  await approve.waitFor({ state: "visible", timeout: 15_000 }).catch(() => undefined);
  if (await approve.isVisible()) await approve.click();
  await expect(example.getByRole("status", { name: "Streaming" })).toHaveCount(0, { timeout: 20_000 });
}
