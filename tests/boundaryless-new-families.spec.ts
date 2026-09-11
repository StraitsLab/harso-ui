import { expect, test } from "@playwright/test";

test("new catalogue families render as implemented", async ({ page }) => {
  for (const hash of ["vercel:open-in-chat", "vercel:schema-display", "vercel:sandbox", "boardui:notification", "boardui:area-chart-card", "boardui:composer"]) {
    await page.goto(`/#${hash}`);
    await expect(page.getByTestId("live-example")).not.toContainText("Mapped. Not built yet.");
  }
});

test("sandbox tabs switch visible content", async ({ page }) => {
  await page.goto("/#vercel:sandbox");
  await expect(page.getByRole("tabpanel", { name: "code" })).toBeVisible();
  await page.getByRole("tab", { name: "Output" }).click();
  await expect(page.getByRole("tabpanel", { name: "output" })).toBeVisible();
});
