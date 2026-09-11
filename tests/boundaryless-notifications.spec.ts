import { test, expect } from "@playwright/test";

test("notification dismissal and read actions respect host refusal", async ({ page }) => {
  await page.goto("/#boardui:notification");
  const example = page.getByTestId("live-example");
  await example.getByLabel("Hold host state").check();
  await example.getByRole("button", { name: "Dismiss notification" }).click();
  await expect(example.getByRole("heading", { name: "Work unit updated" })).toBeVisible();
  await example.getByLabel("Hold host state").uncheck();
  await example.getByRole("button", { name: "Dismiss notification" }).click();
  await expect(example.getByRole("status")).toHaveText("Notification dismissed.");
  await example.getByRole("button", { name: "Show notification" }).click();
  await example.getByLabel("Notification tone").selectOption("error");
  await expect(example.locator(".hk-notification")).toHaveAttribute("data-tone", "error");
  await page.goto("/#boardui:notification-center");
  await example.getByLabel("Hold host state").check();
  await example.getByRole("button", { name: "Mark all read" }).click();
  await expect(example.locator(".hk-notification-unread")).toHaveCount(2);
  await example.getByLabel("Hold host state").uncheck();
  await example.getByRole("button", { name: "Mark all read" }).click();
  await expect(example.locator(".hk-notification-unread")).toHaveCount(0);
  await example.getByRole("button", { name: "Reset notifications" }).click();
  await expect(example.locator(".hk-notification-unread")).toHaveCount(2);
  await example.getByLabel("Empty notifications").check();
  await expect(example.getByRole("button", { name: "Mark all read" })).toBeDisabled();
});
