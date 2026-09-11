import { expect, test } from "@playwright/test";

test("prompt closed native menus stay hidden in the real catalogue", async ({ page }) => {
  await page.goto("/#vercel:prompt-input");
  const example = page.getByTestId("live-example");
  await expect(example.locator(".hk-prompt-select-content")).toBeHidden();
  await expect(example.locator(".hk-prompt-action-content")).toBeHidden();
});

test("prompt open native menus remain anchored and viewport-contained", async ({ page }) => {
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/#vercel:prompt-input");
    const example = page.getByTestId("live-example");
    for (const [label, selector] of [["Balanced", ".hk-prompt-select-content"], ["Prompt actions", ".hk-prompt-action-content"]]) {
      const trigger = example.getByRole("button", { name: label, exact: true });
      const menu = example.locator(selector);
      await trigger.click();
      await expect(menu).toBeVisible();
      await expect(menu).toHaveJSProperty("popover", "manual");
      expect(await menu.evaluate(element => element.matches(":popover-open"))).toBe(true);
      const anchor = (await trigger.boundingBox())!;
      const bounds = (await menu.boundingBox())!;
      expect(Math.min(Math.abs(bounds.y - (anchor.y + anchor.height)), Math.abs(bounds.y + bounds.height - anchor.y)), `${label} vertical anchor gap at ${width}`).toBeLessThanOrEqual(24);
      expect(bounds.x, `${label} left viewport edge`).toBeGreaterThanOrEqual(0);
      expect(bounds.x + bounds.width, `${label} right viewport edge`).toBeLessThanOrEqual(width + 1);
      expect(bounds.y).toBeGreaterThanOrEqual(0);
      expect(bounds.y + bounds.height).toBeLessThanOrEqual(1001);
      expect(bounds.x).toBeLessThan(anchor.x + anchor.width);
      expect(bounds.x + bounds.width).toBeGreaterThan(anchor.x);
      await page.screenshot({ path: test.info().outputPath(`prompt-${label.replace(" ", "-")}-open-${width}.png`) });
      await page.keyboard.press("Escape");
      await expect(menu).toBeHidden();
      await expect(trigger).toBeFocused();
    }
  }
});

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

test("catalogue prompt sends locally, preserves refused drafts and composes selection and tools", async ({ page }) => {
  await page.goto("/#vercel:prompt-input");
  const example = page.getByTestId("live-example");
  const draft = example.getByRole("textbox", { name: "Prompt" });
  const send = example.getByRole("button", { name: "Send", exact: true });
  const result = example.getByLabel("Prompt result");
  await expect(send).toBeDisabled();
  await example.getByRole("button", { name: "Prompt actions", exact: true }).click();
  await example.getByRole("menuitem", { name: "Insert example" }).click();
  await expect(draft).toHaveValue("Summarize the project brief.");
  await example.getByLabel("Hold prompt changes").check();
  await example.getByRole("button", { name: "Balanced", exact: true }).click();
  await expect(example.getByRole("menuitemradio", { name: "Unavailable" })).toBeDisabled();
  await example.getByRole("menuitemradio", { name: "Fast", exact: true }).click();
  await expect(example.getByRole("button", { name: "Balanced", exact: true })).toBeVisible();
  await send.click();
  await expect(result).toContainText("host retained the draft");
  await expect(draft).toHaveValue("Summarize the project brief.");
  await example.getByLabel("Hold prompt changes").uncheck();
  await example.getByRole("button", { name: "Balanced", exact: true }).click();
  await example.getByRole("menuitemradio", { name: "Fast", exact: true }).click();
  await draft.fill("Local keyboard request");
  await draft.press("Shift+Enter");
  await expect(draft).toHaveValue("Local keyboard request\n");
  await draft.press("Enter");
  await expect(result).toContainText("Accepted locally · Fast: Local keyboard request");
  await expect(draft).toHaveValue("");
  await draft.fill("Retain while disabled");
  await example.getByLabel("Disable prompt").check();
  await expect(draft).toBeDisabled();
  await expect(send).toBeDisabled();
  await expect(example.getByRole("button", { name: "Fast", exact: true })).toBeDisabled();
  await example.getByLabel("Disable prompt").uncheck();
  await expect(draft).toHaveValue("Retain while disabled");
  await example.getByRole("button", { name: "Clear draft", exact: true }).click();
  await expect(draft).toHaveValue("");
  await expect(send).toBeDisabled();
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

test("catalogue prompt attachments and refused edits stay local and survive until accepted", async ({ page }) => {
  await page.goto("/#vercel:prompt-input");
  const example = page.getByTestId("live-example");
  const draft = example.getByRole("textbox", { name: "Prompt" });
  const result = example.getByLabel("Prompt result");
  const external: string[] = [];
  page.on("request", request => { if (/^https?:/.test(request.url()) && new URL(request.url()).origin !== new URL(page.url()).origin) external.push(request.url()); });
  await draft.fill("Retained text");
  await example.getByLabel("Hold prompt changes").check();
  await draft.fill("Refused replacement");
  await expect(draft).toHaveValue("Retained text");
  await expect(result).toContainText("Draft edit requested; host retained the draft");
  const file = { name: "brief.txt", mimeType: "text/plain", buffer: Buffer.from("Local fixture; not uploaded") };
  await example.locator('input[type="file"]').last().setInputFiles(file);
  await expect(example.getByRole("list", { name: "Prompt attachments" })).toHaveCount(0);
  await example.getByLabel("Hold prompt changes").uncheck();
  await example.getByRole("button", { name: "Clear draft", exact: true }).click();
  await example.locator('input[type="file"]').last().setInputFiles(file);
  await expect(example.getByRole("list", { name: "Prompt attachments" })).toContainText("brief.txt");
  await example.getByRole("button", { name: "Remove brief.txt" }).click();
  await expect(example.getByRole("list", { name: "Prompt attachments" })).toHaveCount(0);
  await expect(example.getByRole("button", { name: "Send", exact: true })).toBeDisabled();
  await example.locator('input[type="file"]').last().setInputFiles(file);
  await example.getByLabel("Hold prompt changes").check();
  await example.getByRole("button", { name: "Send", exact: true }).click();
  await expect(example.getByRole("list", { name: "Prompt attachments" })).toContainText("brief.txt");
  await example.getByLabel("Hold prompt changes").uncheck();
  await example.getByRole("button", { name: "Send", exact: true }).click();
  await expect(result).toHaveText("Accepted locally · Balanced: Attachment only · Files: brief.txt");
  await expect(example.getByRole("list", { name: "Prompt attachments" })).toHaveCount(0);
  expect(external).toEqual([]);
});

test("four original consumers retain visible actionable controls at narrow and wide widths", async ({ page }) => {
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const family of ["vercel:toolbar", "vercel:queue", "vercel:prompt-input", "boardui:social-button"]) {
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
