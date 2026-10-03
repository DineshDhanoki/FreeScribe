import { describe, expect, it } from 'vitest'
import { createPerformanceExport, createPerformanceRun } from './export'

describe('performance export', () => {
  const metrics = {
    audioDurationSeconds: 10,
    elapsedMs: 5000,
    realTimeFactor: 2,
    modelId: 'Xenova/whisper-tiny.en',
    modelRevision: 'revision',
    cacheState: 'warm',
    capabilities: { hardwareConcurrency: 8, userAgent: 'Test Browser' },
  }

  it('creates a validated, provenance-preserving performance envelope', () => {
    expect(createPerformanceExport(metrics, { capturedAt: '2026-01-01T00:00:00.000Z' })).toEqual({
      schemaVersion: 1,
      metadata: {
        benchmarkId: 'freescribe-local-run',
        source: 'local browser run',
        deviceProfile: 'browser-reported capabilities',
        browser: 'Test Browser',
      },
      runs: [{ ...metrics, capturedAt: '2026-01-01T00:00:00.000Z' }],
    })
  })

  it('rejects incomplete metrics instead of exporting an invalid run', () => {
    expect(() => createPerformanceRun({ elapsedMs: 1 })).toThrow('Invalid performance metrics')
  })
})
