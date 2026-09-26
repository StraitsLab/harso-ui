import { expect, test, type Locator, type Page } from "@playwright/test";

for (const width of [390, 1440]) test(`hover-only citation remains reachable at ordinary pointer speed at ${width}`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  await page.goto('/#vercel:inline-citation');
  const trigger = page.getByRole('button', { name: 'Open citation: 2 sources', exact: true });
  const content = page.locator('[data-testid="live-example"] .hk-inline-citation-card-body');
  await trigger.hover();
  await expect(content).toBeVisible();
  const start = (await trigger.boundingBox())!;
  const end = (await content.boundingBox())!;
  const origin = { x: start.x + start.width / 2, y: start.y + start.height / 2 };
  const destination = { x: Math.max(end.x + 5, Math.min(origin.x, end.x + end.width - 5)), y: end.y > origin.y ? end.y + 5 : end.y + end.height - 5 };
  const steps = Math.ceil(Math.hypot(destination.x - origin.x, destination.y - origin.y) / 150 * 1000 / 50);
  // Pace each 50 ms step against the clock: a fixed sleep after each move adds the move's own cost, which on a loaded
  // CI runner stretched this 150 px/s crossing past the card's close delay.
  const began = Date.now();
  for (let step = 1; step <= steps; step++) {
    await page.mouse.move(origin.x + (destination.x - origin.x) * step / steps, origin.y + (destination.y - origin.y) * step / steps);
    await page.waitForTimeout(Math.max(0, began + step * 50 - Date.now()));
  }
  await expect(content).toBeVisible();
  await expect(trigger).not.toBeFocused();
});

async function contained(page: Page, content: Locator) {
  await expect(content).toBeVisible();
  await expect.poll(async () => content.evaluate(element => {
    const bounds = element.getBoundingClientRect();
    return bounds.left >= 0 && bounds.right <= innerWidth && bounds.top >= 0 && bounds.bottom <= innerHeight;
  })).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}

test("revealed citation fits the actual narrow gallery and survives resize", async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto("/#vercel:inline-citation");
  const example = page.getByTestId("live-example");
  await example.getByRole("button", { name: "Open citation: 2 sources" }).focus();
  const content = example.locator(".hk-inline-citation-card-body");
  await info.attach("initial-geometry", { body: JSON.stringify(await content.boundingBox()), contentType: "application/json" });
  await contained(page, content);
  await content.screenshot({ path: info.outputPath("narrow.png") });
  await page.screenshot({ path: info.outputPath("narrow-context.png") });
  await page.setViewportSize({ width: 1440, height: 900 });
  await contained(page, content);
  await content.screenshot({ path: info.outputPath("wide.png") });
  await page.screenshot({ path: info.outputPath("wide-context.png") });
  await page.setViewportSize({ width: 390, height: 640 });
  await contained(page, content);
});

test("shared hover placement handles edges, alignments and controlled refusal", async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 640 });
  await page.goto("/#vercel:inline-citation");
  const source = await (await page.request.get("/preview/main.tsx")).text();
  const reactUrl = source.match(/from "([^"]+\/react\.js\?[^"]+)"/)![1];
  const domUrl = source.match(/from "([^"]+\/react-dom_client\.js\?[^"]+)"/)![1];
  const producerUrl = source.match(/import "([^"]*\/src\/)primitives\.css(?:\?[^"]*)?"/)![1];
  await page.evaluate(async ({ reactUrl, domUrl, producerUrl }) => {
    const React = (await import(reactUrl)).default;
    const { createRoot } = (await import(domUrl)).default;
    const citation = await import(`${producerUrl}inline-citation.tsx`);
    const attachment = await import(`${producerUrl}attachments.tsx`);
    function Consumer() {
      const [open, setOpen] = React.useState(false);
      const [refuse, setRefuse] = React.useState(false);
      const [requests, setRequests] = React.useState(0);
      return React.createElement("section", { "aria-label": "Placement fixture" },
        React.createElement("label", { style: { position: "fixed", bottom: 0, left: "40%", zIndex: 10 } }, React.createElement("input", { type: "checkbox", checked: refuse, onChange: (event: Event) => setRefuse((event.target as HTMLInputElement).checked) }), "Refuse changes"),
        React.createElement("output", { "aria-label": "Open requests" }, requests),
        ...[
          [citation.InlineCitationCard, citation.InlineCitationCardTrigger, citation.InlineCitationCardBody, "Citation"],
          [attachment.AttachmentHoverCard, attachment.AttachmentHoverCardTrigger, attachment.AttachmentHoverCardContent, "Attachment"],
        ].map(([Card, Trigger, Content, name], index) => React.createElement("div", { key: name, "data-testid": `edge-${name}`, style: { position: "fixed", top: 24 + index * 120, left: 8, zIndex: 4 } },
          React.createElement(Card, { open: index === 0 ? open : undefined, onOpenChange: index === 0 ? (next: boolean) => { setRequests((value: number) => value + 1); if (!refuse) setOpen(next); } : undefined, openDelay: 20, closeDelay: 40 },
            React.createElement(Trigger, { sources: ["https://example.com"], "data-testid": "edge-trigger" }, name),
            React.createElement(Content, null, React.createElement("button", null, `Inspect ${name}`), React.createElement("p", null, "Supplied source details remain readable at either viewport edge."))))));
    }
    const root = document.createElement("div");
    document.querySelector('[data-testid="live-example"]')!.before(root);
    createRoot(root).render(React.createElement(Consumer));
  }, { reactUrl, domUrl, producerUrl });
  const fixture = page.getByRole("region", { name: "Placement fixture" });
  for (const name of ["Citation", "Attachment"]) {
    const wrapper = fixture.getByTestId(`edge-${name}`);
    const trigger = wrapper.getByTestId("edge-trigger");
    const content = wrapper.locator(".hk-attachment-hover-content");
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 640 });
      for (const edge of ["left", "right"]) {
        await wrapper.evaluate((element, edge) => { element.style.left = edge === "left" ? "8px" : "auto"; element.style.right = edge === "right" ? "8px" : "auto"; }, edge);
        await page.getByLabel("Appearance", { exact: true }).focus();
        await trigger.focus();
        for (const align of ["start", "center", "end"]) {
          await content.evaluate((element, align) => element.setAttribute("data-align", align), align);
          await contained(page, content);
        }
        await content.getByRole("button", { name: `Inspect ${name}` }).focus();
        await expect(content.getByRole("button")).toBeFocused();
        await page.keyboard.press("Escape");
        await expect(content).toBeHidden();
        await expect(trigger).toBeFocused();
      }
    }
    await page.setViewportSize({ width: 390, height: 640 });
    await wrapper.evaluate(element => { element.style.top = "auto"; element.style.bottom = "32px"; });
    await page.getByLabel("Appearance", { exact: true }).focus();
    await trigger.hover();
    await contained(page, content);
    await content.getByRole("button").hover();
    await expect(content).toBeVisible();
    await content.screenshot({ path: info.outputPath(`${name}-bottom-edge.png`) });
    await page.screenshot({ path: info.outputPath(`${name}-bottom-context.png`) });
    await page.mouse.move(200, 5);
    await expect(content).toBeHidden();
  }
  const citation = fixture.getByTestId("edge-Citation");
  const trigger = citation.getByTestId("edge-trigger");
  const content = citation.locator(".hk-attachment-hover-content");
  await fixture.getByLabel("Refuse changes").check();
  await trigger.focus();
  await expect(content).toBeHidden();
  await fixture.getByLabel("Refuse changes").uncheck();
  await trigger.focus();
  await contained(page, content);
  await fixture.getByLabel("Refuse changes").evaluate(element => (element as HTMLInputElement).click());
  await trigger.focus();
  await page.keyboard.press("Escape");
  await expect(content).toBeVisible();
  await contained(page, content);
  await fixture.getByLabel("Refuse changes").uncheck();
  await trigger.focus();
  await page.keyboard.press("Escape");
  await expect(content).toBeHidden();
});

test("keyboard citation endpoints retain focus and support Escape without hover", async ({ page }) => {
  await page.goto("/#vercel:inline-citation");
  await page.mouse.move(0, 0);
  const example = page.getByTestId("live-example");
  const trigger = example.getByRole("button", { name: "Open citation: 2 sources" });
  await trigger.focus();
  await example.getByRole("button", { name: "Next citation" }).focus();
  await page.keyboard.press("Enter");
  await expect(trigger).toBeFocused();
  await expect(example.getByRole("link", { name: "Project report" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(example.locator(".hk-inline-citation-card-body")).toBeHidden();
});

test("citation count matches browsable sources and host refusal retains selection", async ({ page }) => {
  await page.goto("/#vercel:inline-citation");
  const example = page.getByTestId("live-example");
  await example.getByRole("button", { name: "Open citation: 2 sources" }).focus();
  await expect(example.locator(".hk-inline-citation-carousel-index")).toHaveText("1/2");
  await example.getByRole("button", { name: "Next citation" }).click();
  await expect(example.getByRole("link", { name: "Project report" })).toBeVisible();
  await page.waitForTimeout(350);
  await expect(example.getByRole("link", { name: "Project report" })).toBeVisible();
  await expect(example.getByRole("button", { name: "Open citation: 2 sources" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(example.locator(".hk-inline-citation-card-body")).toBeHidden();
  await expect(example.getByRole("button", { name: "Open citation: 2 sources" })).toBeFocused();
  await page.keyboard.press("Enter");
  await example.getByRole("button", { name: "Previous citation" }).click();
  await expect(example.getByRole("link", { name: "Research overview" })).toBeVisible();
  await page.waitForTimeout(350);
  await expect(example.getByRole("link", { name: "Research overview" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(example.locator(".hk-inline-citation-card-body")).toBeHidden();
  await expect(example.getByRole("button", { name: "Open citation: 2 sources" })).toBeFocused();
  await example.getByLabel("Hold citation navigation").check();
  await example.getByRole("button", { name: "Open citation: 2 sources" }).focus();
  const before = await example.locator(".hk-inline-citation-carousel-index").textContent();
  const next = example.getByRole("button", { name: "Next citation" });
  if (await next.isEnabled()) await next.click();
  else await example.getByRole("button", { name: "Previous citation" }).click();
  await expect(example.locator(".hk-inline-citation-carousel-index")).toHaveText(before!);
});

test("citation host states never advertise unavailable sources", async ({ page }) => {
  await page.goto("/#vercel:inline-citation");
  const example = page.getByTestId("live-example");
  for (const [state, text] of [["empty", "No sources supplied."], ["loading", "Sources are loading."], ["error", "Sources unavailable."]]) {
    await example.getByLabel("Citation data").selectOption(state);
    await expect(example.getByRole("status")).toHaveText(text);
    await expect(example.locator(".hk-inline-citation-trigger")).toHaveCount(0);
  }
  await example.getByLabel("Citation data").selectOption("ready");
  await example.getByLabel("Disable citation").check();
  await expect(example.locator(".hk-inline-citation-trigger")).toBeDisabled();
});
