import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#boardui:carousel");
});

test("disabled slide composition blocks editing and actions without disabling carousel navigation", async ({ page }) => {
  const example = page.getByTestId("navigation-surface-example");
  await example.getByLabel("Disable slide controls", { exact: true }).check();
  const note = example.getByRole("textbox", { name: "Slide note", exact: true });
  const actions = example.getByRole("button", { name: "Explore result", exact: true });
  await expect(note).toBeDisabled();
  await expect(actions).toHaveCount(3);
  for (let index = 0; index < 3; index++) await expect(actions.nth(index)).toBeDisabled();
  await note.click({ force: true });
  await page.keyboard.insertText("Blocked edit");
  await expect(note).toHaveValue("Draft insight");
  await example.getByRole("button", { name: "Next slide", exact: true }).click();
  await expect(example.getByRole("region", { name: "Research results", exact: true }).getByRole("status")).toHaveText("Slide 2 of 4");
  await actions.nth(0).click({ force: true });
  await expect(example.getByLabel("Gallery action", { exact: true })).toHaveText("");
  await example.getByLabel("Research results slides", { exact: true }).focus();
  await page.keyboard.press("End");
  await expect(example.getByRole("region", { name: "Research results", exact: true }).getByRole("status")).toHaveText("Slide 4 of 4");
});

test("local disabled slide controls retain mounted draft and feedback through re-enable", async ({ page }) => {
  const example = page.getByTestId("navigation-surface-example");
  const note = example.getByRole("textbox", { name: "Slide note", exact: true });
  const action = example.getByLabel("Gallery action", { exact: true });
  const actions = example.getByRole("button", { name: "Explore result", exact: true });
  await note.fill("Retained local insight");
  const original = await note.elementHandle();
  await example.getByRole("button", { name: "Go to slide 2", exact: true }).click();
  await actions.nth(0).click();
  await expect(action).toHaveText("Open requested: The evidence behind it");
  await example.getByLabel("Disable slide controls", { exact: true }).check();
  await expect(note).toBeDisabled();
  await example.getByRole("button", { name: "Go to slide 3", exact: true }).click();
  await expect(actions.nth(1)).toBeDisabled();
  await actions.nth(1).click({ force: true });
  await expect(action).toHaveText("Open requested: The evidence behind it");
  await example.getByLabel("Research results slides", { exact: true }).focus();
  await page.keyboard.press("Home");
  await note.click({ force: true });
  await page.keyboard.insertText("Blocked edit");
  await expect(note).toHaveValue("Retained local insight");
  await example.getByLabel("Disable slide controls", { exact: true }).uncheck();
  await expect(note).toBeEnabled();
  expect(await note.evaluate((element, before) => element === before, original)).toBe(true);
  await expect(note).toHaveValue("Retained local insight");
  await note.fill("Edited after re-enable");
  await example.getByRole("button", { name: "Go to slide 3", exact: true }).click();
  await actions.nth(1).click();
  await expect(action).toHaveText("Open requested: Room for another idea");
  await expect(note).toHaveValue("Edited after re-enable");
});
