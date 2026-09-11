import { expect, test, type Page } from "@playwright/test";

async function mountExample(page: Page, component: "Attachments" | "Commit" | "CommitCopy") {
  await page.goto("/#vercel:commit");
  const source = await (await page.request.get("/src/boundaryless/main.tsx")).text();
  const reactUrl = source.match(/from "([^"]+\/react\.js\?[^"]+)"/)?.[1];
  const domUrl = source.match(/from "([^"]+\/react-dom_client\.js\?[^"]+)"/)?.[1];
  const producerUrl = source.match(/import "([^"]+\/packages\/ui\/src\/boundaryless\/)primitives\.css(?:\?[^"]*)?"/)?.[1];
  expect(reactUrl).toBeTruthy(); expect(domUrl).toBeTruthy(); expect(producerUrl).toBeTruthy();
  await page.evaluate(async ({ reactUrl, domUrl, producerUrl, component }) => {
    const React = (await import(reactUrl!)).default;
    const { createRoot } = (await import(domUrl!)).default;
    const element = React.createElement;
    const exports = component === "CommitCopy" ? await import(`${producerUrl}commit.tsx`) : await import(`/src/boundaryless/${component === "Commit" ? "commit" : "attachments"}-examples.tsx`);
    function Consumer() {
      const [state, setState] = React.useState("default");
      const [hash, setHash] = React.useState("");
      return element("section", { "aria-label": "Developer lifecycle consumer" },
        element("select", { "aria-label": "Mounted state", value: state, onChange: (event: Event) => setState((event.target as HTMLSelectElement).value) },
          ...["default", "disabled", "error"].map(value => element("option", { key: value }, value))),
        component === "CommitCopy" ? element(React.Fragment, null,
          element("input", { "aria-label": "Supplied hash", value: hash, onChange: (event: Event) => setHash((event.target as HTMLInputElement).value) }),
          element(exports.Commit, { disabled: state === "disabled" }, element(exports.CommitCopyButton, { hash }))) :
          element(exports.CommitExample ?? exports.AttachmentsExample, { component, state }));
    }
    const root = document.createElement("div");
    document.querySelector(".harso-kit")!.prepend(root);
    createRoot(root).render(element(Consumer));
  }, { reactUrl, domUrl, producerUrl, component });
  return page.getByRole("region", { name: "Developer lifecycle consumer" });
}

test("attachments mounted disabled removal preserves items and re-enables", async ({ page }) => {
  const fixture = await mountExample(page, "Attachments");
  const attachment = fixture.locator('[data-attachment-id="1"]');
  const original = await attachment.elementHandle();
  const remove = attachment.getByRole("button", { name: "Remove", exact: true });
  await fixture.getByLabel("Mounted state").selectOption("disabled");
  await expect(remove).toBeDisabled();
  await remove.click({ force: true });
  await expect(fixture.locator(".hk-attachment")).toHaveCount(2);
  await fixture.getByLabel("Mounted state").selectOption("default");
  expect(await attachment.evaluate((element, previous) => element === previous, original)).toBe(true);
  await remove.click();
  await expect(fixture.locator(".hk-attachment")).toHaveCount(1);
  await expect(fixture.locator('[data-attachment-id="2"]')).toContainText("notes.md");
  await fixture.getByRole("button", { name: "Remove", exact: true }).click();
  await expect(fixture.locator(".hk-attachment")).toHaveCount(0);
  await expect(fixture.locator(".hk-attachment-empty")).toBeVisible();
});

test("attachments mounted error retry admits supplied uploading recovery", async ({ page }) => {
  const fixture = await mountExample(page, "Attachments");
  await fixture.getByLabel("Mounted state").selectOption("error");
  const attachment = fixture.locator('[data-attachment-id="2"]');
  const original = await attachment.elementHandle();
  await expect(attachment.getByRole("alert")).toHaveText("Upload failed");
  await attachment.getByRole("button", { name: "Retry", exact: true }).click();
  await expect(attachment).toHaveClass(/hk-attachment-uploading/);
  await expect(attachment.getByRole("alert")).toHaveCount(0);
  await expect(attachment.getByRole("progressbar", { name: "Uploading notes.md" })).toHaveAttribute("aria-valuenow", "0");
  await expect(attachment.getByRole("button", { name: "Retry", exact: true })).toHaveCount(0);
  expect(await attachment.evaluate((element, previous) => element === previous, original)).toBe(true);
});

test("commit mounted disabled empty metadata and replacement recovery retain disclosure", async ({ page }) => {
  await page.addInitScript(() => {
    Object.assign(window, { lifecycleWrites: [] });
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async (text: string) => { (window as unknown as { lifecycleWrites: string[] }).lifecycleWrites.push(text); } } });
  });
  const fixture = await mountExample(page, "Commit");
  const root = fixture.getByLabel("Example commit", { exact: true });
  const content = root.locator(".hk-commit-content");
  const original = await content.elementHandle();
  const trigger = root.locator(".hk-commit-header");
  const copy = root.getByRole("button", { name: "Copy commit hash", exact: true });
  await trigger.click();
  await fixture.getByLabel("Mounted state").selectOption("disabled");
  for (const button of [trigger, copy]) { await expect(button).toBeDisabled(); await button.click({ force: true }); }
  await expect(content).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { lifecycleWrites: string[] }).lifecycleWrites)).toEqual([]);
  await fixture.getByLabel("No changed files", { exact: true }).check();
  await expect(content.getByText("No changed files supplied.", { exact: true })).toBeVisible();
  await fixture.getByLabel("Unavailable metadata", { exact: true }).check();
  await expect(root).toContainText("Date unavailable");
  await fixture.getByLabel("Mounted state").selectOption("default");
  await fixture.getByLabel("No changed files", { exact: true }).uncheck();
  await expect(content.locator(".hk-commit-file")).toHaveCount(4);
  await expect(content.getByLabel(/count unavailable/)).toHaveCount(8);
  await fixture.getByLabel("Unavailable metadata", { exact: true }).uncheck();
  await expect(root).not.toContainText("Date unavailable");
  await expect(content.getByLabel(/count unavailable/)).toHaveCount(0);
  await fixture.getByRole("button", { name: "Change sample commit", exact: true }).click();
  await copy.click();
  await expect(root.getByRole("status")).toHaveText("Copied");
  expect(await page.evaluate(() => (window as unknown as { lifecycleWrites: string[] }).lifecycleWrites)).toEqual(["c5e73120d4a69b083ef2175a6d98032bf714c60a"]);
  expect(await content.evaluate((element, previous) => element === previous, original)).toBe(true);
  await trigger.click(); await expect(content).toBeHidden();
  await trigger.press("Enter"); await expect(content).toBeVisible();
});

test("commit copy empty supplied text pending rejection and replacement recovery", async ({ page }) => {
  await page.addInitScript(() => {
    const probe = { writes: [] as string[], resolve: () => {}, reject: () => {} };
    Object.assign(window, { lifecycleClipboard: probe });
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: (text: string) => {
      probe.writes.push(text);
      return new Promise<void>((resolve, reject) => { probe.resolve = resolve; probe.reject = () => reject(new Error("Denied")); });
    } } });
  });
  const fixture = await mountExample(page, "CommitCopy");
  const copy = fixture.getByRole("button", { name: "Copy commit hash", exact: true });
  const original = await copy.elementHandle();
  await copy.click();
  await expect(copy).toBeDisabled();
  await expect(copy).toHaveAttribute("aria-busy", "true");
  await expect(fixture.getByRole("status")).toHaveText("Copying");
  await copy.click({ force: true });
  expect(await page.evaluate(() => (window as unknown as { lifecycleClipboard: { writes: string[] } }).lifecycleClipboard.writes)).toEqual([""]);
  await page.evaluate(() => (window as unknown as { lifecycleClipboard: { reject: () => void } }).lifecycleClipboard.reject());
  await expect(fixture.getByRole("status")).toHaveText("Copy failed");
  await expect(copy).toBeEnabled();
  await expect(copy).not.toHaveAttribute("aria-busy", "true");
  await fixture.getByLabel("Supplied hash").fill("replacement-hash");
  await expect(fixture.getByRole("status")).toBeEmpty();
  await copy.click();
  await page.evaluate(() => (window as unknown as { lifecycleClipboard: { resolve: () => void } }).lifecycleClipboard.resolve());
  await expect(fixture.getByRole("status")).toHaveText("Copied");
  expect(await copy.evaluate((element, previous) => element === previous, original)).toBe(true);
  expect(await page.evaluate(() => (window as unknown as { lifecycleClipboard: { writes: string[] } }).lifecycleClipboard.writes)).toEqual(["", "replacement-hash"]);
});
