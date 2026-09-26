import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { expect, test, type APIResponse, type Page, type Route } from "@playwright/test";
import { moduleSource, routeSource } from "./helpers/module-source";

// page.route cannot fault page.request or route.fetch (both bypass the browser), so a local server drops
// sockets the way a resetting Vite dev server does. Each test states which responses the server gives, in order.
async function serve(plan: Array<"drop" | "garbage" | 200 | 500>) {
  let hits = 0;
  const server: Server = createServer((request, response) => {
    if (request.url !== "/preview/main.tsx") return void response.writeHead(404).end(); // e.g. the browser's favicon
    const step = plan[Math.min(hits++, plan.length - 1)];
    if (step === "drop") request.socket.destroy();
    else if (step === "garbage") request.socket.end("not http\r\n\r\n");
    else response.writeHead(step).end(`source ${hits}`);
  });
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/preview/main.tsx`;
  return { url, hits: () => hits, close: () => new Promise(resolve => server.close(resolve)) };
}

// Navigates to url through page.route and reports what `fetch` gave the handler: the body, or the error it threw.
async function intercepted(page: Page, url: string, fetch: (route: Route) => Promise<APIResponse>) {
  let outcome = "";
  await page.route(url, async route => {
    try { outcome = await (await fetch(route)).text(); }
    catch (error) { outcome = String(error); }
    await route.fulfill({ body: "done" });
  });
  await page.goto(url);
  await page.unrouteAll();
  return outcome;
}

test("a dropped socket fails a raw fetch but the helper retries it", async ({ page }) => {
  const raw = await serve(["drop", 200]);
  await expect(page.request.get(raw.url)).rejects.toThrow(/socket hang up|ECONNRESET/);
  await raw.close();

  const server = await serve(["drop", "drop", 200]);
  expect(await moduleSource(page, server.url)).toBe("source 3");
  expect(server.hits()).toBe(3);
  await server.close();
});

test("the helper gives up after three dropped sockets", async ({ page }) => {
  const server = await serve(["drop"]);
  await expect(moduleSource(page, server.url)).rejects.toThrow(/socket hang up|ECONNRESET/);
  expect(server.hits()).toBe(3);
  await server.close();
});

test("a dropped socket fails a raw route.fetch but routeSource retries it", async ({ page }) => {
  const raw = await serve(["drop", 200]);
  expect(await intercepted(page, raw.url, route => route.fetch())).toMatch(/socket hang up|ECONNRESET/);
  expect(raw.hits()).toBe(1);
  await raw.close();

  const server = await serve(["drop", "drop", 200]);
  expect(await intercepted(page, server.url, routeSource)).toBe("source 3");
  expect(server.hits()).toBe(3);
  await server.close();
});

test("routeSource gives up after three dropped sockets and never retries an HTTP error", async ({ page }) => {
  const dropped = await serve(["drop"]);
  expect(await intercepted(page, dropped.url, routeSource)).toMatch(/socket hang up|ECONNRESET/);
  expect(dropped.hits()).toBe(3);
  await dropped.close();

  const failing = await serve([500, 200]);
  expect(await intercepted(page, failing.url, routeSource)).toMatch(/answered 500/);
  expect(failing.hits()).toBe(1);
  await failing.close();
});

test("an HTTP error fails at once and is never retried", async ({ page }) => {
  const server = await serve([500, 200]);
  await expect(moduleSource(page, server.url)).rejects.toThrow(/answered 500/);
  expect(server.hits()).toBe(1);
  await server.close();
});

test("a malformed response is not a dropped socket and is never retried", async ({ page }) => {
  const server = await serve(["garbage", 200]);
  await expect(moduleSource(page, server.url)).rejects.toThrow(/Parse Error/i);
  expect(server.hits()).toBe(1);
  await server.close();
});
