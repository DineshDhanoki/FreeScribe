import { describe, expect, it } from 'vitest'
import { isTranscriptionRequest, isTranscriptionWorkerMessage, isTranslationRequest, isTranslationWorkerMessage, TranslationMessageType, WorkerMessageType } from './protocol'

describe('worker protocol', () => {
  it('accepts valid typed messages', () => {
    expect(isTranscriptionWorkerMessage({ type: WorkerMessageType.RESULT, results: [] })).toBe(true)
    expect(isTranscriptionWorkerMessage({ type: WorkerMessageType.DOWNLOADING, progress: 50 })).toBe(true)
    expect(isTranscriptionWorkerMessage({ type: WorkerMessageType.INFERENCE_PROGRESS, phase: 'transcribing' })).toBe(true)
  })

  it('rejects malformed or unknown messages', () => {
    expect(isTranscriptionWorkerMessage(null)).toBe(false)
    expect(isTranscriptionWorkerMessage({ type: 'UNKNOWN' })).toBe(false)
    expect(isTranscriptionWorkerMessage({ type: WorkerMessageType.RESULT, results: null })).toBe(false)
    expect(isTranscriptionWorkerMessage({ type: WorkerMessageType.ERROR })).toBe(false)
    expect(isTranscriptionWorkerMessage({ type: WorkerMessageType.DOWNLOADING, progress: -1 })).toBe(false)
    expect(isTranscriptionWorkerMessage({ type: WorkerMessageType.DOWNLOADING, progress: 101 })).toBe(false)
    expect(isTranscriptionWorkerMessage({ type: WorkerMessageType.DOWNLOADING, progress: Number.NaN })).toBe(false)
    expect(isTranscriptionWorkerMessage({ type: WorkerMessageType.INFERENCE_PROGRESS, phase: 'unknown' })).toBe(false)
  })

  it('validates translation lifecycle messages', () => {
    expect(isTranslationWorkerMessage({ type: TranslationMessageType.INITIATE })).toBe(true)
    expect(isTranslationWorkerMessage({ type: TranslationMessageType.UPDATE, output: 'hola' })).toBe(true)
    expect(isTranslationWorkerMessage({ type: TranslationMessageType.PROGRESS, progress: 25 })).toBe(true)
    expect(isTranslationWorkerMessage({ type: TranslationMessageType.UPDATE, output: null })).toBe(false)
    expect(isTranslationWorkerMessage({ type: 'UPDATE', output: 'hola' })).toBe(false)
    expect(isTranslationWorkerMessage({ type: TranslationMessageType.PROGRESS, progress: 101 })).toBe(false)
  })

  it('validates inbound model requests', () => {
    expect(isTranscriptionRequest({ type: WorkerMessageType.INFERENCE_REQUEST, audio: new Float32Array([0.1]) })).toBe(true)
    expect(isTranscriptionRequest({ type: WorkerMessageType.INFERENCE_REQUEST, audio: [] })).toBe(false)
    expect(isTranslationRequest({ text: 'hello', src_lang: 'eng_Latn', tgt_lang: 'spa_Latn' })).toBe(true)
    expect(isTranslationRequest({ text: ' ', src_lang: 'eng_Latn', tgt_lang: 'spa_Latn' })).toBe(false)
    expect(isTranslationRequest({ text: 'hello', src_lang: 'eng_Latn' })).toBe(false)
  })
})
