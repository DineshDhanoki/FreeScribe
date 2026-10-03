/* global Buffer */
import { expect, test } from '@playwright/test'

test('boots with accessible recording and project controls', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('main').getByRole('heading', { name: 'FreeScribe' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Start recording' })).toBeVisible()
  await expect(page.getByText('Projects', { exact: true })).toBeVisible()
  await expect(page.getByText('upload')).toBeVisible()
})

test('loads a locally saved project through the UI', async ({ page }) => {
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
          id: 'e2e-project',
          name: 'Browser smoke transcript',
          segments: [{ index: 0, text: 'Saved from browser', start: 0, end: 1 }],
          translation: 'Guardado desde el navegador',
          translationLanguageId: 'spa_Latn',
          updatedAt: new Date().toISOString(),
        })
        transaction.oncomplete = () => { database.close(); resolve() }
        transaction.onerror = () => reject(transaction.error)
      }
      request.onerror = () => reject(request.error)
    })
  })

  await page.getByText('Projects', { exact: true }).click()
  await expect(page.getByText('Browser smoke transcript')).toBeVisible()
  await page.getByText('Browser smoke transcript').click()
  await expect(page.getByRole('textbox', { name: 'Transcript segment 1' })).toHaveValue('Saved from browser')
  await page.getByRole('tab', { name: 'Translation' }).click()
  await expect(page.getByText('Guardado desde el navegador')).toBeVisible()
})

test('exposes model and spoken-language controls after upload', async ({ page }) => {
  await page.goto('/')
  await page.locator('input[accept="audio/*"]').setInputFiles({
    name: 'sample.mp3',
    mimeType: 'audio/mpeg',
    buffer: Buffer.from('browser-fixture'),
  })

  await expect(page.getByText('sample.mp3')).toBeVisible()
  const model = page.getByLabel('Transcription model')
  const language = page.getByLabel('Spoken language')
  await model.selectOption('Xenova/whisper-tiny')
  await language.selectOption('hi')
  await expect(model).toHaveValue('Xenova/whisper-tiny')
  await expect(language).toHaveValue('hi')
})
