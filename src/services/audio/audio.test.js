import { describe, expect, it, vi } from 'vitest'
import { AUDIO_LIMITS, decodeAudioFile, getSupportedRecordingMimeType, resampleAudio, validateAudioFile } from './audio'

describe('audio service', () => {
  it('rejects missing and non-audio files', () => {
    expect(() => validateAudioFile()).toThrow('Choose an audio file first.')
    expect(() => validateAudioFile({ type: 'text/plain' })).toThrow('not a supported audio file')
  })

  it('accepts audio files', () => {
    const file = { type: 'audio/wav', name: 'sample.wav' }
    expect(validateAudioFile(file)).toBe(file)
  })

  it('falls back to a supported filename extension when MIME metadata is empty', () => {
    const file = { type: '', name: 'recording.wav', size: 10 }
    expect(validateAudioFile(file)).toBe(file)
  })

  it('rejects files that exceed the memory-safety limit', () => {
    expect(() => validateAudioFile({ type: 'audio/wav', size: AUDIO_LIMITS.maxFileSizeBytes + 1 }))
      .toThrow('smaller than')
  })

  it('rejects decoded audio that exceeds the duration limit', async () => {
    globalThis.AudioContext = class {
      async decodeAudioData() {
        return { duration: AUDIO_LIMITS.maxDurationSeconds + 1 }
      }

      async close() {}
    }
    await expect(decodeAudioFile({ type: 'audio/wav', size: 1, arrayBuffer: async () => new ArrayBuffer(1) }))
      .rejects.toThrow('shorter than')
  })

  it('selects the first supported recording type', () => {
    globalThis.MediaRecorder = {
      isTypeSupported: vi.fn((type) => type === 'audio/webm'),
    }
    expect(getSupportedRecordingMimeType()).toBe('audio/webm')
  })

  it('reports no recording type when MediaRecorder is unavailable', () => {
    const originalMediaRecorder = globalThis.MediaRecorder
    delete globalThis.MediaRecorder
    expect(getSupportedRecordingMimeType()).toBe('')
    globalThis.MediaRecorder = originalMediaRecorder
  })

  it('resamples audio to the model sample rate', () => {
    const source = Float32Array.from([0, 1, 0, -1])
    const result = resampleAudio(source, 4, 2)
    expect(result.length).toBe(2)
    expect(Array.from(result)).toEqual([0, 0])
  })

  it('does not copy or alter audio when rates already match', () => {
    const source = Float32Array.from([0.1, -0.2])
    expect(resampleAudio(source, 16000, 16000)).toBe(source)
  })
})
