import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { expect, test } from './fixtures'

test.describe('Portfolio captures @screenshots', () => {
  test.use({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' })

  test.beforeAll(async () => {
    await mkdir(resolve('docs/assets'), { recursive: true })
  })

  test('home', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', {
      level: 1,
      name: /Your Image on a Custom\s*Phone Case/,
    })).toBeVisible()
    await page.screenshot({ path: resolve('docs/assets/home.png'), animations: 'disabled' })
  })

  test('upload', async ({ page }) => {
    await page.goto('/configure/upload')
    await expect(page.getByText('Click to upload')).toBeVisible()
    await page.screenshot({ path: resolve('docs/assets/upload.png'), animations: 'disabled' })
  })

  test('design', async ({ page, configurationId }) => {
    await page.goto(`/configure/design?id=${configurationId}`)
    await expect(page.getByRole('heading', { name: 'Customize your case' })).toBeVisible()
    await expect(page.getByAltText('your image')).toHaveJSProperty('complete', true)
    await expect(page.getByAltText('your image')).not.toHaveJSProperty('naturalWidth', 0)
    await page.screenshot({ path: resolve('docs/assets/design.png'), animations: 'disabled' })
  })

  test('preview', async ({ page, configurationId }) => {
    await page.goto(`/configure/preview?id=${configurationId}`)
    await expect(page.getByRole('heading', { name: 'Your iPhone 15' })).toBeVisible()
    await expect(page.getByAltText('overlaying phone image')).not.toHaveJSProperty('naturalWidth', 0)
    await page.screenshot({ path: resolve('docs/assets/preview.png'), animations: 'disabled' })
  })
})
