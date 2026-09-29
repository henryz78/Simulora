import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure",
    // PX-4a: the product plays directly by default. These journeys review each
    // change, so they start in Strict mode; direct-play tests clear this.
    storageState: {
      cookies: [],
      origins: [
        {
          origin: "http://127.0.0.1:4173",
          localStorage: [{ name: "simulora.strictMode", value: "on" }],
        },
      ],
    },
  },
  // IP-9.8: the same journeys on each engine and form factor the product supports.
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
    { name: "desktop-firefox", use: { ...devices["Desktop Firefox"] } },
    {
      name: "mobile-webkit-390x844",
      use: {
        browserName: "webkit",
        hasTouch: true,
        isMobile: true,
        viewport: { width: 390, height: 844 },
      },
    },
    {
      name: "tablet-chromium-768x1024",
      use: { browserName: "chromium", hasTouch: true, viewport: { width: 768, height: 1024 } },
    },
  ],
  webServer: {
    command: "pnpm --filter @simulora/web dev --host 127.0.0.1 --port 4173",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    url: "http://127.0.0.1:4173",
  },
});
