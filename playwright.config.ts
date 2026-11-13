import { defineConfig, devices } from "@playwright/test";

const STUB_PORT = 54329;
const APP_PORT = 5199;

/**
 * Browser tests run the real app (dev server) against an in-memory Supabase stand-in (e2e/stub-supabase.mjs).
 * The shell variables below override .env, so these tests can never reach the live Supabase project.
 */
export default defineConfig({
  testDir: "./e2e",
  testMatch: /.*\.spec\.ts/,
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: [["list"]],
  use: {
    baseURL: `http://127.0.0.1:${APP_PORT}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    channel: "chrome",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], channel: "chrome", viewport: { width: 1280, height: 800 } } },
    { name: "mobile", use: { ...devices["Pixel 7"], channel: "chrome" }, grep: /@mobile/ },
  ],
  webServer: [
    { command: "node e2e/stub-supabase.mjs", port: STUB_PORT, env: { STUB_PORT: String(STUB_PORT) }, reuseExistingServer: true },
    {
      command: `npx vite dev --port ${APP_PORT} --host 127.0.0.1 --strictPort`,
      port: APP_PORT,
      timeout: 120_000,
      reuseExistingServer: true,
      env: {
        VITE_SUPABASE_URL: `http://127.0.0.1:${STUB_PORT}`,
        VITE_SUPABASE_PUBLISHABLE_KEY: "stub-anon-key",
      },
    },
  ],
});
