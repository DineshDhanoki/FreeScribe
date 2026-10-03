import { describe, expect, it } from 'vitest'
import {
  createInitialTranscriptionState,
  TranscriptionAction,
  TranscriptionStatus,
  transcriptionReducer,
} from './transcriptionState'

describe('transcriptionReducer', () => {
  it('starts in an idle state', () => {
    expect(createInitialTranscriptionState()).toEqual({
      status: TranscriptionStatus.IDLE,
      output: null,
      translation: null,
      translationLanguageId: null,
      error: null,
      progress: null,
      metrics: null,
    })
  })

  it('models the normal inference lifecycle', () => {
    let state = createInitialTranscriptionState()
    state = transcriptionReducer(state, { type: TranscriptionAction.START })
    expect(state.status).toBe(TranscriptionStatus.DECODING)

    state = transcriptionReducer(state, {
      type: TranscriptionAction.DOWNLOAD_PROGRESS,
      progress: 42,
    })
    expect(state).toMatchObject({ status: TranscriptionStatus.DOWNLOADING, progress: 42 })

    state = transcriptionReducer(state, { type: TranscriptionAction.MODEL_READY })
    state = transcriptionReducer(state, {
      type: TranscriptionAction.RESULT,
      output: [{ text: 'hello' }],
    })
    state = transcriptionReducer(state, { type: TranscriptionAction.COMPLETE })
    expect(state).toMatchObject({
      status: TranscriptionStatus.SUCCESS,
      output: [{ text: 'hello' }],
      progress: 1,
    })
  })

  it('preserves a useful error state', () => {
    const state = transcriptionReducer(createInitialTranscriptionState(), {
      type: TranscriptionAction.ERROR,
      message: 'Model unavailable',
    })
    expect(state).toMatchObject({
      status: TranscriptionStatus.ERROR,
      error: 'Model unavailable',
    })
  })

  it('returns to a reusable cancelled state', () => {
    const state = transcriptionReducer({
      ...createInitialTranscriptionState(),
      status: TranscriptionStatus.TRANSCRIBING,
    }, { type: TranscriptionAction.CANCEL })
    expect(state.status).toBe(TranscriptionStatus.CANCELLED)
    expect(state.output).toBeNull()
  })

  it('loads a saved project as a completed transcript', () => {
    const output = [{ text: 'saved', start: 0, end: 1 }]
    const state = transcriptionReducer(createInitialTranscriptionState(), {
      type: TranscriptionAction.LOAD_PROJECT,
      output,
      translation: 'guardado',
      translationLanguageId: 'spa_Latn',
    })
    expect(state).toMatchObject({ status: TranscriptionStatus.SUCCESS, output, translation: 'guardado', translationLanguageId: 'spa_Latn' })
  })
})
