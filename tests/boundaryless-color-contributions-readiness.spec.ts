import { expect, test, type Locator, type Page } from "@playwright/test";

const scenes = [
  { appearance: "light", palette: "clean", width: 1440 },
  { appearance: "dark", palette: "clean", width: 390 },
  { appearance: "light", palette: "cozy", width: 390 },
  { appearance: "dark", palette: "cozy", width: 1440 },
] as const;

async function mount(page: Page, family: "color" | "contributions-card", scene: typeof scenes[number]) {
  await page.setViewportSize({ width: scene.width, height: 1000 });
  await page.emulateMedia({ colorScheme: scene.appearance, reducedMotion: "reduce" });
  await page.goto(`/#boardui:${family}`);
  await page.getByLabel("Appearance", { exact: true }).selectOption(scene.appearance);
  await page.getByLabel("Palette", { exact: true }).selectOption(scene.palette);
  const source = await (await page.request.get("/src/boundaryless/main.tsx")).text();
  const reactUrl = source.match(/from "([^"]+\/react\.js\?[^"]+)"/)?.[1];
  const domUrl = source.match(/from "([^"]+\/react-dom_client\.js\?[^"]+)"/)?.[1];
  const producerUrl = source.match(/import "([^"]+\/packages\/ui\/src\/boundaryless\/)primitives\.css(?:\?[^"]*)?"/)?.[1];
  expect(reactUrl).toBeTruthy();
  expect(domUrl).toBeTruthy();
  expect(producerUrl).toBeTruthy();
  await page.evaluate(async ({ reactUrl, domUrl, producerUrl, family, scene }) => {
    const React = (await import(reactUrl!)).default;
    const { createRoot } = (await import(domUrl!)).default;
    const { Color } = await import(`${producerUrl}misc-surfaces.tsx`);
    const { ContributionsCard } = await import(`${producerUrl}dashboard-surfaces.tsx`);
    function Consumer() {
      const [disabled, setDisabled] = React.useState(false);
      const [view, setView] = React.useState("cells");
      const [empty, setEmpty] = React.useState(false);
      const periods = {
        weekly: [{ label: "Monday", value: 0 }, { label: "Tuesday", value: 7 }, { label: "Wednesday", value: 2 }],
        monthly: [{ label: "Week 1", value: 12 }, { label: "Week 2", value: 0 }, { label: "Week 3", value: 24 }],
        yearly: [{ label: "January", value: 120 }, { label: "February", value: 60 }, { label: "March", value: 180 }],
      };
      return React.createElement("section", { "aria-label": "Readiness consumer" },
        React.createElement("label", null, React.createElement("input", { type: "checkbox", checked: disabled, onChange: (event: Event) => setDisabled((event.target as HTMLInputElement).checked) }), "Disable supplied controls"),
        family === "color" ? React.createElement("div", { "data-testid": "rich-content" },
          React.createElement(Color, { editable: true, defaultAppearance: scene.appearance, palette: scene.palette, disabled }),
          React.createElement(Color, { value: "#6b7cff", label: "Read-only gallery accent" })) : React.createElement(React.Fragment, null,
          React.createElement("label", null, "Activity view", React.createElement("select", { value: view, onChange: (event: Event) => setView((event.target as HTMLSelectElement).value) }, ...["cells", "bars"].map(value => React.createElement("option", { key: value }, value)))),
          React.createElement("label", null, React.createElement("input", { type: "checkbox", checked: empty, onChange: (event: Event) => setEmpty((event.target as HTMLInputElement).checked) }), "Empty supplied periods"),
          React.createElement("div", { "data-testid": "rich-content" }, React.createElement(ContributionsCard, { title: "Supplied contributions", periods: empty ? {} : periods, view, showPaletteControl: true, defaultPalette: scene.palette, disabled }))));
    }
    const root = document.createElement("div");
    root.className = "hkl-live-example";
    document.querySelector('[data-testid="live-example"]')!.before(root);
    createRoot(root).render(React.createElement(Consumer));
  }, { reactUrl, domUrl, producerUrl, family, scene });
  return page.getByRole("region", { name: "Readiness consumer", exact: true });
}

async function layout(page: Page, content: Locator) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  expect(await content.evaluate(root => Array.from(root.querySelectorAll("button,input,select,fieldset,meter,.hk-color,.hk-contribution")).filter(element => {
    const bounds = element.getBoundingClientRect();
    return bounds.width > 0 && (bounds.left < -1 || bounds.right > innerWidth + 1);
  }).map(element => element.outerHTML.slice(0, 150)))).toEqual([]);
}

for (const scene of scenes) {
  const suffix = `${scene.appearance}-${scene.palette}-${scene.width}`;
  test(`Color richer preset/custom roles ${suffix}`, async ({ page }, info) => {
    const fixture = await mount(page, "color", scene);
    const content = fixture.getByTestId("rich-content");
    const preview = content.locator(".hk-color-preview");
    const evidence: object[] = [];
    await expect(preview).toHaveAttribute("data-palette", scene.palette);
    const inspect = async (accent: string) => {
      await layout(page, content);
      for (const name of ["Foreground", "Text", "Background", "Border", "Graphs", "State"]) await expect(preview.getByRole("group", { name, exact: true })).toBeVisible();
      const paints = await preview.evaluate((root, accent) => {
        const probe = document.createElement("span");
        root.append(probe);
        const samples = Array.from(root.querySelectorAll(".hk-color-roles .hk-color")).map(element => {
          const token = element.textContent!;
          probe.style.color = token === "--hk-accent" ? accent : `var(${token})`;
          return { token, expected: getComputedStyle(probe).color, actual: getComputedStyle(element.querySelector(".hk-color-swatch")!).backgroundColor };
        });
        probe.remove();
        return samples;
      }, accent);
      expect(paints).toHaveLength(8);
      for (const paint of paints) expect(paint.actual, paint.token).toBe(paint.expected);
      const mode = await preview.getAttribute("data-mode");
      const foreground = mode === "dark" ? scene.palette === "cozy" ? "rgb(244, 238, 228)" : "rgb(238, 240, 245)" : scene.palette === "cozy" ? "rgb(48, 43, 37)" : "rgb(32, 36, 42)";
      expect(paints.find(paint => paint.token === "--hk-ink")?.actual).toBe(foreground);
      evidence.push({ accent, appearance: await preview.getAttribute("data-mode"), palette: await preview.getAttribute("data-palette"), paints });
    };
    const options = await preview.getByLabel("Accent preset").locator("option:not([disabled])").evaluateAll(options => options.map(option => ({ value: (option as HTMLOptionElement).value, label: option.textContent! })));
    expect(options).toHaveLength(8);
    for (const option of options) {
      await preview.getByLabel("Accent preset").selectOption(option.value);
      await expect(preview.getByLabel("Custom accent")).toHaveValue(option.value);
      await inspect(option.value);
      if (scene.appearance === "light" && scene.palette === "cozy") await content.screenshot({ path: info.outputPath(`preset-${option.label}.png`), animations: "disabled" });
    }
    await preview.getByLabel("Custom accent").evaluate(element => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(element, "#376a85");
      element.dispatchEvent(new Event("input", { bubbles: true }));
      element.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await expect(preview.getByLabel("Accent preset")).toHaveValue("custom");
    await inspect("#376a85");
    await content.screenshot({ path: info.outputPath("custom.png"), animations: "disabled" });
    await preview.getByLabel("Preview appearance").selectOption(scene.appearance === "light" ? "dark" : "light");
    await expect(preview).toHaveAttribute("data-mode", scene.appearance === "light" ? "dark" : "light");
    await expect(preview).toHaveAttribute("data-palette", scene.palette);
    await inspect("#376a85");
    await content.screenshot({ path: info.outputPath("appearance-switched.png"), animations: "disabled" });
    await fixture.getByLabel("Disable supplied controls").check();
    for (const label of ["Accent preset", "Custom accent", "Preview appearance"]) await expect(preview.getByLabel(label)).toBeDisabled();
    await layout(page, content);
    if (scene.width === 390 && scene.appearance === "dark") await content.screenshot({ path: info.outputPath("disabled.png"), animations: "disabled" });
    await info.attach("paint-observations", { body: JSON.stringify(evidence), contentType: "application/json" });
  });

  test(`Contributions supplied cells/periods ${suffix}`, async ({ page }, info) => {
    const fixture = await mount(page, "contributions-card", scene);
    const content = fixture.getByTestId("rich-content");
    const card = content.locator(".hk-contributions-card");
    const evidence: object[] = [];
    for (const [period, label, values] of [["weekly", "Monday", [0, 7, 2]], ["monthly", "Week 1", [12, 0, 24]], ["yearly", "January", [120, 60, 180]]] as const) {
      await card.getByLabel("Contribution period").selectOption(period);
      await expect(card.getByRole("status")).toHaveCount(0);
      expect(await card.locator("meter").evaluateAll(elements => elements.map(element => Number((element as HTMLMeterElement).value)))).toEqual(values);
      await card.getByRole("button", { name: `${label}: ${values[0]} contributions`, exact: true }).click();
      await expect(card.getByRole("status")).toHaveText(`${label}: ${values[0]} contributions`);
      await expect(card.getByRole("button", { name: `${label}: ${values[0]} contributions`, exact: true })).toHaveAttribute("aria-pressed", "true");
      for (const view of ["cells", "bars"]) {
        await fixture.getByRole("combobox", { name: "Activity view", exact: true }).selectOption(view);
        await expect(card.locator(".hk-contributions-activity")).toHaveAttribute("data-view", view);
        await layout(page, content);
        if (period === "weekly" && view === "cells" || period === "yearly" && view === "bars" || scene.width === 390 && scene.appearance === "light") await content.screenshot({ path: info.outputPath(`${period}-${view}.png`), animations: "disabled" });
        evidence.push({ period, view, values });
      }
    }
    for (const palette of ["clean", "cozy"]) {
      await card.getByLabel("Contribution palette").selectOption(palette);
      await expect(content.locator(".hk-contributions-theme")).toHaveAttribute("data-mode", scene.appearance);
      const paints = await card.evaluate(root => {
        const probe = document.createElement("span");
        root.append(probe);
        const samples = [[root, "background-color", "--hk-surface"], [root, "color", "--hk-ink"], [root.querySelector("meter"), "accent-color", "--hk-accent"], [root.querySelector('[aria-pressed="true"]'), "border-top-color", "--hk-accent"]].map(([element, property, token]) => {
          probe.style.color = `var(${token})`;
          return { property, token, actual: getComputedStyle(element as Element).getPropertyValue(property as string), expected: getComputedStyle(probe).color };
        });
        probe.remove();
        return samples;
      });
      for (const paint of paints) expect(paint.actual).toBe(paint.expected);
      evidence.push({ palette, paints });
    }
    await fixture.getByLabel("Disable supplied controls").check();
    await expect(card.getByLabel("Contribution period")).toBeDisabled();
    await expect(card.getByLabel("Contribution palette")).toBeDisabled();
    for (const button of await card.getByRole("button").all()) await expect(button).toBeDisabled();
    if (scene.width === 390 && scene.appearance === "dark") await content.screenshot({ path: info.outputPath("disabled.png"), animations: "disabled" });
    await fixture.getByLabel("Empty supplied periods").check();
    await expect(card.getByText("No contributions supplied.", { exact: true })).toBeVisible();
    await expect(card.locator("meter")).toHaveCount(0);
    await layout(page, content);
    if (scene.width === 390 && scene.appearance === "light") await content.screenshot({ path: info.outputPath("empty.png"), animations: "disabled" });
    await info.attach("period-paint-observations", { body: JSON.stringify(evidence), contentType: "application/json" });
  });
}
