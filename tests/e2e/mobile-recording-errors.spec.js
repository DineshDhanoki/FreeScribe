import { test, expect } from '@playwright/test'
import { mockBrowserApis } from './helpers/mockBrowserApis.js'
import { expectNoHorizontalOverflow } from './helpers/responsive.js'

test('shows error when microphone permission is denied', async ({
  page,
}) => {
  await mockBrowserApis(page, { permission: 'denied' })
  await page.goto('/')

  await page.getByRole('button', {
    name: 'Start recording',
  }).click()

  await expect(page.getByRole('alert')).toContainText(
    'Microphone access was denied or is unavailable.'
  )

  await expectNoHorizontalOverflow(page)
})

test('shows error when recording format is unsupported', async ({
  page,
}) => {
  await mockBrowserApis(page, {
    recordingSupported: false,
  })

  await page.goto('/')

  await page.getByRole('button', {
    name: 'Start recording',
  }).click()

  await expect(page.getByRole('alert')).toContainText(
    'This browser does not support a compatible recording format.'
  )

  await expectNoHorizontalOverflow(page)
})