import { describe, expect, it } from 'vitest'
import {
  formatTimestamp,
  normalizeSegments,
  serializeTranscript,
  transcriptToSrt,
  transcriptToVtt,
} from './transcript'

describe('transcript domain model', () => {
  const segments = [
    { text: ' Hello ', start: 0.25, end: 1.5 },
    { text: 'world', start: 2, end: 3 },
  ]

  it('normalizes text and timing', () => {
    expect(normalizeSegments(segments)).toEqual([
      { index: 0, text: 'Hello', start: 0.25, end: 1.5 },
      { index: 1, text: 'world', start: 2, end: 3 },
    ])
  })

  it('formats subtitle timestamps', () => {
    expect(formatTimestamp(3661.25)).toBe('01:01:01,250')
  })

  it('creates valid SRT and VTT content', () => {
    expect(transcriptToSrt(segments)).toContain('00:00:00,250 --> 00:00:01,500')
    expect(transcriptToVtt(segments)).toContain('WEBVTT')
    expect(transcriptToVtt(segments)).toContain('00:00:00.250 --> 00:00:01.500')
  })

  it('returns an export payload for every supported format', () => {
    expect(serializeTranscript(segments, 'txt').extension).toBe('txt')
    expect(serializeTranscript(segments, 'json').extension).toBe('json')
    expect(serializeTranscript(segments, 'srt').extension).toBe('srt')
    expect(serializeTranscript(segments, 'vtt').extension).toBe('vtt')
  })
})

