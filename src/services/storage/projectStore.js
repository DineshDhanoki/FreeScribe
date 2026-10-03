import { getSpeechModel, getTranscriptionLanguage, getTranslationLanguage } from '../models/modelConfig'

const DATABASE_NAME = 'freescribe'
const DATABASE_VERSION = 1
export const PROJECT_SCHEMA_VERSION = 1
const PROJECT_STORE = 'projects'

function createId() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function finiteNumber(value, fallback = 0) {
  return Number.isFinite(value) ? value : fallback
}

function normalizeSegments(segments) {
  if (!Array.isArray(segments)) return []
  return segments.map((segment, index) => ({
    index: finiteNumber(segment?.index, index),
    text: typeof segment?.text === 'string' ? segment.text : String(segment?.text || ''),
    start: finiteNumber(segment?.start),
    end: finiteNumber(segment?.end),
  }))
}

function normalizeMetrics(metrics) {
  if (!metrics || typeof metrics !== 'object') return null
  return {
    audioDurationSeconds: finiteNumber(metrics.audioDurationSeconds),
    elapsedMs: finiteNumber(metrics.elapsedMs),
    realTimeFactor: Number.isFinite(metrics.realTimeFactor) ? metrics.realTimeFactor : null,
    modelId: typeof metrics.modelId === 'string' ? metrics.modelId : null,
    modelRevision: typeof metrics.modelRevision === 'string' ? metrics.modelRevision : null,
    cacheState: typeof metrics.cacheState === 'string' ? metrics.cacheState : 'unknown',
    memory: metrics.memory && typeof metrics.memory === 'object'
      ? {
        before: metrics.memory.before || null,
        after: metrics.memory.after || null,
        deltaBytes: finiteNumber(metrics.memory.deltaBytes, null),
      }
      : null,
    capabilities: metrics.capabilities && typeof metrics.capabilities === 'object'
      ? {
        hardwareConcurrency: finiteNumber(metrics.capabilities.hardwareConcurrency, null),
        deviceMemoryGb: finiteNumber(metrics.capabilities.deviceMemoryGb, null),
        userAgent: typeof metrics.capabilities.userAgent === 'string' ? metrics.capabilities.userAgent : 'unknown',
      }
      : null,
  }
}

function normalizeProject(project, now) {
  const model = getSpeechModel(project.modelId)
  const language = getTranscriptionLanguage(project.languageId)
  const translationLanguage = getTranslationLanguage(project.translationLanguageId)

  return {
    schemaVersion: PROJECT_SCHEMA_VERSION,
    id: project.id || createId(),
    name: typeof project.name === 'string' ? project.name.slice(0, 120) : 'Untitled transcript',
    segments: normalizeSegments(project.segments),
    translation: typeof project.translation === 'string' ? project.translation : null,
    translationLanguageId: translationLanguage?.nllb || null,
    modelId: model.id,
    languageId: language.id,
    metrics: normalizeMetrics(project.metrics),
    createdAt: typeof project.createdAt === 'string' ? project.createdAt : now,
    updatedAt: now,
  }
}

function normalizeStoredProject(project) {
  const updatedAt = typeof project.updatedAt === 'string' ? project.updatedAt : new Date().toISOString()
  return normalizeProject(project, updatedAt)
}

export function openProjectDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION)
    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(PROJECT_STORE)) {
        const store = database.createObjectStore(PROJECT_STORE, { keyPath: 'id' })
        store.createIndex('updatedAt', 'updatedAt')
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function saveProject(project) {
  const database = await openProjectDatabase()
  const now = new Date().toISOString()
  const record = normalizeProject(project, now)

  try {
    const transaction = database.transaction(PROJECT_STORE, 'readwrite')
    await requestToPromise(transaction.objectStore(PROJECT_STORE).put(record))
    return record
  } finally {
    database.close()
  }
}

export async function listProjects() {
  const database = await openProjectDatabase()
  try {
    const transaction = database.transaction(PROJECT_STORE, 'readonly')
    const records = await requestToPromise(transaction.objectStore(PROJECT_STORE).getAll())
    return records.map(normalizeStoredProject).sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
  } finally {
    database.close()
  }
}

export async function getProject(id) {
  const database = await openProjectDatabase()
  try {
    const transaction = database.transaction(PROJECT_STORE, 'readonly')
    const record = await requestToPromise(transaction.objectStore(PROJECT_STORE).get(id))
    return record ? normalizeStoredProject(record) : undefined
  } finally {
    database.close()
  }
}

export async function deleteProject(id) {
  const database = await openProjectDatabase()
  try {
    const transaction = database.transaction(PROJECT_STORE, 'readwrite')
    await requestToPromise(transaction.objectStore(PROJECT_STORE).delete(id))
  } finally {
    database.close()
  }
}

export async function clearProjects() {
  const database = await openProjectDatabase()
  try {
    const transaction = database.transaction(PROJECT_STORE, 'readwrite')
    await requestToPromise(transaction.objectStore(PROJECT_STORE).clear())
  } finally {
    database.close()
  }
}
