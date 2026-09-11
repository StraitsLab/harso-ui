import { expect, test } from "@playwright/test";

test("confirmation renders its complete interactive example inside the preview surface", async ({ page }) => {
  await page.goto("/#vercel:confirmation");
  const preview = page.getByTestId("live-example");
  await expect(preview.getByRole("heading", { name: "Tool approval" })).toBeVisible();
  await expect(preview).toContainText("Approve the host request");
  await preview.getByRole("button", { name: "Approve", exact: true }).click();
  await expect(preview).toContainText("You approved this tool execution.");
  await expect(preview.getByRole("button", { name: "Approve", exact: true })).toHaveCount(0);
});

test("image gallery demonstrates a visible local illustration rather than a transparent pixel", async ({ page }) => {
  await page.goto("/#vercel:image");
  const image = page.getByTestId("live-example").getByRole("img");
  await expect(image).toBeVisible();
  await expect.poll(() => image.evaluate(element => (element as HTMLImageElement).naturalWidth)).toBeGreaterThan(1);
  expect(await image.getAttribute("src")).toMatch(/^data:image\//);
  await image.screenshot({ path: test.info().outputPath("image-example.png") });
});
