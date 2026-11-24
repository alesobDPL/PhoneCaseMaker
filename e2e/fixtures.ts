import { test as base, expect } from '@playwright/test'

export const test = base.extend<{ configurationId: string }>({
  configurationId: async ({}, use) => {
    const id = process.env.E2E_CONFIGURATION_ID
    if (!id) throw new Error('Missing configuration from Playwright globalSetup')
    await use(id)
  },
})

export { expect }
