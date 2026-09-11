import { expect, test } from "@playwright/test";

test("test results respect closed suites and render custom parts once", async ({ page }) => {
  await page.goto("/#vercel:test-results");
  const example = page.getByTestId("live-example");
  const content = example.locator(".hk-test-suite-content");
  await expect(content).toBeHidden();
  await example.getByRole("button", { name: "API suite", exact: true }).click();
  await expect(content).toBeVisible();
  await expect(content.getByText("Failed", { exact: true })).toHaveCount(1);
  await expect(content.locator(".hk-test-name .hk-test-name")).toHaveCount(0);
  await expect(content.locator(".hk-test > .hk-test-error")).toBeVisible();
  await expect(content.getByText("41ms", { exact: true })).toBeVisible();
  await example.getByRole("button", { name: "API suite", exact: true }).click();
  await expect(content).toBeHidden();
});
