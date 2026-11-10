const { defineConfig } = require('@playwright/test');

const port = process.env.E2E_PORT || '3100';

module.exports = defineConfig({
  testDir: './e2e',
  workers: 1,
  timeout: 60000,
  use: {
    baseURL: `http://localhost:${port}`,
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: `meteor run --port ${port}`,
    url: `http://localhost:${port}`,
    timeout: 180000,
    reuseExistingServer: !process.env.CI,
    gracefulShutdown: { signal: 'SIGTERM', timeout: 10000 },
  },
});
