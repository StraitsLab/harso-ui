import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { chatRoutes, openChat } from "./helpers/harso-chat";

for (const route of chatRoutes) for (const appearance of ["light", "dark"] as const) {
  test(`${route} accessible names and Axe ${appearance}`, async ({ page }) => {
    const example = await openChat(page, route, 1440, appearance);
    const scan = await new AxeBuilder({ page }).include('[data-testid="live-example"]').analyze();
    expect(scan.violations.filter(violation => violation.impact === "serious" || violation.impact === "critical")).toEqual([]);
    for (const button of await example.getByRole("button").all()) await expect(button).toHaveAccessibleName(/\S/);
    for (const input of await example.locator("textarea").all()) await expect(input).toHaveAccessibleName(/\S/);
    if (route === "chat-thread" || route === "chat-composer") await expect(example.locator("textarea")).toHaveCount(1);
    if (route === "chat-parts") {
      const badges = example.locator(".hkc-tool-state");
      expect(await badges.count()).toBeGreaterThan(0);
      for (const badge of await badges.all()) {
        await expect(badge).toHaveAttribute("role", "status");
        await expect(badge).toHaveText(/^(running|completed|failed|denied|awaiting approval)$/);
      }
    }
  });
}
