import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TranslationMessageType, WorkerMessageType } from '../services/workers/protocol'

describe('translation worker integration', () => {
  let messageHandler
  let postedMessages

  beforeEach(() => {
    vi.resetModules()
    postedMessages = []
    vi.stubGlobal('self', {
      addEventListener: vi.fn((type, handler) => {
        if (type === 'message') messageHandler = handler
      }),
      postMessage: vi.fn((message) => postedMessages.push(message)),
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('uses NLLB language codes and normalizes translation output', async () => {
    const translator = vi.fn().mockResolvedValue([{ translation_text: 'hola mundo' }])
    const pipeline = vi.fn().mockResolvedValue(translator)
    vi.doMock('@huggingface/transformers', () => ({ pipeline }))
    await import('./translate.worker.js')

    await messageHandler({
      data: {
        text: 'hello world',
        src_lang: 'eng_Latn',
        tgt_lang: 'afr_Latn',
      },
    })

    expect(pipeline).toHaveBeenCalledWith('translation', 'Xenova/nllb-200-distilled-600M', {
      progress_callback: expect.any(Function),
      revision: '261c31d1a5732c67cdd16d80e8d6088507c7ccea',
    })
    expect(translator).toHaveBeenCalledWith('hello world', {
      src_lang: 'eng_Latn',
      tgt_lang: 'afr_Latn',
    })
    expect(postedMessages).toContainEqual({ type: TranslationMessageType.UPDATE, output: 'hola mundo' })
    expect(postedMessages).toContainEqual({ type: TranslationMessageType.COMPLETE, output: 'hola mundo' })
  })

  it('does not publish a stale translation after cancellation', async () => {
    let resolveTranslation
    const translator = vi.fn().mockReturnValue(new Promise((resolve) => { resolveTranslation = resolve }))
    vi.doMock('@huggingface/transformers', () => ({ pipeline: vi.fn().mockResolvedValue(translator) }))
    await import('./translate.worker.js')

    const request = messageHandler({ data: { text: 'hello', src_lang: 'eng_Latn', tgt_lang: 'fra_Latn' } })
    await Promise.resolve()
    await messageHandler({ data: { type: WorkerMessageType.CANCEL } })
    resolveTranslation([{ translation_text: 'bonjour' }])
    await request

    expect(postedMessages.some((message) => message.type === TranslationMessageType.UPDATE)).toBe(false)
    expect(postedMessages.some((message) => message.type === TranslationMessageType.COMPLETE)).toBe(false)
  })

  it('rejects unsupported language codes before invoking the pipeline', async () => {
    const pipeline = vi.fn()
    vi.doMock('@huggingface/transformers', () => ({ pipeline }))
    await import('./translate.worker.js')

    await messageHandler({ data: { text: 'hello', src_lang: 'evil', tgt_lang: 'spa_Latn' } })

    expect(pipeline).not.toHaveBeenCalled()
    expect(postedMessages).toContainEqual({ type: TranslationMessageType.ERROR, message: 'Unsupported translation language.' })
  })

  it('evicts a failed model load so a later request can retry', async () => {
    const translator = vi.fn().mockResolvedValue([{ translation_text: 'recovered' }])
    const pipeline = vi.fn()
      .mockRejectedValueOnce(new Error('temporary download failure'))
      .mockResolvedValueOnce(translator)
    vi.doMock('@huggingface/transformers', () => ({ pipeline }))
    await import('./translate.worker.js')

    const request = { text: 'hello', src_lang: 'eng_Latn', tgt_lang: 'spa_Latn' }
    await messageHandler({ data: request })
    await messageHandler({ data: request })

    expect(pipeline).toHaveBeenCalledTimes(2)
    expect(postedMessages).toContainEqual({ type: TranslationMessageType.ERROR, message: 'temporary download failure' })
    expect(postedMessages).toContainEqual({ type: TranslationMessageType.COMPLETE, output: 'recovered' })
  })
})
