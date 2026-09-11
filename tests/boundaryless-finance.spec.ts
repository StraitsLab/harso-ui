import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("finance transactions search, filter, sort, select and paginate with host refusal", async ({ page }) => {
  await page.goto("/#boardui:finance-dashboard");
  const table = page.getByRole("table", { name: "Transactions" });
  await expect(table.getByRole("cell", { name: "Studio rent", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Sort by Amount" }).click();
  await expect(table.locator("tbody tr").first()).toContainText("Studio rent");
  await page.getByRole("button", { name: "Sort by Amount" }).click();
  await expect(table.locator("tbody tr").first()).toContainText("September salary");
  await page.getByLabel("Search transactions").fill("coffee");
  await expect(table.locator("tbody tr")).toHaveCount(1);
  await expect(table).toContainText("Morning coffee");
  await page.getByLabel("Search transactions").fill("");
  await page.getByRole("combobox", { name: "Transaction category", exact: true }).selectOption("Food");
  await expect(table.locator("tbody tr")).toHaveCount(3);
  await page.getByLabel("Select visible rows").check();
  await expect(page.getByText("3 matching records · 3 selected")).toBeVisible();
  await page.getByLabel("Hold host state").check();
  await page.getByRole("combobox", { name: "Transaction category", exact: true }).selectOption("Home");
  await expect(page.getByRole("combobox", { name: "Transaction category", exact: true })).toHaveValue("Food");
  await expect(page.getByLabel("Finance request")).toContainText("host retained");
  await page.getByLabel("Hold host state").uncheck();
  await page.getByRole("combobox", { name: "Transaction category", exact: true }).selectOption("All");
  await page.getByRole("button", { name: "Next page" }).click();
  await expect(table).not.toContainText("September salary");
  await page.getByRole("navigation", { name: "Finance navigation" }).getByRole("button", { name: "Transactions" }).click();
  await expect(page.getByRole("region", { name: "Cash flow", exact: true })).toHaveCount(0);
  await expect(table).toBeVisible();
});

test("finance presents empty, loading, error and disabled without actionable stale records", async ({ page }) => {
  await page.goto("/#boardui:finance-dashboard");
  await page.getByLabel("Transaction data", { exact: true }).selectOption("empty");
  await expect(page.getByText("No matching transactions.")).toBeVisible();
  await page.getByLabel("Transaction data", { exact: true }).selectOption("loading");
  await expect(page.getByText("Loading rows…")).toBeVisible();
  await expect(page.getByLabel("Search transactions")).toBeDisabled();
  await page.getByLabel("Transaction data", { exact: true }).selectOption("ready");
  await page.getByLabel("Transaction data", { exact: true }).selectOption("error");
  await expect(page.getByText(/The host could not load transactions/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Export statement" })).toBeDisabled();
  await page.getByLabel("Transaction data", { exact: true }).selectOption("disabled");
  await expect(page.getByRole("button", { name: "Sort by Amount" })).toBeDisabled();
});

for (const mode of ["light", "dark"] as const) for (const palette of ["clean", "cozy"]) for (const width of [1512, 390]) {
  test(`finance ${mode} ${palette} ${width} keeps its canvas accessible`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1040 });
    await page.emulateMedia({ colorScheme: mode, reducedMotion: "reduce" });
    await page.goto("/#boardui:finance-dashboard");
    await page.getByLabel("Palette", { exact: true }).selectOption(palette);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByTestId("live-example").screenshot({ path: test.info().outputPath(`finance-${mode}-${palette}-${width}.png`) });
  });
}
