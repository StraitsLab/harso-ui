import { expect, type APIResponse, type Page, type Route } from "@playwright/test";

// A cold Vite dev server under 4 workers can drop an in-flight keep-alive socket while it optimises dependencies.
// page.request and route.fetch share that APIRequestContext transport. Retry only the transport failure; an HTTP
// status or an assertion is never retried.
const transportFailure = /ECONNRESET|ECONNREFUSED|socket hang up/;
const attempts = 3;

async function okResponse(send: () => Promise<APIResponse>, label: string): Promise<APIResponse> {
  let response: APIResponse | undefined;
  for (let attempt = 1; !response; attempt++) {
    try {
      response = await send();
    } catch (error) {
      if (attempt >= attempts || !transportFailure.test(String(error))) throw error;
      await new Promise(resolve => setTimeout(resolve, 250 * attempt));
    }
  }
  expect(response.ok(), `${label} answered ${response.status()}`).toBe(true);
  return response;
}

export async function moduleSource(page: Page, path: string): Promise<string> {
  return (await okResponse(() => page.request.get(path), path)).text();
}

// The server's response to an intercepted request, for rewriting and passing to route.fulfill({ response, body }).
export function routeSource(route: Route): Promise<APIResponse> {
  return okResponse(() => route.fetch(), route.request().url());
}
