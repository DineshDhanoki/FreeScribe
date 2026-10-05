export const TranscriptionStatus = Object.freeze({
  IDLE: 'idle',
  DECODING: 'decoding',
  DOWNLOADING: 'downloading',
  TRANSCRIBING: 'transcribing',
  SUCCESS: 'success',
  ERROR: 'error',
  CANCELLED: 'cancelled',
})

export const TranscriptionAction = Object.freeze({
  RESET: 'reset',
  START: 'start',
  DOWNLOAD_PROGRESS: 'download_progress',
  MODEL_READY: 'model_ready',
  INFERENCE_PROGRESS: 'inference_progress',
  RESULT: 'result',
  COMPLETE: 'complete',
  ERROR: 'error',
  CANCEL: 'cancel',
  LOAD_PROJECT: 'load_project',
})

export function createInitialTranscriptionState() {
  return {
    status: TranscriptionStatus.IDLE,
    output: null,
    translation: null,
    translationLanguageId: null,
    error: null,
    progress: null,
    phase: null,
    metrics: null,
  }
}

export function transcriptionReducer(state, action) {
  switch (action.type) {
    case TranscriptionAction.RESET:
      return createInitialTranscriptionState()
    case TranscriptionAction.START:
      return { ...createInitialTranscriptionState(), status: TranscriptionStatus.DECODING }
    case TranscriptionAction.DOWNLOAD_PROGRESS:
      return {
        ...state,
        status: TranscriptionStatus.DOWNLOADING,
        progress: action.progress ?? null,
        error: null,
      }
    case TranscriptionAction.MODEL_READY:
      return { ...state, status: TranscriptionStatus.TRANSCRIBING, phase: null, error: null }
    case TranscriptionAction.INFERENCE_PROGRESS:
      return { ...state, status: TranscriptionStatus.TRANSCRIBING, phase: action.phase || 'transcribing', error: null }
    case TranscriptionAction.RESULT:
      return { ...state, output: action.output, status: TranscriptionStatus.TRANSCRIBING }
    case TranscriptionAction.COMPLETE:
      return { ...state, status: TranscriptionStatus.SUCCESS, progress: 1, error: null, metrics: action.metrics || null }
    case TranscriptionAction.ERROR:
      return {
        ...state,
        status: TranscriptionStatus.ERROR,
        error: action.message || 'Transcription failed.',
      }
    case TranscriptionAction.CANCEL:
      return { ...createInitialTranscriptionState(), status: TranscriptionStatus.CANCELLED }
    case TranscriptionAction.LOAD_PROJECT:
      return {
        ...createInitialTranscriptionState(),
        status: TranscriptionStatus.SUCCESS,
        output: action.output,
        translation: action.translation || null,
        translationLanguageId: action.translationLanguageId || null,
        metrics: action.metrics || null,
      }
    default:
      return state
  }
}
