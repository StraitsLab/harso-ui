import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("settings portals, traps focus, closes through each route and resets page", async ({ page }) => {
  await page.goto("/#boardui:settings-modal");
  const trigger = page.getByRole("button", { name: "Open settings", exact: true });
  await page.getByLabel("Initial settings page").selectOption("profile");
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Settings", exact: true });
  await expect(dialog.getByRole("heading", { name: "Profile", exact: true })).toBeVisible();
  expect(await dialog.evaluate(element => !element.closest(".hkl-root"))).toBe(true);
  for (let count = 0; count < 9; count++) {
    await page.keyboard.press("Tab");
    expect(await dialog.evaluate(element => element.contains(document.activeElement))).toBe(true);
  }
  await dialog.getByRole("button", { name: "Tools", exact: true }).click();
  await expect(dialog.getByText("No connected tools in this preview.")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await trigger.click();
  await expect(dialog.getByRole("heading", { name: "Profile", exact: true })).toBeVisible();
  await page.locator(".hk-settings-overlay").click({ position: { x: 2, y: 2 } });
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await trigger.click();
  await dialog.getByRole("button", { name: "Close settings" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("status", { name: "Close requests", exact: true })).toHaveText("3");
});

test("host refusal keeps dialog active and local values stay host-owned", async ({ page }) => {
  await page.goto("/#boardui:settings-modal");
  await page.getByLabel("Hold close requests").check();
  await page.getByRole("button", { name: "Open settings", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Profile", exact: true }).click();
  await dialog.getByLabel("Workspace name").fill("Research studio");
  await page.keyboard.press("Escape");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel("Workspace name")).toHaveValue("Research studio");
  await expect(page.locator('[aria-label="Close requests"]')).toHaveText("1");
});

test("portal follows system theme changes while open and image failures fall back", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await page.goto("/#boardui:settings-modal");
  await page.getByLabel("Custom plan artwork").check();
  await page.getByLabel("Broken plan artwork").check();
  await page.getByRole("button", { name: "Open settings", exact: true }).click();
  await expect(page.locator(".hk-settings-portal")).toHaveAttribute("data-mode", "light");
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.locator(".hk-settings-portal")).toHaveAttribute("data-mode", "dark");
  await expect(page.getByRole("img", { name: "Plan artwork", exact: true })).toHaveAttribute("data-artwork", "native");
  await expect(page.locator('.hk-settings-plan-art span').first()).toHaveCSS("animation-name", "none");
});

test("native dialog-form submission remains a host-controlled close request", async ({ page }) => {
  await page.goto("/#boardui:settings-modal");
  await page.getByLabel("Hold close requests").check();
  await page.getByRole("button", { name: "Open settings", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Settings", exact: true });
  await dialog.evaluate(element => {
    const form = document.createElement("form");
    form.method = "dialog";
    const submit = document.createElement("button");
    submit.type = "submit";
    submit.textContent = "Native done";
    form.append(submit);
    element.append(form);
  });
  await dialog.getByRole("button", { name: "Native done" }).click();
  await expect(dialog).toBeVisible();
  await expect(page.locator('output[aria-label="Close requests"]')).toHaveText("1");
  await expect(dialog.getByRole("button", { name: "Native done" })).toBeFocused();
});

for (const propagation of ["normal", "form-stop", "document-stop"] as const) test(`dialog submission keeps focused submitter through delayed close delivery and rendering: ${propagation}`, async ({ page }) => {
  await page.goto("/#boardui:settings-modal");
  await page.getByLabel("Hold close requests").check();
  await page.getByRole("button", { name: "Open settings", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Settings", exact: true });
  await dialog.evaluate((element, propagation) => {
    // Reproduce the native closed interval independent of browser scheduling.
    element.addEventListener("close", event => {
      element.setAttribute("data-native-close", String(event.isTrusted));
      event.stopImmediatePropagation();
      setTimeout(() => element.dispatchEvent(new Event("close")), 100);
    }, { capture: true, once: true });
    new MutationObserver(() => {
      if (!(element as HTMLDialogElement).open) element.getBoundingClientRect();
    }).observe(element, { attributes: true, attributeFilter: ["open"] });
    const form = document.createElement("form");
    form.method = "dialog";
    const submit = document.createElement("button");
    submit.type = "submit";
    submit.textContent = "Delayed native done";
    if (propagation === "form-stop") form.addEventListener("submit", event => event.stopPropagation());
    if (propagation === "document-stop") document.addEventListener("submit", event => event.stopPropagation(), { once: true });
    form.append(submit);
    element.append(form);
  }, propagation);
  const submit = dialog.getByRole("button", { name: "Delayed native done" });
  await submit.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator('output[aria-label="Close requests"]')).toHaveText("1");
  // Cross the injected close delay and a rendering opportunity before asserting.
  await page.evaluate(() => new Promise<void>(resolve => setTimeout(() => requestAnimationFrame(() => resolve()), 150)));
  await expect(dialog).toBeVisible();
  await expect(submit).toBeFocused();
  await expect(dialog).toHaveAttribute("data-native-close", "true");
  await expect(page.locator('output[aria-label="Close requests"]')).toHaveText("1");
});

for (const submitter of ["button", "input"] as const) test(`submitter ${submitter} method override accepts host close and restores origin focus`, async ({ page }) => {
  await page.goto("/#boardui:settings-modal");
  const trigger = page.getByRole("button", { name: "Open settings", exact: true });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Settings", exact: true });
  await dialog.evaluate((element, kind) => {
    const form = document.createElement("form");
    form.method = "get";
    const submit = document.createElement(kind);
    submit.type = "submit";
    submit.formMethod = "dialog";
    if (submit instanceof HTMLInputElement) submit.value = "Override done";
    else submit.textContent = "Override done";
    form.append(submit);
    element.append(form);
  }, submitter);
  await dialog.getByRole("button", { name: "Override done" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(page.locator('output[aria-label="Close requests"]')).toHaveText("1");
});

test("ordinary forms and canceled dialog submits retain their existing native handlers", async ({ page }) => {
  await page.goto("/#boardui:settings-modal");
  await page.getByLabel("Hold close requests").check();
  await page.getByRole("button", { name: "Open settings", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Settings", exact: true });
  for (const [method, override, canceled] of [["get", null, false], ["dialog", "get", false], ["dialog", "", false], ["dialog", null, true]] as const) {
    await dialog.evaluate((element, options) => {
      element.querySelector("form")?.remove();
      const form = document.createElement("form");
      form.method = options.method;
      const submit = document.createElement("button");
      submit.type = "submit";
      submit.textContent = "Host submit";
      if (options.override !== null) submit.setAttribute("formmethod", options.override);
      form.addEventListener("submit", event => {
        element.setAttribute("data-form-handler", "called");
        if (options.canceled) event.preventDefault();
      });
      // Observe cancellation after React, then stop real navigation in this probe only.
      document.addEventListener("submit", event => {
        element.setAttribute("data-submit-prevented", String(event.defaultPrevented));
        event.preventDefault();
      }, { once: true });
      form.append(submit);
      element.append(form);
    }, { method, override, canceled });
    await dialog.getByRole("button", { name: "Host submit" }).click();
    await expect(dialog).toHaveAttribute("data-form-handler", "called");
    await expect(dialog).toHaveAttribute("data-submit-prevented", String(canceled));
    await expect(dialog).toBeVisible();
    await expect(page.locator('output[aria-label="Close requests"]')).toHaveText("0");
  }
});

for (const scenario of ["ancestor-cancel", "document-cancel", "external-portal", "nested-dialog"] as const) {
  test(`settings preserves native submit ownership: ${scenario}`, async ({ page }) => {
    await page.goto("/#boardui:settings-modal");
    await page.getByRole("button", { name: "Open settings", exact: true }).waitFor();
    await page.evaluate(async scenario => {
      // Mount the real component: DOM-only fixtures cannot exercise React portal bubbling.
      const reactPath = "/node_modules/.vite/deps/react.js";
      const clientPath = "/node_modules/.vite/deps/react-dom_client.js";
      const domPath = "/node_modules/.vite/deps/react-dom.js";
      const sourcePath = "/src/misc-surfaces.tsx";
      const reactModule = await import(reactPath);
      const React = reactModule.default ?? reactModule;
      const clientModule = await import(clientPath);
      const { createRoot } = clientModule.default ?? clientModule;
      const domModule = await import(domPath);
      const { createPortal } = domModule.default ?? domModule;
      const { SettingsModal } = await import(sourcePath);
      const e = React.createElement;
      const root = document.createElement("div");
      const external = document.createElement("div");
      const result = document.createElement("output");
      result.id = "submit-ownership-result";
      result.dataset.requests = "0";
      document.body.append(root, external, result);
      const form = e("form", { id: "ownership-form", method: "dialog", onSubmit: () => { result.dataset.formHandler = "called"; } }, e("button", { type: "submit" }, "Ownership done"));
      const child = scenario === "nested-dialog" ? e("dialog", { open: true, "aria-label": "Child dialog" }, form)
        : scenario === "external-portal" ? createPortal(form, external) : form;
      createRoot(root).render(e("section", { onSubmit: (event: Event) => { result.dataset.ancestorHandler = "called"; if (scenario === "ancestor-cancel") event.preventDefault(); } },
        e(SettingsModal, { open: true, title: "Ownership settings", onClose: () => { result.dataset.requests = String(Number(result.dataset.requests) + 1); }, onSubmit: () => { result.dataset.modalHandler = "called"; } }, child)));
    }, scenario);
    const dialog = page.getByRole("dialog", { name: "Ownership settings", exact: true });
    await expect(dialog).toBeVisible();
    await page.evaluate(scenario => {
      const result = document.querySelector<HTMLOutputElement>("#submit-ownership-result")!;
      // Register after mount too: cancellation must not depend on listener registration order.
      document.addEventListener("submit", event => {
        if (scenario === "document-cancel") event.preventDefault();
        result.dataset.prevented = String(event.defaultPrevented);
      }, { once: true });
      const form = document.querySelector<HTMLFormElement>("#ownership-form")!;
      form.requestSubmit(form.querySelector("button")!);
    }, scenario);
    const result = page.locator("#submit-ownership-result");
    await expect(result).toHaveAttribute("data-form-handler", "called");
    await expect(result).toHaveAttribute("data-modal-handler", "called");
    await expect(result).toHaveAttribute("data-ancestor-handler", "called");
    await expect(result).toHaveAttribute("data-prevented", String(scenario.endsWith("cancel")));
    if (scenario === "nested-dialog") {
      // The child must perform its native default; pre-existing outer onClose bubbling is unchanged.
      await expect(page.locator('dialog[aria-label="Child dialog"]')).not.toHaveAttribute("open");
    } else {
      await expect(result).toHaveAttribute("data-requests", "0");
    }
    await expect(dialog).toHaveAttribute("open");
  });
}

for (const owner of ["window", "form", "dialog", "document"] as const) test(`native lifecycle honors late cancellation or propagation: ${owner}`, async ({ page }) => {
  await page.goto("/#boardui:settings-modal");
  await page.getByLabel("Hold close requests").check();
  await page.getByRole("button", { name: "Open settings", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Settings", exact: true });
  await dialog.evaluate((element, owner) => {
    const form = document.createElement("form"); form.method = "dialog";
    const button = document.createElement("button"); button.textContent = "Propagation done";
    form.append(button); element.append(form);
    const listener = (event: Event) => { if (owner === "window") event.preventDefault(); else event.stopPropagation(); };
    (owner === "window" ? window : owner === "document" ? document : owner === "dialog" ? element : form).addEventListener("submit", listener, { once: true });
    element.addEventListener("close", event => element.setAttribute("data-native-close", String(event.isTrusted)), { capture: true });
  }, owner);
  const button = dialog.getByRole("button", { name: "Propagation done" });
  await button.click();
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  await expect(dialog).toBeVisible();
  await expect(button).toBeFocused();
  await expect(page.locator('output[aria-label="Close requests"]')).toHaveText(owner === "window" ? "0" : "1");
  if (owner === "window") await expect(dialog).not.toHaveAttribute("data-native-close");
  else await expect(dialog).toHaveAttribute("data-native-close", "true");
});

for (const outcome of ["refuse", "no-callback", "move", "interval-move", "disable", "remove", "unmount", "interval-unmount", "accept"] as const) test(`native lifecycle focus target guard: ${outcome}`, async ({ page }) => {
  await page.goto("/#boardui:settings-modal");
  await page.getByRole("button", { name: "Open settings", exact: true }).waitFor();
  await page.evaluate(async outcome => {
    const rp = "/node_modules/.vite/deps/react.js", cp = "/node_modules/.vite/deps/react-dom_client.js", sp = "/src/misc-surfaces.tsx";
    const rm = await import(rp), cm = await import(cp), { SettingsModal } = await import(sp);
    const React = rm.default ?? rm, { createRoot } = cm.default ?? cm, e = React.createElement;
    const host = document.createElement("div"), origin = document.createElement("button"), result = document.createElement("output");
    origin.id = "guard-origin"; origin.textContent = "Guard origin"; result.id = "guard-result"; result.dataset.requests = "0";
    document.body.append(origin, host, result); origin.focus();
    const root = createRoot(host);
    host.id = "guard-host";
    host.addEventListener("guard-unmount", () => root.unmount());
    const close = () => {
      result.dataset.requests = String(Number(result.dataset.requests) + 1);
      const target = document.querySelector<HTMLButtonElement>("#guard-submit")!;
      if (outcome === "move") document.querySelector<HTMLButtonElement>("#guard-other")!.focus();
      if (outcome === "disable") target.disabled = true;
      if (outcome === "remove") target.remove();
      if (outcome === "unmount") root.unmount();
      if (outcome === "accept") root.render(null);
    };
    root.render(e(SettingsModal, { open: true, title: "Guard settings", onClose: outcome === "no-callback" ? undefined : close },
      e("form", { method: "dialog", id: "guard-form", onSubmit: (event: Event) => event.stopPropagation() }, e("button", { id: "guard-submit", type: "submit" }, "Guard submit")), e("button", { id: "guard-other" }, "Other control")));
  }, outcome);
  const dialog = page.getByRole("dialog", { name: "Guard settings" });
  await expect(dialog).toBeVisible();
  // Close/render interval is forced before the native queued close is delivered.
  await page.locator("#guard-submit").focus();
  await page.evaluate(outcome => {
    const form = document.querySelector<HTMLFormElement>("#guard-form")!;
    form.requestSubmit(document.querySelector<HTMLButtonElement>("#guard-submit")!);
    form.closest("dialog")!.getBoundingClientRect();
    if (outcome === "interval-move") {
      const other = document.createElement("button"); other.id = "interval-other"; other.textContent = "Unrelated control";
      document.body.append(other); other.focus();
    }
    if (outcome === "interval-unmount") document.querySelector("#guard-host")!.dispatchEvent(new Event("guard-unmount"));
  }, outcome);
  await expect(page.locator("#guard-result")).toHaveAttribute("data-requests", outcome === "no-callback" || outcome === "interval-unmount" ? "0" : "1");
  if (outcome === "accept" || outcome === "unmount" || outcome === "interval-unmount") {
    await expect(dialog).toHaveCount(0); await expect(page.locator("#guard-origin")).toBeFocused();
  } else {
    await expect(dialog).toBeVisible();
    if (outcome === "refuse" || outcome === "no-callback") await expect(page.locator("#guard-submit")).toBeFocused();
    if (outcome === "move") await expect(page.locator("#guard-other")).toBeFocused();
    if (outcome === "interval-move") await expect(page.locator("#interval-other")).toBeFocused();
    if (outcome === "disable") await expect(page.locator("#guard-submit")).not.toBeFocused();
    if (outcome === "remove") await expect(page.locator("#guard-submit")).toHaveCount(0);
  }
});

for (const kind of ["button", "input"] as const) test(`native method matrix ${kind} keeps form defaults and overrides`, async ({ page }) => {
  const requests: string[] = [];
  await page.route("**/__settings_submit**", route => { requests.push(route.request().method()); return route.fulfill({ status: 200, contentType: "text/html", body: "submitted" }); });
  await page.goto("/#boardui:settings-modal");
  await page.getByLabel("Hold close requests").check();
  await page.getByRole("button", { name: "Open settings", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Settings", exact: true });
  await page.evaluate(() => { const iframe = document.createElement("iframe"); iframe.name = "settings-target"; document.body.append(iframe); });
  let closes = 0;
  for (const [method, override, expected] of [["get", null, "GET"], ["post", null, "POST"], ["dialog", "get", "GET"], ["dialog", "post", "POST"], ["dialog", "", "GET"], ["dialog", "invalid", "GET"], ["dialog", null, "dialog"], ["get", "dialog", "dialog"], ["dialog", "DIALOG", "dialog"]] as const) {
    const previous = requests.length;
    await dialog.evaluate((element, options) => {
      element.querySelector("#matrix-form")?.remove();
      const form = document.createElement("form"); form.id = "matrix-form"; form.method = options.method; form.target = "settings-target"; form.action = "/__settings_submit";
      const submit = document.createElement(options.kind); submit.type = "submit"; submit.id = "matrix-submit";
      if (submit instanceof HTMLInputElement) submit.value = "Matrix submit"; else submit.textContent = "Matrix submit";
      if (options.override !== null) submit.setAttribute("formmethod", options.override);
      form.append(submit); element.append(form);
      window.addEventListener("submit", event => element.setAttribute("data-matrix-prevented", String(event.defaultPrevented)), { once: true });
    }, { kind, method, override });
    await page.locator("#matrix-submit").click();
    if (expected === "dialog") {
      closes++;
      await expect(page.locator('output[aria-label="Close requests"]')).toHaveText(String(closes));
      await expect(page.locator("#matrix-submit")).toBeFocused();
    } else {
      await expect.poll(() => requests.length).toBe(previous + 1);
      expect(requests.at(-1)).toBe(expected);
    }
    await expect(dialog).toHaveAttribute("open");
    await expect(dialog).toHaveAttribute("data-matrix-prevented", "false");
    await expect(page.locator('output[aria-label="Close requests"]')).toHaveText(String(closes));
  }
});

for (const width of [1512, 390]) for (const mode of ["light", "dark"] as const) for (const palette of ["clean", "cozy"]) {
  test(`settings ${width} ${mode} ${palette}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1040 });
    await page.emulateMedia({ colorScheme: mode, reducedMotion: "reduce" });
    await page.goto("/#boardui:settings-modal");
    await page.getByLabel("Palette", { exact: true }).selectOption(palette);
    await page.getByRole("button", { name: "Open settings", exact: true }).click();
    const dialog = page.getByRole("dialog");
    for (const name of ["General", "Profile", "Tools", "Storage"]) {
      await dialog.getByRole("button", { name, exact: true }).click();
      await expect(dialog.getByRole("heading", { name, exact: true })).toBeVisible();
      expect((await new AxeBuilder({ page }).include(".hk-settings-portal").analyze()).violations).toEqual([]);
    }
    await dialog.getByRole("button", { name: "General", exact: true }).click();
    expect(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    await dialog.screenshot({ path: test.info().outputPath("settings.png") });
  });
}
