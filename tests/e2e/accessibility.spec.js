import { expect, test } from '@playwright/test'
import process from 'node:process'
import { mockBrowserApis } from './helpers/mockBrowserApis.js'

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

test('keyboard can edit, verify stale translation is cleared, save, and reopen a transcript project', async ({ page }) => {
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
  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A')
  await page.keyboard.type('Edited with keyboard')
  await expect(editor).toHaveValue('Edited with keyboard')

  const transcriptionTab = page.getByRole('tab', { name: 'Transcription' })
  await transcriptionTab.focus()
  await page.keyboard.press('ArrowRight')
  const translationTab = page.getByRole('tab', { name: 'Translation' })
  await expect(translationTab).toHaveAttribute('aria-selected', 'true')
  const translationPanel = page.getByRole('tabpanel', { name: 'Translation' })
  await expect(translationPanel).toBeVisible()
  await expect(translationPanel.getByText('Transcription accessible au clavier')).toHaveCount(0)
  await expect(translationPanel.getByText('Select a target language to create a local translation.')).toBeVisible()

  await page.getByRole('tab', { name: 'Transcription' }).click()
  await page.getByRole('button', { name: 'Save locally' }).click()
  await expect(page.getByText('Project saved locally.')).toBeVisible()
  await expect(page.getByText('Project saved locally.')).toHaveAttribute('role', 'status')
  await page.getByText('Projects', { exact: true }).click()
  await expect(page.getByText('Edited with keyboard')).toBeVisible()
})

test('quick recording stop and processing stay announced through the full project journey', async ({ page }) => {
  await mockBrowserApis(page, { pauseTranscriptionAtDownload: true })
  await page.goto('/')

  await page.getByRole('button', { name: 'Start recording' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Recording started.' })).toBeVisible()
  await page.getByRole('button', { name: 'Stop recording' }).click()
  await expect(page.getByRole('heading', { name: 'Review your audio' })).toBeVisible()
  await expect(page.getByRole('status').filter({ hasText: 'Recording stopped.' })).toBeVisible()

  await page.getByRole('button', { name: 'Transcribe audio' }).click()
  await expect(page.getByText('Downloading the local AI model')).toBeVisible()
  const progress = page.getByRole('progressbar', { name: 'Model download progress' })
  await expect(progress).toHaveAttribute('aria-valuemin', '0')
  await expect(progress).toHaveAttribute('aria-valuemax', '100')
  await expect(progress).toHaveAttribute('aria-valuenow', '37')
  await expect(progress).toHaveAttribute('aria-valuetext', '37% downloaded')

  await page.evaluate(() => {
    window.__transcriptionWorker.emit({ type: 'LOADING', status: 'ready' })
    window.__transcriptionWorker.emit({ type: 'INFERENCE_PROGRESS', phase: 'detecting' })
  })
  await expect(page.getByText('Detecting the spoken language locally')).toBeVisible()
  await page.evaluate(() => {
    window.__transcriptionWorker.emit({ type: 'INFERENCE_PROGRESS', phase: 'transcribing' })
  })
  await expect(page.getByText('Transcribing your audio locally')).toBeVisible()
  await page.evaluate(() => {
    window.__transcriptionWorker.emit({
      type: 'RESULT',
      results: [{ index: 0, text: 'Synthetic mobile transcript', start: 0, end: 1 }],
    })
    window.__transcriptionWorker.emit({ type: 'INFERENCE_DONE' })
  })

  await expect(page.getByRole('textbox', { name: 'Transcript segment 1' })).toHaveValue('Synthetic mobile transcript')
  await page.getByRole('tab', { name: 'Translation' }).click()
  await page.getByLabel('Translation target language').selectOption('fra_Latn')
  await page.getByRole('button', { name: 'Translate', exact: true }).click()
  await expect(page.getByText('Transcription mobile synthétique')).toBeVisible()
  await page.getByRole('button', { name: 'Save locally' }).click()
  await expect(page.getByText('Project saved locally.')).toBeVisible()
  await page.getByRole('button', { name: 'Start a new project' }).click()
  await page.getByText('Projects', { exact: true }).click()
  await page.getByRole('button', { name: /^Synthetic mobile transcript\s/ }).click()
  await expect(page.getByRole('textbox', { name: 'Transcript segment 1' })).toHaveValue('Synthetic mobile transcript')
})
