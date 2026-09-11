import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.HARSO_UI_PORT ?? 4192);

export default defineConfig({
  testDir: "./tests",
  testMatch: ["boundaryless-*.spec.ts"],
  workers: 4,
  timeout: 120_000,
  reporter: "list",
  snapshotPathTemplate: "{testDir}/snapshots/{platform}/{arg}{ext}",
  use: { ...devices["Desktop Chrome"], baseURL: `http://127.0.0.1:${port}`, viewport: { width: 1512, height: 1040 }, trace: "retain-on-failure" },
  webServer: { command: `./node_modules/.bin/vite --host 127.0.0.1 --port ${port} --strictPort`, url: `http://127.0.0.1:${port}/`, reuseExistingServer: true }
});
