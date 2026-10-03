import { validateTranscriptDataset } from './dataset.js'
import { validateEvaluationMetadata } from './input.js'

export function auditDatasetSplits(payloads = []) {
  const errors = []
  const recordIds = new Map()
  const speakerGroups = new Map()
  const splits = new Set()
  let records = 0

  if (!Array.isArray(payloads) || payloads.length === 0) {
    return { valid: false, errors: ['At least one dataset split is required.'], splits: [], records: 0 }
  }

  payloads.forEach((payload, payloadIndex) => {
    const label = `Input ${payloadIndex + 1}`
    const metadataValidation = validateEvaluationMetadata(payload?.metadata)
    if (!metadataValidation.valid) {
      errors.push(`${label} has invalid metadata.`)
      return
    }
    const split = payload.metadata.split
    splits.add(split)
    const datasetValidation = validateTranscriptDataset(payload.records)
    if (!datasetValidation.valid) {
      errors.push(...datasetValidation.errors.map((error) => `${label}: ${error}`))
      return
    }

    records += payload.records.length
    for (const record of payload.records) {
      if (recordIds.has(record.id)) errors.push(`Duplicate record id "${record.id}" appears in ${recordIds.get(record.id)} and ${split}.`)
      else recordIds.set(record.id, split)

      if (typeof record.speakerGroup === 'string' && record.speakerGroup.trim()) {
        const previousSplit = speakerGroups.get(record.speakerGroup)
        if (previousSplit && previousSplit !== split) {
          errors.push(`Speaker group "${record.speakerGroup}" appears in both ${previousSplit} and ${split} splits.`)
        } else {
          speakerGroups.set(record.speakerGroup, split)
        }
      }
    }
  })

  return { valid: errors.length === 0, errors, splits: [...splits], records }
}
