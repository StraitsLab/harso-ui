import { test, expect, type Page, type Locator } from "@playwright/test";

async function mount(page: Page, kind: string) {
  await page.goto("/#boardui:radio");
  const source = await (await page.request.get("/src/boundaryless/main.tsx")).text();
  const reactUrl = source.match(/from "([^"]+\/react\.js\?[^"]+)"/)?.[1];
  const domUrl = source.match(/from "([^"]+\/react-dom_client\.js\?[^"]+)"/)?.[1];
  const producerUrl = source.match(/import "([^"]+\/packages\/ui\/src\/boundaryless\/)primitives\.css(?:\?[^"]*)?"/)?.[1];
  expect(reactUrl).toBeTruthy(); expect(domUrl).toBeTruthy(); expect(producerUrl).toBeTruthy();
  await page.evaluate(async ({ reactUrl, domUrl, producerUrl, kind }) => {
    const React = (await import(reactUrl!)).default;
    const { createRoot } = (await import(domUrl!)).default;
    const primitives = await import(`${producerUrl}primitives.tsx`);
    const navigation = await import(`${producerUrl}navigation.tsx`);
    const { RadioCard, SelectItem } = await import(`${producerUrl}controls.tsx`);
    const element = React.createElement;
    function Consumer() {
      const [disabled, setDisabled] = React.useState(false);
      const [empty, setEmpty] = React.useState(false);
      const [accepted, setAccepted] = React.useState(false);
      const [pending, setPending] = React.useState(false);
      const [requests, setRequests] = React.useState([]);
      const request = (value: unknown) => setRequests((current: unknown[]) => [...current, value]);
      const items = empty ? [] : [{ value: "first", label: "First" }, { value: "second", label: "Second" }, { value: "blocked", label: "Blocked", disabled: true }];
      const value = accepted ? "second" : "first";
      let content;
      if (kind === "radio") content = element(React.Fragment, null,
        element(primitives.RadioGroup, { label: "Subject", options: items, value, disabled, onValueChange: request }),
        element(RadioCard, { label: "Disabled card", name: "card", value: "blocked", disabled: true, onChange: () => request("card") }));
      else if (kind === "group" || kind === "single-group" || kind === "segmented") content = element(kind === "segmented" ? navigation.SegmentedControl : navigation.ButtonGroup,
        { label: "Subject", items, disabled, ...(kind !== "segmented" ? { multiple: kind === "group", selected: [value], onSelectionChange: request } : { value, onValueChange: request }) });
      else if (kind === "close") content = element(navigation.CloseButton, { label: "Close subject", disabled, pending, onClick: () => request("close") });
      else if (kind === "pagination") content = element(navigation.Pagination, { label: "Subject pages", page: 2, pageCount: empty ? 0 : 3, disabled, onPageChange: request });
      else if (kind === "tooltip") content = element(navigation.Tooltip, { content: "Supplied hint", open: !accepted, onOpenChange: request }, element(primitives.Button, null, "Hint trigger"));
      else content = element(primitives.Field, { label: "Subject", required: true, description: "Select one choice", error: accepted ? undefined : "Host error" },
        (props: object) => element(primitives.Select, { ...props, customizable: kind === "rich-select", value: empty ? "" : value, disabled, onChange: (event: Event) => request((event.target as HTMLSelectElement).value) }, ...items.map(item => element(SelectItem, { key: item.value, value: item.value, disabled: item.disabled, ...(kind === "rich-select" ? { textValue: item.label, description: "Supplied detail" } : {}) }, item.label))));
      return element("section", { "aria-label": "Lifecycle consumer" },
        element("button", { onClick: () => setDisabled(!disabled) }, "Host disabled"),
        element("button", { onClick: () => setEmpty(!empty) }, "Host empty"),
        element("button", { onClick: () => setAccepted(!accepted) }, "Host accept"),
        element("button", { onClick: () => setPending(!pending) }, "Host pending"),
        element("output", { "aria-label": "Requests" }, JSON.stringify(requests)), content);
    }
    const root = document.createElement("div");
    document.querySelector(".harso-kit")!.prepend(root);
    createRoot(root).render(element(Consumer));
  }, { reactUrl, domUrl, producerUrl, kind });
  return page.getByRole("region", { name: "Lifecycle consumer" });
}

async function attemptDisabled(page: Page, locator: Locator) {
  await expect(locator).toBeDisabled();
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);
}

for (const kind of ["radio", "group", "single-group", "segmented"]) {
  test(`LIFECYCLE ${kind} empty per-item/root disabled and host refusal`, async ({ page }) => {
    const fixture = await mount(page, kind);
    const group = fixture.getByRole("group", { name: "Subject" });
    const role = kind === "group" ? "checkbox" : "radio";
    const requests = fixture.getByLabel("Requests");
    await group.getByRole(role, { name: "Second" }).click();
    await expect(requests).toHaveText(kind === "group" ? '[["first","second"]]' : kind === "single-group" ? '[["second"]]' : '["second"]');
    await expect(group.getByRole(role, { name: "First" })).toBeChecked();
    await expect(group.getByRole(role, { name: "Second" })).not.toBeChecked();
    const previous = await requests.textContent();
    await attemptDisabled(page, group.getByRole(role, { name: "Blocked" }));
    if (kind === "radio") await attemptDisabled(page, fixture.getByRole("radio", { name: "Disabled card" }));
    await fixture.getByRole("button", { name: "Host accept" }).click();
    await expect(group.getByRole(role, { name: "Second" })).toBeChecked();
    await expect(group.getByRole(role, { name: "First" })).not.toBeChecked();
    await fixture.getByRole("button", { name: "Host disabled" }).click();
    for (const input of await group.getByRole(role).all()) await attemptDisabled(page, input);
    await expect(requests).toHaveText(previous!);
    await fixture.getByRole("button", { name: "Host empty" }).click();
    await expect(group.getByRole(role)).toHaveCount(0);
    await expect(group).toBeVisible();
    await fixture.getByRole("button", { name: "Host empty" }).click();
    await expect(group.getByRole(role)).toHaveCount(3);
    await expect(group.getByRole(role, { name: "Second" })).toBeChecked();
  });
}

for (const kind of ["select", "rich-select"]) {
  test(`LIFECYCLE ${kind} requests alternative refuses and accepts host replacement`, async ({ page }) => {
    const fixture = await mount(page, kind);
    const select = fixture.getByRole("combobox", { name: "Subject" });
    await select.selectOption("second");
    await expect(fixture.getByLabel("Requests")).toHaveText('["second"]');
    await expect(select).toHaveValue("first");
    await fixture.getByRole("button", { name: "Host accept" }).click();
    await expect(select).toHaveValue("second");
  });
  test(`LIFECYCLE ${kind} empty required error recovery and disabled guards`, async ({ page }) => {
    const fixture = await mount(page, kind);
    const select = fixture.getByRole("combobox", { name: "Subject" });
    await expect(select).toHaveAccessibleDescription("Select one choice Host error");
    await expect(select).toHaveAttribute("aria-invalid", "true");
    await expect(fixture.getByText("Host error", { exact: true })).toBeVisible();
    await expect(select.locator('option[value="blocked"]')).toBeDisabled();
    await fixture.getByRole("button", { name: "Host empty" }).click();
    await expect(select.locator("option")).toHaveCount(0);
    expect(await select.evaluate(element => (element as HTMLSelectElement).validity.valueMissing)).toBe(true);
    await expect(select).toHaveValue("");
    await fixture.getByRole("button", { name: "Host empty" }).click();
    await fixture.getByRole("button", { name: "Host accept" }).click();
    await expect(select).toHaveValue("second");
    await expect(select).not.toHaveAttribute("aria-invalid");
    await expect(select).toHaveAccessibleDescription("Select one choice");
    await expect(fixture.getByText("Host error", { exact: true })).toHaveCount(0);
    expect(await select.evaluate(element => (element as HTMLSelectElement).validity.valueMissing)).toBe(false);
    await select.focus();
    await page.keyboard.press("End");
    await page.keyboard.press("Enter");
    await expect(select).toHaveValue("second");
    const previous = await fixture.getByLabel("Requests").textContent();
    await fixture.getByRole("button", { name: "Host disabled" }).click();
    await attemptDisabled(page, select);
    await select.evaluate(element => (element as HTMLSelectElement).focus());
    await expect(select).not.toBeFocused();
    await expect(fixture.getByLabel("Requests")).toHaveText(previous!);
    await expect(select).toHaveValue("second");
  });
}

test("LIFECYCLE close native pending and disabled guards recover", async ({ page }) => {
  const fixture = await mount(page, "close");
  const close = fixture.getByRole("button", { name: "Close subject" });
  await fixture.getByRole("button", { name: "Host pending" }).click();
  await expect(close).toHaveAttribute("aria-busy", "true");
  await expect(close.locator(".hk-spinner")).toBeVisible();
  await attemptDisabled(page, close);
  await expect(fixture.getByLabel("Requests")).toHaveText("[]");
  await fixture.getByRole("button", { name: "Host pending" }).click();
  await expect(close).not.toHaveAttribute("aria-busy");
  await expect(close.locator(".hk-spinner")).toHaveCount(0);
  await fixture.getByRole("button", { name: "Host disabled" }).click();
  await attemptDisabled(page, close);
  await expect(fixture.getByLabel("Requests")).toHaveText("[]");
  await fixture.getByRole("button", { name: "Host disabled" }).click();
  await close.click();
  await expect(fixture.getByLabel("Requests")).toHaveText('["close"]');
});

test("LIFECYCLE pagination empty root-disabled actions and recovery", async ({ page }) => {
  const fixture = await mount(page, "pagination");
  const navigation = fixture.getByRole("navigation", { name: "Subject pages" });
  await fixture.getByRole("button", { name: "Host disabled" }).click();
  await expect(navigation.getByRole("button")).toHaveCount(5);
  for (const button of await navigation.getByRole("button").all()) await attemptDisabled(page, button);
  await expect(fixture.getByLabel("Requests")).toHaveText("[]");
  await fixture.getByRole("button", { name: "Host empty" }).click();
  await expect(navigation).toHaveCount(0);
  await expect(fixture.getByText("No pages", { exact: true })).toBeVisible();
  await fixture.getByRole("button", { name: "Host empty" }).click();
  await fixture.getByRole("button", { name: "Host disabled" }).click();
  await navigation.getByRole("button", { name: "Next page" }).click();
  await expect(fixture.getByLabel("Requests")).toHaveText("[3]");
  await expect(navigation.getByRole("button", { name: "Page 2", exact: true })).toHaveAttribute("aria-current", "page");
});

test("LIFECYCLE tooltip refuses dismissal then accepts host close and reopen", async ({ page }) => {
  const fixture = await mount(page, "tooltip");
  const hint = page.getByRole("tooltip", { name: "Supplied hint" });
  await expect(hint).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(fixture.getByLabel("Requests")).toHaveText("[false]");
  await expect(hint).toBeVisible();
  await fixture.getByRole("button", { name: "Host accept" }).click();
  await expect(hint).toBeHidden();
  await fixture.getByRole("button", { name: "Host accept" }).click();
  await expect(hint).toBeVisible();
});
