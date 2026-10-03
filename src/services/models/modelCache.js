import { SPEECH_MODELS, TRANSLATION_MODEL } from './modelConfig'

export const MODEL_CACHE_TARGETS = Object.freeze([
  ...SPEECH_MODELS.map((model) => ({ task: 'automatic-speech-recognition', modelId: model.id })),
  { task: TRANSLATION_MODEL.task, modelId: TRANSLATION_MODEL.id },
])

export async function clearModelCaches(registry = null) {
  const activeRegistry = registry || (await import('@huggingface/transformers')).ModelRegistry
  const results = []
  for (const target of MODEL_CACHE_TARGETS) {
    try {
      results.push({
        ...target,
        result: await activeRegistry.clear_pipeline_cache(target.task, target.modelId),
      })
    } catch (error) {
      results.push({ ...target, error: error instanceof Error ? error.message : 'Unknown cache error.' })
    }
  }
  return results
}
