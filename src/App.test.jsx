import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { decodeAudioFile } from './services/audio/audio'
import { MessageTypes } from './utils/presets'
import { WorkerMessageType } from './services/workers/protocol'

vi.mock('./services/audio/audio', async () => {
  const actual = await vi.importActual('./services/audio/audio')
  return { ...actual, decodeAudioFile: vi.fn() }
})

class FakeWorker {
  static instances = []

  constructor() {
    this.listeners = { message: [], error: [] }
    this.lastMessage = null
    this.terminated = false
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

  terminate() {
    this.terminated = true
  }

  emit(data) {
    this.listeners.message.forEach((listener) => listener({ data }))
  }
}

describe('App transcription integration', () => {
  beforeEach(() => {
    FakeWorker.instances = []
    vi.stubGlobal('Worker', FakeWorker)
    decodeAudioFile.mockResolvedValue(new Float32Array([0, 0.25, -0.25]))
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
    vi.unstubAllGlobals()
  })

  it('connects upload, worker lifecycle, metrics, and source cleanup', async () => {
    const { container } = render(<App />)
    const input = container.querySelector('input[accept="audio/*"]')
    fireEvent.change(input, {
      target: { files: [new File(['audio'], 'sample.wav', { type: 'audio/wav' })] },
    })

    await screen.findByText('sample.wav')
    fireEvent.click(screen.getByRole('button', { name: /transcribe/i }))

    const transcriptionWorker = FakeWorker.instances[0]
    await waitFor(() => expect(transcriptionWorker.lastMessage?.type).toBe(MessageTypes.INFERENCE_REQUEST))
    expect(transcriptionWorker.lastMessage.audio).toBeInstanceOf(Float32Array)

    transcriptionWorker.emit({ type: WorkerMessageType.LOADING, status: 'ready' })
    transcriptionWorker.emit({
      type: WorkerMessageType.RESULT,
      results: [{ index: 0, text: 'hello world', start: 0, end: 1 }],
    })
    transcriptionWorker.emit({ type: WorkerMessageType.INFERENCE_DONE })

    await screen.findByRole('textbox', { name: 'Transcript segment 1' })
    expect(screen.getByText(/Processed/)).toBeInTheDocument()
    expect(screen.queryByText('sample.wav')).not.toBeInTheDocument()
    expect(decodeAudioFile).toHaveBeenCalledOnce()
  })

  it('keeps the source available for retry after a decode failure', async () => {
    decodeAudioFile
      .mockRejectedValueOnce(new Error('Unable to decode audio'))
      .mockResolvedValueOnce(new Float32Array([0, 0.1]))
    const { container } = render(<App />)
    fireEvent.change(container.querySelector('input[accept="audio/*"]'), {
      target: { files: [new File(['audio'], 'retry.wav', { type: 'audio/wav' })] },
    })

    await screen.findByText('retry.wav')
    fireEvent.click(screen.getByRole('button', { name: /transcribe/i }))
    expect(await screen.findByRole('button', { name: 'Retry transcription' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Choose another file' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Retry transcription' }))
    await waitFor(() => expect(FakeWorker.instances[0].lastMessage?.type).toBe(MessageTypes.INFERENCE_REQUEST))
    expect(decodeAudioFile).toHaveBeenCalledTimes(2)
  })

  it('does not submit audio when the workspace is reset during decoding', async () => {
    let resolveDecode
    decodeAudioFile.mockReturnValueOnce(new Promise((resolve) => { resolveDecode = resolve }))
    const { container } = render(<App />)
    fireEvent.change(container.querySelector('input[accept="audio/*"]'), {
      target: { files: [new File(['audio'], 'stale.wav', { type: 'audio/wav' })] },
    })

    await screen.findByText('stale.wav')
    fireEvent.click(screen.getByRole('button', { name: /transcribe/i }))
    fireEvent.click(screen.getByRole('button', { name: /new/i }))
    resolveDecode(new Float32Array([0, 0.1]))
    await Promise.resolve()

    expect(FakeWorker.instances[0].lastMessage).toBeNull()
    expect(screen.getByRole('button', { name: 'Start recording' })).toBeInTheDocument()
  })

  it('terminates an active worker on cancel and recreates it for retry', async () => {
    const { container } = render(<App />)
    fireEvent.change(container.querySelector('input[accept="audio/*"]'), {
      target: { files: [new File(['audio'], 'cancel.wav', { type: 'audio/wav' })] },
    })

    await screen.findByText('cancel.wav')
    fireEvent.click(screen.getByRole('button', { name: /transcribe/i }))
    const firstWorker = FakeWorker.instances[0]
    await waitFor(() => expect(firstWorker.lastMessage?.type).toBe(MessageTypes.INFERENCE_REQUEST))

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(firstWorker.terminated).toBe(true)

    fireEvent.click(screen.getByRole('button', { name: /transcribe/i }))
    await waitFor(() => expect(FakeWorker.instances).toHaveLength(2))
    const secondWorker = FakeWorker.instances[1]
    await waitFor(() => expect(secondWorker.lastMessage?.type).toBe(MessageTypes.INFERENCE_REQUEST))
    expect(secondWorker).not.toBe(firstWorker)
  })
})
