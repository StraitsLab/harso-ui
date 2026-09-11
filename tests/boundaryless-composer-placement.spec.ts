import { expect, test, type Locator, type Page } from "@playwright/test";

async function prepare(page: Page, width: number, height: number, hold = false) {
  await page.setViewportSize({ width, height });
  await page.goto("/#boardui:composer-panel");
  await page.getByLabel("Appearance", { exact: true }).selectOption(width === 390 ? "light" : "dark");
  await page.getByLabel("Palette", { exact: true }).selectOption(width === 390 ? "clean" : "cozy");
  if (hold) await page.getByLabel("Hold host state", { exact: true }).check();
  await page.getByRole("button", { name: "Balanced", exact: true }).click();
  return page.getByRole("button", { name: "Effort: Medium", exact: true });
}

async function bounds(popover: Locator) {
  return popover.evaluate(element => {
    const rectangle = element.getBoundingClientRect();
    return { top: rectangle.top, bottom: rectangle.bottom, left: rectangle.left, right: rectangle.right, width: innerWidth, height: innerHeight, scrollHeight: element.scrollHeight, clientHeight: element.clientHeight };
  });
}

async function expectContained(popover: Locator) {
  await expect(popover).toBeVisible();
  await expect.poll(async () => {
    const rectangle = await bounds(popover);
    return rectangle.top >= 0 && rectangle.bottom <= rectangle.height && rectangle.left >= 0 && rectangle.right <= rectangle.width;
  }).toBe(true);
  for (const name of ["Low", "Medium", "High"]) {
    const radio = popover.getByRole("radio", { name, exact: true });
    await expect(radio).toBeVisible();
    await expect.poll(() => radio.evaluate(element => {
      const rectangle = element.getBoundingClientRect();
      return rectangle.top >= 4 && rectangle.bottom <= innerHeight - 4;
    })).toBe(true);
  }
}

for (const width of [390, 1440]) {
  test(`effort native placement lower edge ${width}`, async ({ page }, testInfo) => {
    const trigger = await prepare(page, width, 1050);
    await page.getByTestId("live-example").scrollIntoViewIfNeeded();
    await trigger.click();
    const popover = page.locator(".hk-composer-effort-popover:popover-open");
    await testInfo.attach("opened-bounds", { body: JSON.stringify(await bounds(popover)), contentType: "application/json" });
    await expectContained(popover);
    const triggerBox = await trigger.boundingBox();
    expect((await bounds(popover)).bottom).toBeLessThanOrEqual(triggerBox!.y);
    await page.screenshot({ path: testInfo.outputPath("lower-edge.png") });
    await popover.getByRole("radio", { name: "High", exact: true }).check();
    await expect(popover.getByRole("radio", { name: "High", exact: true })).toBeChecked();
    await expect(page.getByRole("button", { name: "Effort: High", exact: true })).toBeVisible();
  });
}

test("effort normal placement remains below when space permits", async ({ page }, testInfo) => {
  const trigger = await prepare(page, 1440, 1400);
  await trigger.evaluate(element => element.scrollIntoView({ block: "center" }));
  await trigger.click();
  const popover = page.locator(".hk-composer-effort-popover:popover-open");
  await expectContained(popover);
  const triggerBox = await trigger.boundingBox();
  expect((await bounds(popover)).top).toBeGreaterThanOrEqual(triggerBox!.y + triggerBox!.height);
  await page.screenshot({ path: testInfo.outputPath("normal-below.png") });
});

for (const width of [390, 1440]) {
  test(`effort actual short viewport and open resize ${width}`, async ({ page }, testInfo) => {
    const trigger = await prepare(page, width, 320);
    await trigger.click();
    const popover = page.locator(".hk-composer-effort-popover:popover-open");
    await expectContained(popover);
    await page.screenshot({ path: testInfo.outputPath("short-open.png") });
    await page.setViewportSize({ width: width === 390 ? 1440 : 390, height: 740 });
    await trigger.scrollIntoViewIfNeeded();
    await expectContained(popover);
    await expect(popover.getByRole("radio", { name: "Medium", exact: true })).toBeChecked();
    await page.setViewportSize({ width, height: 320 });
    await trigger.scrollIntoViewIfNeeded();
    await expectContained(popover);
    await page.screenshot({ path: testInfo.outputPath("resized-open.png") });
    await popover.getByRole("radio", { name: "Low", exact: true }).check();
    await expect(popover.getByRole("radio", { name: "Low", exact: true })).toBeChecked();
  });
}

test("effort controlled refusal preserves native selection and disabled trigger", async ({ page }, testInfo) => {
  const trigger = await prepare(page, 390, 320, true);
  await trigger.click();
  const popover = page.locator(".hk-composer-effort-popover:popover-open");
  await expectContained(popover);
  await popover.getByRole("radio", { name: "High", exact: true }).click();
  await expect(popover.getByRole("radio", { name: "High", exact: true })).not.toBeChecked();
  await expect(popover.getByRole("radio", { name: "Medium", exact: true })).toBeChecked();
  await expect(trigger).toHaveText("Effort: Medium");
  await page.screenshot({ path: testInfo.outputPath("host-refusal.png") });
  await trigger.click();
  await page.getByLabel("Composer host state", { exact: true }).selectOption("disabled");
  await expect(page.getByRole("button", { name: "Balanced", exact: true })).toBeDisabled();
  await expect(page.locator(".hk-composer-effort-popover:popover-open")).toHaveCount(0);
});
