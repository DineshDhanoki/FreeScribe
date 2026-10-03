import { describe, expect, it } from 'vitest'
import { parseEvaluationPayload, parsePerformancePayload, validateEvaluationMetadata, validatePerformanceMetadata } from './input'

const metadata = {
  datasetId: 'demo',
  source: 'consented recordings',
  license: 'internal',
  consentStatus: 'documented',
  split: 'test',
}

describe('evaluation input envelopes', () => {
  it('parses an envelope and preserves provenance', () => {
    expect(parseEvaluationPayload({ metadata, records: [{ id: 'one' }] })).toEqual({ metadata, records: [{ id: 'one' }] })
  })

  it('accepts legacy arrays without metadata', () => {
    expect(parseEvaluationPayload([{ id: 'one' }])).toEqual({ metadata: null, records: [{ id: 'one' }] })
  })

  it('rejects incomplete provenance metadata', () => {
    expect(validateEvaluationMetadata({ datasetId: 'demo' })).toMatchObject({ valid: false })
    expect(() => parseEvaluationPayload({ metadata: { datasetId: 'demo' }, records: [] })).toThrow('Invalid evaluation metadata')
  })

  it('parses performance envelopes with device provenance', () => {
    const performanceMetadata = { benchmarkId: 'bench-1', source: 'consented fixture', deviceProfile: 'laptop', browser: 'Chromium 120' }
    expect(parsePerformancePayload({ metadata: performanceMetadata, runs: [{ elapsedMs: 1 }] })).toEqual({ metadata: performanceMetadata, runs: [{ elapsedMs: 1 }] })
    expect(validatePerformanceMetadata({ benchmarkId: 'bench-1' })).toMatchObject({ valid: false })
  })
})
