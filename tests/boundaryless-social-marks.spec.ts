import { expect, test } from "@playwright/test";

for (const provider of ["Microsoft", "Bitbucket"]) for (const appearance of ["light", "dark"]) for (const palette of ["clean", "cozy"]) for (const width of [390, 1440]) {
  test(`official social mark ${provider} ${appearance}/${palette}/${width}`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 1040 });
    await page.goto("/#boardui:social-button");
    await page.getByLabel("Appearance", { exact: true }).selectOption(appearance);
    await page.getByLabel("Palette", { exact: true }).selectOption(palette);
    const example = page.getByTestId("live-example");
    await example.getByLabel("Social provider", { exact: true }).selectOption(provider);
    const button = example.getByRole("button", { name: `Continue with ${provider}`, exact: true });
    const mark = button.locator("img");
    const originalUrl = page.url();
    for (const variant of ["colorful", "black", "white"]) {
      await example.getByLabel("Social appearance", { exact: true }).selectOption(variant);
      for (const size of ["small", "medium"]) for (const iconOnly of [false, true]) for (const fullWidth of [false, true]) {
        await example.getByLabel("Social size", { exact: true }).selectOption(size);
        await example.getByLabel("Icon-only social button", { exact: true }).setChecked(iconOnly);
        await example.getByLabel("Full-width social button", { exact: true }).setChecked(fullWidth);
        await expect(button).toHaveAccessibleName(`Continue with ${provider}`);
        const asset = await mark.evaluate(async element => { const response = await fetch((element as HTMLImageElement).src); return response.text(); });
        expect(asset).toContain(provider === "Microsoft" ? "#f25022" : "#94C748");
        expect(asset).toContain(provider === "Microsoft" ? "#7fba00" : "#101214");
        await expect.poll(() => mark.evaluate(element => (element as HTMLImageElement).complete && (element as HTMLImageElement).naturalWidth > 0)).toBe(true);
        await expect(mark).toHaveAttribute("alt", "");
        await expect(button).toHaveClass(new RegExp(`hk-social-button--${variant}`));
        if (iconOnly) await expect(button).not.toContainText(`Continue with ${provider}`);
        else await expect(button).toContainText(`Continue with ${provider}`);
        const bounds = (await button.boundingBox())!;
        const imageBounds = (await mark.boundingBox())!;
        expect(bounds.x).toBeGreaterThanOrEqual(0);
        expect(bounds.x + bounds.width).toBeLessThanOrEqual(width + 1);
        expect(imageBounds.width).toBe(20);
        expect(imageBounds.height).toBe(20);
        expect(imageBounds.x).toBeGreaterThanOrEqual(bounds.x);
        expect(imageBounds.x + imageBounds.width).toBeLessThanOrEqual(bounds.x + bounds.width);
        if (fullWidth && !iconOnly) expect(await button.evaluate(element => Math.abs(element.getBoundingClientRect().width - element.parentElement!.getBoundingClientRect().width))).toBeLessThanOrEqual(1);
        for (const control of ["Disable social buttons", "Pending social request"]) {
          await example.getByLabel(control, { exact: true }).check();
          await expect(button).toBeDisabled();
          await expect(mark).toBeVisible();
          const result = await example.getByLabel("Social result").textContent();
          await button.evaluate(element => (element as HTMLButtonElement).click());
          await expect(example.getByLabel("Social result")).toHaveText(result!);
          await example.getByLabel(control, { exact: true }).uncheck();
          await expect(button).toBeEnabled();
        }
      }
      await example.getByLabel("Full-width social button").uncheck();
      if (palette === "clean" && width === 390) await example.screenshot({ path: info.outputPath(`${provider}-${appearance}-${variant}.png`) });
    }
    await example.getByLabel("Hold social requests").check();
    await button.click();
    await expect(example.getByLabel("Social result")).toContainText("host retained none");
    await example.getByLabel("Hold social requests").uncheck();
    await button.click();
    await expect(example.getByLabel("Social result")).toContainText(`${provider} request accepted locally; no authentication started.`);
    expect(page.url()).toBe(originalUrl);
  });
}
