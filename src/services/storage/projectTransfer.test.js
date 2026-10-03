import { describe, expect, it } from 'vitest'
import { parseProjectTransfer, serializeProject } from './projectTransfer'

describe('project transfer', () => {
  it('serializes only the portable project schema', () => {
    const payload = JSON.parse(serializeProject({
      name: 'Demo',
      segments: [{ text: 'hello' }],
      audio: 'must not export',
      unexpected: 'must not export',
    }, '2026-01-01T00:00:00.000Z'))
    expect(payload).toMatchObject({ exportVersion: 1, exportedAt: '2026-01-01T00:00:00.000Z', project: { name: 'Demo' } })
    expect(payload.project).not.toHaveProperty('audio')
    expect(payload.project).not.toHaveProperty('unexpected')
  })

  it('rejects malformed or unsupported backups', () => {
    expect(() => parseProjectTransfer('not json')).toThrow('not valid JSON')
    expect(() => parseProjectTransfer(JSON.stringify({ exportVersion: 99, project: { segments: [] } }))).toThrow('Unsupported project backup version')
    expect(() => parseProjectTransfer(JSON.stringify({ exportVersion: 1, project: {} }))).toThrow('missing transcript segments')
  })

  it('returns a sanitized project without an imported identifier', () => {
    const project = parseProjectTransfer(JSON.stringify({
      exportVersion: 1,
      project: { id: 'attacker-controlled', name: 'Restored', segments: [], modelId: 'bad-model', unexpected: true },
    }))
    expect(project).toMatchObject({ name: 'Restored', segments: [], modelId: 'bad-model' })
    expect(project).not.toHaveProperty('id')
    expect(project).not.toHaveProperty('unexpected')
  })
})
