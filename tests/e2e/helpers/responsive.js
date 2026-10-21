import { expect } from '@playwright/test'

export async function expectNoHorizontalOverflow(page) {
  await expect.poll(async () => {
    return page.evaluate(() => {
      const width = document.documentElement.clientWidth
      const contentWidth = document.documentElement.scrollWidth

      return contentWidth <= width + 1
    })
  }).toBe(true)
}

export async function expectControlAccessible(page, locator) {
  await expect(locator).toBeVisible()
  await expect(locator).toBeEnabled()

  await locator.scrollIntoViewIfNeeded()

  const bounds = await locator.evaluate((element) => {
    const rect = element.getBoundingClientRect()

    return {
      left: rect.left,
      right: rect.right,
      top: rect.top,
      bottom: rect.bottom,
      width: rect.width,
      height: rect.height,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
    }
  })

  expect(bounds.left).toBeGreaterThanOrEqual(-1)
  expect(bounds.right).toBeLessThanOrEqual(
    bounds.viewportWidth + 1
  )
  expect(bounds.top).toBeGreaterThanOrEqual(-1)
  expect(bounds.bottom).toBeLessThanOrEqual(
    bounds.viewportHeight + 1
  )

  // Verify the control can receive pointer interaction.
  await locator.click({ trial: true })
}