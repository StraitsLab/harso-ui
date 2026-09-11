import { expect, test, type Page } from "@playwright/test";

async function mountTrail(page: Page, mode: "tasks" | "steps" | "results") {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#boardui:task-list");
  const source = await (await page.request.get("/preview/main.tsx")).text();
  const reactUrl = source.match(/from "([^"]+\/react\.js\?[^"]+)"/)?.[1];
  const domUrl = source.match(/from "([^"]+\/react-dom_client\.js\?[^"]+)"/)?.[1];
  const producerUrl = source.match(/import "([^"]*\/src\/)primitives\.css(?:\?[^"]*)?"/)?.[1];
  expect(reactUrl).toBeTruthy(); expect(domUrl).toBeTruthy(); expect(producerUrl).toBeTruthy();
  await page.evaluate(async ({ reactUrl, domUrl, producerUrl, mode }) => {
    const React = (await import(reactUrl!)).default;
    const { createRoot } = (await import(domUrl!)).default;
    const { TaskList, WebSearch } = await import(`${producerUrl}agent-trails.tsx`);
    const element = React.createElement;
    const tasks = [{ id: "supplied", label: "Supplied task", steps: [{ label: "Supplied first step" }, { label: "Supplied final step" }] }];
    const sources = Array.from({ length: 7 }, (_, index) => ({ title: `Reference ${index + 1}`, domain: "example.org", href: `https://example.org/${index + 1}` }));
    const steps = [{ label: "Supplied search step", sources }, { label: "Supplied final step" }];
    const searchResults = [{ title: "Supplied result", url: "https://example.org/result", snippet: "Supplied snippet" }];
    function Consumer() {
      const [state, setState] = React.useState("empty");
      const [completions, setCompletions] = React.useState(0);
      const playback = { startDelay: 300, stepInterval: 1000, disabled: state === "disabled", error: state === "error" ? "Host supplied interruption; no execution inferred." : undefined, onComplete: () => setCompletions((count: number) => count + 1) };
      return element("section", { "aria-label": "Persistent trail fixture" },
        element("select", { "aria-label": "Supplied trail state", value: state, onChange: (event: Event) => setState((event.target as HTMLSelectElement).value) },
          ...["empty", "ready", "disabled", "error"].map(value => element("option", { key: value }, value))),
        element("output", { "aria-label": "Presentation completions" }, String(completions)),
        mode === "tasks" ? element(TaskList, { ...playback, tasks: state === "empty" ? [] : tasks }) : element(WebSearch, {
          ...playback, query: "Supplied local references", working: "Presenting supplied steps",
          ...(mode === "steps" ? { steps: state === "empty" ? [] : steps } : { searchResults: state === "empty" ? [] : searchResults }),
        }));
    }
    const root = document.createElement("div");
    document.querySelector(".harso-kit")!.prepend(root);
    createRoot(root).render(element(Consumer));
  }, { reactUrl, domUrl, producerUrl, mode });
  return page.getByRole("region", { name: "Persistent trail fixture", exact: true });
}

test("TRAIL TaskList mounted empty error disabled timers disclosure and recovery", async ({ page }) => {
  const host = await mountTrail(page, "tasks");
  const trail = host.locator(".hk-task-list");
  const node = await trail.elementHandle();
  const state = host.getByLabel("Supplied trail state");
  const completions = host.getByLabel("Presentation completions");
  await expect(trail).toHaveText("No tasks supplied.");
  await page.waitForTimeout(1300);
  await expect(completions).toHaveText("0");
  await state.selectOption("ready");
  const summary = trail.locator("summary");
  await expect(summary).toHaveText("Supplied task");
  const disclosure = trail.locator("details");
  const disclosureNode = await disclosure.elementHandle();
  await summary.click();
  await expect(disclosure).not.toHaveAttribute("open");
  await state.selectOption("disabled");
  await summary.focus();
  await page.keyboard.press("Enter");
  await expect(disclosure).not.toHaveAttribute("open");
  await expect(summary).toHaveAttribute("aria-disabled", "true");
  await page.waitForTimeout(1300);
  await expect(trail.locator(".hk-trail-steps li")).toHaveCount(0);
  await expect(completions).toHaveText("0");
  await state.selectOption("error");
  await expect(trail.getByRole("alert")).toHaveText("Host supplied interruption; no execution inferred.");
  await page.waitForTimeout(1300);
  await expect(trail.locator(".hk-trail-steps li")).toHaveCount(0);
  await expect(completions).toHaveText("0");
  expect(await disclosure.evaluate((current, original) => current === original, disclosureNode)).toBe(true);
  await expect(disclosure).not.toHaveAttribute("open");
  await state.selectOption("ready");
  await expect(trail.getByRole("alert")).toHaveCount(0);
  await summary.focus();
  await page.keyboard.press("Enter");
  await expect(disclosure).toHaveAttribute("open", "");
  await expect(trail.getByText("Supplied first step", { exact: true })).toBeVisible();
  await expect(summary).toBeFocused();
  await state.selectOption("empty");
  await expect(trail).toHaveText("No tasks supplied.");
  await page.waitForTimeout(1300);
  await expect(trail.locator("details")).toHaveCount(0);
  await expect(completions).toHaveText("0");
  await state.selectOption("ready");
  await expect(trail.getByText("Supplied first step", { exact: true })).toBeVisible();
  await expect(trail.getByText("Supplied final step", { exact: true })).toBeVisible();
  await expect(completions).toHaveText("1");
  await page.waitForTimeout(1300);
  await expect(completions).toHaveText("1");
  await expect(trail.locator('[data-status="complete"]')).toHaveCount(0);
  expect(await trail.evaluate((current, original) => current === original, node)).toBe(true);
});

test("TRAIL WebSearch timed steps cancel pending completion and recover disabled sources", async ({ page }) => {
  const host = await mountTrail(page, "steps");
  const trail = host.locator(".hk-web-search");
  const node = await trail.elementHandle();
  const state = host.getByLabel("Supplied trail state");
  const completions = host.getByLabel("Presentation completions");
  await expect(trail).toContainText("No search steps supplied.");
  await expect(trail.getByRole("status")).toHaveCount(0);
  await page.waitForTimeout(1300);
  await expect(completions).toHaveText("0");
  await state.selectOption("ready");
  await expect(trail.getByRole("status")).toHaveText("Presenting supplied steps");
  const source = trail.getByRole("link", { name: "Reference 1 · example.org", exact: true });
  await expect(source).toBeVisible();
  await state.selectOption("disabled");
  const sourceNode = await source.elementHandle();
  const overflow = trail.locator(".hk-trail-overflow");
  await expect(source).toHaveAttribute("aria-disabled", "true");
  await expect(source).toHaveAttribute("tabindex", "-1");
  await expect(trail.locator("a[href]")).toHaveCount(0);
  await overflow.locator("summary").focus();
  await page.keyboard.press("Enter");
  await expect(overflow).not.toHaveAttribute("open");
  await expect(trail.getByRole("status")).toHaveCount(0);
  await page.waitForTimeout(1300);
  await expect(trail.getByText("Supplied final step", { exact: true })).toHaveCount(0);
  await expect(completions).toHaveText("0");
  await state.selectOption("error");
  await expect(trail.getByRole("alert")).toBeVisible();
  await expect(trail.getByRole("status")).toHaveCount(0);
  await page.waitForTimeout(1300);
  await expect(trail.getByText("Supplied final step", { exact: true })).toHaveCount(0);
  await expect(completions).toHaveText("0");
  expect(await source.evaluate((current, original) => current === original, sourceNode)).toBe(true);
  await state.selectOption("empty");
  await expect(trail).toContainText("No search steps supplied.");
  await expect(trail.locator(".hk-trail-row")).toHaveCount(0);
  await page.waitForTimeout(1300);
  await expect(completions).toHaveText("0");
  await state.selectOption("ready");
  await expect(trail.getByRole("alert")).toHaveCount(0);
  await expect(source).toHaveAttribute("href", "https://example.org/1");
  await overflow.locator("summary").focus();
  await page.keyboard.press("Enter");
  await expect(overflow).toHaveAttribute("open", "");
  await expect(trail.getByRole("link", { name: "Reference 7 · example.org", exact: true })).toBeVisible();
  await source.focus();
  await expect(trail.getByText("Supplied final step", { exact: true })).toBeVisible();
  await expect(source).toBeFocused();
  await expect(completions).toHaveText("1");
  await expect(trail.getByRole("status")).toHaveCount(0);
  await state.selectOption("disabled");
  await expect(overflow).toHaveAttribute("open", "");
  await overflow.locator("summary").click();
  await expect(overflow).toHaveAttribute("open", "");
  await state.selectOption("ready");
  await overflow.locator("summary").click();
  await expect(overflow).not.toHaveAttribute("open");
  await page.waitForTimeout(1300);
  await expect(completions).toHaveText("1");
  expect(await trail.evaluate((current, original) => current === original, node)).toBe(true);
});

test("TRAIL WebSearch results-only actual empty collection supplied error disabled recovery", async ({ page }) => {
  const host = await mountTrail(page, "results");
  const trail = host.locator(".hk-web-search");
  const node = await trail.elementHandle();
  const state = host.getByLabel("Supplied trail state");
  const completions = host.getByLabel("Presentation completions");
  await expect(trail).toContainText("No search results supplied.");
  await expect(trail.locator("a[href]")).toHaveCount(0);
  await state.selectOption("ready");
  const source = trail.locator("a.hk-source");
  await expect(source).toHaveAttribute("href", "https://example.org/result");
  await expect(trail).toContainText("Supplied snippet");
  await state.selectOption("error");
  await expect(trail.getByRole("alert")).toBeVisible();
  await expect(trail).toContainText("Supplied snippet");
  await state.selectOption("disabled");
  await expect(trail.getByRole("alert")).toHaveCount(0);
  await expect(source).not.toHaveAttribute("href");
  await expect(source).toHaveAttribute("aria-disabled", "true");
  await expect(source).toHaveAttribute("tabindex", "-1");
  await source.scrollIntoViewIfNeeded();
  const sourceBox = await source.boundingBox();
  await page.mouse.click(sourceBox!.x + sourceBox!.width / 2, sourceBox!.y + sourceBox!.height / 2);
  await expect(page).toHaveURL(/#boardui:task-list$/);
  await state.selectOption("empty");
  await expect(trail).toContainText("No search results supplied.");
  await expect(trail.locator("li, a")).toHaveCount(0);
  await state.selectOption("ready");
  await expect(source).toHaveAttribute("href", "https://example.org/result");
  await expect(source).toHaveAttribute("rel", "noreferrer noopener");
  await page.waitForTimeout(1300);
  await expect(trail.getByRole("status")).toHaveCount(0);
  await expect(completions).toHaveText("0");
  expect(await trail.evaluate((current, original) => current === original, node)).toBe(true);
});
