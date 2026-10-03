import { describe, expect, it } from 'vitest'
import { characterErrorRate, wordErrorRate } from './metrics'

describe('evaluation metrics', () => {
  it('computes normalized word error rate', () => {
    const result = wordErrorRate('The quick brown fox', 'the quick fox')
    expect(result.referenceWords).toBe(4)
    expect(result.errors).toBe(1)
    expect(result.rate).toBe(0.25)
  })

  it('handles empty references explicitly', () => {
    expect(wordErrorRate('', '').rate).toBe(0)
    expect(wordErrorRate('', 'unexpected speech').rate).toBe(1)
  })

  it('computes character error rate', () => {
    expect(characterErrorRate('cat', 'cut').rate).toBeCloseTo(1 / 3)
  })
})

