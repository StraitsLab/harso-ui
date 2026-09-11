import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page, baseURL }) => {
  if (!baseURL) throw new Error("A local preview baseURL is required");
  const origin = new URL(baseURL).origin;
  await page.route("**/*", async route => {
    if (new URL(route.request().url()).origin === origin) await route.continue();
    else await route.abort();
  });
  await page.goto("/#vercel:sources");
});

test("held-open Sources replaces real children through empty and recovery", async ({ page }) => {
  const sources = page.locator(".hk-sources");
  const trigger = sources.getByRole("button");
  await expect(trigger).toHaveAccessibleName("3 sources");
  await page.getByLabel("Hold host state").check();
  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  const original = await sources.locator(".hk-source").first().elementHandle();
  await page.getByRole("button", { name: "Empty sample sources", exact: true }).click();
  await expect(trigger).toHaveAccessibleName("0 sources");
  await expect(sources.locator(".hk-source")).toHaveCount(0);
  await expect(sources.getByText("No sources supplied.")).toBeVisible();
  expect(await original!.evaluate(element => element.isConnected)).toBe(false);
  await page.getByRole("button", { name: "Replace sample sources", exact: true }).click();
  await expect(trigger).toHaveAccessibleName("2 sources");
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(sources.getByText("No sources supplied.")).toHaveCount(0);
  await expect(sources.getByText("Firsthand observations", { exact: true })).toHaveCount(0);
  await expect(sources.getByRole("link", { name: /Replacement research/ })).toHaveAttribute("href", "https://example.com/replacement-research");
  await expect(sources.locator(".hk-source")).toHaveCount(2);
  await expect(sources.getByText("Unavailable source (missing address)").locator("..")).toHaveAttribute("aria-disabled", "true");
  await sources.getByText("Unavailable source (missing address)").click();
  await expect(page.getByLabel("Activity request")).toHaveText("Source visibility requested.");
  await sources.getByRole("link", { name: /Replacement research/ }).click();
  await expect(page.getByLabel("Activity request")).toHaveText("Open requested. Synthetic link kept local.");
  await page.getByLabel("Hold host state").uncheck();
  await trigger.focus();
  await page.keyboard.press("Space");
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(sources.getByRole("link")).toHaveCount(0);
  await page.keyboard.press("Enter");
  await expect(sources.getByRole("link")).toHaveCount(1);
});

test("live disabled open Sources suppresses pointer keyboard and auxiliary requests then recovers", async ({ page, baseURL }) => {
  const external: string[] = [];
  const dialogs: string[] = [];
  page.on("request", request => { if (new URL(request.url()).origin !== new URL(baseURL!).origin) external.push(request.url()); });
  page.on("dialog", async dialog => { dialogs.push(dialog.message()); await dialog.dismiss(); });
  const sources = page.locator(".hk-sources");
  const trigger = sources.getByRole("button");
  const first = sources.locator(".hk-source").first();
  const original = await first.elementHandle();
  await page.getByLabel("Disable source actions").check();
  await expect(trigger).toBeDisabled();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(sources.getByRole("link")).toHaveCount(0);
  for (const source of await sources.locator(".hk-source").all()) {
    await expect(source).not.toHaveAttribute("href");
    await expect(source).toHaveAttribute("tabindex", "-1");
    await expect(source).toHaveAttribute("aria-disabled", "true");
    await source.click({ force: true });
    await source.click({ button: "middle", force: true });
    await source.focus();
    await page.keyboard.press("Enter");
  }
  await expect(page.getByLabel("Activity request")).toHaveText("No source opened.");
  await page.getByLabel("Disable source actions").focus();
  await page.keyboard.press("Tab");
  expect(await page.evaluate(() => !!document.activeElement?.closest(".hk-source"))).toBe(false);
  await page.getByLabel("Disable source actions").uncheck();
  expect(await original!.evaluate(element => element.isConnected)).toBe(true);
  await expect(trigger).toBeEnabled();
  await expect(sources.getByRole("link")).toHaveCount(2);
  await expect(first).toHaveAttribute("rel", "noreferrer noopener");
  await expect(first).toHaveAttribute("referrerpolicy", "no-referrer");
  await expect(sources.locator("[ping],img,iframe")).toHaveCount(0);
  await first.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Activity request")).toHaveText("Open requested. Synthetic link kept local.");
  await sources.getByText("Unavailable source (unsafe address)").click();
  await expect(page.getByLabel("Activity request")).not.toContainText("never fire");
  expect(external).toEqual([]);
  expect(dialogs).toEqual([]);
});

test("gallery disabled state starts open with no enabled source actions", async ({ page }) => {
  await page.getByLabel("Example state", { exact: true }).selectOption("disabled");
  const sources = page.locator(".hk-sources");
  await expect(sources.getByRole("button")).toBeDisabled();
  await expect(sources.getByRole("button")).toHaveAttribute("aria-expanded", "true");
  await expect(sources.locator(".hk-source")).toHaveCount(3);
  await expect(sources.locator(".hk-source[href]")).toHaveCount(0);
});
