import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("image generation keeps drafts and pending work isolated and supports stop/retry/refusal", async ({ page }) => {
  await page.goto("/#boardui:ai-image-generation");
  const workspace = page.locator(".hk-image-workspace");
  const prompt = workspace.getByRole("textbox", { name: "Describe your image" });
  await prompt.fill("An original horizon");
  await workspace.getByRole("button", { name: "Product studio", exact: true }).click();
  await expect(prompt).toHaveValue("");
  await workspace.getByRole("button", { name: "Image artist", exact: true }).click();
  await expect(prompt).toHaveValue("An original horizon");
  await workspace.getByLabel("Aspect ratio", { exact: true }).selectOption("Portrait");
  await workspace.getByLabel("Reference images", { exact: true }).setInputFiles({ name: "reference.svg", mimeType: "image/svg+xml", buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>') });
  await workspace.getByRole("button", { name: "Generate image", exact: true }).click();
  await expect(workspace.getByText("Estimated 12 seconds remaining")).toBeVisible();
  await expect(workspace.getByText("Illustration · Soft · Portrait · 1 references")).toBeVisible();
  await workspace.getByRole("button", { name: "Product studio", exact: true }).click();
  await expect(workspace.getByText("Estimated 12 seconds remaining")).toHaveCount(0);
  await workspace.getByRole("button", { name: "Image artist", exact: true }).click();
  await expect(workspace.getByText("Estimated 12 seconds remaining")).toBeVisible();
  await page.getByLabel("Hold image host state").check();
  await workspace.getByRole("button", { name: "Stop generation", exact: true }).click();
  await expect(workspace.getByText("Estimated 12 seconds remaining")).toBeVisible();
  await page.getByLabel("Hold image host state").uncheck();
  await workspace.getByRole("button", { name: "Stop generation", exact: true }).click();
  await expect(workspace.getByRole("status")).toHaveText("Generation stopped");
  await page.getByLabel("Image example state").selectOption("failed");
  await workspace.getByRole("button", { name: "Retry generation" }).click();
  for (let step = 0; step < 3; step++) await page.getByRole("button", { name: "Advance image update" }).click();
  await expect(workspace.locator(".hk-image-generation-frame img")).toBeVisible();
  await workspace.getByRole("button", { name: "Helpful", exact: true }).click();
  await expect(workspace.getByRole("button", { name: "Helpful", exact: true })).toHaveAttribute("aria-pressed", "true");
});

test("gallery selection, reuse and download requests are explicit host actions", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/#boardui:ai-image-generation");
  const workspace = page.locator(".hk-image-workspace");
  await workspace.getByRole("button", { name: "Copy image prompt" }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe("A quiet horizon");
  await workspace.getByRole("button", { name: "Gallery", exact: true }).click();
  const gallery = workspace.getByRole("dialog", { name: "Gallery", exact: true });
  await gallery.getByRole("button", { name: "Open Warm morning light" }).click();
  await expect(gallery).toHaveCount(0);
  await expect(workspace.locator(".hk-image-generation-frame figcaption")).toHaveText("Warm morning light");
  await workspace.getByRole("button", { name: "Download image" }).click();
  await expect(page.getByLabel("Image request")).toContainText("demonstration only");
  await workspace.getByRole("button", { name: "Gallery", exact: true }).click();
  await gallery.getByRole("button", { name: "Actions for A quiet horizon" }).click();
  await page.getByRole("menuitem", { name: "Reuse prompt", exact: true }).click();
  await expect(workspace.getByRole("textbox", { name: "Describe your image" })).toHaveValue("A quiet horizon");
});

for (const mode of ["light", "dark"] as const) for (const palette of ["clean", "cozy"]) for (const width of [1512, 390]) {
  test(`image studio ${mode} ${palette} ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1040 });
    await page.emulateMedia({ colorScheme: mode, reducedMotion: "reduce" });
    await page.goto("/#boardui:ai-image-generation");
    await page.getByLabel("Palette", { exact: true }).selectOption(palette);
    const workspace = page.locator(".hk-image-workspace");
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(await workspace.locator(".hk-conversation").evaluate(element => element.getBoundingClientRect().height)).toBeLessThanOrEqual(240);
    await workspace.screenshot({ path: test.info().outputPath("image-studio.png") });
    await workspace.getByRole("button", { name: "Gallery", exact: true }).click();
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await workspace.screenshot({ path: test.info().outputPath("image-gallery.png") });
    await page.keyboard.press("Escape");
    await expect(workspace.getByRole("dialog")).toHaveCount(0);
    await page.getByLabel("Image example state").selectOption("empty");
    await expect(workspace.getByRole("status")).toHaveText("Describe an image to begin");
    await page.getByLabel("Image example state").selectOption("failed");
    await expect(workspace.getByRole("alert")).toContainText("Synthetic generation unavailable");
    await page.getByLabel("Image example state").selectOption("disabled");
    await expect(workspace.getByRole("textbox", { name: "Describe your image" })).toBeDisabled();
  });
}
