import { describe, expect, it } from 'vitest'
import { characterFScore, evaluateTranslationDataset } from './translation'

describe('translation evaluation', () => {
  it('gives identical normalized translations a perfect score', () => {
    expect(characterFScore(' Hola  mundo ', 'hola mundo')).toBe(1)
  })

  it('distinguishes partial translation overlap', () => {
    const score = characterFScore('hello world', 'hello there')
    expect(score).toBeGreaterThan(0)
    expect(score).toBeLessThan(1)
  })

  it('evaluates translation examples with exact-match and aggregate metrics', () => {
    const result = evaluateTranslationDataset([
      { id: 'one', language: 'es', model: 'fixture', modelRevision: 'fixture-v1', reference: 'hola mundo', hypothesis: 'hola mundo' },
      { id: 'two', language: 'es', model: 'fixture', modelRevision: 'fixture-v1', reference: 'buenos dias', hypothesis: 'buenas noches' },
      { id: 'three', language: 'fr', model: 'other', modelRevision: 'other-v1', reference: 'bonjour', hypothesis: 'bonjour' },
    ])
    expect(result.summary).toMatchObject({ examples: 3, exactMatches: 2, exactMatchRate: 2 / 3 })
    expect(result.examples[0].characterFScore).toBe(1)
    expect(result.breakdowns.language.es).toMatchObject({ examples: 2, exactMatches: 1 })
    expect(result.breakdowns.model.other).toMatchObject({ examples: 1, exactMatchRate: 1 })
  })

  it('preserves real-world slice dimensions in translation reports', () => {
    const result = evaluateTranslationDataset([
      {
        id: 'one', language: 'hi', model: 'nllb', modelRevision: 'nllb-v1', accent: 'in', noiseCondition: 'noisy',
        speakerGroup: 'speaker-a', reference: 'hello', hypothesis: 'hello',
      },
    ])
    expect(result.breakdowns.accent.in).toMatchObject({ examples: 1, exactMatchRate: 1 })
    expect(result.breakdowns.noiseCondition.noisy).toMatchObject({ examples: 1 })
  })
})
