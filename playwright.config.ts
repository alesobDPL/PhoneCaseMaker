import { loadEnvFile } from 'node:process'
import { defineConfig, devices } from '@playwright/test'

loadEnvFile('.env.example')

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  // The explicit screenshots command opts in; normal runs exclude captures.
  grepInvert: process.argv.includes('@screenshots') ? undefined : /@screenshots/,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:3100',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'node e2e/jwks-server.mjs',
      url: 'http://127.0.0.1:3199/.well-known/jwks.json',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'npm run build && npm run start -- --port 3100',
      port: 3100,
      timeout: 180_000,
      env: {
        NEXT_PUBLIC_SERVER_URL: 'http://localhost:3100',
        KINDE_SITE_URL: 'http://localhost:3100',
        KINDE_POST_LOGIN_REDIRECT_URL: 'http://localhost:3100/auth-callback',
        KINDE_POST_LOGOUT_REDIRECT_URL: 'http://localhost:3100',
        KINDE_ISSUER_URL: 'http://127.0.0.1:3199',
      },
    },
  ],
})
