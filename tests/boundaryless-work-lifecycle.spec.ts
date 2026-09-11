import { expect, test } from "@playwright/test";

for (const sample of [
  { family: "plan", trigger: "Three considered steps", initiallyOpen: true, content: "Understand the strongest need." },
  { family: "task", trigger: "Six sources reviewed", initiallyOpen: false, content: "Original interview notes" },
]) {
  test(`WORK LIFECYCLE ${sample.family} disabled nested task suppresses real pointer activation`, async ({ page }) => {
    await page.goto(`/#vercel:${sample.family}`);
    const example = page.getByTestId("live-example");
    const trigger = example.getByRole("button", { name: sample.trigger, exact: true });
    await trigger.focus();
    await trigger.press("Enter");
    await expect(trigger).toHaveAttribute("aria-expanded", String(!sample.initiallyOpen));
    await page.getByLabel("Example state").selectOption("disabled");
    await expect(trigger).toHaveAttribute("aria-expanded", String(sample.initiallyOpen));
    await trigger.scrollIntoViewIfNeeded();
    const bounds = await trigger.boundingBox();
    expect(bounds!.width).toBeGreaterThan(0);
    expect(bounds!.height).toBeGreaterThan(0);
    await page.mouse.click(bounds!.x + bounds!.width / 2, bounds!.y + bounds!.height / 2);
    await expect(trigger).toHaveAttribute("aria-expanded", String(sample.initiallyOpen));
    await expect(trigger).toBeDisabled();
    if (sample.initiallyOpen) await expect(example.getByText(sample.content, { exact: true })).toBeVisible();
    else await expect(example.getByText(sample.content, { exact: true })).toBeHidden();
    await trigger.evaluate((button: HTMLButtonElement) => button.click());
    await expect(trigger).toHaveAttribute("aria-expanded", String(sample.initiallyOpen));
    if (sample.family === "plan") {
      await expect(example.getByLabel("Disclosure requests")).toHaveText("0 requests");
      await expect(example.getByRole("button", { name: "Plan details", exact: true })).toBeDisabled();
    } else {
      await expect(example.getByLabel("Work action")).toHaveText("No file requested");
      await expect(example.getByRole("button", { name: /^Shape the launch brief/ })).toBeDisabled();
    }
    await page.getByLabel("Example state").selectOption("default");
    await expect(trigger).toBeEnabled();
    await trigger.focus();
    await trigger.press("Space");
    await expect(trigger).toHaveAttribute("aria-expanded", String(!sample.initiallyOpen));
    await expect(trigger).toBeFocused();
  });
}

test("WORK LIFECYCLE disabled plan notes reject pointer and keyboard editing", async ({ page }) => {
  await page.goto("/#vercel:plan");
  const example = page.getByTestId("live-example");
  const notes = example.getByRole("textbox", { name: "Plan notes", exact: true });
  await notes.fill("Editable default sample");
  await expect(notes).toHaveValue("Editable default sample");
  await page.getByLabel("Example state").selectOption("disabled");
  await expect(notes).toHaveValue("");
  await notes.scrollIntoViewIfNeeded();
  const bounds = await notes.boundingBox();
  expect(bounds!.height).toBeGreaterThan(0);
  await page.mouse.click(bounds!.x + bounds!.width / 2, bounds!.y + bounds!.height / 2);
  await page.keyboard.type("Must not enter disabled notes");
  await expect(notes).toHaveValue("");
  await expect(notes).toBeDisabled();
  await expect(notes).not.toBeFocused();
  await page.getByLabel("Example state").selectOption("default");
  await expect(notes).toBeEnabled();
  await notes.fill("Editable fresh sample again");
  await expect(notes).toHaveValue("Editable fresh sample again");
});
