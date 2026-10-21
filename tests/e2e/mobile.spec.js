import { test, expect } from '@playwright/test'
import { Buffer } from 'node:buffer'
import { mockBrowserApis } from './helpers/mockBrowserApis.js'
import {
  expectNoHorizontalOverflow,
  expectControlAccessible,
} from './helpers/responsive.js'

test.beforeEach(async ({ page }) => {
  await mockBrowserApis(page)
  await page.goto('/')
})

test('mobile navigation and controls remain accessible', async ({
  page,
}) => {
  const record = page.getByRole('button', {
    name: 'Start recording',
  })

  const projects = page.getByText('Projects', {
    exact: true,
  })

  const theme = page.getByRole('button', {
    name: 'Switch to dark mode',
  })

  await expectControlAccessible(page, record)
  await expectControlAccessible(page, theme)

  await expect(projects).toBeVisible()
  await expectNoHorizontalOverflow(page)

  await projects.click()

  await expect(
    page.getByRole('button', {
      name: 'Import project backup',
    })
  ).toBeVisible()

  await expectNoHorizontalOverflow(page)
})


test.describe('microphone permission denied', () => {
  test('shows recording permission error', async ({ page }) => {
    // Override the microphone mock on the current page.
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'mediaDevices', {
        configurable: true,
        value: {
          getUserMedia: async () => {
            throw new DOMException(
              'Permission denied',
              'NotAllowedError'
            )
          },
        },
      })
    })

    // Attempt recording.
    await page.getByRole('button', {
      name: 'Start recording',
    }).click()

    // Verify the actual application error.
    await expect(page.getByRole('alert')).toContainText(
      'Microphone access was denied or is unavailable.'
    )

    await expectNoHorizontalOverflow(page)
  })
})


test('records and stops with mocked microphone', async ({
  page,
}) => {
  await page.getByRole('button', {
    name: 'Start recording',
  }).click()

  await expect(page.getByRole('button', {
    name: 'Stop recording',
  })).toBeVisible()

  await page.getByRole('button', {
    name: 'Stop recording',
  }).click()

  await expect(page.getByRole('heading', {
    name: 'Review your audio',
  })).toBeVisible()

  const released = await page.evaluate(() => {
    return window.__microphoneStopped
  })

  expect(released).toBe(true)

  await expectNoHorizontalOverflow(page)
})


test('uploads synthetic audio on mobile', async ({ page }) => {
  await page.locator('input[accept="audio/*"]').setInputFiles({
    name: 'mobile-test.wav',
    mimeType: 'audio/wav',
    buffer: Buffer.from('synthetic audio'),
  })

  await expect(page.getByText('mobile-test.wav')).toBeVisible()

  await page.getByLabel('Transcription model')
    .selectOption('Xenova/whisper-tiny')

  await page.getByLabel('Spoken language')
    .selectOption('en')

  await expect(
    page.getByLabel('Spoken language')
  ).toHaveValue('en')

  await expectControlAccessible(
    page,
    page.getByRole('button', {
      name: 'Transcribe audio',
    })
  )

  await expectNoHorizontalOverflow(page)
})


test('completes mobile project save and reopen flow', async ({
  page,
}) => {
  // 1. Upload synthetic file
  await page.locator('input[accept="audio/*"]').setInputFiles({
    name: 'synthetic.wav',
    mimeType: 'audio/wav',
    buffer: Buffer.from('synthetic test audio'),
  })

  // 2. Transcribe using mocked worker
  await page.getByRole('button', {
    name: 'Transcribe audio',
  }).click()

  const transcript = page.getByRole('textbox', {
    name: 'Transcript segment 1',
  })

  await expect(transcript).toHaveValue(
    'Synthetic mobile transcript'
  )

  await expectNoHorizontalOverflow(page)

  // 3. Select translation language
  await page.getByRole('tab', {
    name: 'Translation',
  }).click()

  const targetLanguage = page.getByLabel(
    'Translation target language'
  )

  await targetLanguage.selectOption('fra_Latn')
  await expect(targetLanguage).toHaveValue('fra_Latn')

  // 4. Translate using mocked NLLB worker
  await page.getByRole('button', {
    name: 'Translate',
    exact: true,
  }).click()

  await expect(
    page.getByText('Transcription mobile synthétique')
  ).toBeVisible()

  // 5. Save through real UI to IndexedDB
  await page.getByRole('button', {
    name: 'Save locally',
  }).click()

  await expect(page.getByRole('button', {
    name: 'Saved locally',
  })).toBeVisible()

  // 6. Reset workspace
  await page.getByRole('button', {
    name: 'Start a new project',
  }).click()

  // 7. Open saved projects
  await page.getByText('Projects', {
    exact: true,
  }).click()

    await page.getByRole('button', {
    name: /^Synthetic mobile transcript\s/,
    }).click()

  // 8. Verify saved data was restored
  await expect(page.getByRole('textbox', {
    name: 'Transcript segment 1',
  })).toHaveValue('Synthetic mobile transcript')

  await page.getByRole('tab', {
    name: 'Translation',
  }).click()

  await expect(
    page.getByText('Transcription mobile synthétique')
  ).toBeVisible()

  await expectNoHorizontalOverflow(page)
})


test('persists theme after reload', async ({ page }) => {
  await page.getByRole('button', {
    name: 'Switch to dark mode',
  }).click()

  await expect(page.locator('html')).toHaveAttribute(
    'data-theme',
    'dark'
  )

  await page.reload()

  await expect(page.locator('html')).toHaveAttribute(
    'data-theme',
    'dark'
  )

  await page.getByRole('button', {
    name: 'Switch to light mode',
  }).click()

  await expect(page.locator('html')).toHaveAttribute(
    'data-theme',
    'light'
  )

  await expectNoHorizontalOverflow(page)
})


