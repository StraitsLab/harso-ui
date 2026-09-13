import { expect, test } from "@playwright/test";

// Phase D removes prompt-only dropdown anatomy; native toolbar coverage remains.
test("catalogue toolbar uses local actions, controlled refusal and native keyboard navigation", async ({ page }) => {
  await page.goto("/#vercel:toolbar");
  const example = page.getByTestId("live-example");
  const toolbar = example.getByRole("toolbar", { name: "Selection actions" });
  const result = example.getByLabel("Toolbar result");
  await expect(toolbar).toBeVisible();
  await toolbar.getByRole("button", { name: "Inspect selection" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(toolbar.getByRole("button", { name: "Duplicate selection" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(result).toContainText("2 local items");
  await example.getByLabel("Hold toolbar changes").check();
  await toolbar.getByRole("button", { name: "Duplicate selection" }).click();
  await expect(result).toContainText("host retained 2 local items");
  await example.getByLabel("Hold toolbar changes").uncheck();
  await toolbar.getByRole("button", { name: "Duplicate selection" }).click();
  await expect(result).toContainText("3 local items");
  await example.getByLabel("Disable toolbar").check();
  for (const action of await toolbar.getByRole("button").all()) await expect(action).toBeDisabled();
  await example.getByLabel("Disable toolbar").uncheck();
  await toolbar.getByRole("button", { name: "Remove selection" }).click();
  await expect(toolbar).toHaveCount(0);
  await expect(example.getByText("No selection. Select the sample to show its tools.")).toBeVisible();
  await example.getByRole("button", { name: "Select sample" }).click();
  await expect(toolbar).toBeVisible();
});

test("catalogue queue composes sections, attachments, completion, removal and refusal", async ({ page }) => {
  await page.goto("/#vercel:queue");
  const example = page.getByTestId("live-example");
  const section = example.locator(".hk-queue-section");
  const result = example.getByLabel("Queue result");
  await expect(section).toHaveAttribute("open", "");
  await expect(example.locator(".hk-queue-item")).toHaveCount(2);
  await expect(example.locator(".hk-queue-item-file")).toHaveText("brief.md");
  await example.getByLabel("Hold queue changes").check();
  await example.getByRole("button", { name: "Complete Review the brief" }).click();
  await expect(result).toContainText("host retained the queue");
  await expect(example.getByRole("button", { name: "Complete Review the brief" })).toBeVisible();
  await section.locator("summary").click();
  await expect(section).toHaveAttribute("open", "");
  await example.getByLabel("Hold queue changes").uncheck();
  await section.locator("summary").click();
  await expect(section).not.toHaveAttribute("open", "");
  await section.locator("summary").click();
  await example.getByRole("button", { name: "Complete Review the brief" }).click();
  await expect(example.getByRole("button", { name: "Reopen Review the brief" })).toBeVisible();
  await expect(example.locator(".hk-queue-indicator--completed")).toHaveCount(2);
  await example.getByLabel("Disable queue").check();
  for (const action of await example.locator(".hk-queue-item-actions button").all()) await expect(action).toBeDisabled();
  await section.locator("summary").click();
  await expect(section).toHaveAttribute("open", "");
  await example.getByLabel("Disable queue").uncheck();
  await example.getByRole("button", { name: "Remove Review the brief" }).click();
  await example.getByRole("button", { name: "Remove Gather references" }).click();
  await expect(example.getByText("Nothing queued. Add the sample work to explore the queue.")).toBeVisible();
  await expect(example.locator(".hk-queue-item")).toHaveCount(0);
  await example.getByRole("button", { name: "Reset queue" }).click();
  await expect(example.locator(".hk-queue-item")).toHaveCount(2);
});

test("runtime composer preserves mounted drafts, attachments and host refusal", async ({ page }) => {
  await page.goto("/#harso:chat-composer");
  await page.getByLabel("Composer state", { exact: true }).selectOption("with attachment");
  const input = page.getByRole("textbox", { name: "Message", exact: true });
  await input.fill("Keep this draft");
  const mounted = await input.elementHandle();
  await expect(page.getByText("requirements.md", { exact: true })).toBeVisible();
  await page.getByLabel("Disable composer input", { exact: true }).check();
  await expect(input).toBeDisabled();
  await expect(page.getByRole("button", { name: "Send", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Add attachment", exact: true })).toBeDisabled();
  await page.getByLabel("Disable composer input", { exact: true }).uncheck();
  expect(await mounted!.evaluate(element => element.isConnected)).toBe(true);
  await expect(input).toHaveValue("Keep this draft");
  await page.getByLabel("Refuse submission", { exact: true }).check();
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(page.getByTestId("composer-host-result")).toContainText("Submission refused");
  await expect(input).toHaveValue("Keep this draft");
  await expect(page.getByText("requirements.md", { exact: true })).toBeVisible();
  await page.getByLabel("Refuse submission", { exact: true }).uncheck();
  await page.getByRole("button", { name: "Remove requirements.md", exact: true }).click();
  await expect(page.getByText("requirements.md", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(input).toHaveValue("");
});

test("catalogue social variants call a local host without authentication or navigation", async ({ page }) => {
  await page.goto("/#boardui:social-button");
  const example = page.getByTestId("live-example");
  const result = example.getByLabel("Social result");
  const originalUrl = page.url();
  await example.getByRole("button", { name: "Continue with GitHub", exact: true }).click();
  await expect(result).toContainText("GitHub request accepted locally");
  await example.getByLabel("Hold social requests").check();
  await example.getByLabel("Social provider", { exact: true }).selectOption("Google");
  await example.getByRole("button", { name: "Continue with Google", exact: true }).click();
  await expect(result).toContainText("Google requested; host retained GitHub");
  await example.getByLabel("Hold social requests").uncheck();
  await example.getByLabel("Social provider", { exact: true }).selectOption("Apple");
  await example.getByRole("button", { name: "Continue with Apple", exact: true }).click();
  await expect(result).toContainText("Apple request accepted locally");
  const social = example.locator(".hk-social-button");
  const providers = ["Google", "Apple", "GitHub", "GitLab", "Microsoft", "X", "Facebook", "LinkedIn", "Discord", "Slack", "Figma", "Notion", "Dropbox", "Spotify", "Twitch", "Reddit", "TikTok", "Instagram", "Telegram", "WhatsApp", "Amazon", "Bitbucket", "Auth0", "Okta"];
  await expect(example.getByLabel("Social provider", { exact: true }).locator("option")).toHaveCount(24);
  for (const provider of providers) {
    await example.getByLabel("Social provider", { exact: true }).selectOption(provider);
    await expect(social).toHaveAccessibleName(`Continue with ${provider}`);
    await social.click();
    await expect(result).toContainText(`${provider} request accepted locally`);
  }
  for (const appearance of ["colorful", "black", "white"]) {
    await example.getByLabel("Social appearance", { exact: true }).selectOption(appearance);
    await expect(social).toHaveClass(new RegExp(`hk-social-button--${appearance}`));
  }
  for (const size of ["small", "medium"]) {
    await example.getByLabel("Social size", { exact: true }).selectOption(size);
    await expect(social).toHaveClass(new RegExp(`hk-button--${size}`));
  }
  await example.getByLabel("Full-width social button").check();
  expect(await social.evaluate(element => Math.abs(element.getBoundingClientRect().width - element.parentElement!.getBoundingClientRect().width))).toBeLessThanOrEqual(1);
  await example.getByLabel("Full-width social button").uncheck();
  await example.getByLabel("Icon-only social button").check();
  await expect(social).toHaveClass(/hk-icon-button/);
  await expect(social).toHaveAccessibleName("Continue with Okta");
  await expect(social).not.toContainText("Continue with");
  await example.getByLabel("Pending social request").check();
  for (const action of await example.locator(".hk-social-button").all()) {
    await expect(action).toBeDisabled();
    await expect(action).toHaveAttribute("aria-busy", "true");
  }
  await example.getByLabel("Pending social request").uncheck();
  await example.getByLabel("Disable social buttons").check();
  for (const action of await example.locator(".hk-social-button").all()) await expect(action).toBeDisabled();
  expect(page.url()).toBe(originalUrl);
});

test("runtime attachment input stays local", async ({ page }) => {
  await page.goto("/#harso:chat-composer");
  const external: string[] = [];
  page.on("request", request => { if (/^https?:/.test(request.url()) && new URL(request.url()).origin !== new URL(page.url()).origin) external.push(request.url()); });
  const chooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Add attachment", exact: true }).click();
  await (await chooser).setFiles({ name: "local.txt", mimeType: "text/plain", buffer: Buffer.from("local fixture") });
  await expect(page.getByText("local.txt", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Remove local.txt", exact: true }).click();
  await expect(page.getByText("local.txt", { exact: true })).toHaveCount(0);
  expect(external).toEqual([]);
});

test("four original consumers retain visible actionable controls at narrow and wide widths", async ({ page }) => {
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const family of ["vercel:toolbar", "vercel:queue", "harso:chat-composer", "boardui:social-button"]) {
      await page.goto(`/#${family}`);
      const example = page.getByTestId("live-example");
      await expect(example.locator("output")).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${family} at ${width}`).toBe(true);
      for (const button of await example.locator("button:visible").all()) {
        const bounds = await button.boundingBox();
        expect(bounds!.x, `${family} left edge at ${width}`).toBeGreaterThanOrEqual(0);
        expect(bounds!.x + bounds!.width, `${family} right edge at ${width}`).toBeLessThanOrEqual(width + 1);
      }
      await example.screenshot({ path: test.info().outputPath(`${family.replace(":", "-")}-${width}.png`) });
    }
  }
});
