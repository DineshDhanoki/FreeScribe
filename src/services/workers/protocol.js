export const WorkerMessageType = Object.freeze({
  DOWNLOADING: 'DOWNLOADING',
  LOADING: 'LOADING',
  RESULT: 'RESULT',
  INFERENCE_REQUEST: 'INFERENCE_REQUEST',
  INFERENCE_DONE: 'INFERENCE_DONE',
  INFERENCE_PROGRESS: 'INFERENCE_PROGRESS',
  ERROR: 'ERROR',
  CANCEL: 'CANCEL',
})

export const TranslationMessageType = Object.freeze({
  INITIATE: 'TRANSLATION_INITIATE',
  PROGRESS: 'TRANSLATION_PROGRESS',
  UPDATE: 'TRANSLATION_UPDATE',
  COMPLETE: 'TRANSLATION_COMPLETE',
  ERROR: 'TRANSLATION_ERROR',
})

export function getWorkerErrorMessage(message) {
  return typeof message === 'string' && message.trim()
    ? message
    : 'The background AI task failed.'
}

export function isTranscriptionWorkerMessage(message) {
  if (!message || typeof message !== 'object' || typeof message.type !== 'string') return false
  if (!Object.values(WorkerMessageType).includes(message.type)) return false
  if (message.type === WorkerMessageType.RESULT && !Array.isArray(message.results)) return false
  if (message.type === WorkerMessageType.ERROR && typeof message.message !== 'string') return false
  if (message.type === WorkerMessageType.DOWNLOADING && (!Number.isFinite(message.progress) || message.progress < 0 || message.progress > 100)) return false
  if (message.type === WorkerMessageType.INFERENCE_PROGRESS && message.phase !== 'transcribing') return false
  return true
}

export function isTranscriptionRequest(message) {
  return Boolean(
    message
    && message.type === WorkerMessageType.INFERENCE_REQUEST
    && message.audio instanceof Float32Array
    && message.audio.length > 0
    && (message.model_name === undefined || typeof message.model_name === 'string')
    && (message.language === undefined || typeof message.language === 'string'),
  )
}

export function isTranslationWorkerMessage(message) {
  if (!message || typeof message !== 'object' || typeof message.type !== 'string') return false
  if (!Object.values(TranslationMessageType).includes(message.type)) return false
  if ([TranslationMessageType.UPDATE, TranslationMessageType.COMPLETE].includes(message.type) && typeof message.output !== 'string') return false
  if (message.type === TranslationMessageType.PROGRESS && (!Number.isFinite(message.progress) || message.progress < 0 || message.progress > 100)) return false
  if (message.type === TranslationMessageType.ERROR && typeof message.message !== 'string') return false
  return true
}

export function isTranslationRequest(message) {
  return Boolean(
    message
    && typeof message.text === 'string'
    && message.text.trim()
    && typeof message.src_lang === 'string'
    && message.src_lang.trim()
    && typeof message.tgt_lang === 'string'
    && message.tgt_lang.trim(),
  )
}
