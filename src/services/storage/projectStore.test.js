import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { clearProjects, deleteProject, getProject, listProjects, openProjectDatabase, PROJECT_SCHEMA_VERSION, saveProject } from './projectStore'

describe('project store', () => {
  beforeEach(async () => {
    const projects = await listProjects()
    await Promise.all(projects.map((project) => deleteProject(project.id)))
  })

  it('saves, retrieves, and lists projects by update time', async () => {
    const saved = await saveProject({ name: 'Demo', segments: [{ text: 'hello' }], translation: 'hola', translationLanguageId: 'spa_Latn', modelId: 'model', languageId: 'hi', metrics: { elapsedMs: 100 } })
    expect(saved.id).toBeTruthy()
    expect(saved.schemaVersion).toBe(PROJECT_SCHEMA_VERSION)
    expect(await getProject(saved.id)).toMatchObject({ name: 'Demo', segments: [{ text: 'hello' }], translation: 'hola', translationLanguageId: 'spa_Latn', modelId: 'Xenova/whisper-tiny.en', languageId: 'hi', metrics: { elapsedMs: 100 } })
    expect((await listProjects()).map((project) => project.id)).toContain(saved.id)
  })

  it('updates an existing project without changing its creation time', async () => {
    const first = await saveProject({ name: 'Draft', segments: [] })
    const second = await saveProject({ ...first, name: 'Updated' })
    expect(second.id).toBe(first.id)
    expect(second.createdAt).toBe(first.createdAt)
    expect((await listProjects())).toHaveLength(1)
  })

  it('clears every locally saved project', async () => {
    await saveProject({ name: 'One', segments: [] })
    await saveProject({ name: 'Two', segments: [] })
    await clearProjects()
    expect(await listProjects()).toEqual([])
  })

  it('stores only the approved project schema', async () => {
    const saved = await saveProject({
      name: 'A'.repeat(200),
      segments: [{ index: 2, text: 'hello', start: 1, end: 2, audio: new Blob(['secret']) }],
      audio: new Blob(['should not be persisted']),
      unexpectedField: 'should not be persisted',
    })
    expect(saved.name).toHaveLength(120)
    expect(saved.segments).toEqual([{ index: 2, text: 'hello', start: 1, end: 2 }])
    expect(saved).not.toHaveProperty('audio')
    expect(saved).not.toHaveProperty('unexpectedField')
    expect(await getProject(saved.id)).not.toHaveProperty('audio')
  })

  it('normalizes legacy records when they are read', async () => {
    const database = await openProjectDatabase()
    const transaction = database.transaction('projects', 'readwrite')
    transaction.objectStore('projects').put({
      id: 'legacy',
      name: 'Legacy project',
      segments: [{ text: 'hello' }],
      metrics: { elapsedMs: 250 },
      audio: new Blob(['legacy audio']),
      updatedAt: '2024-01-01T00:00:00.000Z',
    })
    await new Promise((resolve, reject) => {
      transaction.oncomplete = resolve
      transaction.onerror = () => reject(transaction.error)
    })
    database.close()

    const legacy = await getProject('legacy')
    expect(legacy).toMatchObject({
      schemaVersion: PROJECT_SCHEMA_VERSION,
      id: 'legacy',
      segments: [{ index: 0, text: 'hello', start: 0, end: 0 }],
      metrics: { audioDurationSeconds: 0, elapsedMs: 250 },
    })
    expect(legacy).not.toHaveProperty('audio')
  })

  it('allowlists restored model and language identifiers', async () => {
    const saved = await saveProject({
      name: 'Untrusted metadata',
      segments: [],
      modelId: 'https://attacker.invalid/model',
      languageId: 'not-a-language',
      translationLanguageId: 'not-a-language',
    })

    expect(saved.modelId).toBe('Xenova/whisper-tiny.en')
    expect(saved.languageId).toBe('en')
    expect(saved.translationLanguageId).toBeNull()
  })
})
