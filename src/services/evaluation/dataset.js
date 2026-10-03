import { characterErrorRate, wordErrorRate } from './metrics.js'
import { groupExamplesByDimension } from './dimensions.js'
import { EVALUATION_SCHEMA_VERSION } from './input.js'

export function validateTranscriptDataset(records = []) {
  const errors = []
  if (!Array.isArray(records)) return { valid: false, errors: ['Dataset must be an array of records.'] }

  const ids = new Set()
  records.forEach((record, index) => {
    if (!record || typeof record !== 'object') {
      errors.push(`Record ${index + 1} must be an object.`)
      return
    }
    if (typeof record.id !== 'string' || !record.id.trim()) errors.push(`Record ${index + 1} is missing a unique id.`)
    else if (ids.has(record.id)) errors.push(`Record ${index + 1} duplicates id "${record.id}".`)
    else ids.add(record.id)
    if (typeof record.reference !== 'string') errors.push(`Record ${record.id || index + 1} is missing a string reference.`)
    else if (!record.reference.trim()) errors.push(`Record ${record.id || index + 1} has an empty reference.`)
    if (typeof record.hypothesis !== 'string') errors.push(`Record ${record.id || index + 1} is missing a string hypothesis.`)
    if (typeof record.model === 'string' && record.model.trim() && (typeof record.modelRevision !== 'string' || !record.modelRevision.trim())) errors.push(`Record ${record.id || index + 1} requires modelRevision when model is provided.`)
  })

  return { valid: errors.length === 0, errors }
}

function summarizeExamples(examples) {
  const referenceWords = examples.reduce((sum, example) => sum + example.wordErrorRate.referenceWords, 0)
  const wordErrors = examples.reduce((sum, example) => sum + example.wordErrorRate.errors, 0)
  const referenceCharacters = examples.reduce((sum, example) => sum + example.characterErrorRate.referenceCharacters, 0)
  const characterErrors = examples.reduce((sum, example) => sum + example.characterErrorRate.errors, 0)

  return {
    examples: examples.length,
    wordErrors,
    referenceWords,
    wordErrorRate: referenceWords ? wordErrors / referenceWords : 0,
    characterErrors,
    referenceCharacters,
    characterErrorRate: referenceCharacters ? characterErrors / referenceCharacters : 0,
  }
}

export function evaluateTranscriptDataset(records = [], metadata = null) {
  const validation = validateTranscriptDataset(records)
  if (!validation.valid) throw new Error(`Invalid transcript dataset:\n${validation.errors.join('\n')}`)

  const examples = records.map((record) => ({
    id: record.id,
    language: record.language || 'unspecified',
    model: record.model || 'unspecified',
    modelRevision: record.modelRevision || 'unknown',
    condition: record.condition || 'unspecified',
    accent: record.accent || 'unspecified',
    noiseCondition: record.noiseCondition || 'unspecified',
    speakerGroup: record.speakerGroup || 'unspecified',
    wordErrorRate: wordErrorRate(record.reference, record.hypothesis),
    characterErrorRate: characterErrorRate(record.reference, record.hypothesis),
  }))

  const groupedExamples = groupExamplesByDimension(examples)
  const breakdowns = {}
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
