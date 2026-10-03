import { describe, expect, it, vi } from 'vitest'
import { clearModelCaches, MODEL_CACHE_TARGETS } from './modelCache'

describe('model cache management', () => {
  it('clears every registered pipeline cache', async () => {
    const registry = { clear_pipeline_cache: vi.fn().mockResolvedValue({ filesDeleted: 2 }) }
    const result = await clearModelCaches(registry)

    expect(registry.clear_pipeline_cache).toHaveBeenCalledTimes(MODEL_CACHE_TARGETS.length)
    expect(result).toHaveLength(MODEL_CACHE_TARGETS.length)
    expect(result[0]).toMatchObject({ task: 'automatic-speech-recognition', result: { filesDeleted: 2 } })
  })

  it('continues cleanup after an individual cache failure', async () => {
    const registry = { clear_pipeline_cache: vi.fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue({ filesDeleted: 1 }) }
    const result = await clearModelCaches(registry)

    expect(result[0]).toMatchObject({ error: 'offline' })
    expect(result.at(-1)).toMatchObject({ result: { filesDeleted: 1 } })
    expect(registry.clear_pipeline_cache).toHaveBeenCalledTimes(MODEL_CACHE_TARGETS.length)
  })
})
