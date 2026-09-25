import { defineConfig, devices } from "@playwright/test";

// IP-10.2: journeys against the real API, worker and PostgreSQL, not a transport
// fixture. CI starts the API and worker containers first; Vite proxies /v1 to them.
export default defineConfig({
  testDir: "tests/stack",
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  reporter: [["list"]],
  timeout: 90000,
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop-chromium", use: { ...devices["Desktop Chrome"] } },
    {
      name: "mobile-390x844",
      use: {
        browserName: "chromium",
        hasTouch: true,
        isMobile: true,
        viewport: { width: 390, height: 844 },
      },
    },
  ],
  webServer: {
    command: "pnpm --filter @simulora/web dev --host 127.0.0.1 --port 4173",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    url: "http://127.0.0.1:4173",
  },
});
