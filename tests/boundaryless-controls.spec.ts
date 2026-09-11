import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("native range serialization, displayed values and callbacks agree at numeric boundaries", async ({ page }) => {
  await page.goto("/#boardui:slider");
  const example = page.getByTestId("controls-example");
  const configurations = [
    { label: "Decimal", min: 0, max: 0.3 },
    { label: "Partial last step", min: 0, max: 0.9999999999999999 },
    { label: "Large origin", min: 1e12, max: 1e12 + 1 },
    { label: "Out of bounds", min: 0, max: 101 },
  ];
  for (const config of configurations) {
    await example.getByLabel("Range scale").selectOption({ label: config.label });
    for (const action of ["initial", "End", "Home"]) {
      if (action !== "initial") await example.getByRole("slider", { name: `${action === "End" ? "Minimum" : "Maximum"} Budget` }).press(action);
      const observed = await example.locator("form").evaluate(form => {
        const inputs = Array.from(form.querySelectorAll<HTMLInputElement>(".hk-range-pair input"));
        const data = new FormData(form as HTMLFormElement);
        return { values: inputs.map(input => input.value), valid: inputs.every(input => input.checkValidity()), displays: Array.from(form.querySelectorAll(".hk-range-pair output"), output => output.textContent), data: [data.get("minimum"), data.get("maximum")] };
      });
      expect(observed.valid, config.label).toBe(true);
      expect(observed.displays, config.label).toEqual(observed.values);
      expect(observed.data, config.label).toEqual(observed.values);
      const [low, high] = observed.values.map(Number);
      expect(low).toBeGreaterThanOrEqual(config.min);
      expect(high).toBeLessThanOrEqual(config.max);
      expect(low).toBeLessThanOrEqual(high);
      if (action !== "initial") expect(JSON.parse(await example.getByLabel("Supplied range").innerText())).toEqual([low, high]);
    }
  }
  await example.getByLabel("Range scale").selectOption({ label: "Precision limit" });
  await expect(example.getByRole("slider", { name: "Maximum Budget" })).toBeDisabled();
  await expect(example.getByText("Range unavailable: browser precision limit.")).toBeVisible();
  expect(await example.locator("form").evaluate(form => new FormData(form as HTMLFormElement).has("maximum"))).toBe(false);
  await example.getByLabel("Range scale").selectOption({ label: "Budget" });
  await expect(example.getByRole("slider", { name: "Maximum Budget" })).toBeEnabled();
});

test("all nine entry families expose meaningful original compositions and accessible states", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  const parts: Record<string, string> = { input: "input[type=tel]", checkbox: ".hk-choice-card", switch: ".hk-switch--rectangle", radio: ".hk-radio-dot", select: "option", slider: ".hk-range-pair", badge: "kbd", "input-otp": "input[autocomplete=one-time-code]", "file-upload": "input[type=file]" };
  for (const [slug, selector] of Object.entries(parts)) {
    await page.goto(`/#boardui:${slug}`);
    await expect(page.getByTestId("controls-example").locator(selector).first()).toBeAttached();
    const audit = await new AxeBuilder({ page }).include(".harso-kit").analyze();
    expect(audit.violations, slug).toEqual([]);
  }
  expect(errors).toEqual([]);
});

test("mixed selection, choice cards, native reset and switch sizes survive real keyboard input", async ({ page }) => {
  await page.goto("/#boardui:checkbox");
  const example = page.getByTestId("controls-example");
  const all = example.getByRole("checkbox", { name: "All references" });
  expect(await all.evaluate(input => (input as HTMLInputElement).indeterminate)).toBe(true);
  await all.focus();
  await page.keyboard.press("Space");
  await expect(example.getByText("2 references selected")).toBeVisible();
  await example.getByRole("checkbox", { name: "Research sources" }).uncheck();
  expect(await all.evaluate(input => (input as HTMLInputElement).indeterminate)).toBe(true);
  await example.getByLabel("Control size").selectOption("small");
  await expect(all).toHaveCSS("width", "16px");
  await expect(all).toHaveAccessibleName("All references");
  await page.goto("/#boardui:radio");
  await example.getByRole("radio", { name: "A focused brief" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(example.getByRole("radio", { name: "A full report" })).toBeChecked();
  await example.getByRole("button", { name: "Read form" }).click();
  await expect(example.getByText("Native form: report")).toBeVisible();
  await example.getByRole("button", { name: "Reset choices" }).click();
  await expect(example.getByRole("radio", { name: "A focused brief" })).toBeChecked();
  await page.goto("/#boardui:switch");
  const toggle = example.getByRole("switch", { name: "Rectangle switch" });
  await toggle.focus();
  await page.keyboard.press("Space");
  await expect(example.getByText("Voice responses on")).toBeVisible();
  await expect(toggle).toHaveCSS("border-radius", "6px");
  await example.getByLabel("Control size").selectOption("large");
  await expect(toggle).toHaveCSS("width", "46px");
  await page.getByLabel("Example state").selectOption("disabled");
  await expect(toggle).toBeDisabled();
});

test("OTP retains native paste, editing, validation and explicit submission without requests", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  const requests: string[] = [];
  await page.goto("/#boardui:input-otp");
  page.on("request", request => requests.push(request.url()));
  const example = page.getByTestId("controls-example");
  const input = example.getByRole("textbox", { name: "One-time code" });
  await example.getByRole("button", { name: "Continue" }).click();
  await expect(input).toBeFocused();
  expect(await input.evaluate(element => (element as HTMLInputElement).checkValidity())).toBe(false);
  await page.evaluate(() => navigator.clipboard.writeText("123456"));
  await input.focus();
  await page.keyboard.press("ControlOrMeta+V");
  await expect(input).toHaveValue("123456");
  await expect(example.getByText("Code is complete. Submit when ready.")).toBeVisible();
  await expect(example.getByText("Code submitted to the demo host. No verification request.")).toHaveCount(0);
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("Backspace");
  await expect(input).toHaveValue("12346");
  await input.fill("12x456");
  await example.getByRole("button", { name: "Continue" }).click();
  expect(await input.evaluate(element => (element as HTMLInputElement).checkValidity())).toBe(false);
  await input.fill("654321");
  await example.getByRole("button", { name: "Continue" }).click();
  await expect(example.getByText("Code submitted to the demo host. No verification request.")).toBeVisible();
  await example.getByRole("button", { name: "Clear code" }).click();
  await expect(input).toBeEmpty();
  await example.getByLabel("Code alphabet").selectOption("alphanumeric");
  await input.fill("A12b34");
  expect(await input.evaluate(element => (element as HTMLInputElement).checkValidity())).toBe(true);
  expect(requests).toEqual([]);
});

test("file picker/drop reject the same batches, preserve pending files and never send contents", async ({ page }) => {
  await page.goto("/#boardui:file-upload");
  const requests: string[] = [];
  page.on("request", request => requests.push(request.url()));
  const example = page.getByTestId("controls-example");
  const picker = example.getByLabel("Reference files", { exact: true });
  const files = [{ name: "brief.txt", mimeType: "text/plain", buffer: Buffer.from("brief") }, { name: "bad.exe", mimeType: "application/octet-stream", buffer: Buffer.from("not allowed") }];
  await picker.setInputFiles(files);
  await expect(example.getByRole("alert")).toContainText("bad.exe");
  await expect(example.locator(".hk-file-list")).toHaveCount(0);
  const data = await page.evaluateHandle(() => { const transfer = new DataTransfer(); transfer.items.add(new File(["brief"], "brief.txt", { type: "text/plain" })); transfer.items.add(new File(["bad"], "bad.exe")); return transfer; });
  await example.locator(".hk-file-upload").dispatchEvent("drop", { dataTransfer: data });
  await data.dispose();
  await expect(example.getByRole("alert")).toContainText("bad.exe");
  await expect(example.locator(".hk-file-list")).toHaveCount(0);
  await picker.focus();
  await expect(picker).toBeFocused();
  const chooserEvent = page.waitForEvent("filechooser");
  await page.keyboard.press("Enter");
  await (await chooserEvent).setFiles(files[0]);
  await expect(example.getByText("Selection received. Nothing was uploaded.")).toBeVisible();
  await expect(example.locator(".hk-file-list li")).toHaveCount(1);
  await picker.setInputFiles(files[0]);
  await expect(example.locator(".hk-file-list li")).toHaveCount(2);
  await picker.setInputFiles({ name: "large.txt", mimeType: "text/plain", buffer: Buffer.alloc(1025) });
  await expect(example.getByRole("alert")).toContainText("too large");
  await example.getByRole("button", { name: "Show supplied transfer states" }).click();
  await expect(example.getByRole("progressbar")).toHaveAttribute("value", "0.35");
  await example.getByRole("button", { name: "Retry research-notes.txt" }).click();
  await expect(example.getByText("Retry requested. No upload started.")).toBeVisible();
  await example.getByRole("button", { name: "Remove decisions.txt" }).click();
  await expect(example.getByText("decisions.txt", { exact: true })).toHaveCount(0);
  expect(requests).toEqual([]);
});

test("range keyboard constraints, host reset and input adornment focus work", async ({ page }) => {
  await page.goto("/#boardui:slider");
  const example = page.getByTestId("controls-example");
  const low = example.getByRole("slider", { name: "Minimum Budget" });
  const high = example.getByRole("slider", { name: "Maximum Budget" });
  await low.focus();
  await page.keyboard.press("ArrowRight");
  await expect(low).toHaveValue("25");
  await page.keyboard.press("End");
  await expect(low).toHaveValue("80");
  await high.focus();
  await page.keyboard.press("Home");
  await expect(high).toHaveValue("80");
  await example.getByRole("button", { name: "Reset range" }).click();
  await expect(low).toHaveValue("20");
  await page.goto("/#boardui:input");
  const input = example.getByRole("textbox", { name: "Project name" });
  await input.focus();
  await page.keyboard.press("Tab");
  await expect(example.getByRole("button", { name: "Clear project name" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(input).toBeEmpty();
  await example.getByLabel("Country calling code").selectOption("gb");
  await expect(example.getByRole("textbox", { name: "Phone number" })).toHaveValue("8123 4567");
});

test("entry compositions stay quiet, readable and uncut across palettes and narrow RTL", async ({ page }) => {
  await page.goto("/#boardui:checkbox");
  for (const palette of ["clean", "cozy"]) {
    for (const appearance of ["light", "dark"]) {
      await page.getByLabel("Appearance", { exact: true }).selectOption(appearance);
      await page.getByLabel("Palette", { exact: true }).selectOption(palette);
      const audit = await new AxeBuilder({ page }).include(".harso-kit").analyze();
      expect(audit.violations).toEqual([]);
      await expect(page.getByTestId("controls-example")).toHaveScreenshot(`choices-${palette}-${appearance}.png`);
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  for (const slug of ["input", "slider", "input-otp", "file-upload"]) {
    await page.goto(`/#boardui:${slug}`);
    await page.getByTestId("controls-example").evaluate(element => { element.setAttribute("dir", "rtl"); });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), slug).toBe(true);
  }
  await page.getByTestId("controls-example").getByRole("button", { name: "Show supplied transfer states" }).click();
  await expect(page.getByTestId("controls-example")).toHaveScreenshot("files-narrow-rtl.png");
});

test("touch and forced-colors controls keep usable targets and visible names", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, viewport: { width: 390, height: 844 }, hasTouch: true, forcedColors: "active", reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto("/#boardui:checkbox");
  const example = page.getByTestId("controls-example");
  await example.getByRole("checkbox", { name: "All references" }).tap();
  await expect(example.getByText("2 references selected")).toBeVisible();
  const targets = await example.locator(".hk-choice").evaluateAll(labels => labels.map(label => label.getBoundingClientRect().height));
  expect(targets.every(height => height >= 44)).toBe(true);
  const audit = await new AxeBuilder({ page }).include(".harso-kit").analyze();
  expect(audit.violations).toEqual([]);
  await expect(example).toHaveScreenshot("choices-forced-colors-touch.png");
  await context.close();
});
