import { describe, expect, it } from 'vitest'
import { createTranscriptionMetrics, getDeviceCapabilities, getMemorySnapshot, summarizeTranscriptionMetrics, updateModelCacheState, validatePerformanceRuns } from './performance'

describe('performance instrumentation', () => {
  it('calculates real-time factor from audio and wall-clock duration', () => {
    const metrics = createTranscriptionMetrics({
      audioSamples: 16000 * 10,
      sampleRate: 16000,
      elapsedMs: 5000,
      capabilities: { hardwareConcurrency: 8 },
      modelId: 'tiny',
      modelRevision: 'revision',
      cacheState: 'cold',
      memoryBefore: { usedHeapBytes: 100 },
      memoryAfter: { usedHeapBytes: 150 },
    })
    expect(metrics.audioDurationSeconds).toBe(10)
    expect(metrics.realTimeFactor).toBe(2)
    expect(metrics.modelId).toBe('tiny')
    expect(metrics.modelRevision).toBe('revision')
    expect(metrics.cacheState).toBe('cold')
    expect(metrics.memory.deltaBytes).toBe(50)
    expect(metrics.capabilities.hardwareConcurrency).toBe(8)
  })

  it('summarizes multiple model runs', () => {
    const summary = summarizeTranscriptionMetrics([
      { elapsedMs: 1000, audioDurationSeconds: 2, realTimeFactor: 2, cacheState: 'cold' },
      { elapsedMs: 3000, audioDurationSeconds: 4, realTimeFactor: 4 / 3, cacheState: 'warm', modelId: 'tiny', modelRevision: 'rev-1' },
    ])
    expect(summary).toMatchObject({
      runs: 2,
      averageElapsedMs: 2000,
      medianElapsedMs: 2000,
      p95ElapsedMs: 2900,
      averageRealTimeFactor: 1.5,
      byCacheState: {
        cold: { runs: 1, medianElapsedMs: 1000 },
        warm: { runs: 1, medianElapsedMs: 3000 },
      },
      byModel: {
        'unspecified@unknown': { runs: 1 },
        'tiny@rev-1': { runs: 1 },
      },
    })
    expect(summary.medianRealTimeFactor).toBeCloseTo(5 / 3)
  })

  it('returns stable capability fields when browser hints are missing', () => {
    expect(getDeviceCapabilities({})).toEqual({
      hardwareConcurrency: null,
      deviceMemoryGb: null,
      userAgent: 'unknown',
    })
  })

  it('returns no memory snapshot when the browser does not expose heap metrics', () => {
    expect(getMemorySnapshot({ performance: {} })).toBeNull()
    expect(getMemorySnapshot({})).toBeNull()
  })

  it('infers cold and warm cache states from worker lifecycle messages', () => {
    expect(updateModelCacheState('unknown', { type: 'DOWNLOADING' })).toBe('cold')
    expect(updateModelCacheState('unknown', { type: 'LOADING', status: 'ready' })).toBe('warm')
    expect(updateModelCacheState('cold', { type: 'LOADING', status: 'ready' })).toBe('cold')
    expect(updateModelCacheState('unknown', { type: 'LOADING', status: 'loading' })).toBe('unknown')
  })

  it('validates benchmark run shape before summarizing', () => {
    expect(validatePerformanceRuns([
      { elapsedMs: 1000, audioDurationSeconds: 2, cacheState: 'warm', modelId: 'tiny', modelRevision: 'rev-1' },
    ])).toEqual({ valid: true, errors: [] })
    expect(() => summarizeTranscriptionMetrics([
      { elapsedMs: -1, audioDurationSeconds: 0, cacheState: 'broken' },
    ])).toThrow('Invalid performance runs')
  })

  it('requires an immutable model revision for named models', () => {
    expect(validatePerformanceRuns([
      { elapsedMs: 1000, audioDurationSeconds: 2, modelId: 'tiny' },
    ])).toEqual({
      valid: false,
      errors: ['Run 1 requires modelRevision when modelId is provided.'],
    })
  })

  it('preserves benchmark provenance in summaries', () => {
    const metadata = { benchmarkId: 'bench-1', source: 'fixture', deviceProfile: 'laptop', browser: 'Chromium 120' }
    expect(summarizeTranscriptionMetrics([
      { elapsedMs: 1000, audioDurationSeconds: 2 },
    ], metadata).metadata).toEqual(metadata)
  })
})
