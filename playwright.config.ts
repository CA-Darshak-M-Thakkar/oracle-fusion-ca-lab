import { defineConfig } from '@playwright/test';

const chrome = process.env.CHROME_PATH || '/usr/local/bin/google-chrome';

export default defineConfig({
  testDir: './e2e',
  timeout: 240_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:5173',
    viewport: { width: 1366, height: 768 },
    launchOptions: { executablePath: chrome, args: ['--no-sandbox', '--disable-dev-shm-usage'] },
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 5173',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: false,
    timeout: 60_000,
    env: { VITE_E2E_BYPASS: '1' },
  },
});
