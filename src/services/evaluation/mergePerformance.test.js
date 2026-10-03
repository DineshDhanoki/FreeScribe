import { describe, expect, it } from 'vitest'
import { mergePerformancePayloads } from './mergePerformance'

const metadata = { benchmarkId: 'bench', source: 'consented', deviceProfile: 'laptop', browser: 'Chromium' }

describe('performance payload merging', () => {
  it('merges runs while preserving shared provenance', () => {
    const merged = mergePerformancePayloads([
      { metadata, runs: [{ elapsedMs: 100, audioDurationSeconds: 1 }] },
      { metadata, runs: [{ elapsedMs: 200, audioDurationSeconds: 2 }] },
    ])
    expect(merged).toEqual({
      schemaVersion: 1,
      metadata,
      runs: [
        { elapsedMs: 100, audioDurationSeconds: 1 },
        { elapsedMs: 200, audioDurationSeconds: 2 },
      ],
    })
  })

  it('rejects mixed benchmark metadata to prevent invalid aggregates', () => {
    expect(() => mergePerformancePayloads([
      { metadata, runs: [] },
      { metadata: { ...metadata, deviceProfile: 'phone' }, runs: [] },
    ])).toThrow('metadata mismatch for deviceProfile')
  })
})
