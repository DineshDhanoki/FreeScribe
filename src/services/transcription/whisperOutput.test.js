import { describe, expect, it } from 'vitest'
import { normalizeWhisperOutput } from './whisperOutput'

describe('Whisper output normalization', () => {
  it('normalizes timestamped chunks into transcript segments', () => {
    expect(normalizeWhisperOutput({
      chunks: [
        { text: ' Hello ', timestamp: [0.2, 1.4] },
        { text: '', timestamp: [1.4, 2] },
      ],
    })).toEqual([{ index: 0, text: 'Hello', start: 0, end: 1 }])
  })

  it('supports singular and plural timestamp fields', () => {
    expect(normalizeWhisperOutput({ chunks: [{ text: 'test', timestamps: [2, 3] }] })[0]).toMatchObject({ start: 2, end: 3 })
  })

  it('supports a plain text pipeline response', () => {
    expect(normalizeWhisperOutput({ text: ' hello ' })).toEqual([{ index: 0, text: 'hello', start: 0, end: 1 }])
  })
})
