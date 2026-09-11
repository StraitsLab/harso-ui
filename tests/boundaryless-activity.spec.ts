import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("tool activity stays compact through host updates, refusal and visible decisions", async ({ page }) => {
  await page.goto("/#vercel:tool");
  const trigger = page.locator(".hk-tool .hk-work-trigger");
  await page.getByLabel("Working notes").fill("Keep my place");
  await trigger.focus();
  await page.keyboard.press("Space");
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await page.getByLabel("Tool status").selectOption("approval-requested");
  await expect(trigger).toContainText("Awaiting approval");
  await expect(page.getByRole("button", { name: "Review permission" })).toBeVisible();
  await page.getByRole("button", { name: "Review permission" }).click();
  await expect(page.getByLabel("Activity request")).toContainText("Nothing approved or executed");
  await page.getByRole("button", { name: "Append sample update" }).click();
  await page.getByLabel("Tool status").selectOption("output-available");
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await page.getByLabel("Hold host state").check();
  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await page.getByLabel("Hold host state").uncheck();
  await trigger.click();
  await expect(page.getByLabel("Working notes")).toHaveValue("Keep my place");
  await expect(page.getByText("4 useful sources", { exact: true })).toBeVisible();
  await page.getByLabel("Tool status").selectOption("output-error");
  await expect(page.getByText("4 useful sources", { exact: true })).toHaveCount(0);
  await expect(page.locator(".hk-tool [data-error]")).toContainText("No result is available");
  await page.getByLabel("Example state").selectOption("disabled");
  await expect(trigger).toBeDisabled();
});

test("configuration schemas share one selection and honor host refusal", async ({ page }) => {
  await page.goto("/#vercel:agent");
  const first = page.getByRole("button", { name: /search_evidence Find sources/ });
  const second = page.getByRole("button", { name: /summarize_findings Bring/ });
  await page.getByLabel("Hold host state").check();
  await first.click();
  await expect(first).toHaveAttribute("aria-expanded", "false");
  await page.getByLabel("Hold host state").uncheck();
  await first.focus();
  await page.keyboard.press("Enter");
  await expect(first).toHaveAttribute("aria-expanded", "true");
  await second.click();
  await expect(first).toHaveAttribute("aria-expanded", "false");
  await expect(second).toHaveAttribute("aria-expanded", "true");
  await page.getByLabel("Hold host state").check();
  await second.click();
  await expect(second).toHaveAttribute("aria-expanded", "true");
  await page.getByLabel("Hold host state").uncheck();
  await second.click();
  await expect(second).toHaveAttribute("aria-expanded", "false");
  await page.getByLabel("Example state").selectOption("disabled");
  await expect(first).toBeDisabled();
  await expect(second).toBeDisabled();
});

test("artifact native actions have tooltips and host-owned close behavior", async ({ page }) => {
  await page.goto("/#vercel:artifact");
  await page.getByRole("button", { name: "Save brief" }).focus();
  await expect(page.getByRole("tooltip")).toHaveText("Request save");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("tooltip")).toHaveCount(0);
  await page.getByRole("button", { name: "Save brief" }).click();
  await expect(page.getByLabel("Activity request")).toContainText("No file downloaded");
  await page.getByLabel("Hold host state").check();
  await page.getByRole("button", { name: "Close artifact" }).click();
  await expect(page.locator(".hk-artifact")).toBeVisible();
  await page.getByLabel("Hold host state").uncheck();
  await page.getByRole("button", { name: "Close artifact" }).click();
  await expect(page.locator(".hk-artifact")).toHaveCount(0);
  await page.getByRole("button", { name: "Reopen sample artifact" }).click();
  await page.getByLabel("Artifact content").selectOption("data");
  await expect(page.locator(".hk-artifact code")).toContainText("Needs user observation");
  await page.getByLabel("Example state").selectOption("disabled");
  for (const button of await page.locator(".hk-artifact").getByRole("button").all()) await expect(button).toBeDisabled();
});

test("source data is inert and examples make no automatic external requests", async ({ page, baseURL }) => {
  if (!baseURL) throw new Error("This test requires a configured baseURL");
  const configuredURL = new URL(baseURL);
  const external: string[] = [];
  page.on("request", request => {
    const url = new URL(request.url());
    if (url.protocol !== "data:" && (url.origin !== configuredURL.origin || url.protocol !== configuredURL.protocol)) external.push(request.url());
  });
  for (const family of ["tool", "agent", "artifact", "sources"]) await page.goto(`/#vercel:${family}`);
  const sources = page.locator(".hk-sources");
  await expect(sources.getByRole("link")).toHaveCount(2);
  const source = sources.getByRole("link", { name: /Firsthand observations/ });
  await expect(source).toHaveAttribute("rel", "noreferrer noopener");
  await expect(source).toHaveAttribute("referrerpolicy", "no-referrer");
  await expect(sources.locator("[ping],img,iframe")).toHaveCount(0);
  await source.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Activity request")).toContainText("Synthetic link kept local");
  await sources.getByText("Unavailable source (unsafe address)").click();
  await expect(page.getByLabel("Activity request")).not.toContainText("never fire");
  await page.getByLabel("Hold host state").check();
  await sources.getByRole("button", { name: /3 sources/ }).click();
  await expect(sources.getByRole("button")).toHaveAttribute("aria-expanded", "true");
  await page.getByLabel("Hold host state").uncheck();
  await sources.getByRole("button").click();
  await expect(sources.getByRole("link")).toHaveCount(0);
  expect(external).toEqual([]);
});

test("activity surfaces keep the continuous canvas accessible across themes and narrow widths", async ({ page }) => {
  for (const mode of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme: mode, reducedMotion: "reduce" });
    for (const family of ["tool", "agent", "artifact", "sources"]) {
      await page.goto(`/#vercel:${family}`);
      if (family === "tool") await page.getByLabel("Tool status").selectOption("approval-requested");
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      await expect(page.getByTestId("live-example")).toHaveScreenshot(`activity-${family}-${mode}.png`, { animations: "disabled" });
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  for (const family of ["tool", "agent", "artifact", "sources"]) {
    await page.goto(`/#vercel:${family}`);
    await page.getByLabel("Example state").selectOption("long-content");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    if (family === "artifact") await expect(page.getByTestId("live-example")).toHaveScreenshot("activity-artifact-narrow.png", { animations: "disabled" });
  }
  for (const mode of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme: mode });
    for (const family of ["tool", "agent", "artifact", "sources"]) {
      await page.goto(`/#vercel:${family}`);
      await page.getByLabel("Palette", { exact: true }).selectOption("cozy");
      if (family === "tool") await page.getByLabel("Tool status").selectOption("approval-requested");
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    }
  }
  await page.emulateMedia({ forcedColors: "active", reducedMotion: "reduce" });
  await page.goto("/#vercel:tool");
  await page.getByLabel("Tool status").selectOption("output-error");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.locator(".hk-tool .hk-work-trigger").focus();
  await expect(page.locator(".hk-tool .hk-work-trigger")).toBeFocused();
  await page.keyboard.press("Space");
  await expect(page.locator(".hk-tool .hk-work-trigger")).toHaveAttribute("aria-expanded", "false");
});
