import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MessageTypes } from './presets'
import { WorkerMessageType } from '../services/workers/protocol'

describe('Whisper worker integration', () => {
  let messageHandler
  let postedMessages
  let fakeSelf

  beforeEach(() => {
    vi.resetModules()
    postedMessages = []
    fakeSelf = {
      addEventListener: vi.fn((type, handler) => {
        if (type === 'message') messageHandler = handler
      }),
      postMessage: vi.fn((message) => postedMessages.push(message)),
    }
    vi.stubGlobal('self', fakeSelf)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('uses the public ASR pipeline API and normalizes timestamped output', async () => {
    const transcriber = vi.fn().mockResolvedValue({
      chunks: [{ text: 'hello world', timestamp: [0, 1] }],
    })
    const pipeline = vi.fn().mockResolvedValue(transcriber)
    vi.doMock('@huggingface/transformers', () => ({ pipeline }))
    await import('./whisper.worker.js')

    await messageHandler({
      data: {
        type: MessageTypes.INFERENCE_REQUEST,
        audio: new Float32Array([0, 0.25]),
        model_name: 'Xenova/whisper-tiny.en',
        language: 'english',
      },
    })

    expect(pipeline).toHaveBeenCalledWith('automatic-speech-recognition', 'Xenova/whisper-tiny.en', {
      progress_callback: expect.any(Function),
      revision: '79fb389fc764e7c395bd330e9531d9d32ada7049',
    })
    expect(transcriber).toHaveBeenCalledWith(expect.any(Float32Array), {
      chunk_length_s: 30,
      stride_length_s: 5,
      return_timestamps: true,
      no_repeat_ngram_size: 3,
      repetition_penalty: 1.1,
    })
    expect(postedMessages).toContainEqual({
      type: MessageTypes.RESULT,
      results: [{ index: 0, text: 'hello world', start: 0, end: 1 }],
      isDone: false,
    })
    expect(postedMessages).toContainEqual({ type: WorkerMessageType.INFERENCE_DONE })
    expect(postedMessages).toContainEqual({ type: WorkerMessageType.INFERENCE_PROGRESS, phase: 'transcribing' })
  })

  it('passes language and task options to multilingual Whisper models', async () => {
    const transcriber = vi.fn().mockResolvedValue({ chunks: [{ text: 'hola', timestamp: [0, 1] }] })
    const pipeline = vi.fn().mockResolvedValue(transcriber)
    vi.doMock('@huggingface/transformers', () => ({ pipeline }))
    await import('./whisper.worker.js')

    await messageHandler({
      data: {
        type: MessageTypes.INFERENCE_REQUEST,
        audio: new Float32Array([0, 0.25]),
        model_name: 'Xenova/whisper-tiny',
        language: 'spanish',
      },
    })

    expect(transcriber).toHaveBeenCalledWith(expect.any(Float32Array), {
      chunk_length_s: 30,
      stride_length_s: 5,
      return_timestamps: true,
      no_repeat_ngram_size: 3,
      repetition_penalty: 1.1,
      language: 'spanish',
      task: 'transcribe',
    })
  })

  it('detects a supported language before transcribing in auto mode', async () => {
    const classifier = vi.fn().mockResolvedValue([
      { label: 'LABEL_12', score: 0.94 },
      { label: 'LABEL_16', score: 0.03 },
    ])
    const transcriber = vi.fn().mockResolvedValue({ chunks: [{ text: 'আমি ভালো আছি', timestamp: [0, 1] }] })
    const pipeline = vi.fn()
      .mockImplementationOnce(() => Promise.resolve(transcriber))
      .mockImplementationOnce(() => Promise.resolve(classifier))
    vi.doMock('@huggingface/transformers', () => ({ pipeline }))
    await import('./whisper.worker.js')

    await messageHandler({
      data: {
        type: MessageTypes.INFERENCE_REQUEST,
        audio: new Float32Array(16000),
        model_name: 'Xenova/whisper-tiny',
      },
    })

    expect(pipeline).toHaveBeenNthCalledWith(2, 'audio-classification', 'Xenova/mms-lid-256', {
      progress_callback: expect.any(Function),
      revision: '74c747185d407ca911d346a892241c95131d6fa3',
    })
    expect(classifier).toHaveBeenCalledWith(expect.any(Float32Array), { top_k: 5 })
    expect(postedMessages).toContainEqual({
      type: WorkerMessageType.LANGUAGE_DETECTED,
      languageId: 'bn',
      confidence: 0.94,
    })
    expect(transcriber).toHaveBeenCalledWith(expect.any(Float32Array), expect.objectContaining({ language: 'bengali', task: 'transcribe' }))
  })

  it('does not replace an unsupported top prediction with a weaker supported language', async () => {
    const classifier = vi.fn().mockResolvedValue([
      { label: 'LABEL_999', score: 0.81 },
      { label: 'LABEL_12', score: 0.12 },
    ])
    const transcriber = vi.fn()
    const pipeline = vi.fn()
      .mockImplementationOnce(() => Promise.resolve(transcriber))
      .mockImplementationOnce(() => Promise.resolve(classifier))
    vi.doMock('@huggingface/transformers', () => ({ pipeline }))
    await import('./whisper.worker.js')

    await messageHandler({
      data: {
        type: MessageTypes.INFERENCE_REQUEST,
        audio: new Float32Array(16000),
        model_name: 'Xenova/whisper-tiny',
      },
    })

    expect(transcriber).not.toHaveBeenCalled()
    expect(postedMessages).toContainEqual({
      type: WorkerMessageType.ERROR,
      message: 'The most likely spoken language is not supported by automatic mode. Please select the spoken language manually.',
    })
  })

  it('does not publish a result after cancellation', async () => {
    let resolveTranscription
    const transcriber = vi.fn().mockReturnValue(new Promise((resolve) => { resolveTranscription = resolve }))
    vi.doMock('@huggingface/transformers', () => ({ pipeline: vi.fn().mockResolvedValue(transcriber) }))
    await import('./whisper.worker.js')

    const request = messageHandler({
      data: {
        type: MessageTypes.INFERENCE_REQUEST,
        audio: new Float32Array([0, 0.25]),
        model_name: 'Xenova/whisper-tiny.en',
      },
    })
    await Promise.resolve()
    await messageHandler({ data: { type: WorkerMessageType.CANCEL } })
    resolveTranscription({ chunks: [{ text: 'stale', timestamp: [0, 1] }] })
    await request

    expect(postedMessages.some((message) => message.type === MessageTypes.RESULT)).toBe(false)
    expect(postedMessages.some((message) => message.type === WorkerMessageType.INFERENCE_DONE)).toBe(false)
  })

  it('rejects an unsupported model before invoking the pipeline', async () => {
    const pipeline = vi.fn()
    vi.doMock('@huggingface/transformers', () => ({ pipeline }))
    await import('./whisper.worker.js')

    await messageHandler({
      data: {
        type: MessageTypes.INFERENCE_REQUEST,
        audio: new Float32Array([0, 0.25]),
        model_name: 'https://attacker.invalid/model',
        language: 'english',
      },
    })

    expect(pipeline).not.toHaveBeenCalled()
    expect(postedMessages).toContainEqual({ type: WorkerMessageType.ERROR, message: 'Unsupported transcription model.' })
  })

  it('evicts a failed model load so a later request can retry', async () => {
    const transcriber = vi.fn().mockResolvedValue({ chunks: [{ text: 'recovered', timestamp: [0, 1] }] })
    const pipeline = vi.fn()
      .mockRejectedValueOnce(new Error('temporary download failure'))
      .mockResolvedValueOnce(transcriber)
    vi.doMock('@huggingface/transformers', () => ({ pipeline }))
    await import('./whisper.worker.js')

    const request = { type: MessageTypes.INFERENCE_REQUEST, audio: new Float32Array([0, 0.25]), model_name: 'Xenova/whisper-tiny.en', language: 'english' }
    await messageHandler({ data: request })
    await messageHandler({ data: request })

    expect(pipeline).toHaveBeenCalledTimes(2)
    expect(postedMessages).toContainEqual({ type: WorkerMessageType.ERROR, message: 'temporary download failure' })
    expect(postedMessages).toContainEqual(expect.objectContaining({ type: MessageTypes.RESULT, results: [{ index: 0, text: 'recovered', start: 0, end: 1 }] }))
  })
})
