import { describe, expect, it } from 'vitest'
import { evaluateTranscriptDataset, validateTranscriptDataset } from './dataset'

describe('transcript dataset evaluation', () => {
  it('aggregates errors across examples by reference size', () => {
    const result = evaluateTranscriptDataset([
      { id: 'one', reference: 'one two', hypothesis: 'one two' },
      { id: 'two', reference: 'one two three', hypothesis: 'one two' },
    ])
    expect(result.summary).toMatchObject({
      examples: 2,
      wordErrors: 1,
      referenceWords: 5,
      wordErrorRate: 0.2,
    })
    expect(result.breakdowns.language.unspecified).toMatchObject({ examples: 2, referenceWords: 5 })
  })

  it('handles an empty dataset', () => {
    expect(evaluateTranscriptDataset([]).summary).toMatchObject({ examples: 0, wordErrorRate: 0, characterErrorRate: 0 })
  })

  it('validates identifiers and required transcript fields', () => {
    expect(validateTranscriptDataset([
      { id: 'one', reference: 'hello', hypothesis: 'hello' },
      { id: 'one', reference: 'bye' },
    ])).toEqual({
      valid: false,
      errors: [
        'Record 2 duplicates id "one".',
        'Record one is missing a string hypothesis.',
      ],
    })
  })

  it('rejects empty references so invalid benchmarks cannot hide in aggregate scores', () => {
    expect(validateTranscriptDataset([
      { id: 'empty', reference: '   ', hypothesis: '' },
    ])).toEqual({
      valid: false,
      errors: ['Record empty has an empty reference.'],
    })
  })

  it('requires a model revision for named transcription models', () => {
    expect(validateTranscriptDataset([
      { id: 'unpinned', model: 'tiny', reference: 'hello', hypothesis: 'hello' },
    ])).toEqual({
      valid: false,
      errors: ['Record unpinned requires modelRevision when model is provided.'],
    })
  })

  it('reports weighted breakdowns by evaluation metadata', () => {
    const result = evaluateTranscriptDataset([
      { id: 'en-clean', language: 'en', model: 'tiny', modelRevision: 'rev-tiny', condition: 'clean', reference: 'one two', hypothesis: 'one two' },
      { id: 'hi-noisy', language: 'hi', model: 'base', modelRevision: 'rev-base', condition: 'noisy', reference: 'one two', hypothesis: 'one' },
    ])
    expect(result.breakdowns.language.en.wordErrorRate).toBe(0)
    expect(result.breakdowns.condition.noisy.wordErrorRate).toBe(0.5)
  })

  it('reports slices for accent, noise, and speaker groups', () => {
    const result = evaluateTranscriptDataset([
      {
        id: 'one', language: 'en', accent: 'in', noiseCondition: 'street', speakerGroup: 'speaker-a',
        reference: 'one two', hypothesis: 'one',
      },
      {
        id: 'two', language: 'en', accent: 'us', noiseCondition: 'clean', speakerGroup: 'speaker-b',
        reference: 'one two', hypothesis: 'one two',
      },
    ])
    expect(result.breakdowns.accent.in).toMatchObject({ examples: 1, wordErrorRate: 0.5 })
    expect(result.breakdowns.noiseCondition.street).toMatchObject({ examples: 1, wordErrorRate: 0.5 })
    expect(result.breakdowns.speakerGroup['speaker-b']).toMatchObject({ examples: 1, wordErrorRate: 0 })
  })

  it('preserves provenance metadata in reports', () => {
    const result = evaluateTranscriptDataset(
      [{ id: 'one', reference: 'hello', hypothesis: 'hello' }],
      { datasetId: 'demo', source: 'consented', license: 'internal', consentStatus: 'documented', split: 'test' },
    )
    expect(result.metadata).toMatchObject({ datasetId: 'demo', split: 'test' })
  })
})
