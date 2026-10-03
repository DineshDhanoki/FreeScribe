import { validatePerformanceRuns } from './performance.js'

export const PERFORMANCE_EXPORT_SCHEMA_VERSION = 1

export function createPerformanceRun(metrics, capturedAt = new Date().toISOString()) {
  if (!metrics || typeof metrics !== 'object') throw new Error('Performance metrics are required.')
  const run = { ...metrics, capturedAt }
  const validation = validatePerformanceRuns([run])
  if (!validation.valid) throw new Error(`Invalid performance metrics:\n${validation.errors.join('\n')}`)
  return run
}

export function createPerformanceExport(metrics, options = {}) {
  const run = createPerformanceRun(metrics, options.capturedAt)
  const browser = metrics.capabilities?.userAgent || 'unknown'
  return {
    schemaVersion: PERFORMANCE_EXPORT_SCHEMA_VERSION,
    metadata: {
      benchmarkId: options.benchmarkId || 'freescribe-local-run',
      source: options.source || 'local browser run',
      deviceProfile: options.deviceProfile || 'browser-reported capabilities',
      browser,
    },
    runs: [run],
  }
}
