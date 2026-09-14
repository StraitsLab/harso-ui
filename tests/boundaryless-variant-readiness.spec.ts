import { test, expect, type Page, type Locator } from "@playwright/test";

async function rectangle(locator: Locator) {
  await expect(locator).toBeVisible();
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  return box!;
}

async function consumer(page: Page, kind: "radio" | "input" | "attachments") {
  await page.goto(`/#${kind === "attachments" ? "vercel" : "boardui"}:${kind}`);
  const entry = await (await page.request.get("/preview/main.tsx")).text();
  const reactUrl = entry.match(/from "([^"]+\/react\.js\?[^\"]+)"/)?.[1];
  const domUrl = entry.match(/from "([^"]+\/react-dom_client\.js\?[^\"]+)"/)?.[1];
  const producerUrl = entry.match(/import "([^"]*\/src\/)primitives\.css(?:\?[^"]*)?"/)?.[1];
  expect(reactUrl).toBeTruthy();
  expect(domUrl).toBeTruthy();
  expect(producerUrl).toBeTruthy();
  await page.evaluate(async ({ reactUrl, domUrl, producerUrl, kind }) => {
    const React = (await import(reactUrl!)).default;
    const { createRoot } = (await import(domUrl!)).default;
    const { Input, Field } = await import(`${producerUrl}primitives.tsx`);
    const { RadioDot } = await import(`${producerUrl}controls.tsx`);
    const galleryUrl = "/preview/attachments-examples.tsx";
    const AttachmentsExample = kind === "attachments" ? (await import(galleryUrl)).AttachmentsExample : null;
    const element = React.createElement;
    function Consumer() {
      const [disabled, setDisabled] = React.useState(false);
      return element("section", { "aria-label": "Variant consumer" }, kind === "radio"
        ? ["md", "sm"].flatMap(size => [false, true].map(selected => element("div", { key: `${size}-${selected}`, "data-testid": `${size}-${selected}` }, element(RadioDot, { presentation: true, size, selected }))))
        : kind === "attachments" ? element(AttachmentsExample, { component: "Attachments", state: "error" }) : element(React.Fragment, null,
          element("button", { onClick: () => setDisabled(!disabled) }, "Toggle disabled"),
          element(Field, { label: "Required draft", required: true, description: "Keep the hint visible", error: "Draft needs review" },
            (props: object) => element(Input, { ...props, disabled, defaultValue: "", leading: element("span", null, "Draft"), trailing: element("span", null, "Text") }))));
    }
    const root = document.createElement("div");
    document.querySelector(".harso-kit")!.prepend(root);
    createRoot(root).render(element(Consumer));
  }, { reactUrl, domUrl, producerUrl, kind });
  return page.getByRole("region", { name: "Variant consumer" });
}

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
});

test("VARIANTS radio presentation md/sm default/selected paint actual dots", async ({ page }) => {
  const fixture = await consumer(page, "radio");
  for (const size of ["md", "sm"]) {
    const expectedSize = size === "md" ? 18 : 14;
    for (const selected of [false, true]) {
      const dot = fixture.getByTestId(`${size}-${selected}`).locator("span");
      const box = await rectangle(dot);
      expect(box.width).toBe(expectedSize);
      expect(box.height).toBe(expectedSize);
      await expect(dot).toHaveCSS("border-radius", "50%");
      await expect(dot).toHaveAttribute("aria-hidden", "true");
      const paint = await dot.evaluate(element => {
        const style = getComputedStyle(element, "::after");
        return { content: style.content, width: parseFloat(style.width), height: parseFloat(style.height), background: style.backgroundColor };
      });
      if (selected) {
        expect(paint.content).toBe('""');
        expect(paint.width).toBe((expectedSize - 2) / 2);
        expect(paint.height).toBe(paint.width);
        expect(paint.background).not.toBe("rgba(0, 0, 0, 0)");
      } else expect(paint.content).toBe("none");
    }
  }
  await expect(fixture.getByRole("radio")).toHaveCount(0);
});

test("VARIANTS input combined focus hint required invalid and disabled", async ({ page }) => {
  const fixture = await consumer(page, "input");
  const input = fixture.getByRole("textbox", { name: "Required draft" });
  const shell = fixture.locator(".hk-input-shell");
  await expect(input).toHaveAttribute("required", "");
  await expect(input).toHaveAttribute("aria-invalid", "true");
  await expect(input).toHaveAccessibleDescription("Keep the hint visible Draft needs review");
  await expect(fixture.getByText("Keep the hint visible")).toBeVisible();
  await expect(fixture.getByText("Draft needs review")).toBeVisible();
  expect(await input.evaluate(element => (element as HTMLInputElement).validity.valueMissing)).toBe(true);
  await fixture.getByRole("button", { name: "Toggle disabled" }).focus();
  await page.keyboard.press("Tab");
  await expect(input).toBeFocused();
  const focusRing = await shell.evaluate(element => {
    const probe = document.createElement("span");
    probe.style.color = "var(--hk-accent-soft)";
    element.append(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return `${color} 0px 0px 0px 3px`;
  });
  await expect(shell).toHaveCSS("box-shadow", focusRing);
  const errorColor = await fixture.locator(".hk-field-error").evaluate(element => getComputedStyle(element).color);
  await expect(shell).toHaveCSS("border-top-color", errorColor);
  await input.fill("Retained draft");
  expect(await input.evaluate(element => (element as HTMLInputElement).validity.valueMissing)).toBe(false);
  const enabledPaint = await shell.evaluate(element => getComputedStyle(element).backgroundColor);
  await fixture.getByRole("button", { name: "Toggle disabled" }).click();
  await expect(input).toBeDisabled();
  expect(await shell.evaluate(element => getComputedStyle(element).backgroundColor)).not.toBe(enabledPaint);
  await input.evaluate(element => (element as HTMLInputElement).focus());
  await expect(input).not.toBeFocused();
  await expect(input).toHaveValue("Retained draft");
  await expect(input).toHaveAccessibleDescription("Keep the hint visible Draft needs review");
});

for (const variant of ["grid", "inline", "list"] as const) {
  test(`VARIANTS attachments ${variant} actual gallery geometry`, async ({ page }) => {
    await page.goto("/#vercel:attachments");
    if (variant === "list") await page.getByLabel("Example state").selectOption("long-content");
    const example = variant === "inline" ? await consumer(page, "attachments") : page.getByTestId("live-example");
    const collection = example.locator(".hk-attachments");
    const items = collection.locator(".hk-attachment");
    await expect(items).toHaveCount(2);
    await expect(example.getByText("design.png", { exact: true })).toBeVisible();
    await expect(example.getByText("notes.md", { exact: true })).toBeVisible();
    const first = await rectangle(items.nth(0));
    const second = await rectangle(items.nth(1));
    const preview = await rectangle(items.first().locator(".hk-attachment-preview"));
    if (variant === "grid") {
      await expect(collection).toHaveCSS("display", "grid");
      expect(second.x).toBeGreaterThan(first.x + first.width);
      expect(second.y).toBe(first.y);
      expect(preview.height).toBe(100);
      expect(preview.width).toBeCloseTo(first.width - 2, 0);
    } else if (variant === "inline") {
      await expect(collection).toHaveCSS("display", "flex");
      await expect(items.first()).toHaveCSS("border-radius", "999px");
      await expect(items.first().locator(".hk-attachment-info")).toHaveCSS("display", "flex");
      expect(preview.height).toBe(34);
      expect(second.x).toBeGreaterThan(first.x + first.width);
    } else {
      expect(second.y).toBeGreaterThan(first.y + first.height);
      expect(second.x).toBe(first.x);
      expect(second.width).toBe(first.width);
      expect(preview.height).toBe(34);
      await expect(items.first()).toHaveCSS("padding", "8px 10px");
    }
    await items.first().getByRole("button", { name: "Remove", exact: true }).click();
    await expect(items).toHaveCount(1);
    await expect(example.getByText("notes.md", { exact: true })).toBeVisible();
  });
}

test("VARIANTS theme expanded and compact controls paint light and dark", async ({ page }) => {
  await page.goto("/#boardui:theme-toggle");
  const example = page.getByTestId("live-example");
  const provider = example.locator(".hkl-theme-example");
  const expanded = provider.getByRole("group", { name: "Appearance", exact: true });
  await expect(expanded.getByRole("radio")).toHaveCount(3);
  await provider.getByRole("radio", { name: "Light", exact: true }).check();
  await expect(provider).toHaveCSS("color-scheme", "light");
  const lightPaint = await provider.evaluate(element => ({ background: getComputedStyle(element).backgroundColor, color: getComputedStyle(element).color }));
  const compact = provider.getByRole("button", { name: "Change appearance, currently light" });
  const compactBox = await rectangle(compact);
  const expandedBox = await rectangle(expanded);
  expect(compactBox.width).toBe(36);
  expect(compactBox.height).toBe(36);
  expect(expandedBox.width).toBeGreaterThan(compactBox.width * 2);
  await expect(compact).toHaveText("◐");
  await compact.focus();
  await page.keyboard.press("Space");
  await expect(provider.getByRole("radio", { name: "Dark", exact: true })).toBeChecked();
  await expect(provider).toHaveCSS("color-scheme", "dark");
  const darkPaint = await provider.evaluate(element => ({ background: getComputedStyle(element).backgroundColor, color: getComputedStyle(element).color }));
  expect(darkPaint.background).not.toBe(lightPaint.background);
  expect(darkPaint.color).not.toBe(lightPaint.color);
  await expect(provider.getByRole("button", { name: "Change appearance, currently dark" })).toBeFocused();
  await page.getByLabel("Example state").selectOption("disabled");
  for (const control of await provider.locator("input, button").all()) await expect(control).toBeDisabled();
});

test("VARIANTS link hover paints underline and retains anchor destination", async ({ page }) => {
  await page.goto("/#boardui:link-button");
  const link = page.getByTestId("live-example").getByRole("link", { name: "Explore buttons" });
  await expect(link).toHaveAttribute("href", "#boardui:button");
  await link.hover();
  await expect(link).toHaveCSS("text-decoration-line", "underline");
  await expect(link).toHaveCSS("text-decoration-thickness", "2px");
  await expect(link).toHaveCSS("text-underline-offset", "4px");
  const box = await rectangle(link);
  expect(box.width).toBeGreaterThan(0);
  await link.click();
  await expect(page).toHaveURL(/#boardui:button$/);
});

test("VARIANTS button group native checked state paints selection and clears", async ({ page }) => {
  await page.goto("/#boardui:button-group");
  const example = page.getByTestId("live-example");
  const checkbox = example.getByRole("checkbox", { name: "Markdown" });
  const paint = checkbox.locator("..").locator("span").first();
  await expect(checkbox).not.toBeChecked();
  await expect(paint).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await checkbox.focus();
  await page.keyboard.press("Space");
  await expect(checkbox).toBeChecked();
  expect(await paint.evaluate(element => getComputedStyle(element).backgroundColor)).not.toBe("rgba(0, 0, 0, 0)");
  expect(await paint.evaluate(element => getComputedStyle(element, "::after").width)).toBe("auto"); // wave 1: the selected dot is gone; selection paints fill + weight only
  await page.keyboard.press("Space");
  await expect(checkbox).not.toBeChecked();
  await expect(paint).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  expect(await paint.evaluate(element => getComputedStyle(element, "::after").content)).toBe("none");
});
