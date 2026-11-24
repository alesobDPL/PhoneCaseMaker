import { expect, test } from '@playwright/test'

test('home responds with 200 and shows the main heading', async ({ page }) => {
  const response = await page.goto('/')
  expect(response?.status()).toBe(200)
  await expect(page.getByRole('heading', {
    level: 1,
    name: /Your Image on a Custom\s*Phone Case/,
  })).toBeVisible()
})
