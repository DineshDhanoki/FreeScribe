import { describe, expect, it } from 'vitest'
import { checkEvaluationThresholds, evaluationGatePassed } from './gates'

describe('evaluation quality gates', () => {
  it('passes transcription thresholds when all metrics are within limits', () => {
    const checks = checkEvaluationThresholds('transcription', {
      summary: { examples: 10, wordErrorRate: 0.1, characterErrorRate: 0.04 },
    }, { minExamples: 5, maxWordErrorRate: 0.2, maxCharacterErrorRate: 0.1 })
    expect(evaluationGatePassed(checks)).toBe(true)
  })

  it('fails translation thresholds when a metric regresses', () => {
    const checks = checkEvaluationThresholds('translation', {
      summary: { examples: 10, exactMatchRate: 0.4, averageCharacterFScore: 0.8 },
    }, { minExamples: 5, minExactMatchRate: 0.5 })
    expect(checks).toContainEqual(expect.objectContaining({ name: 'minimum exact-match rate', passed: false }))
    expect(evaluationGatePassed(checks)).toBe(false)
  })

  it('does not pass when no thresholds were requested', () => {
    expect(evaluationGatePassed([])).toBe(false)
  })
})
