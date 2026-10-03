import { validateTranscriptDataset } from './dataset.js'
import { groupExamplesByDimension } from './dimensions.js'
import { EVALUATION_SCHEMA_VERSION } from './input.js'

function normalizeTranslation(text) {
  return String(text || '').toLowerCase().replace(/\s+/g, ' ').trim()
}

function characterNgrams(text, order) {
  const characters = text.replace(/\s/g, '').split('')
  const counts = new Map()
  for (let index = 0; index <= characters.length - order; index += 1) {
    const ngram = characters.slice(index, index + order).join('')
    counts.set(ngram, (counts.get(ngram) || 0) + 1)
  }
  return counts
}

function fScore(precision, recall, beta) {
  if (precision === 0 || recall === 0) return 0
  const betaSquared = beta ** 2
  return ((1 + betaSquared) * precision * recall) / (betaSquared * precision + recall)
}

function summarizeExamples(examples) {
  const exactMatches = examples.filter((example) => example.exactMatch).length
  return {
    examples: examples.length,
    exactMatches,
    exactMatchRate: examples.length ? exactMatches / examples.length : 0,
    averageCharacterFScore: examples.length
      ? examples.reduce((sum, example) => sum + example.characterFScore, 0) / examples.length
      : 0,
  }
}

export function characterFScore(reference, hypothesis, { maxOrder = 6, beta = 2 } = {}) {
  const normalizedReference = normalizeTranslation(reference)
  const normalizedHypothesis = normalizeTranslation(hypothesis)
  if (!normalizedReference && !normalizedHypothesis) return 1
  if (!normalizedReference || !normalizedHypothesis) return 0

  const scores = []
  for (let order = 1; order <= maxOrder; order += 1) {
    const referenceNgrams = characterNgrams(normalizedReference, order)
    const hypothesisNgrams = characterNgrams(normalizedHypothesis, order)
    const referenceCount = [...referenceNgrams.values()].reduce((sum, count) => sum + count, 0)
    const hypothesisCount = [...hypothesisNgrams.values()].reduce((sum, count) => sum + count, 0)
    const overlap = [...hypothesisNgrams.entries()].reduce((sum, [ngram, count]) => sum + Math.min(count, referenceNgrams.get(ngram) || 0), 0)
    scores.push(fScore(overlap / hypothesisCount, overlap / referenceCount, beta))
  }
  return scores.reduce((sum, score) => sum + score, 0) / scores.length
}

export function evaluateTranslationDataset(records = [], metadata = null) {
  const validation = validateTranscriptDataset(records)
  if (!validation.valid) throw new Error(`Invalid translation dataset:\n${validation.errors.join('\n')}`)

  const examples = records.map((record) => {
    const reference = normalizeTranslation(record.reference)
    const hypothesis = normalizeTranslation(record.hypothesis)
    return {
      id: record.id,
      language: record.language || 'unspecified',
      model: record.model || 'unspecified',
      modelRevision: record.modelRevision || 'unknown',
      condition: record.condition || 'unspecified',
      accent: record.accent || 'unspecified',
      noiseCondition: record.noiseCondition || 'unspecified',
      speakerGroup: record.speakerGroup || 'unspecified',
      exactMatch: reference === hypothesis,
      characterFScore: characterFScore(reference, hypothesis),
    }
  })
  const breakdowns = {}
  const groupedExamples = groupExamplesByDimension(examples)
  for (const [dimension, groups] of Object.entries(groupedExamples)) {
    breakdowns[dimension] = Object.fromEntries(
      Object.entries(groups).map(([key, group]) => [key, summarizeExamples(group)]),
    )
  }

  return {
    schemaVersion: EVALUATION_SCHEMA_VERSION,
    ...(metadata ? { metadata } : {}),
    examples,
    summary: summarizeExamples(examples),
    breakdowns,
  }
}
