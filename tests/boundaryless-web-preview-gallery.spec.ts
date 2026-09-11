import { test, expect } from "@playwright/test";
import { createServer } from "node:http";

test("preview remains local until explicit navigation and reload stays sandboxed", async ({ page }, testInfo) => {
  const diagnostics: string[] = [];
  page.on("console", message => { if (message.type() === "error") diagnostics.push(`${message.location().url}: ${message.text()}`); });
  page.on("requestfailed", request => diagnostics.push(`${request.url()}: ${request.failure()?.errorText}`));
  let requests = 0;
  const server = createServer((request, response) => {
    if (request.url === "/result") requests += 1;
    response.writeHead(200, { "Content-Type": "text/html" });
    response.end('<!doctype html><html lang="en"><head><title>Test preview</title></head><body><main><h1>Requested preview</h1></main></body></html>');
  });
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Fixture server address unavailable");
  try {
  await page.goto("/#vercel:web-preview");
  const example = page.getByTestId("live-example");
  await expect(example.frameLocator("iframe").getByRole("heading", { name: "A quiet place to work." })).toBeVisible();
  await example.getByRole("textbox", { name: "Preview URL" }).fill(`http://127.0.0.1:${address.port}/result`);
  expect(requests).toBe(0);
  await example.getByRole("button", { name: "Open", exact: true }).click();
  await expect(example.frameLocator("iframe").getByRole("heading", { name: "Requested preview" })).toBeVisible();
  await expect(example.locator("iframe")).toHaveAttribute("sandbox", "allow-scripts");
  await expect(example.locator("iframe")).toHaveAttribute("referrerpolicy", "no-referrer");
  await example.getByRole("button", { name: "Reload", exact: true }).click();
  await expect.poll(() => requests).toBe(2);
  await expect(example.frameLocator("iframe").getByRole("heading", { name: "Requested preview" })).toBeVisible();
  await expect(example.locator("iframe")).toHaveAttribute("sandbox", "allow-scripts");
  await expect(example.locator("iframe")).toHaveAttribute("referrerpolicy", "no-referrer");
  } finally {
    await testInfo.attach("preview-navigation-diagnostics", { body: JSON.stringify({ diagnostics, requests, frames: page.frames().map(frame => frame.url()) }), contentType: "application/json" });
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});
