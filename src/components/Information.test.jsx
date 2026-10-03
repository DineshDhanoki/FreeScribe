import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Information from './Information'
import { TranslationMessageType } from '../services/workers/protocol'

class FakeWorker {
  static instances = []

  constructor() {
    this.listeners = { message: [], error: [] }
    this.lastMessage = null
    FakeWorker.instances.push(this)
  }

  addEventListener(type, listener) {
    this.listeners[type].push(listener)
  }

  removeEventListener(type, listener) {
    this.listeners[type] = this.listeners[type].filter((candidate) => candidate !== listener)
  }

  postMessage(message) {
    this.lastMessage = message
  }

  terminate() {}

  emit(data) {
    this.listeners.message.forEach((listener) => listener({ data }))
  }
}

describe('Information translation integration', () => {
  const defaultProps = {
    output: [{ index: 0, text: 'hello world', start: 0, end: 1 }],
    finished: true,
    metrics: { audioDurationSeconds: 1, elapsedMs: 500 },
    sourceLanguage: { id: 'en', nllb: 'eng_Latn' },
    modelId: 'Xenova/whisper-tiny.en',
  }

  beforeEach(() => {
    FakeWorker.instances = []
    vi.stubGlobal('Worker', FakeWorker)
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('sends a typed translation request and renders the worker result', async () => {
    render(
      <Information
        output={[{ index: 0, text: 'hello world', start: 0, end: 1 }]}
        finished
        metrics={{ audioDurationSeconds: 1, elapsedMs: 500 }}
        sourceLanguage={{ id: 'en', nllb: 'eng_Latn' }}
        modelId='Xenova/whisper-tiny.en'
      />,
    )

    expect(screen.getByRole('tab', { name: 'Transcription' })).toHaveAttribute('aria-selected', 'true')
    fireEvent.keyDown(screen.getByRole('tab', { name: 'Transcription' }), { key: 'ArrowRight' })
    expect(screen.getByRole('tab', { name: 'Translation' })).toHaveAttribute('aria-selected', 'true')
    fireEvent.change(screen.getByLabelText('Translation target language'), { target: { value: 'spa_Latn' } })
    fireEvent.click(screen.getByRole('button', { name: 'Translate' }))

    const translationWorker = FakeWorker.instances[0]
    await waitFor(() => expect(translationWorker.lastMessage).toMatchObject({
      text: 'hello world',
      src_lang: 'eng_Latn',
      tgt_lang: 'spa_Latn',
    }))

    translationWorker.emit({ type: TranslationMessageType.UPDATE, output: 'hola mundo' })
    translationWorker.emit({ type: TranslationMessageType.COMPLETE, output: 'hola mundo' })

    expect(await screen.findByText('hola mundo')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Translate' })).toBeEnabled()

    fireEvent.click(screen.getByRole('tab', { name: 'Transcription' }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Transcript segment 1' }), { target: { value: 'edited source' } })
    fireEvent.click(screen.getByRole('tab', { name: 'Translation' }))
    expect(screen.queryByText('hola mundo')).not.toBeInTheDocument()
  })

  it('renders translation model progress accessibly', async () => {
    render(<Information {...defaultProps} />)
    fireEvent.click(screen.getByRole('tab', { name: 'Translation' }))
    fireEvent.change(screen.getByRole('combobox', { name: 'Translation target language' }), { target: { value: 'spa_Latn' } })
    fireEvent.click(screen.getByRole('button', { name: 'Translate' }))

    const translationWorker = FakeWorker.instances[0]
    translationWorker.emit({ type: TranslationMessageType.PROGRESS, progress: 42 })
    expect(await screen.findByRole('progressbar', { name: 'Translation model progress' })).toHaveAttribute('aria-valuenow', '42')
  })

  it('cancels translation and ignores late worker results', async () => {
    render(
      <Information
        output={[{ index: 0, text: 'hello world', start: 0, end: 1 }]}
        finished
        metrics={{ audioDurationSeconds: 1, elapsedMs: 500 }}
        sourceLanguage={{ id: 'en', nllb: 'eng_Latn' }}
        modelId='Xenova/whisper-tiny.en'
      />,
    )
    fireEvent.click(screen.getByRole('tab', { name: 'Translation' }))
    fireEvent.change(screen.getByLabelText('Translation target language'), { target: { value: 'spa_Latn' } })
    fireEvent.click(screen.getByRole('button', { name: 'Translate' }))
    const translationWorker = FakeWorker.instances[0]
    await screen.findByRole('button', { name: 'Cancel translation' })
    fireEvent.click(screen.getByRole('button', { name: 'Cancel translation' }))
    translationWorker.emit({ type: TranslationMessageType.UPDATE, output: 'late result' })
    expect(screen.queryByText('late result')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Translate' })).toBeEnabled()
  })

  it('exposes a local benchmark export without requiring audio or transcript upload', () => {
    render(<Information {...defaultProps} />)
    expect(screen.getByRole('button', { name: 'Export benchmark run' })).toBeInTheDocument()
  })

  it('cancels translation when the source transcript is edited', async () => {
    render(
      <Information
        output={[{ index: 0, text: 'hello world', start: 0, end: 1 }]}
        finished
        metrics={{ audioDurationSeconds: 1, elapsedMs: 500 }}
        sourceLanguage={{ id: 'en', nllb: 'eng_Latn' }}
        modelId='Xenova/whisper-tiny.en'
      />,
    )
    fireEvent.click(screen.getByRole('tab', { name: 'Translation' }))
    fireEvent.change(screen.getByLabelText('Translation target language'), { target: { value: 'spa_Latn' } })
    fireEvent.click(screen.getByRole('button', { name: 'Translate' }))
    const translationWorker = FakeWorker.instances[0]
    await screen.findByRole('button', { name: 'Cancel translation' })

    fireEvent.click(screen.getByRole('tab', { name: 'Transcription' }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Transcript segment 1' }), { target: { value: 'edited source' } })
    translationWorker.emit({ type: TranslationMessageType.UPDATE, output: 'stale result' })

    expect(screen.queryByText('stale result')).not.toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Translation' })).toBeInTheDocument()
  })
})
