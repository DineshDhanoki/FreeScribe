import { validatePerformanceRuns } from './performance.js'
import { EVALUATION_SCHEMA_VERSION, validatePerformanceMetadata } from './input.js'

const METADATA_FIELDS = ['benchmarkId', 'source', 'deviceProfile', 'browser']

export function mergePerformancePayloads(payloads = []) {
  if (!Array.isArray(payloads) || payloads.length === 0) throw new Error('At least one performance payload is required.')

  const metadata = payloads[0]?.metadata
  const metadataValidation = validatePerformanceMetadata(metadata)
  if (!metadataValidation.valid) throw new Error(`Invalid performance metadata:\n${metadataValidation.errors.join('\n')}`)

  for (const [index, payload] of payloads.entries()) {
    const validation = validatePerformanceMetadata(payload?.metadata)
    if (!validation.valid) throw new Error(`Invalid performance metadata in input ${index + 1}.`)
    for (const field of METADATA_FIELDS) {
      if (payload.metadata[field] !== metadata[field]) {
        throw new Error(`Performance metadata mismatch for ${field} in input ${index + 1}.`)
      }
    }
  }

  const runs = payloads.flatMap((payload) => payload.runs || [])
  const runValidation = validatePerformanceRuns(runs)
  if (!runValidation.valid) throw new Error(`Invalid performance runs:\n${runValidation.errors.join('\n')}`)

  return {
    schemaVersion: EVALUATION_SCHEMA_VERSION,
    metadata,
    runs,
  }
}
