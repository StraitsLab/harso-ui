import { expect, test, type Page } from "@playwright/test";

async function mountProducer(page: Page, component: string, variant = "plain") {
  await page.goto("/#vercel:persona");
  const source = await (await page.request.get("/preview/main.tsx")).text();
  const reactUrl = source.match(/from "([^"]+\/react\.js\?[^"]+)"/)?.[1];
  const domUrl = source.match(/from "([^"]+\/react-dom_client\.js\?[^"]+)"/)?.[1];
  const producerUrl = source.match(/import "([^"]*\/src\/)primitives\.css(?:\?[^"]*)?"/)?.[1];
  expect(reactUrl).toBeTruthy(); expect(domUrl).toBeTruthy(); expect(producerUrl).toBeTruthy();
  await page.evaluate(async ({ reactUrl, domUrl, producerUrl, component, variant }) => {
    const React = (await import(reactUrl!)).default;
    const { createRoot } = (await import(domUrl!)).default;
    const exports = await import(`${producerUrl}${component === "StatCards" ? "data" : "chart-cards"}.tsx`);
    const element = React.createElement;
    function Consumer() {
      const [state, setState] = React.useState("ready");
      const [range, setRange] = React.useState("week");
      const [requests, setRequests] = React.useState(0);
      const empty = state === "empty";
      const props = component === "StatCards" ? {
        label: "Lifecycle metrics", variant,
        items: empty ? [] : [{ id: "sources", label: "Sources", value: state === "updated" ? "9" : "4", hint: state === "no-hint" ? undefined : state === "updated" ? "Updated supplied hint" : "Original supplied hint" }],
      } : {
        title: "Lifecycle chart", disabled: state === "disabled", range,
        ranges: [{ value: "week", label: "Week" }, { value: "month", label: "Month" }],
        onRangeChange: (next: string) => { setRange(next); setRequests((count: number) => count + 1); },
        ...(component === "HeatmapChartCard" ? {
          rows: empty ? [] : [{ label: "Sources", values: [state === "malformed" ? -1 : state === "updated" ? 9 : 4] }],
          columns: empty ? [] : ["Monday"],
        } : {
          nodes: empty ? [] : [{ name: "Sources" }, { name: "Reviewed" }],
          links: empty ? [] : [{ source: state === "malformed" ? "Missing" : "Sources", target: "Reviewed", value: state === "updated" ? 9 : 4 }],
        }),
      };
      return element("section", { "aria-label": "Simple lifecycle fixture" },
        element("select", { "aria-label": "Supplied lifecycle state", value: state, onChange: (event: Event) => setState((event.target as HTMLSelectElement).value) },
          ...["ready", "empty", "malformed", "disabled", "updated", "no-hint"].map(value => element("option", { key: value }, value))),
        element("output", { "aria-label": "Range requests" }, String(requests)),
        element(exports[component], props));
    }
    const root = document.createElement("div");
    document.querySelector(".harso-kit")!.prepend(root);
    createRoot(root).render(element(Consumer));
  }, { reactUrl, domUrl, producerUrl, component, variant });
  return page.getByRole("region", { name: "Simple lifecycle fixture", exact: true });
}

test("SIMPLE Persona supplied states pause/asleep/recover on the same renderer", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/#vercel:persona");
  const persona = page.locator('.hk-persona[style*="160px"]');
  const node = await persona.elementHandle();
  const motion = await persona.locator(".hk-persona-motion").elementHandle();
  const log = page.getByLabel("Persona lifecycle", { exact: true });
  await expect(log).toContainText("play");
  for (const state of ["listening", "thinking", "speaking", "asleep", "idle"]) {
    await page.getByLabel("Persona state", { exact: true }).selectOption(state);
    await expect(persona).toHaveAttribute("data-state", state);
    await expect(persona).toHaveAttribute("data-playback", state === "asleep" ? "stopped" : "playing");
    if (state === "asleep") {
      await expect(persona.locator(".hk-persona-motion")).toHaveCSS("animation-name", "none");
      await expect(log).toHaveText(/stop$/);
    }
    expect(await persona.evaluate((current, original) => current === original, node)).toBe(true);
    expect(await persona.locator(".hk-persona-motion").evaluate((current, original) => current === original, motion)).toBe(true);
  }
  await page.getByLabel("Pause animation", { exact: true }).check();
  await expect(persona.locator(".hk-persona-motion")).toHaveCSS("animation-play-state", "paused");
  await expect(log).toHaveText(/pause$/);
  await page.getByLabel("Pause animation", { exact: true }).uncheck();
  await expect(persona.locator(".hk-persona-motion")).toHaveCSS("animation-play-state", "running");
  await expect(log).toHaveText(/play$/);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(persona).toHaveAttribute("data-playback", "paused");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(persona).toHaveAttribute("data-playback", "playing");
  expect(await persona.evaluate((current, original) => current === original, node)).toBe(true);
  expect((await log.innerText()).match(/ready/g)).toHaveLength(1);
});

for (const variant of ["plain", "footer"]) {
  test(`SIMPLE StatCards ${variant} true empty collection and hint removal/recovery`, async ({ page }) => {
    const host = await mountProducer(page, "StatCards", variant);
    const cards = host.locator("dl");
    const node = await cards.elementHandle();
    const state = host.getByLabel("Supplied lifecycle state");
    await expect(cards).toHaveAttribute("data-variant", variant);
    await host.getByRole("button", { name: "About Sources" }).focus();
    await expect(page.getByRole("tooltip")).toHaveText("Original supplied hint");
    await state.selectOption("empty");
    await expect(cards.locator("dt, dd")).toHaveCount(0);
    await expect(host.getByRole("button")).toHaveCount(0);
    await expect(page.getByRole("tooltip")).toHaveCount(0);
    await state.selectOption("updated");
    await expect(cards.locator("dd")).toHaveText("9");
    await host.getByRole("button", { name: "About Sources" }).focus();
    await expect(page.getByRole("tooltip")).toHaveText("Updated supplied hint");
    await state.selectOption("no-hint");
    await expect(host.getByRole("button")).toHaveCount(0);
    await expect(page.getByRole("tooltip")).toHaveCount(0);
    await expect(cards.locator("dd")).toHaveText("4");
    await state.selectOption("ready");
    await host.getByRole("button", { name: "About Sources" }).focus();
    await expect(page.getByRole("tooltip")).toHaveText("Original supplied hint");
    expect(await cards.evaluate((current, original) => current === original, node)).toBe(true);
  });
}

for (const component of ["HeatmapChartCard", "SankeyChartCard"]) {
  test(`SIMPLE ${component} true empty arrays malformed disabled and restored inspection`, async ({ page }) => {
    const host = await mountProducer(page, component);
    const chart = host.locator("article");
    const node = await chart.elementHandle();
    const state = host.getByLabel("Supplied lifecycle state");
    const heatmap = component === "HeatmapChartCard";
    const inspect = () => chart.getByRole("button", { name: heatmap ? /Sources · Monday/ : /Sources → Reviewed/ });
    await inspect().focus();
    await expect(chart.getByRole("status")).toContainText(heatmap ? "Sources · Monday: 4" : "Sources → Reviewed: 4");
    await state.selectOption("empty");
    await expect(chart.getByText(heatmap ? "No matrix data supplied." : "No positive flows supplied.", { exact: true })).toBeVisible();
    await expect(chart.locator("table, svg")).toHaveCount(0);
    await expect(chart.getByRole("button")).toHaveCount(0);
    await expect(chart.getByRole("status")).toHaveText(heatmap ? "No observations supplied." : "Source total: 0 · Sink total: 0");
    await state.selectOption("updated");
    await inspect().focus();
    await expect(chart.getByRole("status")).toContainText(heatmap ? "Sources · Monday: 9" : "Sources → Reviewed: 9");
    await state.selectOption("malformed");
    await expect(chart.getByRole("alert")).toContainText(heatmap ? "finite nonnegative" : "existing endpoints");
    await expect(chart.locator("table, svg")).toHaveCount(0);
    await expect(chart.getByRole("status")).toHaveCount(0);
    await state.selectOption("disabled");
    await expect(chart.getByRole("alert")).toHaveCount(0);
    await expect(inspect()).toBeDisabled();
    await expect(chart.getByRole("combobox")).toBeDisabled();
    await expect(chart.getByRole("status")).toHaveText(heatmap ? "Total: 4" : "Source total: 4 · Sink total: 4");
    await inspect().scrollIntoViewIfNeeded();
    const box = await inspect().boundingBox();
    await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await expect(chart.getByRole("status")).toHaveText(heatmap ? "Total: 4" : "Source total: 4 · Sink total: 4");
    await expect(host.getByLabel("Range requests")).toHaveText("0");
    await state.selectOption("ready");
    await chart.getByRole("combobox").selectOption("month");
    await expect(host.getByLabel("Range requests")).toHaveText("1");
    await inspect().focus();
    await expect(chart.getByRole("status")).toContainText(heatmap ? "Sources · Monday: 4" : "Sources → Reviewed: 4");
    expect(await chart.evaluate((current, original) => current === original, node)).toBe(true);
  });
}

test("SIMPLE actual Heatmap consumer supplied loading/error children recover mounted matrix", async ({ page }) => {
  await page.goto("/#boardui:heatmap-chart-card");
  const chart = page.locator(".hk-heatmap");
  const node = await chart.elementHandle();
  const state = page.getByLabel("Heatmap state", { exact: true });
  await chart.getByRole("combobox").selectOption("previous");
  await chart.getByRole("button").first().focus();
  await state.selectOption("loading");
  await expect(chart.getByRole("status")).toHaveText("Loading matrix…");
  await expect(chart.getByRole("status")).toHaveAttribute("aria-busy", "true");
  await expect(chart.locator("table")).toHaveCount(0);
  await state.selectOption("error");
  await expect(chart.getByRole("alert")).toHaveText("Matrix unavailable. The host can retry.");
  await expect(chart.getByRole("status")).toHaveCount(0);
  await state.selectOption("ready");
  await expect(chart.getByRole("alert")).toHaveCount(0);
  await expect(chart.getByRole("combobox")).toHaveValue("previous");
  await expect(chart.locator("table")).toBeVisible();
  await chart.getByRole("button").first().focus();
  await expect(chart.getByRole("status")).toContainText("Monday · 08:00: 2");
  expect(await chart.evaluate((current, original) => current === original, node)).toBe(true);
});
