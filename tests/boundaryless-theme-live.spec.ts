import { expect, test } from "@playwright/test";

test("theme sample follows the gallery palette and live system appearance without losing explicit choice", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await page.goto("/#boardui:theme-toggle");
  const example = page.getByTestId("live-example");
  const provider = example.locator(".hkl-theme-example");
  await page.getByLabel("Palette", { exact: true }).selectOption("cozy");
  await expect(provider).toHaveAttribute("data-palette", "cozy");
  await expect(provider).toHaveAttribute("data-mode", "light");
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(provider).toHaveAttribute("data-mode", "dark");
  await provider.getByRole("radio", { name: "Light", exact: true }).check();
  await page.emulateMedia({ colorScheme: "light" });
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(provider).toHaveAttribute("data-appearance", "light");
  await expect(provider).toHaveAttribute("data-mode", "light");
  await page.getByLabel("Palette", { exact: true }).selectOption("clean");
  await expect(provider).toHaveAttribute("data-palette", "clean");
  await expect(provider).toHaveAttribute("data-appearance", "light");
  await provider.getByRole("radio", { name: "System", exact: true }).check();
  await expect(provider).toHaveAttribute("data-mode", "dark");
  await page.emulateMedia({ colorScheme: "light" });
  await expect(provider).toHaveAttribute("data-mode", "light");
});
