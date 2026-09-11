import { expect, test, type Locator } from "@playwright/test";

async function expectDecodedArtwork(image: Locator) {
  await expect(image).toBeVisible();
  await expect.poll(() => image.evaluate(element => {
    const artwork = element as HTMLImageElement;
    return artwork.complete && artwork.naturalWidth > 1 && artwork.naturalHeight > 1;
  })).toBe(true);
  expect(await image.evaluate(element => ({ width: (element as HTMLImageElement).naturalWidth, height: (element as HTMLImageElement).naturalHeight }))).toEqual({ width: 600, height: 400 });
}

test("profile cover decodes the local sample and recovers from failed artwork", async ({ page }) => {
  await page.goto("/#boardui:ai-profile");
  const cover = page.locator(".hk-profile-cover");
  await expectDecodedArtwork(cover.locator("img"));
  await page.getByLabel("Profile cover", { exact: true }).selectOption("broken");
  await expect(cover.getByRole("img", { name: "Quiet abstract profile cover", exact: true })).toHaveText("No image available");
  await expect(cover.locator("img")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Mira Chen", exact: true })).toBeVisible();
  await page.getByLabel("Profile cover", { exact: true }).selectOption("sample");
  await expectDecodedArtwork(cover.locator("img"));
});

test("profile artwork preserves refused host changes and disabled actions", async ({ page }) => {
  await page.goto("/#boardui:ai-profile");
  const artwork = page.locator(".hk-profile-cover img");
  await expectDecodedArtwork(artwork);
  await page.getByLabel("Hold profile host state", { exact: true }).check();
  await page.getByLabel("Profile cover", { exact: true }).selectOption("broken");
  await expect(page.getByLabel("Profile cover", { exact: true })).toHaveValue("sample");
  await expect(page.getByLabel("Profile request", { exact: true })).toHaveText("Cover artwork requested; host retained state.");
  await page.getByRole("button", { name: "Edit profile", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Edit profile", exact: true })).toHaveCount(0);
  await expectDecodedArtwork(artwork);
  await page.getByLabel("Hold profile host state", { exact: true }).uncheck();
  await page.getByLabel("Profile data", { exact: true }).selectOption("disabled");
  await expect(page.getByLabel("Profile cover", { exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Edit profile", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Share profile", exact: true })).toBeDisabled();
  await expectDecodedArtwork(artwork);
});

test("custom plan artwork decodes the local sample and retains the broken fallback", async ({ page }) => {
  await page.goto("/#boardui:settings-modal");
  await page.getByLabel("Custom plan artwork", { exact: true }).check();
  await page.getByRole("button", { name: "Open settings", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Settings", exact: true });
  await expectDecodedArtwork(dialog.locator(".hk-settings-plan-art img"));
  await dialog.getByRole("button", { name: "Close settings", exact: true }).click();
  await page.getByLabel("Broken plan artwork", { exact: true }).check();
  await page.getByRole("button", { name: "Open settings", exact: true }).click();
  await expect(dialog.locator('[data-artwork="native"]')).toBeVisible();
  await expect(dialog.locator(".hk-settings-plan-art img")).toHaveCount(0);
  await expect(dialog.getByRole("heading", { name: "General", exact: true })).toBeVisible();
  await dialog.getByRole("button", { name: "Close settings", exact: true }).click();
  await page.getByLabel("Broken plan artwork", { exact: true }).uncheck();
  await page.getByRole("button", { name: "Open settings", exact: true }).click();
  await expectDecodedArtwork(dialog.locator(".hk-settings-plan-art img"));
});

test("custom artwork preserves refused close requests and disabled opening", async ({ page }) => {
  await page.goto("/#boardui:settings-modal");
  await page.getByLabel("Custom plan artwork", { exact: true }).check();
  await page.getByLabel("Hold close requests", { exact: true }).check();
  await page.getByRole("button", { name: "Open settings", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Settings", exact: true });
  await expectDecodedArtwork(dialog.locator(".hk-settings-plan-art img"));
  await dialog.getByRole("button", { name: "Close settings", exact: true }).click();
  await expect(dialog).toBeVisible();
  await expect(page.locator('[aria-label="Close requests"]')).toHaveText("1");
  await expectDecodedArtwork(dialog.locator(".hk-settings-plan-art img"));
  await page.goto("/#boardui:settings-modal");
  await page.getByLabel("Example state", { exact: true }).selectOption("disabled");
  await expect(page.getByRole("button", { name: "Open settings", exact: true })).toBeDisabled();
  await expect(page.getByRole("dialog", { name: "Settings", exact: true })).toHaveCount(0);
});
