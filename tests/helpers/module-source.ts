import { expect, type APIResponse, type Page } from "@playwright/test";

// A cold Vite dev server under 4 workers can drop an in-flight keep-alive socket while it optimises dependencies.
// Retry only that transport failure; an HTTP status or an assertion is never retried.
const transportFailure = /ECONNRESET|ECONNREFUSED|socket hang up/;
const attempts = 3;

export async function moduleSource(page: Page, path: string): Promise<string> {
  let response: APIResponse | undefined;
  for (let attempt = 1; !response; attempt++) {
    try {
      response = await page.request.get(path);
    } catch (error) {
      if (attempt >= attempts || !transportFailure.test(String(error))) throw error;
      await new Promise(resolve => setTimeout(resolve, 250 * attempt));
    }
  }
  expect(response.ok(), `${path} answered ${response.status()}`).toBe(true);
  return response.text();
}
