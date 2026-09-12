import { test, expect, type Locator } from "@playwright/test";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const sourcePaths = [
  "preview/Library.tsx",
  "preview/examples.tsx",
  "preview/controls-examples.tsx",
  "preview/navigation-examples.tsx",
  "preview/catalogue-examples.tsx",
  "preview/dates-examples.tsx",
  "src/primitives.tsx",
  "src/primitives.css",
  "src/controls.tsx",
  "src/controls.css",
  "src/navigation.tsx",
  "src/navigation.css",
  "src/misc-surfaces.tsx",
  "src/misc-surfaces.css",
  "src/theme.css",
  "src/dates.tsx",
];

async function record(label: string, value: unknown) {
  console.log(`${label}: ${JSON.stringify(value)}`);
  await test.info().attach(label, { body: JSON.stringify(value, null, 2), contentType: "application/json" });
}

async function bounds(locator: Locator) {
  const rectangle = await locator.boundingBox();
  expect(rectangle).not.toBeNull();
  return rectangle!;
}

test.beforeEach(async ({ page }) => {
  const root = resolve(test.info().file, "../..");
  await record("source-sha256", Object.fromEntries(sourcePaths.map(path => [path, createHash("sha256").update(readFileSync(resolve(root, path))).digest("hex")])));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
});

for (const side of ["top", "bottom", "left", "right"] as const) {
  test(`READINESS tooltip ${side} actual placement and Escape`, async ({ page }) => {
    await page.goto("/#boardui:tooltip");
    const example = page.getByTestId("live-example");
    const trigger = example.getByRole("button", { name: "Copy link", exact: true });
    await example.getByLabel("Hint placement").selectOption(side);
    await trigger.focus();
    const hint = page.locator(".hk-tooltip");
    await expect(hint).toBeVisible();
    await expect(hint).toHaveAttribute("data-side", side);
    const anchor = await bounds(trigger);
    const bubble = await bounds(hint);
    if (side === "top") expect(bubble.y + bubble.height).toBeLessThanOrEqual(anchor.y - 7);
    if (side === "bottom") expect(bubble.y).toBeGreaterThanOrEqual(anchor.y + anchor.height + 7);
    if (side === "left") expect(bubble.x + bubble.width).toBeLessThanOrEqual(anchor.x - 7);
    if (side === "right") expect(bubble.x).toBeGreaterThanOrEqual(anchor.x + anchor.width + 7);
    expect(bubble.x).toBeGreaterThanOrEqual(11);
    expect(bubble.x + bubble.width).toBeLessThanOrEqual(1429);
    await record("tooltip-geometry", { side, anchor, bubble });
    await page.keyboard.press("Escape");
    await expect(hint).toBeHidden();
    await expect(trigger).toBeFocused();
  });
}

test("READINESS tooltip small and medium painted density", async ({ page }) => {
  await page.goto("/#boardui:tooltip");
  const example = page.getByTestId("live-example");
  const trigger = example.getByRole("button", { name: "Copy link", exact: true });
  const hint = page.locator(".hk-tooltip");
  await trigger.focus();
  await expect(hint).toBeVisible();
  const medium = await hint.evaluate(element => ({ font: getComputedStyle(element).fontSize, padding: getComputedStyle(element).padding }));
  await expect(hint).toHaveCSS("font-size", "13px");
  await expect(hint).toHaveCSS("padding", "10px 14px");
  await page.keyboard.press("Escape");
  await example.getByRole("button", { name: "Open brief" }).focus();
  await expect(hint).toBeVisible();
  await expect(hint).toHaveCSS("font-size", "12px");
  await expect(hint).toHaveCSS("padding", "7px 10px");
  const small = await bounds(hint);
  await record("tooltip-density", { medium, small });
});

test("READINESS tooltip viewport collision flips above-edge trigger below", async ({ page }) => {
  await page.goto("/#boardui:tooltip");
  const example = page.getByTestId("live-example");
  const trigger = example.getByRole("button", { name: "Copy link", exact: true });
  const hint = page.locator(".hk-tooltip");
  await example.getByLabel("Hint placement").focus();
  await trigger.evaluate(element => window.scrollBy(0, element.getBoundingClientRect().top - 18));
  await page.evaluate(() => new Promise<void>(done => requestAnimationFrame(() => requestAnimationFrame(() => done()))));
  await trigger.focus();
  await expect(hint).toBeVisible();
  await expect(hint).toHaveAttribute("data-side", "bottom");
  const anchor = await bounds(trigger);
  const flipped = await bounds(hint);
  expect(anchor.y).toBeGreaterThanOrEqual(0);
  expect(anchor.y).toBeLessThan(30);
  expect(flipped.y).toBeGreaterThanOrEqual(anchor.y + anchor.height + 7);
  expect(flipped.y + flipped.height).toBeLessThanOrEqual(988);
  await record("tooltip-collision", { anchor, flipped });
});

for (const treatment of ["pill", "accent"]) {
  test(`READINESS tabs ${treatment} painted selection and panel interaction`, async ({ page }) => {
    await page.goto("/#boardui:tabs");
    await page.getByLabel("Appearance", { exact: true }).selectOption("light");
    await page.getByLabel("Palette", { exact: true }).selectOption("clean");
    const example = page.getByTestId("live-example");
    await example.getByLabel("Tab treatment").selectOption(treatment);
    const overview = example.getByRole("tab", { name: "Overview" });
    const sources = example.getByRole("tab", { name: "Sources 6" });
    await expect(overview).toHaveAttribute("aria-selected", "true");
    const selected = await overview.evaluate(element => ({ color: getComputedStyle(element).color, background: getComputedStyle(element).backgroundColor, radius: getComputedStyle(element).borderRadius }));
    expect(selected.background).not.toBe("rgba(0, 0, 0, 0)");
    expect(selected.radius).toBe("26px");
    expect(selected.color).toBe(treatment === "accent" ? "rgb(29, 99, 200)" : "rgb(31, 34, 38)");
    await sources.click();
    await page.mouse.move(0, 0);
    await expect(sources).toHaveAttribute("aria-selected", "true");
    await expect(overview).toHaveAttribute("aria-selected", "false");
    await expect(example.getByRole("tabpanel")).toContainText("Customer interviews");
    await expect(overview).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    await expect(sources).toHaveCSS("background-color", selected.background);
    await sources.press("ArrowRight");
    await expect(overview).toBeFocused();
    await expect(example.getByRole("tabpanel")).toContainText("Start smaller.");
    await record("tab-paint-and-box", { treatment, selected, geometry: await bounds(overview) });
  });
}

test("READINESS slider exact bubble follows keyboard value and reset", async ({ page }) => {
  await page.goto("/#boardui:slider");
  const example = page.getByTestId("controls-example");
  const slider = example.getByRole("slider", { name: /^Volume ·/ });
  const bubble = example.locator(".hk-slider-value");
  await expect(bubble).toHaveCSS("opacity", "0");
  await slider.focus();
  await expect(bubble).toHaveCSS("opacity", "1");
  await expect(bubble).toHaveText("45%");
  await slider.press("ArrowRight");
  await expect(slider).toHaveValue("46");
  await expect(bubble).toHaveText("46%");
  const track = await bounds(slider);
  const value = await bounds(bubble);
  expect(value.y + value.height).toBeLessThanOrEqual(track.y + 1);
  expect(value.width).toBeGreaterThan(20);
  expect(value.x).toBeGreaterThanOrEqual(track.x);
  expect(value.x + value.width).toBeLessThanOrEqual(track.x + track.width + 1);
  await record("slider-bubble-geometry", { track, value });
  await example.getByRole("button", { name: "Reset range" }).click();
  await expect(bubble).toHaveText("45%");
  await page.getByLabel("Example state").selectOption("disabled");
  await expect(example.getByRole("slider", { name: "Volume · 45%" })).toBeDisabled();
});

test("READINESS close button four glyph sizes retain hit targets and callbacks", async ({ page }) => {
  await page.goto("/#boardui:close-button");
  const example = page.getByTestId("live-example");
  const observed = [];
  for (const [size, width] of [["2xs", 12], ["xs", 14], ["small", 16], ["medium", 20]] as const) {
    const button = example.getByRole("button", { name: `Close ${size} example`, exact: true });
    const control = await bounds(button);
    const glyph = await bounds(button.locator("svg"));
    expect(control.width).toBeGreaterThanOrEqual(42);
    expect(control.height).toBeGreaterThanOrEqual(42);
    expect.soft(glyph.width, `${size} glyph width`).toBe(width);
    expect.soft(glyph.height, `${size} glyph height`).toBe(width);
    await button.click();
    await expect(example.getByRole("status")).toHaveText(`${size} close action received`);
    observed.push({ size, control, glyph });
  }
  await record("close-button-geometry", observed);
  await example.screenshot({ path: test.info().outputPath("close-buttons.png") });
});

test("READINESS social and radio gallery exposure inventory is not variant proof", async ({ page }) => {
  await page.goto("/#boardui:social-button");
  const social = page.getByTestId("live-example");
  const button = social.getByRole("button", { name: "Continue with GitHub" });
  await expect(button).toBeVisible();
  const socialObservation = await button.evaluate(element => ({ text: element.textContent, icons: element.querySelectorAll("svg,img").length, background: getComputedStyle(element).backgroundColor, width: element.getBoundingClientRect().width, height: element.getBoundingClientRect().height }));
  await social.screenshot({ path: test.info().outputPath("social-default.png") });
  await page.setViewportSize({ width: 800, height: 1000 });
  await record("social-exposure-only", { ...socialObservation, resized: await bounds(button), controls: await social.locator("select,input").count() });
  await page.goto("/#boardui:radio");
  const example = page.getByTestId("live-example");
  await expect(example.getByRole("radio", { name: "Our team" })).toBeChecked();
  await expect(example.getByRole("radio", { name: "Everyone" })).not.toBeChecked();
  await example.getByRole("radio", { name: "Everyone" }).check();
  await expect(example.getByRole("radio", { name: "Our team" })).not.toBeChecked();
  await expect(example.getByRole("radio", { name: "Everyone" })).toBeChecked();
  await expect(page.locator(".hk-radio-dot--presentation")).toHaveCount(0);
  await record("radio-exposure-only", { presentations: 0, nativeRadios: await example.getByRole("radio").count(), box: await bounds(example.getByRole("radio", { name: "Everyone" })) });
  await example.screenshot({ path: test.info().outputPath("radio-native-selected.png") });
});

test("READINESS button hover pressed and disabled actual paint and callback", async ({ page }) => {
  await page.goto("/#boardui:button");
  const example = page.getByTestId("live-example");
  const button = example.getByRole("button", { name: "Continue" });
  const initial = await button.evaluate(element => getComputedStyle(element).backgroundColor);
  await button.hover();
  await expect.poll(() => button.evaluate(element => getComputedStyle(element).backgroundColor)).not.toBe(initial);
  const hover = await button.evaluate(element => getComputedStyle(element).backgroundColor);
  await page.mouse.down();
  await expect(button).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 1)");
  await page.mouse.up();
  await expect(example.getByRole("status")).toHaveText("1 example actions received");
  await page.getByLabel("Example state").selectOption("disabled");
  await expect(button).toBeDisabled();
  const disabled = await button.evaluate(element => getComputedStyle(element).backgroundColor);
  expect(disabled).not.toBe(initial);
  await button.hover();
  await page.mouse.down();
  await expect(button).toHaveCSS("transform", "none");
  await page.mouse.up();
  await expect(example.getByRole("status")).toHaveText("Try an action. This example does not save anything.");
  await record("button-paints", { initial, hover, disabled });
});

test("READINESS OTP real clipboard paste distributes six digits", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/#boardui:input-otp");
  const example = page.getByTestId("controls-example");
  const input = example.getByRole("textbox", { name: "One-time code" });
  await page.evaluate(() => navigator.clipboard.writeText("123456"));
  await input.focus();
  await input.press("ControlOrMeta+v");
  await expect(input).toHaveValue("123456");
  expect(await example.locator("[data-otp-slot]").allTextContents()).toEqual(["1", "2", "3", "4", "5", "6"]);
  await record("native-paste", { value: await input.inputValue(), slots: await example.locator("[data-otp-slot]").allTextContents(), autofill: "not exercised" });
});

test("READINESS slider inherited RTL keyboard direction and disabled state", async ({ page }) => {
  await page.goto("/#boardui:slider");
  const example = page.getByTestId("controls-example");
  await example.evaluate(element => element.setAttribute("dir", "rtl"));
  const slider = example.getByRole("slider", { name: /^Volume ·/ });
  await expect(slider).toHaveCSS("direction", "rtl");
  await slider.press("ArrowLeft");
  await expect(slider).toHaveValue("46");
  await expect(example.locator(".hk-slider-value")).toHaveText("46%");
  await slider.press("ArrowRight");
  await expect(slider).toHaveValue("45");
  await record("inherited-rtl", { direction: await slider.evaluate(element => getComputedStyle(element).direction), value: await slider.inputValue(), box: await bounds(slider), environment: "dir=rtl on existing gallery composition; no synthetic input events" });
  await page.getByLabel("Example state").selectOption("disabled");
  await expect(slider).toBeDisabled();
  const rectangle = await bounds(slider);
  await page.mouse.click(rectangle.x + rectangle.width * 0.8, rectangle.y + rectangle.height / 2);
  await expect(slider).toHaveValue("45");
});

for (const composition of ["single", "range"] as const) {
  test(`READINESS date ${composition} draft Apply reopen and viewport geometry`, async ({ page }) => {
    await page.goto("/#boardui:date-picker");
    await page.getByLabel("Date composition").selectOption(composition);
    const trigger = page.locator(".hk-date-selection > button");
    await trigger.click();
    const dialog = page.getByRole("dialog", { name: composition === "single" ? "Review date" : "Research window" });
    await expect(dialog).toBeVisible();
    const field = dialog.getByLabel(composition === "single" ? "Date" : "Start date", { exact: true });
    await field.fill("2026-09-08");
    const selected = page.getByLabel(composition === "single" ? "Selected date" : "Selected range");
    await expect(selected).toHaveText(composition === "single" ? "2026-09-06" : "2026-09-07 / 2026-09-11");
    const geometry = await bounds(dialog);
    expect(geometry.x).toBeGreaterThanOrEqual(0);
    expect(geometry.x + geometry.width).toBeLessThanOrEqual(1441);
    expect(geometry.y).toBeGreaterThanOrEqual(0);
    expect(geometry.y + geometry.height).toBeLessThanOrEqual(1001);
    await dialog.getByRole("button", { name: "Apply", exact: true }).click();
    await expect(selected).toHaveText(composition === "single" ? "2026-09-08" : "2026-09-08 / 2026-09-11");
    await trigger.click();
    await expect(field).toHaveValue("2026-09-08");
    await record("date-composition", { composition, geometry, selected: await selected.innerText() });
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
  });
}

test("READINESS breadcrumb hover paints underline without navigating", async ({ page }) => {
  await page.goto("/#boardui:breadcrumb");
  const link = page.getByTestId("live-example").getByRole("link", { name: "Workspace" });
  await expect(link).toHaveCSS("text-decoration-line", "none");
  await link.hover();
  await expect(link).toHaveCSS("text-decoration-line", "underline");
  await expect(link).toHaveCSS("text-underline-offset", "4px");
  await expect(page).toHaveURL(/#boardui:breadcrumb$/);
  await record("breadcrumb-hover", { box: await bounds(link), decoration: await link.evaluate(element => getComputedStyle(element).textDecoration) });
});
