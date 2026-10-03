import { describe, expect, it } from 'vitest'
import { auditDatasetSplits } from './audit'

const metadata = (split) => ({
  datasetId: 'dataset-v1', source: 'consented', license: 'internal', consentStatus: 'documented', split,
})

describe('dataset split audit', () => {
  it('accepts disjoint records and speaker groups', () => {
    expect(auditDatasetSplits([
      { metadata: metadata('dev'), records: [{ id: 'dev-1', speakerGroup: 'speaker-a', reference: 'hello', hypothesis: 'hello' }] },
      { metadata: metadata('test'), records: [{ id: 'test-1', speakerGroup: 'speaker-b', reference: 'world', hypothesis: 'world' }] },
    ])).toMatchObject({ valid: true, errors: [], splits: ['dev', 'test'], records: 2 })
  })

  it('rejects speaker leakage and duplicate records across splits', () => {
    const result = auditDatasetSplits([
      { metadata: metadata('dev'), records: [{ id: 'same', speakerGroup: 'speaker-a', reference: 'hello', hypothesis: 'hello' }] },
      { metadata: metadata('test'), records: [{ id: 'same', speakerGroup: 'speaker-a', reference: 'world', hypothesis: 'world' }] },
    ])
    expect(result.valid).toBe(false)
    expect(result.errors).toEqual(expect.arrayContaining([
      'Duplicate record id "same" appears in dev and test.',
      'Speaker group "speaker-a" appears in both dev and test splits.',
    ]))
  })
})
