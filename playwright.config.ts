import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

const PORT = 3100;
const baseURL = `http://127.0.0.1:${PORT}`;
const e2eDbPath = path.join(process.cwd(), "e2e.sqlite.db");

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `rm -f "${e2eDbPath}" "${e2eDbPath}-wal" "${e2eDbPath}-shm" && npx drizzle-kit migrate && npx next dev --hostname 127.0.0.1 --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      ...process.env,
      SQLITE_PATH: e2eDbPath,
      NEXT_DIST_DIR: ".next-e2e",
    },
  },
});
