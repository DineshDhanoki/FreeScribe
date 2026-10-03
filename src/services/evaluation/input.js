export const EVALUATION_SCHEMA_VERSION = 1

export function validateEvaluationMetadata(metadata) {
  const errors = []
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return { valid: false, errors: ['Evaluation metadata must be an object.'] }
  }
  for (const field of ['datasetId', 'source', 'license', 'consentStatus', 'split']) {
    if (typeof metadata[field] !== 'string' || !metadata[field].trim()) {
      errors.push(`Evaluation metadata is missing a string ${field}.`)
    }
  }
  return { valid: errors.length === 0, errors }
}

export function parseEvaluationPayload(payload) {
  if (Array.isArray(payload)) return { records: payload, metadata: null }
  if (payload && typeof payload === 'object' && Array.isArray(payload.records)) {
    const validation = validateEvaluationMetadata(payload.metadata)
    if (!validation.valid) throw new Error(`Invalid evaluation metadata:\n${validation.errors.join('\n')}`)
    return { records: payload.records, metadata: payload.metadata }
  }
  if (payload && typeof payload === 'object') return { records: [payload], metadata: null }
  throw new Error('Evaluation input must be a record, an array of records, or an envelope with records and metadata.')
}

export function validatePerformanceMetadata(metadata) {
  const errors = []
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return { valid: false, errors: ['Performance metadata must be an object.'] }
  }
  for (const field of ['benchmarkId', 'source', 'deviceProfile', 'browser']) {
    if (typeof metadata[field] !== 'string' || !metadata[field].trim()) {
      errors.push(`Performance metadata is missing a string ${field}.`)
    }
  }
  return { valid: errors.length === 0, errors }
}

export function parsePerformancePayload(payload) {
  if (Array.isArray(payload)) return { runs: payload, metadata: null }
  if (payload && typeof payload === 'object' && Array.isArray(payload.runs)) {
    const validation = validatePerformanceMetadata(payload.metadata)
    if (!validation.valid) throw new Error(`Invalid performance metadata:\n${validation.errors.join('\n')}`)
    return { runs: payload.runs, metadata: payload.metadata }
  }
  throw new Error('Performance input must be an array or an envelope with runs and metadata.')
}
