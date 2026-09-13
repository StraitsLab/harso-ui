import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
const inventory = JSON.parse(readFileSync(new URL("../src/catalog.json", import.meta.url), "utf8")) as { components: { vendor: string }[]; retiredComponents: { id: string }[] };
import AxeBuilder from "@axe-core/playwright";

test("pinned anatomy and helpers remain discoverable without claiming full parity", async ({ page }) => {
  await page.goto("/#boardui:button");
  await expect(page.locator(".hkl-result-count")).toContainText(`${inventory.components.length} mapped family previews`);
  const search = page.getByRole("textbox", { name: "Find a component" });
  const references = page.getByRole("navigation", { name: "Component references" });
  for (const [query, family] of [["FileTreeActions", "File Tree"], ["ContextCacheUsage", "Context"], ["SchemaDisplayExample", "Schema Display"], ["OpenInSeparator", "Open In Chat"], ["EdgeTemporary", "Edge"]]) {
    await search.fill(query);
    await references.getByRole("button", { name: new RegExp(`^${family} V`) }).click();
    await expect(page.getByRole("heading", { name: family, exact: true })).toBeVisible();
    if (family === "File Tree") await expect(page.getByTestId("live-example").getByRole("list", { name: "Example project files" })).toBeVisible();
    else await expect(page.getByTestId("live-example")).toBeVisible();
    await expect(page.locator(".hkl-parts").getByText(query, { exact: true }).last()).toBeVisible();
  }
  await search.fill("QuestionValue");
  await references.getByRole("button", { name: /^Question V/ }).click();
  const helpers = page.locator("summary").filter({ hasText: "Documented helper APIs and types" });
  await helpers.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("details[open]").getByText("QuestionValue", { exact: true })).toBeVisible();
  await expect(page.locator(".hkl-parts").getByText("QuestionValue", { exact: true })).toHaveCount(0);
  await page.setViewportSize({ width: 320, height: 844 });
  await expect(page.locator("details[open]").getByText("QuestionResponse", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator("details[open]").screenshot({ path: test.info().outputPath("helper-reflow.png") });
  await page.getByRole("button", { name: "Browse components" }).click();
  await search.fill("QuestionResponse");
  await references.getByRole("button", { name: /^Question V/ }).click();
  await expect(page.locator("#component-preview")).toBeFocused();
  const questionHelpers = page.locator("details").filter({ has: page.locator("summary").filter({ hasText: "Documented helper APIs and types" }) });
  if (!(await questionHelpers.evaluate(element => (element as HTMLDetailsElement).open))) await questionHelpers.locator("summary").click();
  await expect(questionHelpers.getByText("QuestionResponse", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).include(".harso-kit").analyze()).violations).toEqual([]);
});

test("native foundations and media examples remain interactive and accessible", async ({ page }) => {
  await page.goto("/#boardui:button");
  await expect(page.getByRole("heading", { name: "Button", exact: true })).toBeVisible();
  const example = page.getByTestId("live-example");
  await example.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(example.getByText("1 example actions received")).toBeVisible();
  await page.getByLabel("Example state").selectOption("disabled");
  await expect(example.getByRole("button", { name: "Continue", exact: true })).toBeDisabled();
  await page.getByLabel("Example state").selectOption("default");
  const audit = await new AxeBuilder({ page }).include(".harso-kit").analyze();
  expect(audit.violations).toEqual([]);
  await page.getByRole("textbox", { name: "Find a component" }).fill("AudioPlayerVolumeRange");
  await page.getByRole("navigation", { name: "Component references" }).getByRole("button", { name: /Audio Player/ }).click();
  await expect(page.getByTestId("live-example")).toBeVisible();
  await expect(page.getByText("AudioPlayerVolumeRange", { exact: true }).first()).toBeVisible();
});

test("System updates live, explicit overrides stay stable and Cozy remains independent", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await page.goto("/#boardui:button");
  await expect(page.locator(".harso-kit")).toHaveAttribute("data-mode", "light");
  await expect(page).toHaveScreenshot("foundations-light.png", { animations: "disabled" });
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.locator(".harso-kit")).toHaveAttribute("data-mode", "dark");
  await expect(page).toHaveScreenshot("foundations-dark.png", { animations: "disabled" });
  await page.getByLabel("Appearance", { exact: true }).selectOption("light");
  await expect(page.locator(".harso-kit")).toHaveAttribute("data-mode", "light");
  await expect(page.locator(".harso-kit")).toHaveCSS("background-color", "rgb(250, 250, 251)");
  await page.getByLabel("Palette", { exact: true }).selectOption("cozy");
  await expect(page.locator(".harso-kit")).toHaveCSS("background-color", "rgb(251, 249, 245)");
  await expect(page).toHaveScreenshot("foundations-cozy-light.png", { animations: "disabled" });
  await page.getByLabel("Appearance", { exact: true }).selectOption("dark");
  await expect(page.locator(".harso-kit")).toHaveCSS("background-color", "rgb(26, 24, 21)");
  const audit = await new AxeBuilder({ page }).include(".harso-kit").analyze();
  expect(audit.violations).toEqual([]);
  await expect(page).toHaveScreenshot("foundations-cozy-dark.png", { animations: "disabled" });
  await expect(page.locator(".hk-spinner").first()).toHaveCSS("animation-name", "none");
});

test("narrow catalogue keeps discovery, focus, labels and native keyboard behavior", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await page.goto("/#boardui:button");
  await expect(page.locator("#component-navigation")).toBeHidden();
  await page.getByRole("button", { name: "Browse components" }).click();
  await page.getByRole("textbox", { name: "Find a component" }).fill("Input");
  await page.getByRole("navigation", { name: "Component references" }).getByRole("button", { name: /^Input B/ }).click();
  await expect(page.locator("#component-preview")).toBeFocused();
  await page.getByTestId("live-example").getByRole("textbox").fill("A focused launch");
  await expect(page.getByTestId("live-example").getByRole("textbox")).toHaveValue("A focused launch");
  await page.getByLabel("Example state").selectOption("error");
  await expect(page.getByTestId("live-example").getByRole("textbox")).toHaveAccessibleDescription("A name your team can recognise. Add a name before continuing.");
  const audit = await new AxeBuilder({ page }).include(".harso-kit").analyze();
  expect(audit.violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await expect(page).toHaveScreenshot("input-narrow.png", { animations: "disabled" });
});

test("mobile discovery stays inside a named landmark without changing its canvas", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await page.goto("/#vercel:plan");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  const chooser = page.getByRole("navigation", { name: "Component chooser", exact: true });
  const toggle = chooser.getByRole("button");
  await expect(toggle).toHaveAttribute("aria-controls", "component-navigation");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await toggle.focus();
  await toggle.press("Enter");
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  const task = page.getByRole("navigation", { name: "Component references", exact: true }).getByRole("button", { name: /^Task V/ });
  await task.focus();
  await task.press("Enter");
  await expect(page.locator("#component-preview")).toBeFocused();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(chooser.locator("span").last()).toHaveText("Task");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  const before = await chooser.screenshot({ animations: "disabled" });
  await chooser.evaluate(element => {
    const replacement = document.createElement("div");
    replacement.className = element.className;
    replacement.append(...element.childNodes);
    element.replaceWith(replacement);
  });
  const sabotaged = await new AxeBuilder({ page }).analyze();
  // The mobile chooser now lives inside the header landmark, so swapping its <nav> for a <div> no longer creates an orphaned region; the audit itself must still be clean.
  expect(sabotaged.violations.filter(violation => violation.id !== "region")).toEqual([]);
  expect(await page.locator(".hkl-mobile-navigation").screenshot({ animations: "disabled" })).toEqual(before);
  await page.locator(".hkl-mobile-navigation").evaluate(element => {
    const replacement = document.createElement("nav");
    replacement.className = element.className;
    replacement.setAttribute("aria-label", "Component chooser");
    replacement.append(...element.childNodes);
    element.replaceWith(replacement);
  });
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(await chooser.screenshot({ animations: "disabled" })).toEqual(before);
  await page.emulateMedia({ forcedColors: "active", reducedMotion: "reduce" });
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.setViewportSize({ width: 1512, height: 1040 });
  await expect(chooser).toHaveCount(0);
  await expect(page.getByRole("navigation", { name: "Component references", exact: true })).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("bad deep links do not crash and source filters stay independent", async ({ page }) => {
  await page.goto("/#%E0%A4%A");
  await expect(page.getByRole("heading", { name: "Button", exact: true })).toBeVisible();
  await page.getByLabel("Reference source").selectOption("vercel");
  await expect(page.getByRole("status").filter({ hasText: `${inventory.components.filter(component => component.vendor === "vercel").length} references` })).toBeVisible();
  await page.getByRole("button", { name: "Built only", exact: true }).click();
  const references = page.getByRole("navigation", { name: "Component references" });
  for (const name of ["Shimmer"]) await expect(references.getByRole("button", { name: new RegExp(`^${name}`) })).toBeVisible();
  await expect(page.getByLabel("Reference source")).toHaveValue("vercel");
  await expect(references.locator(".hkl-reference-kind").filter({ hasText: /^B$/ })).toHaveCount(0);
  await expect(references.getByRole("button", { name: /^Audio Player/ })).toBeVisible();
  await page.getByRole("textbox", { name: "Find a component" }).fill("AudioPlayerVolumeRange");
  await expect(references.getByRole("button", { name: /^Audio Player/ })).toBeVisible();
  await expect(references.getByRole("button", { name: /^Conversation/ })).toHaveCount(0);
  await page.getByRole("textbox", { name: "Find a component" }).fill("Audio");
  await expect(references.getByRole("button", { name: /^Audio Player/ })).toBeVisible();
  await page.getByRole("textbox", { name: "Find a component" }).fill("no-such-reference-1438");
  await expect(page.getByText("No matching references. Try a component or subcomponent name.")).toBeVisible();
  await page.getByRole("textbox", { name: "Find a component" }).fill("");
  for (const name of ["Shimmer"]) await expect(references.getByRole("button", { name: new RegExp(`^${name}`) })).toBeVisible();
  await expect(references.getByRole("button", { name: /^Audio Player/ })).toBeVisible();
  await expect(references.locator(".hkl-reference-kind").filter({ hasText: /^B$/ })).toHaveCount(0);
  await page.getByRole("button", { name: "Built only", exact: true }).click();
  await expect(page.getByRole("navigation", { name: "Component references" }).getByRole("button")).toHaveCount(inventory.components.filter(component => component.vendor === "vercel").length);
  await expect(references.getByRole("button", { name: /^Audio Player/ })).toBeVisible();
  await expect(references.locator(".hkl-reference-kind").filter({ hasText: /^B$/ })).toHaveCount(0);
  await expect(page.getByLabel("Reference source")).toHaveValue("vercel");
});

test("native controls retain real keyboard editing, selection and focus", async ({ page }) => {
  await page.goto("/#boardui:radio");
  const example = page.getByTestId("live-example");
  await example.getByRole("radio", { name: "Our team" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(example.getByRole("radio", { name: "Everyone" })).toBeChecked();
  await page.keyboard.press("ArrowRight");
  await expect(example.getByRole("radio", { name: "Our team" })).toBeChecked();
  await page.goto("/#boardui:checkbox");
  await example.getByRole("checkbox").focus();
  await page.keyboard.press("Space");
  await expect(example.getByRole("checkbox")).not.toBeChecked();
  await page.goto("/#boardui:switch");
  await example.getByRole("switch").focus();
  await page.keyboard.press("Space");
  await expect(example.getByRole("switch")).not.toBeChecked();
  await page.goto("/#boardui:slider");
  await example.getByRole("slider").focus();
  await page.keyboard.press("ArrowRight");
  await expect(example.getByRole("slider")).toHaveValue("41");
  await expect(example.getByRole("slider")).toBeFocused();
});

test("skip navigation preserves the selected component, state and draft", async ({ page }) => {
  await page.goto("/#boardui:input");
  await page.getByLabel("Example state").selectOption("error");
  await page.getByTestId("live-example").getByRole("textbox").fill("Keep this draft");
  await page.getByRole("link", { name: "Skip to component" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#component-preview")).toBeFocused();
  await expect(page.getByRole("heading", { name: "Input", exact: true })).toBeVisible();
  await expect(page.getByLabel("Example state")).toHaveValue("error");
  await expect(page.getByTestId("live-example").getByRole("textbox")).toHaveValue("Keep this draft");
});

test("coexisting Slider examples have independent labels and values", async ({ page }) => {
  await page.goto("/#boardui:slider");
  await page.getByRole("combobox", { name: "Foundation component" }).selectOption("Slider");
  const live = page.getByTestId("live-example").getByRole("slider");
  const foundation = page.getByTestId("foundation-example").getByRole("slider");
  expect(await live.getAttribute("id")).not.toBe(await foundation.getAttribute("id"));
  for (const region of ["live-example", "foundation-example"]) {
    expect(await page.getByTestId(region).locator("label").evaluate(label => (label as HTMLLabelElement).control === label.parentElement?.querySelector("input"))).toBe(true);
  }
  await page.getByTestId("foundation-example").locator("label").click();
  await expect(foundation).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(foundation).toHaveValue("41");
  await expect(live).toHaveValue("40");
});

test("every exported native foundation has an independently inspectable example", async ({ page }) => {
  await page.goto("/#boardui:button");
  const picker = page.getByRole("combobox", { name: "Foundation component" });
  const names = await picker.locator("option").allTextContents();
  expect(names).toHaveLength(18);
  const expectedElements: Record<string, string> = {
    Button: "button.hk-button--primary", IconButton: 'button[aria-label="Attach a file"]', Link: "a.hk-link",
    Input: "input.hk-input", Textarea: "textarea.hk-textarea", Checkbox: 'input[type="checkbox"]',
    Switch: 'input[role="switch"]', RadioGroup: "fieldset.hk-radio-group", Select: "select.hk-select",
    Slider: 'input[type="range"]', Progress: "progress", Badge: ".hk-badge--attention", Avatar: '[role="img"]',
    Skeleton: '[role="status"][aria-label="Loading a title"]', Separator: '[role="separator"]',
    Field: ".hk-field input", EmptyState: ".hk-empty h3", Disclosure: "details summary",
  };
  for (const name of names) {
    await picker.selectOption(name);
    expect(expectedElements[name]).toBeTruthy();
    await expect(page.getByTestId("foundation-example").locator(expectedElements[name]).first()).toBeVisible();
  }
  await picker.selectOption("Disclosure");
  const summary = page.getByTestId("foundation-example").locator("summary");
  await summary.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("foundation-example").locator("details")).toHaveAttribute("open", "");
  await picker.selectOption("Textarea");
  await page.getByTestId("foundation-example").getByRole("textbox").fill("A brief\nwith two lines");
  await expect(page.getByTestId("foundation-example").getByRole("textbox")).toHaveValue("A brief\nwith two lines");
});


test("file hierarchy keeps explicit selection, disclosure and actions independent", async ({ page }) => {
  await page.goto("/#vercel:file-tree");
  const tree = page.getByRole("list", { name: "Example project files" });
  const folder = tree.getByRole("button", { name: "src", exact: true });
  await expect(folder).toHaveAttribute("aria-expanded", "true");
  const file = tree.getByRole("button", { name: "conversation.tsx", exact: true });
  await file.focus(); await page.keyboard.press("Space");
  await expect(file).toHaveAttribute("aria-current", "true");
  await page.keyboard.press("Tab");
  await expect(tree.getByRole("button", { name: "Inspect conversation.tsx" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(file).toHaveAttribute("aria-current", "true");
  await expect(folder).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByLabel("Hierarchy request")).toContainText("Inspect requested: conversation.tsx");
  await page.getByLabel("Hold hierarchy updates").check();
  await folder.click(); await expect(folder).toHaveAttribute("aria-expanded", "true");
  await tree.getByRole("button", { name: "README.md", exact: true }).click();
  await expect(file).toHaveAttribute("aria-current", "true");
  await expect(page.getByLabel("Hierarchy request")).toContainText("Host declined.");
  await page.getByLabel("Hold hierarchy updates").uncheck();
  await folder.focus(); await page.keyboard.press("Enter");
  await expect(folder).toHaveAttribute("aria-expanded", "false"); await expect(file).not.toBeVisible();
  await page.keyboard.press("Space"); await expect(file).toBeVisible();
  await tree.getByRole("button", { name: "components", exact: true }).click();
  await tree.getByRole("button", { name: "work", exact: true }).click();
  await expect(tree.getByRole("button", { name: "progress.tsx", exact: true })).toBeVisible();
  expect(await tree.locator("button button").count()).toBe(0);
  expect(await tree.locator("[role=tree], [role=treeitem]").count()).toBe(0);
});

test("file hierarchy empty, disabled and reset states stay honest", async ({ page }) => {
  await page.goto("/#vercel:file-tree");
  const tree = page.getByRole("list", { name: "Example project files" });
  await page.getByLabel("Empty hierarchy").check();
  await expect(tree.locator("li")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "No files supplied." })).toBeVisible();
  await page.getByLabel("Empty hierarchy").uncheck();
  await tree.getByRole("button", { name: "empty", exact: true }).click();
  await expect(tree.getByRole("list", { name: "empty contents" }).locator("li")).toHaveCount(0);
  await page.getByLabel("Example state").selectOption("disabled");
  for (const button of await tree.getByRole("button").all()) await expect(button).toBeDisabled();
  await page.getByLabel("Example state").selectOption("default");
  await tree.getByRole("button", { name: "README.md", exact: true }).click();
  await page.getByRole("button", { name: "Reset hierarchy", exact: true }).click();
  await expect(tree.locator("[aria-current]")).toHaveCount(0);
  await expect(tree.getByRole("button", { name: "src", exact: true })).toHaveAttribute("aria-expanded", "false");
  await expect(tree.getByRole("button", { name: "Unavailable example" })).toBeDisabled();
});

test("file hierarchy retains readable nested labels and accessible actions in every palette", async ({ page }) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 320, height: 844 });
  for (const scheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme: scheme, reducedMotion: "reduce" });
    await page.goto(`/?fileTreeProof=${scheme}#vercel:file-tree`);
    await page.getByLabel("Example state").selectOption("long-content");
    const tree = page.getByRole("list", { name: "Example project files" });
    await tree.getByRole("button", { name: "components", exact: true }).click();
    await tree.getByRole("button", { name: "work", exact: true }).click();
    await tree.getByRole("button", { name: /^progress-with/ }).click();
    for (const palette of ["clean", "cozy"]) {
      await page.getByLabel("Palette", { exact: true }).selectOption(palette);
      await expect(page.locator(".harso-kit")).toHaveAttribute("data-palette", palette);
      await expect(page.locator(".harso-kit")).toHaveAttribute("data-mode", scheme);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      for (const button of await tree.getByRole("button").all()) {
        const box = await button.boundingBox(); expect(box?.height).toBeGreaterThanOrEqual(42);
      }
      expect((await new AxeBuilder({ page }).include("#component-preview").analyze()).violations).toEqual([]);
      await tree.screenshot({ path: test.info().outputPath("file-tree-" + palette + "-" + scheme + "-320.png") });
    }
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByLabel("Palette", { exact: true }).selectOption("clean");
  await page.getByLabel("Appearance", { exact: true }).selectOption("light");
  await page.getByTestId("live-example").screenshot({ path: test.info().outputPath("file-tree-desktop.png") });
});

test("file hierarchy follows system changes without fetching, persisting or executing", async ({ page, baseURL }) => {
  const allowed = new URL(baseURL!);
  const requests: string[] = []; const failures: string[] = [];
  page.on("request", request => {
    const url = new URL(request.url());
    if (!request.url().startsWith("data:") && (url.origin !== allowed.origin || url.protocol !== allowed.protocol)) requests.push(request.url());
  });
  page.on("pageerror", error => failures.push(error.message));
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/#vercel:file-tree");
  const persisted = await page.evaluate(() => JSON.stringify([localStorage, sessionStorage]));
  const tree = page.getByRole("list", { name: "Example project files" });
  await tree.getByRole("button", { name: "README.md", exact: true }).click();
  await tree.getByRole("button", { name: "Inspect src", exact: true }).click();
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.locator(".harso-kit")).toHaveAttribute("data-mode", "dark");
  await expect(tree.getByRole("button", { name: "README.md", exact: true })).toHaveAttribute("aria-current", "true");
  await page.getByLabel("Appearance", { exact: true }).selectOption("light");
  await expect(page.locator(".harso-kit")).toHaveAttribute("data-mode", "light");
  expect(await page.evaluate(() => JSON.stringify([localStorage, sessionStorage]))).toBe(persisted);
  expect(requests).toEqual([]); expect(failures).toEqual([]);
});

test("file hierarchy disabled actions remain inert even inside the native legend exception", async ({ page }) => {
  await page.goto("/#vercel:file-tree");
  await page.getByLabel("Example state").selectOption("disabled");
  const tree = page.getByRole("list", { name: "Example project files" });
  const actions = tree.locator("fieldset").first();
  await expect(actions).toHaveAttribute("inert", "");
  const request = await page.getByLabel("Hierarchy request").textContent();
  const controls = page.getByLabel("Example state");
  await controls.focus();
  const result = await actions.evaluate(element => {
    const action = element.querySelector("button")!;
    const legend = document.createElement("legend");
    element.prepend(legend); legend.append(action);
    action.focus(); action.click();
    element.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    return { nativeLegendException: !action.matches(":disabled"), focused: document.activeElement === action };
  });
  expect(result).toEqual({ nativeLegendException: true, focused: false });
  await expect(controls).toBeFocused();
  await expect(page.getByLabel("Hierarchy request")).toHaveText(request!);
  await controls.selectOption("default");
  await tree.getByRole("button", { name: "Inspect src", exact: true }).click();
  await expect(page.getByLabel("Hierarchy request")).toContainText("Inspect requested: src");
});

for (const retired of inventory.retiredComponents) test(`retired ${retired.id} has a truthful fallback, not a renderer`, async ({ page }) => {
  await page.goto(`/#${retired.id}`);
  await expect(page.getByTestId("retired-route")).toBeVisible();
  await expect(page.getByTestId("live-example")).toHaveCount(0);
  await page.getByTestId("retired-route").locator('a[href="#harso:chat-shell"]').click();
  await expect(page.getByRole("textbox", { name: "Message", exact: true })).toBeVisible();
});
