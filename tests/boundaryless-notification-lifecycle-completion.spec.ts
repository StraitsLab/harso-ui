import { expect, test, type Page, type Locator } from "@playwright/test";

async function mountedNotification(page: Page, mode: "notice" | "timer" | "center", controlled = true) {
  await page.goto("/#boardui:notification");
  const source = await (await page.request.get("/src/boundaryless/main.tsx")).text();
  const reactUrl = source.match(/from "([^"]+\/react\.js\?[^"]+)"/)?.[1];
  const domUrl = source.match(/from "([^"]+\/react-dom_client\.js\?[^"]+)"/)?.[1];
  const producerUrl = source.match(/import "([^"]+\/packages\/ui\/src\/boundaryless\/)primitives\.css(?:\?[^"]*)?"/)?.[1];
  expect(reactUrl).toBeTruthy(); expect(domUrl).toBeTruthy(); expect(producerUrl).toBeTruthy();
  await page.evaluate(async ({ reactUrl, domUrl, producerUrl, mode, controlled }) => {
    const React = (await import(reactUrl!)).default;
    const { createRoot } = (await import(domUrl!)).default;
    const { Notification, NotificationAction, NotificationViewport, NotificationCenter } = await import(`${producerUrl}notification.tsx`);
    const element = React.createElement;
    function Consumer() {
      const [state, setState] = React.useState(mode === "timer" ? "closed" : "ready");
      const [hold, setHold] = React.useState(true);
      const [disabled, setDisabled] = React.useState(false);
      const [itemDisabled, setItemDisabled] = React.useState(false);
      const [actionDisabled, setActionDisabled] = React.useState(false);
      const [inert, setInert] = React.useState(false);
      const [tone, setTone] = React.useState("information");
      const [filter, setFilter] = React.useState("all");
      const [read, setRead] = React.useState([] as string[]);
      const [events, setEvents] = React.useState([] as string[]);
      const record = (event: string) => setEvents((previous: string[]) => [...previous, event]);
      const checkbox = (label: string, checked: boolean, setter: (value: boolean) => void) => element("label", { key: label }, element("input", { type: "checkbox", checked, onChange: (event: Event) => setter((event.target as HTMLInputElement).checked) }), label);
      const items = state === "empty" ? [] : [
        { id: "mention", title: "Supplied mention", category: "mentions", read: read.includes("mention"), disabled: itemDisabled, action: { label: "Reply locally", disabled: actionDisabled, onAction: () => record("action:mention") } },
        ...(state === "mentions-only" ? [] : [{ id: "system", title: "Supplied system", category: "system", read: read.includes("system"), tone: "success" }]),
      ];
      return element("section", { "aria-label": "Notification lifecycle fixture" },
        element("select", { "aria-label": "Supplied notification state", value: state, onChange: (event: Event) => setState((event.target as HTMLSelectElement).value) },
          ...["ready", "closed", "hidden", "empty", "mentions-only"].map(value => element("option", { key: value }, value))),
        element("select", { "aria-label": "Supplied tone", value: tone, onChange: (event: Event) => setTone((event.target as HTMLSelectElement).value) },
          ...["information", "success", "error"].map(value => element("option", { key: value }, value))),
        checkbox("Hold supplied state", hold, setHold), checkbox("Global disabled", disabled, setDisabled),
        checkbox("Item disabled", itemDisabled, setItemDisabled), checkbox("Action disabled", actionDisabled, setActionDisabled),
        checkbox("Host inert", inert, setInert),
        element("button", { onClick: () => setEvents([]) }, "Clear requests"),
        element("output", { "aria-label": "Recorded requests" }, JSON.stringify(events)),
        mode === "center" ? element(NotificationCenter, {
          items, disabled, ...(controlled ? { filter } : {}),
          onFilterChange: (next: string) => { record(`filter:${next}`); if (!hold) setFilter(next); },
          onSelect: (item: { id: string }) => record(`select:${item.id}`),
          onMarkRead: (id: string) => { record(`read:${id}`); if (!hold) setRead((previous: string[]) => [...new Set([...previous, id])]); },
        }) : element(NotificationViewport, { label: "Persistent notification viewport" },
          element(Notification, { title: "Supplied notice", description: `Supplied ${tone} message`, tone,
            open: state !== "closed" && state !== "empty", hidden: state === "hidden", inert,
            duration: mode === "timer" ? 900 : undefined,
            onDismiss: () => { record("dismiss"); if (!hold) setState("closed"); },
          }, element(NotificationAction, { disabled: actionDisabled, onClick: () => record("action") }, "Local action"))));
    }
    const root = document.createElement("div");
    document.querySelector(".harso-kit")!.prepend(root);
    createRoot(root).render(element(Consumer));
  }, { reactUrl, domUrl, producerUrl, mode, controlled });
  return page.getByRole("region", { name: "Notification lifecycle fixture", exact: true });
}

async function nativeClick(page: Page, target: Locator) {
  await target.scrollIntoViewIfNeeded();
  const box = await target.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);
}

test("NOTICE persistent hide/show supplied tones action-disabled inert and dismissal recovery", async ({ page }) => {
  const host = await mountedNotification(page, "notice");
  const notice = host.locator(".hk-notification");
  const node = await notice.elementHandle();
  const viewport = host.locator(".hk-notification-viewport");
  const viewportNode = await viewport.elementHandle();
  const state = host.getByLabel("Supplied notification state");
  const requests = host.getByLabel("Recorded requests");
  const action = host.getByRole("button", { name: "Local action" });
  for (const tone of ["success", "error", "information"]) {
    await host.getByLabel("Supplied tone").selectOption(tone);
    await expect(notice).toHaveAttribute("data-tone", tone);
    await expect(notice).toContainText(`Supplied ${tone} message`);
    await expect(notice).toHaveAttribute("role", "status");
  }
  await host.getByLabel("Action disabled", { exact: true }).check();
  await expect(action).toBeDisabled();
  await nativeClick(page, action);
  await expect(requests).toHaveText("[]");
  await host.getByLabel("Action disabled", { exact: true }).uncheck();
  await action.click();
  await expect(requests).toHaveText('["action"]');
  await host.getByRole("button", { name: "Clear requests" }).click();
  await host.getByLabel("Host inert").check();
  await expect(notice).toHaveAttribute("inert", "");
  await nativeClick(page, notice.locator(".hk-notification-action"));
  await expect(requests).toHaveText("[]");
  await host.getByLabel("Host inert").uncheck();
  for (const hiddenState of ["closed", "hidden", "empty"]) {
    await state.selectOption(hiddenState);
    await expect(notice).toBeHidden();
    await expect(notice).toHaveAttribute("aria-hidden", "true");
    await expect(notice).toHaveAttribute("inert", "");
    await expect(viewport.getByRole("status")).toHaveCount(0);
    await state.selectOption("ready");
    await expect(notice).toBeVisible();
    expect(await notice.evaluate((current, original) => current === original, node)).toBe(true);
  }
  await host.getByRole("button", { name: "Dismiss notification" }).click();
  await expect(requests).toHaveText('["dismiss"]');
  await expect(notice).toBeVisible();
  await host.getByLabel("Hold supplied state").uncheck();
  await host.getByRole("button", { name: "Dismiss notification" }).click();
  await expect(notice).toBeHidden();
  await state.selectOption("ready");
  await action.focus();
  await page.keyboard.press("Enter");
  await expect(requests).toHaveText('["dismiss","dismiss","action"]');
  expect(await viewport.evaluate((current, original) => current === original, viewportNode)).toBe(true);
  expect(await notice.evaluate((current, original) => current === original, node)).toBe(true);
});

test("NOTICE real dismissal timer cancels hidden and interaction state then recovers once", async ({ page }) => {
  const host = await mountedNotification(page, "timer");
  const notice = host.locator(".hk-notification");
  const node = await notice.elementHandle();
  const state = host.getByLabel("Supplied notification state");
  const requests = host.getByLabel("Recorded requests");
  await page.mouse.move(0, 0);
  await page.waitForTimeout(1150);
  await expect(requests).toHaveText("[]");
  await state.selectOption("ready");
  await expect(notice).toBeVisible();
  await page.waitForTimeout(200);
  await state.selectOption("hidden");
  await page.waitForTimeout(1150);
  await expect(requests).toHaveText("[]");
  await state.selectOption("ready");
  await notice.hover();
  await page.waitForTimeout(1150);
  await expect(requests).toHaveText("[]");
  await host.getByRole("button", { name: "Local action" }).focus();
  await page.mouse.move(0, 0);
  await page.waitForTimeout(1150);
  await expect(requests).toHaveText("[]");
  await state.selectOption("closed");
  await page.waitForTimeout(1150);
  await expect(requests).toHaveText("[]");
  await state.selectOption("ready");
  await state.focus();
  await expect(requests).toHaveText('["dismiss"]');
  await expect(notice).toBeVisible();
  await page.waitForTimeout(1150);
  await expect(requests).toHaveText('["dismiss"]');
  await state.selectOption("closed");
  await host.getByLabel("Hold supplied state").uncheck();
  await state.selectOption("ready");
  await page.mouse.move(0, 0);
  await state.focus();
  await expect(requests).toHaveText('["dismiss","dismiss"]');
  await expect(notice).toBeHidden();
  await page.waitForTimeout(1150);
  await expect(requests).toHaveText('["dismiss","dismiss"]');
  expect(await notice.evaluate((current, original) => current === original, node)).toBe(true);
});

for (const controlled of [true, false]) {
  test(`CENTER ${controlled ? "controlled" : "local"} disabled requests empty filters and retained recovery`, async ({ page }) => {
    const host = await mountedNotification(page, "center", controlled);
    const center = host.locator(".hk-notification-center");
    const node = await center.elementHandle();
    const requests = host.getByLabel("Recorded requests");
    const mention = center.getByRole("button", { name: /^Supplied mention(?: Unread)?$/ });
    const system = center.getByRole("button", { name: /^Supplied system(?: Unread)?$/ });
    const reply = center.getByRole("button", { name: "Reply locally" });
    const bulk = center.getByRole("button", { name: "Mark all read" });
    await expect(center.locator(".hk-notification-unread")).toHaveCount(2);
    await host.getByLabel("Global disabled").check();
    for (const target of [mention, system, reply, bulk, center.getByRole("radio", { name: "System", exact: true })]) {
      await expect(target).toBeDisabled();
      await nativeClick(page, target);
    }
    await expect(requests).toHaveText("[]");
    await expect(center.getByRole("radio", { name: "All", exact: true })).toBeChecked();
    await expect(center.locator(".hk-notification-unread")).toHaveCount(2);
    await host.getByLabel("Global disabled").uncheck();
    await host.getByLabel("Item disabled", { exact: true }).check();
    for (const target of [mention, reply]) {
      await expect(target).toBeDisabled();
      await nativeClick(page, target);
    }
    await expect(requests).toHaveText("[]");
    await bulk.click();
    await expect(requests).toHaveText('["read:system"]');
    await expect(center.locator(".hk-notification-unread")).toHaveCount(2);
    await system.click();
    await expect(requests).toHaveText('["read:system","select:system","read:system"]');
    await host.getByRole("button", { name: "Clear requests" }).click();
    await host.getByLabel("Item disabled", { exact: true }).uncheck();
    await host.getByLabel("Action disabled", { exact: true }).check();
    await expect(reply).toBeDisabled();
    await nativeClick(page, reply);
    await expect(requests).toHaveText("[]");
    await mention.click();
    await expect(requests).toHaveText('["select:mention","read:mention"]');
    await host.getByRole("button", { name: "Clear requests" }).click();
    await host.getByLabel("Action disabled", { exact: true }).uncheck();
    await reply.click();
    await expect(requests).toHaveText('["action:mention","read:mention"]');
    await host.getByLabel("Hold supplied state").uncheck();
    await bulk.click();
    await expect(center.locator(".hk-notification-unread")).toHaveCount(0);
    await expect(bulk).toBeDisabled();
    await center.getByRole("radio", { name: "System", exact: true }).click();
    await expect(center.getByRole("radio", { name: "System", exact: true })).toBeChecked();
    await expect(requests).toContainText('"filter:system"');
    await expect(system).toBeVisible();
    await expect(mention).toHaveCount(0);
    const state = host.getByLabel("Supplied notification state");
    await state.selectOption("mentions-only");
    await expect(center.getByRole("status")).toHaveText("No notifications in this filter.");
    await state.selectOption("empty");
    await expect(center.getByRole("status")).toHaveText("You’re all caught up.");
    await expect(center.locator(".hk-notification-center-row")).toHaveCount(0);
    await expect(bulk).toBeDisabled();
    await state.selectOption("ready");
    await expect(center.getByRole("status")).toHaveCount(0);
    await expect(center.getByRole("radio", { name: "System", exact: true })).toBeChecked();
    await expect(system).toHaveAttribute("data-read", "true");
    await center.getByRole("radio", { name: "All", exact: true }).click();
    await expect(mention).toHaveAttribute("data-read", "true");
    await expect(reply).toBeEnabled();
    expect(await center.evaluate((current, original) => current === original, node)).toBe(true);
  });
}
