export function getDeviceCapabilities(environment = globalThis.navigator) {
  return {
    hardwareConcurrency: environment?.hardwareConcurrency || null,
    deviceMemoryGb: environment?.deviceMemory || null,
    userAgent: environment?.userAgent || 'unknown',
  }
}

export function getMemorySnapshot(environment = globalThis) {
  const memory = environment?.performance?.memory
  if (!memory || !Number.isFinite(memory.usedJSHeapSize)) return null
  return {
    usedHeapBytes: memory.usedJSHeapSize,
    totalHeapBytes: Number.isFinite(memory.totalJSHeapSize) ? memory.totalJSHeapSize : null,
    heapLimitBytes: Number.isFinite(memory.jsHeapSizeLimit) ? memory.jsHeapSizeLimit : null,
  }
}

export function createTranscriptionMetrics({ audioSamples, sampleRate, elapsedMs, capabilities, modelId = null, modelRevision = null, cacheState = 'unknown', memoryBefore = null, memoryAfter = null }) {
  const audioDurationSeconds = audioSamples > 0 && sampleRate > 0 ? audioSamples / sampleRate : 0
  const elapsedSeconds = Math.max(0, elapsedMs || 0) / 1000

  return {
    audioDurationSeconds,
    elapsedMs: Math.max(0, elapsedMs || 0),
    realTimeFactor: elapsedSeconds > 0 ? audioDurationSeconds / elapsedSeconds : null,
    modelId,
    modelRevision,
    cacheState,
    memory: memoryBefore && memoryAfter
      ? {
        before: memoryBefore,
        after: memoryAfter,
        deltaBytes: memoryAfter.usedHeapBytes - memoryBefore.usedHeapBytes,
      }
      : null,
    capabilities: capabilities || getDeviceCapabilities(),
  }
}

export function updateModelCacheState(currentState = 'unknown', workerMessage = {}) {
  if (workerMessage.type === 'DOWNLOADING') return 'cold'
  if (workerMessage.type === 'LOADING' && workerMessage.status === 'ready' && currentState === 'unknown') return 'warm'
  return currentState
}

export function validatePerformanceRuns(runs = []) {
  const errors = []
  if (!Array.isArray(runs)) return { valid: false, errors: ['Performance input must be an array of runs.'] }
  runs.forEach((run, index) => {
    const label = `Run ${index + 1}`
    if (!run || typeof run !== 'object') {
      errors.push(`${label} must be an object.`)
      return
    }
    if (!Number.isFinite(run.elapsedMs) || run.elapsedMs < 0) errors.push(`${label} requires a non-negative elapsedMs.`)
    if (!Number.isFinite(run.audioDurationSeconds) || run.audioDurationSeconds <= 0) errors.push(`${label} requires a positive audioDurationSeconds.`)
    if (run.realTimeFactor !== undefined && (!Number.isFinite(run.realTimeFactor) || run.realTimeFactor < 0)) errors.push(`${label} has an invalid realTimeFactor.`)
    if (run.cacheState !== undefined && !['cold', 'warm', 'unknown'].includes(run.cacheState)) errors.push(`${label} has an invalid cacheState.`)
    if (run.modelId !== undefined && (typeof run.modelId !== 'string' || !run.modelId.trim())) errors.push(`${label} has an invalid modelId.`)
    if (typeof run.modelId === 'string' && run.modelId.trim() && (typeof run.modelRevision !== 'string' || !run.modelRevision.trim())) errors.push(`${label} requires modelRevision when modelId is provided.`)
  })
  return { valid: errors.length === 0, errors }
}

function percentile(values, percentileRank) {
  if (!values.length) return null
  const sorted = [...values].sort((left, right) => left - right)
  const position = (sorted.length - 1) * percentileRank
  const lower = Math.floor(position)
  const upper = Math.ceil(position)
  if (lower === upper) return sorted[lower]
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower)
}

function summarizeRunGroup(runs) {
  const elapsedMs = runs.reduce((total, run) => total + run.elapsedMs, 0)
  const audioDurationSeconds = runs.reduce((total, run) => total + run.audioDurationSeconds, 0)
  const elapsedValues = runs.map((run) => run.elapsedMs)
  const realTimeFactorValues = runs.map((run) => run.realTimeFactor).filter((value) => typeof value === 'number')
  return {
    runs: runs.length,
    averageElapsedMs: elapsedMs / runs.length,
    medianElapsedMs: percentile(elapsedValues, 0.5),
    p95ElapsedMs: percentile(elapsedValues, 0.95),
    averageAudioDurationSeconds: audioDurationSeconds / runs.length,
    averageRealTimeFactor: elapsedMs > 0 ? (audioDurationSeconds * 1000) / elapsedMs : null,
    medianRealTimeFactor: percentile(realTimeFactorValues, 0.5),
    p95RealTimeFactor: percentile(realTimeFactorValues, 0.95),
  }
}

export function summarizeTranscriptionMetrics(runs, metadata = null) {
  if (!runs.length) return null
  const validation = validatePerformanceRuns(runs)
  if (!validation.valid) throw new Error(`Invalid performance runs:\n${validation.errors.join('\n')}`)
  const summary = summarizeRunGroup(runs)
  const byCacheState = {}
  const byModel = {}
  for (const run of runs) {
    const cacheState = run.cacheState || 'unknown'
    if (!byCacheState[cacheState]) byCacheState[cacheState] = []
    byCacheState[cacheState].push(run)
    const modelKey = `${run.modelId || 'unspecified'}@${run.modelRevision || 'unknown'}`
    if (!byModel[modelKey]) byModel[modelKey] = []
    byModel[modelKey].push(run)
  }

  return {
    ...summary,
    ...(metadata ? { metadata } : {}),
    byCacheState: Object.fromEntries(
      Object.entries(byCacheState).map(([cacheState, cacheRuns]) => [cacheState, summarizeRunGroup(cacheRuns)]),
    ),
    byModel: Object.fromEntries(
      Object.entries(byModel).map(([model, modelRuns]) => [model, summarizeRunGroup(modelRuns)]),
    ),
  }
}
