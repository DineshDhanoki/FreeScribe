export const PROJECT_EXPORT_VERSION = 1
export const MAX_PROJECT_IMPORT_BYTES = 5 * 1024 * 1024

function transferableProject(project = {}) {
  return {
    name: typeof project.name === 'string' ? project.name : 'Untitled transcript',
    segments: Array.isArray(project.segments) ? project.segments : [],
    translation: typeof project.translation === 'string' ? project.translation : null,
    translationLanguageId: project.translationLanguageId || null,
    modelId: project.modelId,
    languageId: project.languageId,
    metrics: project.metrics || null,
    createdAt: project.createdAt,
  }
}

export function serializeProject(project, exportedAt = new Date().toISOString()) {
  return JSON.stringify({
    exportVersion: PROJECT_EXPORT_VERSION,
    exportedAt,
    project: transferableProject(project),
  }, null, 2)
}

export function parseProjectTransfer(text) {
  if (typeof text !== 'string' || !text.trim()) throw new Error('Project backup is empty.')
  if (new TextEncoder().encode(text).byteLength > MAX_PROJECT_IMPORT_BYTES) {
    throw new Error('Project backup is too large to import.')
  }

  let payload
  try {
    payload = JSON.parse(text)
  } catch {
    throw new Error('Project backup is not valid JSON.')
  }

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new Error('Project backup must be a JSON object.')
  if (payload.exportVersion !== PROJECT_EXPORT_VERSION) throw new Error('Unsupported project backup version.')
  if (!payload.project || typeof payload.project !== 'object' || Array.isArray(payload.project)) throw new Error('Project backup is missing project data.')
  if (!Array.isArray(payload.project.segments)) throw new Error('Project backup is missing transcript segments.')

  // Save through projectStore after this whitelist; imported IDs are deliberately not retained.
  return transferableProject(payload.project)
}
