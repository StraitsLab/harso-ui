import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  page.setDefaultTimeout(5000);
  await page.goto("/#vercel:chain-of-thought");
});

test("supplied chain summary retains native disclosure through disabled and content recovery", async ({ page }) => {
  const example = page.getByTestId("live-example");
  const header = example.locator("button.hk-chain-header");
  await header.click();
  const originalHeader = await header.elementHandle();
  const content = example.locator(".hk-chain-content");
  const originalContent = await content.elementHandle();
  await expect(example.getByText("Read the supplied work state", { exact: true })).toBeVisible();
  await example.getByLabel("Disable disclosure controls").check();
  await expect(header).toBeDisabled();
  await expect(example.getByRole("button", { name: "Close supplied summary", exact: true })).toBeDisabled();
  await header.click({ force: true });
  await expect(header).toHaveAttribute("aria-expanded", "true");
  await expect(content).toBeVisible();
  await example.getByLabel("Disable disclosure controls").uncheck();
  await header.focus();
  await page.keyboard.press("Space");
  await expect(header).toHaveAttribute("aria-expanded", "false");
  await page.keyboard.press("Enter");
  await expect(header).toHaveAttribute("aria-expanded", "true");
  await expect(content).toBeVisible();
  expect(await header.evaluate((element, before) => element === before, originalHeader)).toBe(true);
  for (const state of ["empty", "loading", "error", "replacement", "default"]) {
    await example.getByRole("combobox", { name: "Supplied summary state", exact: true }).selectOption(state);
    expect(await content.evaluate((element, before) => element === before, originalContent)).toBe(true);
    await expect(header).toHaveAttribute("aria-expanded", "true");
    if (state === "empty") {
      await expect(content.locator(".hk-chain-step")).toHaveCount(0);
      await expect(content.getByText("No work summary supplied.")).toBeVisible();
    } else if (state === "loading") {
      await expect(content).toHaveAttribute("aria-busy", "true");
      await expect(content.locator('.hk-chain-step[data-status="active"]')).toHaveText(/Waiting for the supplied summary/);
    } else if (state === "error") {
      await expect(content.getByRole("alert")).toHaveText("The host could not supply a work summary. No retry is started here.");
      await expect(content.locator('.hk-chain-step[data-status="active"]')).toHaveCount(0);
      await expect(content).toHaveAttribute("aria-busy", "false");
    } else if (state === "replacement") {
      await expect(content.getByText("Replacement work summary", { exact: true })).toBeVisible();
      await expect(content.getByText("Read the supplied work state", { exact: true })).toHaveCount(0);
      await expect(content.getByRole("alert")).toHaveCount(0);
    } else {
      await expect(content.getByText("Read the supplied work state", { exact: true })).toBeVisible();
      await expect(content.getByText("Replacement work summary", { exact: true })).toHaveCount(0);
      await expect(content.locator(".hk-chain-search-result")).toHaveCount(2);
    }
  }
});

test("chain host can refuse both opening and closing without changing supplied content", async ({ page }) => {
  const example = page.getByTestId("live-example");
  const header = example.locator("button.hk-chain-header");
  const content = example.locator(".hk-chain-content");
  await example.getByLabel("Hold disclosure state").check();
  await header.click();
  await expect(example.getByLabel("Disclosure request", { exact: true })).toHaveText("Requested: open");
  await expect(header).toHaveAttribute("aria-expanded", "false");
  await expect(content).toBeHidden();
  await example.getByRole("button", { name: "Open supplied summary", exact: true }).click();
  await expect(content).toBeHidden();
  await example.getByLabel("Hold disclosure state").uncheck();
  await header.click();
  await example.getByLabel("Hold disclosure state").check();
  await header.click();
  await expect(example.getByLabel("Disclosure request", { exact: true })).toHaveText("Requested: closed");
  await expect(content).toBeVisible();
  await example.getByRole("button", { name: "Close supplied summary", exact: true }).click();
  await expect(content).toBeVisible();
  await example.getByLabel("Hold disclosure state").uncheck();
  await header.click();
  await expect(content).toBeHidden();
  await expect(content.getByText("Read the supplied work state", { exact: true })).toBeAttached();
});
