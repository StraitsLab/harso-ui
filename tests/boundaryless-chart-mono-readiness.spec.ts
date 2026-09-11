import { expect, test } from "@playwright/test";

for (const component of ["BarListCard", "FunnelChartCard", "StageBarsCard"]) for (const palette of ["clean", "cozy"]) {
  test(`MONO ${component} ${palette} computed paint and raw values`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 1000 });
    await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
    await page.goto("/#boardui:bar-list-card");
    const entry = await (await page.request.get("/preview/main.tsx")).text();
    const example = await (await page.request.get("/preview/shared-chart-example.tsx")).text();
    const reactUrl = entry.match(/from "([^"]*\/deps\/react\.js[^"]*)"/)?.[1];
    const domUrl = entry.match(/from "([^"]*\/deps\/react-dom_client\.js[^"]*)"/)?.[1];
    const producerUrl = example.match(/from "([^"]*\/src\/index\.ts[^"]*)"/)?.[1];
    if (!reactUrl || !domUrl || !producerUrl) throw new Error("Coordinated Vite consumer imports were not found");
    await page.evaluate(async ({ reactUrl, domUrl, producerUrl, component, palette }) => {
      const React = (await import(reactUrl)).default;
      const { createRoot } = (await import(domUrl)).default;
      const components = await import(producerUrl);
      const gallery = document.getElementById("root");
      if (gallery) gallery.hidden = true;
      const fixture = document.createElement("main");
      fixture.dataset.testid = "mono-fixture";
      fixture.style.cssText = "box-sizing:border-box;width:100%;max-width:720px;padding:24px;margin:auto";
      document.body.append(fixture);
      function Consumer() {
        const [mono, setMono] = React.useState(false);
        return React.createElement(components.KitProvider, { appearance: "light", palette },
          React.createElement("label", null, "Monochrome", React.createElement("input", { type: "checkbox", checked: mono, onChange: (event: Event) => setMono((event.target as HTMLInputElement).checked) })),
          React.createElement(components[component], { title: "Supplied stages", mono, display: "value", data: [
            { label: "First", value: 80, color: "#b3313b" }, { label: "Second", value: 40, color: "#287346" },
          ] }));
      }
      createRoot(fixture).render(React.createElement(Consumer));
    }, { reactUrl, domUrl, producerUrl, component, palette });
    const fixture = page.getByTestId("mono-fixture");
    const chart = fixture.locator("article");
    const shapes = chart.locator(component === "FunnelChartCard" ? ".hk-chart-funnel-shape path" : ".hk-chart-funnel-bar");
    const paint = () => shapes.evaluateAll(elements => elements.map(element => element.tagName === "path" ? getComputedStyle(element).fill : getComputedStyle(element).backgroundColor));
    await expect(shapes).toHaveCount(2);
    await expect.poll(paint).toEqual(["rgb(179, 49, 59)", "rgb(40, 115, 70)"]);
    const coloredGeometry = await shapes.evaluateAll(elements => elements.map(element => ({ width: element.getBoundingClientRect().width, height: element.getBoundingClientRect().height })));
    await fixture.getByRole("checkbox", { name: "Monochrome" }).check();
    const accent = palette === "clean" ? "rgb(20, 92, 186)" : "rgb(57, 105, 87)";
    await expect.poll(paint).toEqual([accent, accent]);
    expect(await shapes.evaluateAll(elements => elements.map(element => ({ width: element.getBoundingClientRect().width, height: element.getBoundingClientRect().height })))).toEqual(coloredGeometry);
    await expect(chart.locator(".hk-chart-number")).toHaveText(["80", "40"]);
    await expect(chart.getByRole("tablist")).toHaveCount(0);
    await chart.getByRole("button", { name: "Second: 40", exact: true }).click();
    await expect(chart.getByRole("status")).toHaveText("Second: 40");
    expect(await chart.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
    console.log(JSON.stringify({ component, palette, before: ["rgb(179, 49, 59)", "rgb(40, 115, 70)"], mono: await paint(), coloredGeometry, values: await chart.locator(".hk-chart-number").allTextContents() }));
    await chart.screenshot({ path: test.info().outputPath("monochrome.png") });
    await fixture.getByRole("checkbox", { name: "Monochrome" }).uncheck();
    await expect.poll(paint).toEqual(["rgb(179, 49, 59)", "rgb(40, 115, 70)"]);
    await expect(chart.locator(".hk-chart-number")).toHaveText(["80", "40"]);
  });
}
