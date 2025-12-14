import { test, expect } from '@playwright/test'

test.describe.skip('Pit Wall Strategist UI', () => {
  test('loads app root', async ({ page }) => {
    await page.goto('http://localhost:5173/')
    await expect(page.locator('#root')).toBeVisible()
  })
})
