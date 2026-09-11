import { expect, test } from "@playwright/test";

for (const [family, label, root] of [
  ["artifact", "Artifact sample", ".hk-artifact"],
  ["context", "Context sample", ".hk-context"],
  ["code-block", "Code sample", ".hk-code-block"],
  ["file-tree", "Hierarchy sample", ".hk-file-tree"],
] as const) {
  test(`${family}: mounted empty loading error replacement recovery`, async ({ page }) => {
    await page.goto(`/#vercel:${family}`);
    const live = page.getByTestId("live-example");
    const sample = live.getByRole("combobox", { name: label, exact: true });
    await expect(sample).toBeVisible();
    if (family === "context") await live.getByRole("button", { name: "25% context used", exact: true }).click();
    const mounted = await live.locator(root).first().elementHandle();
    for (const value of ["empty", "loading", "error", "replacement", "ready"]) {
      await sample.selectOption(value);
      await expect(live.getByRole(value === "error" ? "alert" : "status").filter({ hasText: `${label}: ${value}` })).toBeVisible();
      expect(await mounted!.evaluate(node => node.isConnected)).toBe(true);
      if (value === "loading") await expect(live.locator(root).first()).toHaveAttribute("aria-busy", "true");
      const unavailable = ["empty", "loading", "error"].includes(value);
      if (family === "artifact") {
        await expect(live.locator(".hk-artifact-content")).toContainText(value === "empty" ? "No artifact supplied." : value === "loading" ? "Waiting for host artifact." : value === "error" ? "Host could not supply the artifact." : value === "replacement" ? "Replacement brief supplied by host." : "The best workspace leaves room for the work.");
        if (value !== "ready") await expect(live.locator(".hk-artifact-content")).not.toContainText("What stood out");
      } else if (family === "context") {
        await expect(live.locator(".hk-context-trigger")).toHaveAttribute("aria-label", unavailable ? "Context usage unavailable" : value === "replacement" ? "50% context used" : "25% context used");
        await expect(live.locator(".hk-context-content")).toBeVisible();
        await expect(live.locator(".hk-context-usage").first()).toContainText(unavailable ? "Unavailable" : value === "replacement" ? "55.0K" : "23.0K");
        if (unavailable) await expect(live.locator(".hk-context-footer")).toBeEmpty();
      } else if (family === "code-block") {
        if (unavailable) await expect(live.locator(".hk-code-content code")).toHaveText("");
        else await expect(live.locator(".hk-code-content code")).toContainText(value === "replacement" ? "Host supplied replacement" : "Work complete");
        if (value === "loading" || value === "error") await expect(live.getByRole("button", { name: "Copy code" })).toBeDisabled();
      } else {
        await expect(live.locator(".hk-file-tree-file")).toHaveCount(unavailable ? 0 : value === "replacement" ? 1 : 4);
        if (value === "replacement") await expect(live.getByRole("button", { name: "replacement.md", exact: true })).toBeVisible();
      }
    }
    await sample.selectOption("disabled");
    const action = family === "artifact" ? "Close artifact" : family === "context" ? "25% context used" : family === "code-block" ? "Copy code" : "conversation.tsx";
    await expect(live.getByRole("button", { name: action, exact: true })).toBeDisabled();
    await sample.selectOption("ready");
    await expect(live.getByRole("button", { name: action, exact: true })).toBeEnabled();
    expect(await mounted!.evaluate(node => node.isConnected)).toBe(true);
  });
}

test("terminal: mounted host refusal empty streaming error replacement recovery", async ({ page }) => {
  await page.goto("/#vercel:terminal");
  const live = page.getByTestId("live-example");
  const mounted = await live.getByRole("log").elementHandle();
  await live.getByLabel("Hold clear requests").check();
  await live.getByRole("button", { name: "Clear", exact: true }).click();
  await expect(live.getByRole("log")).toContainText("build complete");
  await expect(live.getByLabel("Terminal request")).toContainText("Host declined");
  await live.getByLabel("Hold clear requests").uncheck();
  await live.getByRole("button", { name: "Clear", exact: true }).click();
  await expect(live.getByRole("log")).toBeEmpty();
  await live.getByLabel("Streaming", { exact: true }).check();
  await expect(live.getByRole("log")).toHaveAttribute("aria-busy", "true");
  await live.getByLabel("Streaming", { exact: true }).uncheck();
  await live.getByRole("button", { name: "Supply error output" }).click();
  await expect(live.getByRole("log")).toHaveText("error: supplied build failed");
  await live.getByRole("button", { name: "Replace output" }).click();
  await expect(live.getByRole("log")).toHaveText("replacement build complete");
  await live.getByRole("button", { name: "Append output" }).click();
  await expect(live.getByRole("log")).toContainText("new output");
  expect(await mounted!.evaluate(node => node.isConnected)).toBe(true);
  await live.getByLabel("Disable terminal controls").check();
  await expect(live.getByRole("button", { name: "Clear", exact: true })).toBeDisabled();
  await expect(live.getByRole("button", { name: "Copy terminal output" })).toBeDisabled();
  await live.getByLabel("Disable terminal controls").uncheck();
  await expect(live.getByRole("button", { name: "Clear", exact: true })).toBeEnabled();
  expect(await mounted!.evaluate(node => node.isConnected)).toBe(true);
});

test("mounted disable controls are supplied by each content host", async ({ page }) => {
  for (const [family, label] of [["artifact", "Artifact sample"], ["context", "Context sample"], ["code-block", "Code sample"], ["file-tree", "Hierarchy sample"]]) {
    await page.goto(`/#vercel:${family}`);
    const sample = page.getByTestId("live-example").getByRole("combobox", { name: label, exact: true });
    await expect(sample).toBeVisible();
    expect.soft(await sample.evaluate(node => Array.from((node as HTMLSelectElement).options).map(option => option.value)), family).toContain("disabled");
  }
  await page.goto("/#vercel:terminal");
  expect.soft(await page.getByTestId("live-example").getByLabel("Disable terminal controls").count()).toBe(1);
});

test("tool: supplied loading error denial replacement recovery and disclosure refusal", async ({ page }) => {
  await page.goto("/#vercel:tool");
  const live = page.getByTestId("live-example");
  const status = live.getByLabel("Tool status");
  await live.getByPlaceholder("A thought to keep…").fill("Retained across supplied states");
  for (const [value, label] of [["input-streaming", "Pending"], ["output-error", "Error"], ["output-denied", "Denied"], ["output-available", "Completed"]]) {
    await status.selectOption(value);
    await expect(live.locator(".hk-tool-heading")).toContainText(label);
    await expect(live.getByPlaceholder("A thought to keep…")).toHaveValue("Retained across supplied states");
    if (value === "output-error") await expect(live.getByText("The host could not reach the source.", { exact: false })).toBeVisible();
  }
  await expect(live.getByText("3 useful sources", { exact: false })).toBeVisible();
  await live.getByRole("button", { name: "Append sample update" }).click();
  await expect(live.getByText("4 useful sources", { exact: false })).toBeVisible();
  await status.selectOption("input-available");
  await expect(live.getByText("4 useful sources", { exact: false })).toHaveCount(0);
  await live.getByLabel("Hold host state").check();
  const trigger = live.locator(".hk-tool button[aria-expanded]");
  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await status.selectOption("approval-requested");
  const root = live.locator(".hk-tool");
  const notes = live.getByPlaceholder("A thought to keep…");
  const mountedRoot = await root.elementHandle();
  const mountedNotes = await notes.elementHandle();
  const request = live.getByLabel("Activity request");
  await expect(request).toHaveText("Disclosure close requested.");
  await live.getByLabel("Hold host state").uncheck();
  await live.getByLabel("Disable tool controls").check();
  await expect(trigger).toBeDisabled();
  await expect(notes).toBeDisabled();
  const review = live.getByRole("button", { name: "Review permission" });
  await expect(review).toBeDisabled();
  await trigger.click({ force: true });
  await review.click({ force: true });
  await expect(request).toHaveText("Disclosure close requested.");
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(status).toHaveValue("approval-requested");
  await expect(notes).toHaveValue("Retained across supplied states");
  expect(await root.evaluate((current, original) => current === original, mountedRoot)).toBe(true);
  expect(await notes.evaluate((current, original) => current === original, mountedNotes)).toBe(true);
  await live.getByLabel("Disable tool controls").uncheck();
  await expect(trigger).toBeEnabled();
  await expect(notes).toBeEnabled();
  await expect(review).toBeEnabled();
  await expect(status).toHaveValue("approval-requested");
  await expect(notes).toHaveValue("Retained across supplied states");
  expect(await root.evaluate((current, original) => current === original, mountedRoot)).toBe(true);
  expect(await notes.evaluate((current, original) => current === original, mountedNotes)).toBe(true);
  await review.click();
  await expect(request).toHaveText("Review requested. Nothing approved or executed.");
  await notes.fill("Edited after re-enable");
  await expect(notes).toHaveValue("Edited after re-enable");
  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await trigger.click();
  await expect(notes).toHaveValue("Edited after re-enable");
});

test("artifact and context: host declines close/disclosure then accepts", async ({ page }) => {
  await page.goto("/#vercel:artifact");
  const live = page.getByTestId("live-example");
  await live.getByLabel("Hold host state").check();
  await live.getByRole("button", { name: "Close artifact", exact: true }).click();
  await expect(live.locator(".hk-artifact")).toBeVisible();
  await expect(live.getByLabel("Activity request")).toHaveText("Close requested.");
  await live.getByLabel("Hold host state").uncheck();
  await live.getByRole("button", { name: "Close artifact", exact: true }).click();
  await expect(live.locator(".hk-artifact")).toHaveCount(0);
  await live.getByRole("button", { name: "Reopen sample artifact" }).click();
  await expect(live.locator(".hk-artifact")).toBeVisible();
  await page.goto("/#vercel:context");
  await live.getByLabel("Hold context requests").check();
  const trigger = live.locator(".hk-context-trigger");
  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(live.getByLabel("Context request", { exact: true })).toHaveText("Host declined context disclosure.");
  await live.getByLabel("Hold context requests").uncheck();
  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
});

test("code and hierarchy: host refuses selection; replacement resets stale selection", async ({ page }) => {
  await page.goto("/#vercel:code-block");
  const live = page.getByTestId("live-example");
  await live.getByLabel("Hold language requests").check();
  await live.getByRole("button", { name: "Code language" }).click();
  await live.getByRole("option", { name: "JavaScript", exact: true }).click();
  await expect(live.locator(".hk-code-block")).toHaveAttribute("data-language", "typescript");
  await live.getByLabel("Hold language requests").uncheck();
  await live.getByRole("button", { name: "Code language" }).click();
  await live.getByRole("option", { name: "JavaScript", exact: true }).click();
  await expect(live.locator(".hk-code-block")).toHaveAttribute("data-language", "javascript");
  await page.goto("/#vercel:file-tree");
  const file = live.getByRole("button", { name: "conversation.tsx", exact: true });
  await live.getByLabel("Hold hierarchy updates").check();
  await file.click();
  await expect(file).not.toHaveAttribute("aria-current");
  const folder = live.locator(".hk-file-tree-folder .hk-file-tree-row button[aria-expanded]").first();
  await folder.click();
  await expect(folder).toHaveAttribute("aria-expanded", "true");
  await live.getByLabel("Hold hierarchy updates").uncheck();
  await file.click();
  await expect(file).toHaveAttribute("aria-current", "true");
  await live.getByRole("combobox", { name: "Hierarchy sample", exact: true }).selectOption("replacement");
  await expect(file).toHaveCount(0);
  await live.getByRole("combobox", { name: "Hierarchy sample", exact: true }).selectOption("ready");
  await expect(file).not.toHaveAttribute("aria-current");
});

test("code and terminal: clipboard denial recovers without executing content", async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async () => { throw new Error("Host denied clipboard"); } } }));
  for (const [family, name] of [["code-block", "Copy code"], ["terminal", "Copy terminal output"]]) {
    await page.goto(`/#vercel:${family}`);
    await page.evaluate(() => Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async () => { throw new Error("Host denied clipboard"); } } }));
    const live = page.getByTestId("live-example");
    await live.getByRole("button", { name, exact: true }).click();
    await expect(live.getByRole("status", { exact: true }).filter({ hasText: "Copy failed" })).toBeVisible();
    await page.evaluate(() => Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async (text: string) => { document.documentElement.dataset.copied = text; } } }));
    await live.getByRole("button", { name, exact: true }).click();
    await expect(live.getByRole("status", { exact: true }).filter({ hasText: "Copied" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.dataset.copied)).toContain(family === "code-block" ? "Work complete" : "build complete");
  }
});

test("queue: existing host refusal disabled empty and recovery", async ({ page }) => {
  await page.goto("/#vercel:queue");
  const live = page.getByTestId("live-example");
  await live.getByLabel("Hold queue changes").check();
  await live.getByRole("button", { name: "Remove Review the brief", exact: true }).click();
  await expect(live.locator(".hk-queue-item")).toHaveCount(2);
  await expect(live.getByLabel("Queue result")).toContainText("host retained the queue");
  await live.getByLabel("Hold queue changes").uncheck();
  await live.getByLabel("Disable queue", { exact: true }).check();
  await expect(live.getByRole("button", { name: "Remove Review the brief", exact: true })).toBeDisabled();
  await live.getByLabel("Disable queue", { exact: true }).uncheck();
  await live.getByRole("button", { name: "Remove Review the brief", exact: true }).click();
  await live.getByRole("button", { name: "Remove Gather references", exact: true }).click();
  await expect(live.getByText("Nothing queued.", { exact: false })).toBeVisible();
  await live.getByRole("button", { name: "Reset queue", exact: true }).click();
  await expect(live.locator(".hk-queue-item")).toHaveCount(2);
});
