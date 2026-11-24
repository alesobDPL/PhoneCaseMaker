import { expect, test } from './fixtures'

test('home shows demo banner with test card when DEMO_MODE', async ({ page }) => {
  test.skip(process.env.DEMO_MODE !== 'true', 'Requires DEMO_MODE=true')
  await page.goto('/')

  const banner = page.getByRole('complementary', { name: 'Demo mode' })
  await expect(banner).toBeVisible()
  await expect(banner).toContainText('4242 4242 4242 4242')
  await expect(banner).toContainText('any future date and any CVC')
  await expect(banner.getByRole('link', { name: 'Try the admin dashboard' }))
    .toHaveAttribute('href', '/dashboard')
})

test('upload page renders the dropzone', async ({ page }) => {
  await page.goto('/configure/upload')

  await expect(page.getByText('Click to upload')).toBeVisible()
  await expect(page.getByText('or drag and drop')).toBeVisible()
  await expect(page.locator('input[type="file"]')).toHaveAttribute('accept', /image\/png/)
})

test('preview without session opens the login modal', async ({ page, configurationId }) => {
  await page.goto(`/configure/preview?id=${configurationId}`)

  await expect(page.getByRole('heading', { name: 'Your iPhone 15' })).toBeVisible()
  await page.getByRole('button', { name: 'Check out' }).click()
  const dialog = page.getByRole('dialog', { name: 'Log in to continue' })
  await expect(dialog).toBeVisible()
  await expect(dialog).toContainText('Your configuration was saved!')
  await expect.poll(() => page.evaluate(() => localStorage.getItem('configurationId')))
    .toBe(configurationId)
})
