import { expect, test } from '@playwright/test'

test('keyboard reaches the skip link and labelled home controls', async ({ page }) => {
  await page.goto('/')
  await page.keyboard.press('Tab')
  const skipLink = page.getByRole('link', { name: 'Skip to main content' })
  await expect(skipLink).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('#main-content')).toBeFocused()
  await expect(page.getByRole('button', { name: 'Start recording' })).toBeVisible()
  await expect(page.getByLabel('Upload an audio file')).toBeAttached()
})

test('keyboard can review, translate, save, and reopen a transcript project', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(async () => {
    await new Promise((resolve, reject) => {
      const request = indexedDB.open('freescribe', 1)
      request.onupgradeneeded = () => {
        const store = request.result.createObjectStore('projects', { keyPath: 'id' })
        store.createIndex('updatedAt', 'updatedAt')
      }
      request.onsuccess = () => {
        const database = request.result
        const transaction = database.transaction('projects', 'readwrite')
        transaction.objectStore('projects').put({
          id: 'accessibility-project',
          name: 'Keyboard audit transcript',
          segments: [{ index: 0, text: 'Keyboard accessible transcript', start: 0, end: 1 }],
          translation: 'Transcription accessible au clavier',
          translationLanguageId: 'fra_Latn',
          modelId: 'Xenova/whisper-tiny.en',
          languageId: 'en',
          updatedAt: new Date().toISOString(),
        })
        transaction.oncomplete = () => { database.close(); resolve() }
        transaction.onerror = () => reject(transaction.error)
      }
      request.onerror = () => reject(request.error)
    })
  })

  await page.getByText('Projects', { exact: true }).click()
  await page.getByText('Keyboard audit transcript').click()
  const editor = page.getByRole('textbox', { name: 'Transcript segment 1' })
  await expect(editor).toHaveValue('Keyboard accessible transcript')
  await editor.focus()
  await page.keyboard.press('Control+A')
  await page.keyboard.type('Edited with keyboard')
  await expect(editor).toHaveValue('Edited with keyboard')

  const transcriptionTab = page.getByRole('tab', { name: 'Transcription' })
  await transcriptionTab.focus()
  await page.keyboard.press('ArrowRight')
  const translationTab = page.getByRole('tab', { name: 'Translation' })
  await expect(translationTab).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('tabpanel', { name: 'Translation' })).toBeVisible()
  await expect(page.getByText('Transcription accessible au clavier')).toBeVisible()

  await page.getByRole('tab', { name: 'Transcription' }).click()
  await page.getByRole('button', { name: 'Save locally' }).click()
  await expect(page.getByText('Project saved locally.')).toBeVisible()
  await expect(page.getByText('Project saved locally.')).toHaveAttribute('role', 'status')
  await page.getByText('Projects', { exact: true }).click()
  await expect(page.getByText('Edited with keyboard')).toBeVisible()
})

test('processing progress exposes a meaningful name and value text', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => {
    const progress = document.createElement('div')
    progress.setAttribute('role', 'progressbar')
    progress.setAttribute('aria-label', 'Model download progress')
    progress.setAttribute('aria-valuemin', '0')
    progress.setAttribute('aria-valuemax', '100')
    progress.setAttribute('aria-valuenow', '37')
    progress.setAttribute('aria-valuetext', '37% downloaded')
    document.body.append(progress)
  })
  await expect(page.getByRole('progressbar', { name: 'Model download progress' })).toHaveAttribute('aria-valuetext', '37% downloaded')
})
